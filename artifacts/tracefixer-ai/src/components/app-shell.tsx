import type { ReactNode } from 'react';
import { Link, useLocation } from 'wouter';
import { useQueryClient } from '@tanstack/react-query';
import { Activity, ArrowLeft, Bug, CircleHelp, Command, LogOut, Plus, Terminal } from 'lucide-react';
import { getGetCurrentUserQueryKey } from '@workspace/api-client-react';

export function Brand({ light = false }: { light?: boolean }) {
  return <Link href="/" className={`inline-flex items-center gap-2.5 ${light ? 'text-[#f8f6ef]' : 'text-foreground'}`} data-testid="link-brand">
    <span className="grid size-8 place-items-center rounded-lg bg-primary text-[#20271a]"><Bug size={18} strokeWidth={2.4} /></span>
    <span className="text-[15px] font-extrabold tracking-[-.04em]">tracefixer<span className="font-medium text-primary">.ai</span></span>
  </Link>;
}

export function AppShell({ children, title, eyebrow = 'WORKSPACE', back }: { children: ReactNode; title: string; eyebrow?: string; back?: string }) {
  const [location, setLocation] = useLocation();
  const qc = useQueryClient();
  const logout = () => {
    localStorage.removeItem('tracefixer-token');
    qc.removeQueries({ queryKey: getGetCurrentUserQueryKey() });
    qc.clear();
    setLocation('/login');
  };
  const nav = [{ href: '/dashboard', label: 'History', icon: Terminal }, { href: '/debug/new', label: 'New diagnosis', icon: Plus }];
  return <div className="min-h-[100dvh] bg-background text-foreground md:flex">
    <aside className="flex shrink-0 flex-col bg-[#202833] text-[#e9e9df] md:sticky md:top-0 md:h-[100dvh] md:w-[244px]" data-testid="region-sidebar">
      <div className="flex items-center justify-between px-5 py-5"><Brand light /><span className="mono text-[10px] tracking-widest text-[#9ba39f]">BETA</span></div>
      <div className="mx-4 mt-6 rounded-xl border border-white/10 bg-white/[.04] px-3 py-3">
        <div className="flex items-center gap-2 text-[10px] font-bold tracking-[.16em] text-[#a5ada8]"><Activity size={13} className="text-primary" /> DEBUG SPACE</div>
        <div className="mt-2 truncate text-sm font-semibold">Personal workspace</div>
        <div className="mono mt-1 text-[10px] text-[#a5ada8]">TRACE / LOCAL</div>
      </div>
      <nav className="mt-7 flex gap-2 overflow-x-auto px-3 pb-2 md:flex-col md:overflow-visible" aria-label="Main navigation">
        <div className="hidden px-3 pb-2 text-[10px] font-bold tracking-[.16em] text-[#9ba39f] md:block">WORKSPACE</div>
        {nav.map(({ href, label, icon: Icon }) => <Link key={href} href={href} data-testid={`nav-${label.toLowerCase().replaceAll(' ', '-')}`} className={`flex shrink-0 items-center gap-3 rounded-lg px-3 py-2.5 text-sm transition-colors ${location === href || (href === '/dashboard' && location.startsWith('/debug/')) ? 'bg-white/10 text-white' : 'text-[#c5cbc5] hover:bg-white/[.06] hover:text-white'}`}><Icon size={16} className={location === href ? 'text-primary' : ''} />{label}</Link>)}
      </nav>
      <div className="mt-auto hidden p-4 md:block">
        <div className="mb-4 rounded-xl border border-white/10 bg-[#29333d] p-3">
          <div className="flex items-center gap-2 text-xs font-semibold"><CircleHelp size={14} className="text-primary" /> Built for the next clue</div>
          <p className="mt-2 text-[11px] leading-relaxed text-[#adb5af]">Keep the stack trace. Lose the guesswork.</p>
        </div>
        <button onClick={logout} data-testid="button-sign-out" className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-xs text-[#bcc2bc] transition hover:bg-white/10"><LogOut size={14} /> Sign out</button>
      </div>
    </aside>
    <main className="min-w-0 flex-1">
      <header className="flex h-[70px] items-center justify-between border-b border-border/80 px-5 md:px-10">
        <div className="flex min-w-0 items-center gap-3">
          {back && <button onClick={() => setLocation(back)} data-testid="button-back" aria-label="Go back" className="grid size-9 shrink-0 place-items-center rounded-lg border bg-card hover:bg-muted"><ArrowLeft size={16} /></button>}
          <div><p className="mono text-[9px] font-medium tracking-[.18em] text-muted-foreground">{eyebrow}</p><h1 className="truncate text-sm font-bold md:text-base" data-testid="text-page-title">{title}</h1></div>
        </div>
        <div className="flex items-center gap-2">
          <div className="hidden items-center gap-2 rounded-lg border border-border bg-card px-2.5 py-1.5 text-[10px] text-muted-foreground sm:flex"><Command size={12} /> Ready to trace</div>
          <button onClick={() => setLocation('/debug/new')} data-testid="button-quick-diagnose" className="inline-flex items-center gap-2 rounded-lg bg-primary px-3 py-2 text-xs font-bold text-[#20271a] transition hover:brightness-95"><Plus size={15} /> <span className="hidden sm:inline">New diagnosis</span></button>
          <button onClick={logout} data-testid="button-sign-out-mobile" aria-label="Sign out" className="grid size-9 place-items-center rounded-lg border border-border bg-card text-muted-foreground transition hover:bg-muted md:hidden"><LogOut size={15} /></button>
        </div>
      </header>
      <div className="mx-auto max-w-[1320px] px-5 py-7 md:px-10 md:py-10">{children}</div>
    </main>
  </div>;
}

export function PageError({ retry }: { retry: () => void }) {
  return <div className="rounded-2xl border border-dashed border-border bg-card/60 px-6 py-14 text-center" data-testid="state-query-error">
    <div className="mx-auto grid size-12 place-items-center rounded-xl bg-[#f7e7dd] text-[#ad573d]"><Bug size={20} /></div>
    <h2 className="mt-4 font-bold">That trace didn’t come through.</h2>
    <p className="mx-auto mt-1 max-w-sm text-sm text-muted-foreground">The service could not load this view. Your work is safe; try again in a moment.</p>
    <button onClick={retry} data-testid="button-retry" className="mt-5 rounded-lg border bg-card px-4 py-2 text-sm font-semibold hover:bg-muted">Try again</button>
  </div>;
}

export function SkeletonRows() {
  return <div className="space-y-3" data-testid="state-loading"><div className="h-20 animate-pulse rounded-xl bg-muted" /><div className="h-20 animate-pulse rounded-xl bg-muted" /><div className="h-20 animate-pulse rounded-xl bg-muted" /></div>;
}

export function StatusPill({ status }: { status: string }) {
  return <span data-testid={`status-${status}`} className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[10px] font-bold capitalize ${status === 'resolved' ? 'bg-[#e2eee4] text-[#3e7049]' : 'bg-[#f8ecd5] text-[#93621f]'}`}><span className={`size-1.5 rounded-full ${status === 'resolved' ? 'bg-[#4d8a59]' : 'bg-[#c58830]'}`} />{status}</span>;
}
export const formatDate = (date: string) => new Intl.DateTimeFormat(undefined, { month: 'short', day: 'numeric', year: 'numeric' }).format(new Date(date));
export const Severity = ({ severity }: { severity?: string | null }) => <span className={`mono text-[10px] uppercase tracking-wider ${severity === 'critical' || severity === 'high' ? 'text-[#af4c38]' : severity === 'medium' ? 'text-[#a27628]' : 'text-muted-foreground'}`}>{severity ?? 'unrated'}</span>;
