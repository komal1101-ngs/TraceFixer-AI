import { Link } from 'wouter';
import { ArrowLeft, Bug, Search } from 'lucide-react';
import { Brand } from '@/components/app-shell';
export default function NotFound() {
  return <main className="grid min-h-[100dvh] place-items-center bg-background px-5">
    <section className="w-full max-w-lg rounded-2xl border border-border bg-card p-8 text-center shadow-sm md:p-12" data-testid="state-not-found">
      <div className="mx-auto grid size-14 place-items-center rounded-2xl bg-[#e9ebdc] text-[#71843b]"><Bug size={24} /></div>
      <div className="mt-6 mono text-[10px] tracking-[.18em] text-[#849449]">404 / TRACE LOST</div>
      <h1 className="mt-2 text-3xl font-extrabold tracking-[-.06em]">Nothing on this line.</h1>
      <p className="mx-auto mt-3 max-w-sm text-sm leading-6 text-muted-foreground">This route does not resolve to a page. The good news: nothing is wrong with your code.</p>
      <div className="mt-7 flex flex-col justify-center gap-2 sm:flex-row"><Link href="/" data-testid="link-not-found-home" className="inline-flex items-center justify-center gap-2 rounded-lg border border-border px-4 py-2.5 text-xs font-bold hover:bg-muted"><ArrowLeft size={14} /> Back to home</Link><Link href="/login" data-testid="link-not-found-login" className="inline-flex items-center justify-center gap-2 rounded-lg bg-primary px-4 py-2.5 text-xs font-extrabold text-[#20271a] hover:brightness-95"><Search size={14} /> Find your diagnoses</Link></div>
      <div className="mt-8 flex justify-center"><Brand /></div>
    </section>
  </main>;
}
