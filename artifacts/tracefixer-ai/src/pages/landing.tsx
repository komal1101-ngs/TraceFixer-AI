import { Link } from 'wouter';
import { useHealthCheck } from '@workspace/api-client-react';
import { ArrowRight, ArrowUpRight, Check, Code2, FileCode2, GitBranch, Search, ShieldCheck, Sparkles, Terminal, Workflow } from 'lucide-react';
import { Brand } from '@/components/app-shell';

export default function LandingPage() {
  const health = useHealthCheck();
  return <div className="min-h-[100dvh] overflow-hidden bg-background">
    <header className="mx-auto flex max-w-[1360px] items-center justify-between px-5 py-5 md:px-10">
      <Brand />
      <div className="flex items-center gap-5">
        <Link href="/login" data-testid="link-login" className="hidden text-sm font-semibold text-muted-foreground transition hover:text-foreground sm:inline">Sign in</Link>
        <Link href="/register" data-testid="link-register" className="inline-flex items-center gap-2 rounded-lg bg-[#202833] px-4 py-2.5 text-sm font-bold text-[#f8f6ef] transition hover:bg-[#303b46]">Try TraceFixer <ArrowRight size={15} /></Link>
      </div>
    </header>
    <main>
      <section className="mx-auto grid max-w-[1360px] items-center gap-12 px-5 pb-20 pt-12 md:grid-cols-[1.05fr_.95fr] md:px-10 md:pb-28 md:pt-20">
        <div className="animate-rise">
          <div className="inline-flex items-center gap-2 rounded-full border border-border bg-card px-3 py-1.5 text-[11px] font-semibold text-muted-foreground"><span className={`size-1.5 rounded-full ${health.isError ? 'bg-[#c78348]' : 'bg-[#8fa83d]'}`} /> {health.isLoading ? 'Checking diagnostic engine' : health.isError ? 'Engine status unavailable' : `Engine ${health.data?.status ?? 'ready'}`} <span className="mono text-[9px] tracking-wider">· v0.1</span></div>
          <h1 className="mt-7 max-w-[680px] text-[clamp(3.1rem,7vw,6.3rem)] font-extrabold leading-[.98] tracking-[-.075em]">Errors are clues.<br /><span className="relative text-[#738d2c]">Find the thread.</span></h1>
          <p className="mt-7 max-w-[510px] text-lg leading-8 text-muted-foreground">TraceFixer turns the errors you already have into fixes you can understand, review, and trust.</p>
          <div className="mt-8 flex flex-wrap gap-3">
            <Link href="/register" data-testid="button-get-started" className="group inline-flex items-center gap-3 rounded-lg bg-primary px-5 py-3.5 text-sm font-extrabold text-[#20271a] shadow-sm transition hover:-translate-y-0.5">Start tracing <ArrowRight size={16} className="transition-transform group-hover:translate-x-1" /></Link>
            <Link href="/login" data-testid="button-sign-in" className="inline-flex items-center rounded-lg border border-border bg-card px-5 py-3.5 text-sm font-bold transition hover:bg-muted">I have an account</Link>
          </div>
          <div className="mt-8 flex items-center gap-2 text-xs text-muted-foreground"><ShieldCheck size={14} className="text-[#688348]" /> Your diagnosis stays connected to the original code and logs.</div>
        </div>
        <div className="relative animate-rise delay-1">
          <div className="absolute -right-12 -top-16 size-64 rounded-full bg-[#d8dfaa]/40 blur-3xl" />
          <div className="relative overflow-hidden rounded-[20px] border border-[#37414a] bg-[#202833] shadow-[0_28px_70px_-32px_rgba(31,39,49,.5)]">
            <div className="flex items-center justify-between border-b border-white/10 px-5 py-4">
              <div className="flex items-center gap-2"><span className="size-2 rounded-full bg-[#da8b47]" /><span className="mono text-[11px] text-[#dce0d7]">diagnosis / 042</span></div>
              <span className="mono text-[10px] text-[#abb3ab]">PYTHON · RUNTIME</span>
            </div>
            <div className="grid-paper relative px-5 py-6 md:px-7">
              <div className="rounded-xl border border-white/10 bg-[#171e27]/95 p-4">
                <div className="mb-4 flex items-center gap-2 text-[10px] text-[#aeb8ae]"><Terminal size={13} /> ERROR LOG</div>
                <pre className="mono whitespace-pre-wrap text-[11px] leading-[1.9] text-[#d3d9d0]"><span className="text-[#d99671]">TypeError</span>: cannot unpack non-iterable NoneType<br />at <span className="text-[#c0d37a]">parse_record</span>(parser.py:42)<br />at run_job(worker.py:108)</pre>
              </div>
              <div className="my-3 flex items-center justify-center"><div className="h-px w-full bg-white/10" /><span className="mx-3 shrink-0 rounded-full border border-white/10 px-2 py-1 mono text-[9px] text-[#cbd29e]">TRACEFIXER ANALYSIS</span><div className="h-px w-full bg-white/10" /></div>
              <div className="rounded-xl border border-[#a7bd62]/30 bg-[#303b32] p-4">
                <div className="flex items-center gap-2 text-xs font-bold text-[#e1e8ca]"><Sparkles size={14} className="text-[#c8dc75]" /> Root cause found</div>
                <p className="mt-2 text-[12px] leading-5 text-[#c9d2c2]">`parse_record` returns <span className="mono text-[#d9db94]">None</span> when the row is empty. The caller unpacks it as a pair.</p>
                <div className="mt-3 rounded-lg bg-[#171e27] px-3 py-2.5 mono text-[10px] text-[#dce1d9]"><span className="text-[#849d4c]">+ if record is None: return (None, None)</span></div>
              </div>
            </div>
            <div className="flex items-center justify-between border-t border-white/10 px-5 py-3 text-[10px] text-[#abb3ab]"><span className="flex items-center gap-2"><Check size={12} className="text-[#bed46a]" /> Fix is reviewable</span><span className="mono">3 STEPS · 12 SEC</span></div>
          </div>
          <div className="absolute -bottom-5 -left-5 hidden items-center gap-3 rounded-xl border border-border bg-card px-4 py-3 shadow-lg sm:flex"><div className="grid size-8 place-items-center rounded-lg bg-[#e8eccf] text-[#657b2f]"><GitBranch size={16} /></div><div><div className="text-xs font-bold">No black box</div><div className="mono text-[9px] text-muted-foreground">CAUSE → FIX → PREVENT</div></div></div>
        </div>
      </section>
      <section className="border-y border-border bg-[#edece2]">
        <div className="mx-auto grid max-w-[1360px] gap-9 px-5 py-9 md:grid-cols-[1fr_2fr] md:items-center md:px-10">
          <p className="mono text-[10px] font-medium tracking-[.15em] text-muted-foreground">A BETTER LOOP FOR BUGS</p>
          <div className="grid gap-6 sm:grid-cols-3">
            {[['01', 'Make sense', 'Plain-language root cause, not another cryptic stack trace.'], ['02', 'Review the fix', 'See the corrected code before it goes anywhere.'], ['03', 'Keep the context', 'Search past diagnoses and ask a follow-up when needed.']].map(([n, title, body]) => <article key={n} className="border-l border-[#c9c9bb] pl-4"><span className="mono text-[10px] text-[#809344]">{n}</span><h2 className="mt-2 text-sm font-extrabold">{title}</h2><p className="mt-1 text-xs leading-5 text-muted-foreground">{body}</p></article>)}
          </div>
        </div>
      </section>
      <section className="mx-auto grid max-w-[1360px] gap-10 px-5 py-16 md:grid-cols-2 md:items-center md:px-10 md:py-24">
        <div><span className="mono text-[10px] tracking-[.16em] text-[#819343]">BUILT FOR THE DEBUGGING MOMENT</span><h2 className="mt-4 max-w-lg text-4xl font-extrabold leading-tight tracking-[-.055em] md:text-5xl">Keep your focus on the problem, not the paperwork.</h2><p className="mt-4 max-w-lg leading-7 text-muted-foreground">Drop in the snippet and the log. Get a diagnosis organized around what broke, why it broke, and what to change next.</p><Link href="/register" data-testid="link-start-debugging" className="mt-7 inline-flex items-center gap-2 text-sm font-bold underline decoration-[#a5b773] decoration-2 underline-offset-4">Bring us your first trace <ArrowUpRight size={15} /></Link></div>
        <div className="grid gap-3">
          {[['Input', 'Code + error log', Code2], ['Analysis', 'Cause, severity, steps', Workflow], ['History', 'A searchable diagnosis trail', Search], ['Output', 'Patch + prevention tips', FileCode2]].map(([name, detail, Icon]: any) => <div key={name} className="flex items-center gap-4 rounded-xl border border-border bg-card px-4 py-4 transition hover:translate-x-1"><span className="grid size-10 place-items-center rounded-lg bg-[#e9ebdc] text-[#657a33]"><Icon size={18} /></span><div className="flex-1"><div className="text-sm font-bold">{name}</div><div className="text-xs text-muted-foreground">{detail}</div></div><ArrowRight size={15} className="text-muted-foreground" /></div>)}
        </div>
      </section>
      <footer className="border-t border-border bg-[#202833] px-5 py-8 text-[#e5e5db] md:px-10">
        <div className="mx-auto flex max-w-[1360px] flex-col gap-5 sm:flex-row sm:items-center sm:justify-between"><Brand light /><div className="flex gap-5 text-xs text-[#c4c9c1]"><Link href="/login" data-testid="footer-login" className="hover:text-white">Sign in</Link><Link href="/register" data-testid="footer-register" className="hover:text-white">Create account</Link></div><span className="mono text-[9px] tracking-wider text-[#98a199]">A LITTLE LESS STUCK.</span></div>
      </footer>
    </main>
  </div>;
}
