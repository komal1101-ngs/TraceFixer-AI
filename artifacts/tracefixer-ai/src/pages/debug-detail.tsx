import { useState, type FormEvent } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { Link } from 'wouter';
import { getGetDebugSessionQueryKey, getGetDebugSummaryQueryKey, getListDebugSessionsQueryKey, useGetDebugSession, useSendDebugMessage, useUpdateDebugSessionStatus } from '@workspace/api-client-react';
import { ArrowDown, ArrowLeft, Check, CheckCheck, Copy, CornerDownLeft, Lightbulb, MessageSquareText, ShieldCheck, Sparkles, Terminal } from 'lucide-react';
import { AppShell, formatDate, PageError, SkeletonRows, StatusPill } from '@/components/app-shell';

function CodePanel({ code, label, testId }: { code: string; label: string; testId: string }) {
  const [copied, setCopied] = useState(false);
  const copy = async () => {
    try {
      await navigator.clipboard.writeText(code);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 1800);
    } catch {
      setCopied(false);
    }
  };
  return <section className="overflow-hidden rounded-xl border border-[#39434d] bg-[#202833]">
    <div className="flex items-center justify-between border-b border-white/10 px-4 py-3"><div className="flex items-center gap-2 text-xs font-bold text-[#e5e6dc]"><Terminal size={14} className="text-[#c4d47c]" />{label}</div><button onClick={copy} data-testid={testId} className="inline-flex items-center gap-1.5 rounded-md border border-white/15 px-2.5 py-1.5 text-[10px] font-semibold text-[#d3d8cf] transition hover:bg-white/10">{copied ? <Check size={13} /> : <Copy size={13} />}{copied ? 'Copied' : 'Copy code'}</button></div>
    <pre data-testid="content-code" className="mono max-h-[440px] overflow-auto whitespace-pre-wrap break-words px-4 py-4 text-[11px] leading-[1.85] text-[#e0e4dc] md:px-5 md:text-xs">{code}</pre>
  </section>;
}

export default function DebugDetailPage({ id: rawId }: { id?: string }) {
  const id = Number(rawId);
  const validId = Number.isInteger(id) && id > 0;
  const qc = useQueryClient();
  const sessionQuery = useGetDebugSession(validId ? id : 0, { query: { enabled: validId, queryKey: getGetDebugSessionQueryKey(validId ? id : 0) } });
  const statusUpdate = useUpdateDebugSessionStatus();
  const sendMessage = useSendDebugMessage();
  const [message, setMessage] = useState('');
  const [messageIssue, setMessageIssue] = useState('');
  const session = sessionQuery.data;
  const setStatus = (status: 'open' | 'resolved') => {
    statusUpdate.mutate({ id, data: { status } }, {
      onSuccess: updated => {
        qc.setQueryData(getGetDebugSessionQueryKey(id), (old: typeof session) => old ? { ...old, status: updated.status } : old);
        qc.invalidateQueries({ queryKey: getGetDebugSummaryQueryKey() });
        qc.invalidateQueries({ queryKey: getListDebugSessionsQueryKey() });
      },
    });
  };
  const submitMessage = (e: FormEvent) => {
    e.preventDefault();
    const content = message.trim();
    if (!content) return;
    if (content.length > 4000) return setMessageIssue('Keep your follow-up under 4,000 characters.');
    setMessageIssue('');
    sendMessage.mutate({ id, data: { message: content } }, {
      onSuccess: pair => {
        qc.setQueryData(getGetDebugSessionQueryKey(id), (old: typeof session) => old ? {
          ...old,
          messages: [...old.messages, pair.userMessage, pair.aiMessage],
        } : old);
        setMessage('');
      },
      onError: () => setMessageIssue('That follow-up did not send. Your message is still here; please try again.'),
    });
  };
  if (!validId) return <AppShell title="Unknown diagnosis" eyebrow="TRACE NOT FOUND" back="/dashboard"><PageError retry={() => window.history.back()} /></AppShell>;
  return <AppShell title={session?.title ?? 'Diagnosis details'} eyebrow="DEBUG SESSION" back="/dashboard">
    {sessionQuery.isLoading ? <SkeletonRows /> : sessionQuery.isError || !session ? <PageError retry={() => void sessionQuery.refetch()} /> : <div className="animate-rise">
      <div className="mb-7 flex flex-col justify-between gap-4 border-b border-border pb-6 md:flex-row md:items-end">
        <div className="min-w-0">
          <div className="mb-3 flex flex-wrap items-center gap-2"><span className="mono text-[10px] tracking-wider text-muted-foreground">TRACE #{session.id.toString().padStart(4, '0')}</span><StatusPill status={session.status} /><span className="rounded-md border border-border px-2 py-1 mono text-[9px]">{session.language}</span><span className="mono text-[9px] text-muted-foreground">{formatDate(session.createdAt)}</span></div>
          <h2 className="max-w-3xl text-3xl font-extrabold tracking-[-.055em] md:text-4xl" data-testid="text-session-title">{session.title}</h2>
          <p className="mt-2 text-sm text-muted-foreground">Root cause, corrected code, and the original evidence in one reviewable trace.</p>
        </div>
        <div className="flex shrink-0 gap-2">
          <button disabled={statusUpdate.isPending || session.status === 'open'} onClick={() => setStatus('open')} data-testid="button-reopen-session" className="rounded-lg border border-border bg-card px-3 py-2.5 text-xs font-bold transition hover:bg-muted disabled:opacity-45">Reopen</button>
          <button disabled={statusUpdate.isPending || session.status === 'resolved'} onClick={() => setStatus('resolved')} data-testid="button-resolve-session" className="inline-flex items-center gap-2 rounded-lg bg-[#202833] px-3 py-2.5 text-xs font-bold text-[#f4f2e9] transition hover:bg-[#303b46] disabled:opacity-45"><CheckCheck size={14} /> Resolve</button>
        </div>
      </div>
      {statusUpdate.isError && <div role="alert" data-testid="status-update-error" className="mb-5 rounded-lg border border-[#e6c6b9] bg-[#fff1e9] px-4 py-3 text-xs text-[#8b422f]">Could not update this session status. Please try again.</div>}
      <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_350px]">
        <div className="min-w-0 space-y-5">
          <section className="rounded-xl border border-[#dce1c5] bg-[#f0f1e6] p-5 md:p-6" data-testid="content-diagnosis">
            <div className="flex flex-wrap items-center justify-between gap-3"><div className="flex items-center gap-2 text-xs font-extrabold"><span className="grid size-7 place-items-center rounded-lg bg-[#dfe5c5] text-[#6e823a]"><Sparkles size={15} /></span> The likely cause</div><div className="flex items-center gap-2"><span className="rounded-full bg-[#e8dec7] px-2.5 py-1 mono text-[9px] font-medium uppercase tracking-wider text-[#826a38]">{session.diagnosis.severity}</span><span className="mono text-[9px] uppercase tracking-wider text-[#68734d]">{session.diagnosis.category}</span></div></div>
            <p className="mt-4 text-[15px] leading-7 text-[#3e4837]" data-testid="text-root-cause">{session.diagnosis.rootCause}</p>
          </section>
          <section className="rounded-xl border border-border bg-card p-5 md:p-6">
            <div className="flex items-center justify-between"><div><div className="flex items-center gap-2 text-xs font-extrabold"><span className="grid size-7 place-items-center rounded-lg bg-[#e9ebdc] text-[#657b33]"><ArrowDown size={15} /></span>Suggested next steps</div><p className="mt-1 ml-9 text-[11px] text-muted-foreground">Follow the evidence in order.</p></div><span className="mono text-[9px] text-muted-foreground">{session.diagnosis.steps.length} STEPS</span></div>
            <ol className="mt-5 space-y-3">{session.diagnosis.steps.map((step, index) => <li key={`${index}-${step}`} data-testid={`step-diagnosis-${index + 1}`} className="flex gap-3"><span className="mono mt-0.5 grid size-6 shrink-0 place-items-center rounded-full bg-[#eef0e4] text-[10px] font-medium text-[#687a3e]">{String(index + 1).padStart(2, '0')}</span><p className="pt-0.5 text-sm leading-6">{step}</p></li>)}</ol>
          </section>
          <CodePanel code={session.diagnosis.correctedCode} label="Suggested patch" testId="button-copy-patch" />
          <CodePanel code={session.codeSnippet} label="Original code" testId="button-copy-original" />
          <section className="rounded-xl border border-border bg-card p-5 md:p-6"><div className="flex items-center gap-2 text-xs font-extrabold"><Lightbulb size={15} className="text-[#839445]" /> Keep it from happening again</div><p className="mt-3 text-sm leading-6 text-muted-foreground" data-testid="text-prevention-tips">{session.diagnosis.preventionTips}</p></section>
          <details className="group rounded-xl border border-border bg-card">
            <summary data-testid="toggle-original-error" className="flex cursor-pointer list-none items-center justify-between px-5 py-4 text-xs font-bold marker:hidden"><span className="flex items-center gap-2"><Terminal size={14} className="text-[#aa654c]" /> Original error log</span><ArrowDown size={14} className="transition-transform group-open:rotate-180" /></summary>
            <pre data-testid="content-original-error" className="mono max-h-[360px] overflow-auto whitespace-pre-wrap border-t border-border bg-[#202833] px-5 py-4 text-[11px] leading-6 text-[#e0e4dc]">{session.errorLog}</pre>
          </details>
        </div>
        <aside className="min-w-0">
          <section className="flex max-h-[760px] min-h-[420px] flex-col overflow-hidden rounded-xl border border-border bg-card xl:sticky xl:top-5">
            <header className="border-b border-border px-4 py-4"><div className="flex items-center gap-2 text-sm font-extrabold"><MessageSquareText size={16} className="text-[#75883e]" /> Ask a follow-up</div><p className="mt-1 text-[10px] leading-4 text-muted-foreground">Keep exploring this diagnosis with its original context.</p></header>
            <div className="flex-1 space-y-3 overflow-y-auto bg-[#f4f3ec] p-4" data-testid="list-debug-messages">
              {session.messages.length ? session.messages.map(item => <article key={item.id} data-testid={`message-${item.id}`} className={`max-w-[94%] rounded-xl border px-3.5 py-3 ${item.sender === 'user' ? 'ml-auto border-[#d3d9b6] bg-[#edf0df]' : 'border-border bg-card'}`}><div className="mb-1.5 flex items-center justify-between gap-4"><span className="text-[10px] font-extrabold">{item.sender === 'ai' ? 'TraceFixer' : 'You'}</span><time className="mono text-[8px] text-muted-foreground">{new Intl.DateTimeFormat(undefined, { hour: 'numeric', minute: '2-digit' }).format(new Date(item.createdAt))}</time></div><p className="whitespace-pre-wrap text-xs leading-5">{item.message}</p></article>) : <div className="grid h-full min-h-[210px] place-items-center text-center"><div><div className="mx-auto grid size-10 place-items-center rounded-xl bg-card text-[#778744]"><MessageSquareText size={18} /></div><p className="mt-3 text-xs font-bold">The next question is yours.</p><p className="mt-1 max-w-[210px] text-[10px] leading-4 text-muted-foreground">Ask why the fix works or what to check before applying it.</p></div></div>}
              {sendMessage.isPending && <div className="w-fit rounded-xl border bg-card px-3.5 py-3 text-xs text-muted-foreground"><span className="mr-2 inline-block size-2 animate-pulse rounded-full bg-[#91a14d]" />Following the thread…</div>}
            </div>
            <form onSubmit={submitMessage} className="border-t border-border bg-card p-3">
              <textarea value={message} onChange={e => { setMessage(e.target.value); if (e.target.value.length <= 4000) setMessageIssue(''); }} maxLength={4000} rows={3} data-testid="input-follow-up" placeholder="Ask a question about this fix…" className="w-full resize-none rounded-lg border border-input bg-background px-3 py-2.5 text-xs leading-5 outline-none placeholder:text-muted-foreground focus:border-[#849549]" />
              {messageIssue && <p role="alert" data-testid="status-message-error" className="mt-1 text-[10px] text-destructive">{messageIssue}</p>}
              <div className="mt-2 flex items-center justify-between"><span className="mono text-[9px] text-muted-foreground">{message.length}/4,000</span><button disabled={!message.trim() || sendMessage.isPending} data-testid="button-send-message" className="inline-flex items-center gap-2 rounded-lg bg-primary px-3 py-2 text-[11px] font-extrabold text-[#20271a] transition hover:brightness-95 disabled:cursor-not-allowed disabled:opacity-45">{sendMessage.isPending ? 'Sending…' : 'Send follow-up'} <CornerDownLeft size={13} /></button></div>
            </form>
          </section>
          <div className="mt-3 flex items-start gap-2 rounded-lg px-2 py-2 text-[10px] leading-4 text-muted-foreground"><ShieldCheck size={13} className="mt-0.5 shrink-0 text-[#718540]" /> A diagnosis is a suggestion. Review the patch and validate it in your own environment.</div>
          <Link href="/dashboard" data-testid="link-back-history" className="mt-4 inline-flex items-center gap-2 text-xs font-bold text-muted-foreground hover:text-foreground"><ArrowLeft size={13} /> Back to all diagnoses</Link>
        </aside>
      </div>
    </div>}
  </AppShell>;
}
