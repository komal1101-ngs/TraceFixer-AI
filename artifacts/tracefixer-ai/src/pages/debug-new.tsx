import { useState, type FormEvent } from 'react';
import { useLocation } from 'wouter';
import { useQueryClient } from '@tanstack/react-query';
import { useCreateDebugSession, getListDebugSessionsQueryKey, getGetDebugSummaryQueryKey } from '@workspace/api-client-react';
import { ArrowRight, Braces, CircleHelp, FileCode2, Info, Lightbulb, Terminal } from 'lucide-react';
import { AppShell } from '@/components/app-shell';

const languages = [
  'Python',
  'JavaScript',
  'TypeScript',
  'Go',
  'Rust',
  'Java',
  'C++',
  'C#',
  'SQL',
  'Ruby',
  'PHP',
  'Swift',
  'Kotlin',
  'Bash',
  'Other',
];
export default function NewDebugPage() {
  const [, setLocation] = useLocation();
  const qc = useQueryClient();
  const create = useCreateDebugSession();
  const [language, setLanguage] = useState('TypeScript');
  const [title, setTitle] = useState('');
  const [codeSnippet, setCodeSnippet] = useState('');
  const [errorLog, setErrorLog] = useState('');
  const [issue, setIssue] = useState('');
  const submit = (e: FormEvent) => {
    e.preventDefault();
    if (title.trim().length < 3) return setIssue('Give this diagnosis a short, searchable title (at least 3 characters).');
    if (!codeSnippet.trim()) return setIssue('Add the relevant code snippet so the diagnosis has enough context.');
    if (!errorLog.trim()) return setIssue('Paste the error or unexpected behavior you are seeing.');
    setIssue('');
    create.mutate({ data: { language, title: title.trim(), codeSnippet, errorLog } }, {
      onSuccess: (session) => {
        qc.invalidateQueries({ queryKey: getListDebugSessionsQueryKey() });
        qc.invalidateQueries({ queryKey: getGetDebugSummaryQueryKey() });
        setLocation(`/debug/${session.id}`);
      },
      onError: () => setIssue('The diagnosis could not be created right now. Your inputs are still here; try again.'),
    });
  };
  return <AppShell title="New diagnosis" eyebrow="TRACE A PROBLEM" back="/dashboard">
    <div className="mx-auto max-w-[1000px]">
      <div className="mb-7 animate-rise">
        <div className="flex items-center gap-2 mono text-[10px] tracking-[.16em] text-[#809343]"><Braces size={13} /> INPUT → EXPLANATION → PATCH</div>
        <h2 className="mt-3 text-3xl font-extrabold tracking-[-.055em]">Give the error its context.</h2>
        <p className="mt-2 max-w-2xl text-sm leading-6 text-muted-foreground">A focused snippet and the full error log make for a more useful diagnosis. Nothing is changed in your code.</p>
      </div>
      <div className="grid gap-5 lg:grid-cols-[minmax(0,1fr)_270px]">
        <form onSubmit={submit} className="space-y-5" data-testid="form-new-debug">
          <section className="rounded-xl border border-border bg-card p-5 md:p-6">
            <div className="mb-5 flex items-center gap-3"><span className="grid size-8 place-items-center rounded-lg bg-[#e9ebdc] text-[#657b33]"><FileCode2 size={16} /></span><div><h3 className="text-sm font-extrabold">Session details</h3><p className="text-[11px] text-muted-foreground">Give this one a name you will recognize later.</p></div></div>
            <div className="grid gap-4 sm:grid-cols-[170px_1fr]">
              <label><span className="mb-1.5 block text-[11px] font-bold">Language</span><select value={language} onChange={e => setLanguage(e.target.value)} data-testid="select-language" className="h-10 w-full rounded-lg border border-input bg-background px-3 text-xs font-semibold outline-none focus:border-[#849549]">{languages.map(item => <option key={item}>{item}</option>)}</select></label>
              <label><span className="mb-1.5 block text-[11px] font-bold">Diagnosis title</span><input value={title} onChange={e => setTitle(e.target.value)} maxLength={255} minLength={3} required data-testid="input-session-title" placeholder="e.g. Worker crashes on empty payload" className="h-10 w-full rounded-lg border border-input bg-background px-3 text-sm outline-none focus:border-[#849549]" /></label>
            </div>
          </section>
          <section className="overflow-hidden rounded-xl border border-border bg-card">
            <div className="flex items-center justify-between border-b border-border px-5 py-3"><div className="flex items-center gap-2 text-xs font-bold"><FileCode2 size={14} className="text-[#798a42]" /> Code snippet</div><span className="mono text-[9px] text-muted-foreground">INPUT / {language.toUpperCase()}</span></div>
            <textarea value={codeSnippet} onChange={e => setCodeSnippet(e.target.value)} maxLength={30000} required data-testid="input-code-snippet" placeholder={'function parseRecord(row) {\n  const [key, value] = row;\n  return { key, value };\n}'} spellCheck={false} className="mono min-h-[230px] w-full resize-y bg-[#202833] px-5 py-4 text-[12px] leading-6 text-[#e0e3d8] outline-none placeholder:text-[#77827d] focus:ring-2 focus:ring-inset focus:ring-[#91a34e]/60" />
            <div className="flex justify-between border-t border-border px-4 py-2 mono text-[9px] text-muted-foreground"><span>Paste only the relevant lines</span><span>{codeSnippet.length.toLocaleString()} / 30,000</span></div>
          </section>
          <section className="overflow-hidden rounded-xl border border-border bg-card">
            <div className="flex items-center justify-between border-b border-border px-5 py-3"><div className="flex items-center gap-2 text-xs font-bold"><Terminal size={14} className="text-[#aa654c]" /> Error log</div><span className="mono text-[9px] text-muted-foreground">OUTPUT / TRACE</span></div>
            <textarea value={errorLog} onChange={e => setErrorLog(e.target.value)} maxLength={30000} required data-testid="input-error-log" placeholder={'TypeError: cannot unpack non-iterable NoneType\n  at parse_record (parser.py:42)\n  at run_job (worker.py:108)'} spellCheck={false} className="mono min-h-[150px] w-full resize-y bg-[#202833] px-5 py-4 text-[12px] leading-6 text-[#e0e3d8] outline-none placeholder:text-[#77827d] focus:ring-2 focus:ring-inset focus:ring-[#91a34e]/60" />
            <div className="flex justify-between border-t border-border px-4 py-2 mono text-[9px] text-muted-foreground"><span>Include the complete stack trace if available</span><span>{errorLog.length.toLocaleString()} / 30,000</span></div>
          </section>
          {issue && <div role="alert" data-testid="status-create-error" className="rounded-lg border border-[#e6c6b9] bg-[#fff1e9] px-4 py-3 text-sm text-[#8b422f]">{issue}</div>}
          <div className="flex flex-col-reverse justify-between gap-3 sm:flex-row sm:items-center"><button type="button" onClick={() => setLocation('/dashboard')} data-testid="button-cancel-diagnosis" className="rounded-lg border border-border bg-card px-4 py-2.5 text-xs font-bold hover:bg-muted">Cancel</button><button type="submit" disabled={create.isPending} data-testid="button-submit-diagnosis" className="inline-flex items-center justify-center gap-2 rounded-lg bg-primary px-5 py-3 text-sm font-extrabold text-[#20271a] transition hover:brightness-95 disabled:opacity-60">{create.isPending ? 'Reading the trace…' : 'Diagnose this error'} {create.isPending ? <span className="size-3 animate-spin rounded-full border-2 border-current border-r-transparent" /> : <ArrowRight size={15} />}</button></div>
        </form>
        <aside className="space-y-3">
          <div className="rounded-xl border border-[#dce1c5] bg-[#f0f1e6] p-4"><div className="flex items-center gap-2 text-xs font-extrabold"><Lightbulb size={15} className="text-[#788c3d]" /> Better context, better clues</div><ul className="mt-3 space-y-2.5 text-xs leading-5 text-[#646c54]"><li>Include the function where the error starts.</li><li>Keep line numbers and the full exception message.</li><li>Remove secrets such as tokens or passwords.</li></ul></div>
          <div className="rounded-xl border border-border bg-card p-4"><div className="flex items-center gap-2 text-xs font-extrabold"><CircleHelp size={15} className="text-muted-foreground" /> What happens next?</div><p className="mt-2 text-xs leading-5 text-muted-foreground">TraceFixer analyzes your inputs and saves the explanation, suggested patch, and prevention tips together.</p><div className="mt-3 flex items-center gap-2 mono text-[9px] text-muted-foreground"><Info size={12} /> REVIEW BEFORE YOU APPLY</div></div>
          <div className="hidden rounded-xl bg-[#202833] p-4 text-[#e9e9df] lg:block"><div className="mono text-[9px] tracking-widest text-[#bdcf77]">A QUICK CHECK</div><p className="mt-2 text-xs leading-5 text-[#c1c7bf]">Does the log line up with the snippet? A few lines of surrounding code can make the difference.</p></div>
        </aside>
      </div>
    </div>
  </AppShell>;
}
