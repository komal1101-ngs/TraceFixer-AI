import { useState } from 'react';
import { Link } from 'wouter';
import { useGetDebugSummary, useListDebugSessions, getListDebugSessionsQueryKey } from '@workspace/api-client-react';
import { ArrowRight, ChevronDown, CirclePlus, Code2, Search, SlidersHorizontal, Sparkles } from 'lucide-react';
import { AppShell, formatDate, PageError, Severity, SkeletonRows, StatusPill } from '@/components/app-shell';

export default function DashboardPage() {
  const [search, setSearch] = useState('');
  const [status, setStatus] = useState('');
  const [language, setLanguage] = useState('');
  const params = { ...(search.trim() ? { search: search.trim() } : {}), ...(status ? { status: status as 'open' | 'resolved' } : {}), ...(language ? { language } : {}) };
  const summary = useGetDebugSummary();
  const sessions = useListDebugSessions(params, { query: { queryKey: getListDebugSessionsQueryKey(params) } });
  const refetch = () => { void summary.refetch(); void sessions.refetch(); };
  return <AppShell title="Debug history" eyebrow="YOUR WORKSPACE">
    {summary.isError ? <PageError retry={() => void summary.refetch()} /> : <section className="mb-8 animate-rise">
      <div className="mb-5 flex flex-wrap items-end justify-between gap-4">
        <div><p className="mono text-[10px] tracking-[.16em] text-[#809343]">THE SIGNAL SO FAR</p><h2 className="mt-2 text-2xl font-extrabold tracking-[-.04em]">A clearer debugging trail.</h2></div>
        <span className="mono text-[10px] tracking-wider text-muted-foreground">UPDATED FROM YOUR SESSIONS</span>
      </div>
      {summary.isLoading ? <div data-testid="state-summary-loading" className="grid gap-3 sm:grid-cols-3"><div className="h-[104px] animate-pulse rounded-xl bg-muted" /><div className="h-[104px] animate-pulse rounded-xl bg-muted" /><div className="h-[104px] animate-pulse rounded-xl bg-muted" /></div> : summary.data && <div className="grid gap-3 sm:grid-cols-3">
        {[['All diagnoses', summary.data.total, 'Everything you have traced', 'all'], ['Still open', summary.data.open, 'Waiting for the next fix', 'open'], ['Resolved', summary.data.resolved, 'Closed with context kept', 'resolved']].map(([label, count, hint, key]) => <button key={key} onClick={() => setStatus(key === 'all' ? '' : key as string)} data-testid={`stat-${key}`} className={`rounded-xl border p-4 text-left transition hover:-translate-y-0.5 hover:shadow-sm ${status === (key === 'all' ? '' : key) ? 'border-[#a6b56e] bg-[#f2f3e8]' : 'border-border bg-card'}`}>
          <div className="flex items-center justify-between"><span className="text-xs font-bold text-muted-foreground">{label}</span><span className="mono text-[9px] text-muted-foreground">/ {key.toString().toUpperCase()}</span></div><div className="mt-3 flex items-end justify-between"><strong className="text-3xl font-extrabold tracking-[-.06em]">{count}</strong><span className="text-[10px] text-muted-foreground">{hint}</span></div>
        </button>)}
      </div>}
      {summary.data?.languages?.length ? <div className="mt-4 flex flex-wrap items-center gap-2 rounded-xl border border-border bg-card px-4 py-3"><span className="mono mr-2 text-[9px] tracking-wider text-muted-foreground">LANGUAGES</span>{summary.data.languages.map(item => <button key={item.language} onClick={() => setLanguage(language === item.language ? '' : item.language)} data-testid={`filter-language-${item.language.toLowerCase().replace(/[^a-z0-9]+/g, '-')}`} className={`rounded-full border px-2.5 py-1 text-[10px] font-semibold transition ${language === item.language ? 'border-[#9cab63] bg-[#edf0df] text-[#53672b]' : 'border-border hover:bg-muted'}`}>{item.language}<span className="ml-1.5 mono text-[9px] text-muted-foreground">{item.count}</span></button>)}</div> : null}
    </section>}
    <section className="animate-rise delay-1">
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <div><h2 className="text-lg font-extrabold tracking-[-.035em]">Recent diagnoses</h2><p className="mt-1 text-xs text-muted-foreground">Search the cause, code language, or session title.</p></div>
        <Link href="/debug/new" data-testid="button-new-session" className="inline-flex items-center gap-2 rounded-lg bg-[#202833] px-3.5 py-2.5 text-xs font-bold text-[#f4f2e9] transition hover:bg-[#303b46]"><CirclePlus size={15} /> New diagnosis</Link>
      </div>
      <div className="mb-3 flex flex-col gap-2 sm:flex-row">
        <label className="relative flex-1"><Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" /><input type="search" value={search} onChange={e => setSearch(e.target.value)} data-testid="input-search-history" placeholder="Search diagnoses…" className="h-10 w-full rounded-lg border border-input bg-card pl-9 pr-3 text-sm outline-none focus:border-[#849549]" /></label>
        <label className="relative"><SlidersHorizontal size={14} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" /><select value={status} onChange={e => setStatus(e.target.value)} data-testid="select-status-filter" className="h-10 w-full appearance-none rounded-lg border border-input bg-card pl-9 pr-9 text-xs font-semibold outline-none sm:w-[150px]"><option value="">Any status</option><option value="open">Open</option><option value="resolved">Resolved</option></select><ChevronDown size={13} className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground" /></label>
        <label className="relative"><Code2 size={14} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" /><select value={language} onChange={e => setLanguage(e.target.value)} data-testid="select-language-filter" className="h-10 w-full appearance-none rounded-lg border border-input bg-card pl-9 pr-9 text-xs font-semibold outline-none sm:w-[150px]"><option value="">Any language</option>{summary.data?.languages.map(item => <option value={item.language} key={item.language}>{item.language}</option>)}</select><ChevronDown size={13} className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground" /></label>
      </div>
      {sessions.isLoading ? <SkeletonRows /> : sessions.isError ? <PageError retry={refetch} /> : sessions.data?.length ? <div className="overflow-hidden rounded-xl border border-border bg-card" data-testid="list-debug-sessions">
        {sessions.data.map(item => <Link key={item.id} href={`/debug/${item.id}`} data-testid={`row-debug-session-${item.id}`} className="group grid gap-3 border-b border-border px-4 py-4 transition last:border-b-0 hover:bg-[#f3f3e9] sm:grid-cols-[minmax(0,1fr)_145px_105px_70px] sm:items-center sm:px-5">
          <div className="min-w-0"><div className="flex items-center gap-2"><span className="mono text-[9px] text-muted-foreground">#{item.id.toString().padStart(4, '0')}</span><h3 className="truncate text-sm font-bold">{item.title}</h3></div><p className="mt-1 truncate text-xs text-muted-foreground">{item.rootCause ?? 'Diagnosis details available inside'}</p><div className="mt-2 flex items-center gap-2 sm:hidden"><StatusPill status={item.status} /><Severity severity={item.severity} /></div></div>
          <div className="hidden sm:block"><div className="inline-flex items-center gap-1.5 rounded-md bg-muted/80 px-2 py-1 mono text-[10px]">{item.language}</div><p className="mt-1 text-[10px] text-muted-foreground">{formatDate(item.createdAt)}</p></div>
          <div className="hidden sm:flex sm:flex-col sm:items-start sm:gap-1.5"><StatusPill status={item.status} /><Severity severity={item.severity} /></div><div className="hidden justify-end sm:flex"><ArrowRight size={16} className="text-muted-foreground transition group-hover:translate-x-1 group-hover:text-foreground" /></div>
          <div className="flex items-center justify-between text-[10px] text-muted-foreground sm:hidden"><span className="mono">{item.language} · {formatDate(item.createdAt)}</span><ArrowRight size={14} /></div>
        </Link>)}
      </div> : <div className="rounded-2xl border border-dashed border-border bg-card/60 px-6 py-14 text-center" data-testid="state-empty-history">
        <div className="mx-auto grid size-12 place-items-center rounded-xl bg-[#e9ebdc] text-[#687d37]"><Sparkles size={20} /></div>
        <h3 className="mt-4 font-bold">{search || status || language ? 'No traces match that search.' : 'Your debugging story starts here.'}</h3>
        <p className="mx-auto mt-2 max-w-sm text-sm leading-6 text-muted-foreground">{search || status || language ? 'Try another phrase or clear a filter to see more diagnoses.' : 'Add a code snippet and error log. TraceFixer will keep the diagnosis and patch together.'}</p>
        {search || status || language ? <button onClick={() => { setSearch(''); setStatus(''); setLanguage(''); }} data-testid="button-clear-filters" className="mt-5 rounded-lg border bg-card px-4 py-2 text-xs font-bold hover:bg-muted">Clear filters</button> : <Link href="/debug/new" data-testid="button-first-diagnosis" className="mt-5 inline-flex items-center gap-2 rounded-lg bg-primary px-4 py-2.5 text-xs font-extrabold text-[#20271a]">Trace your first error <ArrowRight size={14} /></Link>}
      </div>}
      {sessions.isSuccess && sessions.data?.length ? <div className="mt-3 flex justify-between mono text-[9px] tracking-wider text-muted-foreground"><span>{sessions.data.length} SESSION{sessions.data.length === 1 ? '' : 'S'} SHOWN</span><span>PRIVATE TO YOUR WORKSPACE</span></div> : null}
    </section>
  </AppShell>;
}
