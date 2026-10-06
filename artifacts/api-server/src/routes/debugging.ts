import { Router, type IRouter } from "express";
import {
  and,
  count,
  desc,
  eq,
  ilike,
  or,
} from "drizzle-orm";
import {
  CreateDebugSessionBody,
  CreateDebugSessionResponse,
  DebugMessagePair,
  GetDebugSessionParams,
  GetDebugSessionResponse,
  GetDebugSummaryResponse,
  ListDebugSessionsQueryParams,
  ListDebugSessionsResponse,
  SendDebugMessageBody,
  SendDebugMessageParams,
  SendDebugMessageResponse,
  UpdateDebugSessionStatusBody,
  UpdateDebugSessionStatusParams,
  UpdateDebugSessionStatusResponse,
} from "@workspace/api-zod";
import {
  aiDiagnosesTable,
  db,
  debugSessionsTable,
  sessionMessagesTable,
} from "@workspace/db";
import { requireAuth } from "../middlewares/auth";
import { answerFollowUp, diagnoseCode, type DiagnosisResult } from "../lib/gemini";

const router: IRouter = Router();

function toSummary(row: {
  id: number;
  language: string;
  title: string;
  status: string;
  severity: string | null;
  rootCause: string | null;
  createdAt: Date;
}) {
  return {
    id: row.id,
    language: row.language,
    title: row.title,
    status: row.status,
    severity: row.severity,
    rootCause: row.rootCause,
    createdAt: row.createdAt.toISOString(),
  };
}

async function getDetail(sessionId: number, userId: number) {
  const [session] = await db
    .select()
    .from(debugSessionsTable)
    .where(and(eq(debugSessionsTable.id, sessionId), eq(debugSessionsTable.userId, userId)))
    .limit(1);

  if (!session) {
    return null;
  }

  const [[diagnosis], messages] = await Promise.all([
    db
      .select()
      .from(aiDiagnosesTable)
      .where(eq(aiDiagnosesTable.debugSessionId, session.id))
      .limit(1),
    db
      .select()
      .from(sessionMessagesTable)
      .where(eq(sessionMessagesTable.debugSessionId, session.id))
      .orderBy(sessionMessagesTable.createdAt, sessionMessagesTable.id),
  ]);

  if (!diagnosis) {
    return null;
  }

  return GetDebugSessionResponse.parse({
    id: session.id,
    language: session.language,
    title: session.title,
    codeSnippet: session.codeSnippet,
    errorLog: session.errorLog,
    status: session.status,
    createdAt: session.createdAt.toISOString(),
    diagnosis: {
      rootCause: diagnosis.rootCause,
      severity: diagnosis.severity,
      category: diagnosis.category,
      steps: diagnosis.stepByStepFix,
      correctedCode: diagnosis.correctedCode,
      preventionTips: diagnosis.preventionTips,
    },
    messages: messages.map((message) => ({
      id: message.id,
      sender: message.sender,
      message: message.message,
      createdAt: message.createdAt.toISOString(),
    })),
  });
}

async function getSummaryRow(sessionId: number, userId: number) {
  const [row] = await db
    .select({
      id: debugSessionsTable.id,
      language: debugSessionsTable.language,
      title: debugSessionsTable.title,
      status: debugSessionsTable.status,
      severity: aiDiagnosesTable.severity,
      rootCause: aiDiagnosesTable.rootCause,
      createdAt: debugSessionsTable.createdAt,
    })
    .from(debugSessionsTable)
    .leftJoin(aiDiagnosesTable, eq(aiDiagnosesTable.debugSessionId, debugSessionsTable.id))
    .where(and(eq(debugSessionsTable.id, sessionId), eq(debugSessionsTable.userId, userId)))
    .limit(1);
  return row ? toSummary(row) : null;
}

router.use("/debug-sessions", requireAuth);

router.get("/debug-sessions", async (req, res): Promise<void> => {
  const parsed = ListDebugSessionsQueryParams.safeParse(req.query);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }

  const { language, search, status } = parsed.data;
  const conditions = [eq(debugSessionsTable.userId, req.userId!)];
  if (language) {
    conditions.push(eq(debugSessionsTable.language, language));
  }
  if (status) {
    conditions.push(eq(debugSessionsTable.status, status));
  }
  if (search?.trim()) {
    const pattern = `%${search.trim()}%`;
    conditions.push(
      or(
        ilike(debugSessionsTable.title, pattern),
        ilike(debugSessionsTable.language, pattern),
        ilike(debugSessionsTable.errorLog, pattern),
        ilike(aiDiagnosesTable.rootCause, pattern),
      )!,
    );
  }

  const rows = await db
    .select({
      id: debugSessionsTable.id,
      language: debugSessionsTable.language,
      title: debugSessionsTable.title,
      status: debugSessionsTable.status,
      severity: aiDiagnosesTable.severity,
      rootCause: aiDiagnosesTable.rootCause,
      createdAt: debugSessionsTable.createdAt,
    })
    .from(debugSessionsTable)
    .leftJoin(aiDiagnosesTable, eq(aiDiagnosesTable.debugSessionId, debugSessionsTable.id))
    .where(and(...conditions))
    .orderBy(desc(debugSessionsTable.createdAt));

  res.json(
    ListDebugSessionsResponse.parse(
      rows.map((row) => toSummary(row)),
    ),
  );
});

router.post("/debug-sessions", async (req, res): Promise<void> => {
  const parsed = CreateDebugSessionBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }

  let diagnosis: DiagnosisResult;
  try {
    diagnosis = await diagnoseCode(parsed.data);
  } catch (error) {
    req.log.error(
      { reason: error instanceof Error ? error.message : "unknown error" },
      "Gemini diagnosis failed",
    );
    res.status(502).json({ error: "The AI diagnosis could not be completed. Please try again." });
    return;
  }

  try {
    const result = await db.transaction(async (tx) => {
      const [session] = await tx
        .insert(debugSessionsTable)
        .values({
          userId: req.userId!,
          language: parsed.data.language,
          title: parsed.data.title,
          codeSnippet: parsed.data.codeSnippet,
          errorLog: parsed.data.errorLog,
        })
        .returning();
      if (!session) {
        throw new Error("Session insert returned no row");
      }

      await tx.insert(aiDiagnosesTable).values({
        debugSessionId: session.id,
        rootCause: diagnosis.rootCause,
        severity: diagnosis.severity,
        category: diagnosis.category,
        stepByStepFix: diagnosis.steps,
        correctedCode: diagnosis.correctedCode,
        preventionTips: diagnosis.preventionTips,
      });

      return {
        id: session.id,
        language: session.language,
        title: session.title,
        codeSnippet: session.codeSnippet,
        errorLog: session.errorLog,
        status: session.status,
        createdAt: session.createdAt.toISOString(),
        diagnosis,
        messages: [],
      };
    });

    res.status(201).json(CreateDebugSessionResponse.parse(result));
  } catch (error) {
    req.log.error(
      { reason: error instanceof Error ? error.message : "unknown error" },
      "Saving debug session failed",
    );
    res.status(500).json({ error: "Diagnosis completed but could not be saved." });
  }
});

router.get("/debug-sessions/summary", async (req, res): Promise<void> => {
  const userId = req.userId!;
  const userCondition = eq(debugSessionsTable.userId, userId);
  const [totalRows, openRows, resolvedRows, languages, recentRows] = await Promise.all([
    db.select({ value: count() }).from(debugSessionsTable).where(userCondition),
    db
      .select({ value: count() })
      .from(debugSessionsTable)
      .where(and(userCondition, eq(debugSessionsTable.status, "open"))),
    db
      .select({ value: count() })
      .from(debugSessionsTable)
      .where(and(userCondition, eq(debugSessionsTable.status, "resolved"))),
    db
      .select({ language: debugSessionsTable.language, count: count() })
      .from(debugSessionsTable)
      .where(userCondition)
      .groupBy(debugSessionsTable.language)
      .orderBy(desc(count())),
    db
      .select({
        id: debugSessionsTable.id,
        language: debugSessionsTable.language,
        title: debugSessionsTable.title,
        status: debugSessionsTable.status,
        severity: aiDiagnosesTable.severity,
        rootCause: aiDiagnosesTable.rootCause,
        createdAt: debugSessionsTable.createdAt,
      })
      .from(debugSessionsTable)
      .leftJoin(aiDiagnosesTable, eq(aiDiagnosesTable.debugSessionId, debugSessionsTable.id))
      .where(userCondition)
      .orderBy(desc(debugSessionsTable.createdAt))
      .limit(5),
  ]);

  res.json(
    GetDebugSummaryResponse.parse({
      total: Number(totalRows[0]?.value ?? 0),
      open: Number(openRows[0]?.value ?? 0),
      resolved: Number(resolvedRows[0]?.value ?? 0),
      languages: languages.map((row) => ({
        language: row.language,
        count: Number(row.count),
      })),
      recent: recentRows.map((row) => toSummary(row)),
    }),
  );
});

router.get("/debug-sessions/:id", async (req, res): Promise<void> => {
  const params = GetDebugSessionParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }
  const detail = await getDetail(params.data.id, req.userId!);
  if (!detail) {
    res.status(404).json({ error: "Debug session not found" });
    return;
  }
  res.json(detail);
});

router.patch("/debug-sessions/:id/status", async (req, res): Promise<void> => {
  const params = UpdateDebugSessionStatusParams.safeParse(req.params);
  const parsed = UpdateDebugSessionStatusBody.safeParse(req.body);
  if (!params.success || !parsed.success) {
    res.status(400).json({
      error: !params.success ? params.error.message : parsed.success ? "Invalid request" : parsed.error.message,
    });
    return;
  }

  const [updated] = await db
    .update(debugSessionsTable)
    .set({ status: parsed.data.status })
    .where(and(eq(debugSessionsTable.id, params.data.id), eq(debugSessionsTable.userId, req.userId!)))
    .returning({ id: debugSessionsTable.id });

  if (!updated) {
    res.status(404).json({ error: "Debug session not found" });
    return;
  }

  const summary = await getSummaryRow(updated.id, req.userId!);
  if (!summary) {
    res.status(404).json({ error: "Debug session not found" });
    return;
  }
  res.json(UpdateDebugSessionStatusResponse.parse(summary));
});

router.post("/debug-sessions/:id/messages", async (req, res): Promise<void> => {
  const params = SendDebugMessageParams.safeParse(req.params);
  const parsed = SendDebugMessageBody.safeParse(req.body);
  if (!params.success || !parsed.success) {
    res.status(400).json({
      error: !params.success ? params.error.message : parsed.success ? "Invalid request" : parsed.error.message,
    });
    return;
  }

  const detail = await getDetail(params.data.id, req.userId!);
  if (!detail) {
    res.status(404).json({ error: "Debug session not found" });
    return;
  }

  let answer: string;
  try {
    answer = await answerFollowUp({
      language: detail.language,
      title: detail.title,
      codeSnippet: detail.codeSnippet,
      errorLog: detail.errorLog,
      diagnosis: detail.diagnosis,
      history: detail.messages.slice(-12),
      question: parsed.data.message,
    });
  } catch (error) {
    req.log.error(
      { reason: error instanceof Error ? error.message : "unknown error" },
      "Gemini follow-up failed",
    );
    res.status(502).json({ error: "The AI could not answer right now. Please try again." });
    return;
  }

  const pair = await db.transaction(async (tx) => {
    const [userMessage] = await tx
      .insert(sessionMessagesTable)
      .values({
        debugSessionId: detail.id,
        sender: "user",
        message: parsed.data.message,
      })
      .returning();
    const [aiMessage] = await tx
      .insert(sessionMessagesTable)
      .values({
        debugSessionId: detail.id,
        sender: "ai",
        message: answer,
      })
      .returning();
    return { userMessage, aiMessage };
  });

  if (!pair.userMessage || !pair.aiMessage) {
    res.status(500).json({ error: "Could not save the conversation" });
    return;
  }

  res.status(201).json(
    SendDebugMessageResponse.parse({
      userMessage: {
        id: pair.userMessage.id,
        sender: pair.userMessage.sender,
        message: pair.userMessage.message,
        createdAt: pair.userMessage.createdAt.toISOString(),
      },
      aiMessage: {
        id: pair.aiMessage.id,
        sender: pair.aiMessage.sender,
        message: pair.aiMessage.message,
        createdAt: pair.aiMessage.createdAt.toISOString(),
      },
    }),
  );
});

export default router;
