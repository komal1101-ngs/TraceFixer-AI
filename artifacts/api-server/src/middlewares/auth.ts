import { jwtVerify } from "jose";
import type { RequestHandler } from "express";

declare global {
  namespace Express {
    interface Request {
      userId?: number;
    }
  }
}

export const requireAuth: RequestHandler = async (req, res, next): Promise<void> => {
  const authorization = req.header("authorization");
  const token = authorization?.startsWith("Bearer ")
    ? authorization.slice("Bearer ".length)
    : null;
  const secret = process.env.SESSION_SECRET;

  if (!token) {
    res.status(401).json({ error: "Authentication required" });
    return;
  }

  if (!secret) {
    res.status(500).json({ error: "Authentication is not configured" });
    return;
  }

  try {
    const { payload } = await jwtVerify(token, new TextEncoder().encode(secret), {
      algorithms: ["HS256"],
    });
    const userId = Number(payload.sub);
    if (!Number.isSafeInteger(userId) || userId < 1) {
      res.status(401).json({ error: "Invalid authentication token" });
      return;
    }
    req.userId = userId;
    next();
  } catch {
    res.status(401).json({ error: "Invalid or expired authentication token" });
  }
};
