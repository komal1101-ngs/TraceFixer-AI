import { useState, type FormEvent } from 'react';
import { Link, useLocation } from 'wouter';
import { useQueryClient } from '@tanstack/react-query';
import { useLoginUser, useRegisterUser, getGetCurrentUserQueryKey, getGetDebugSummaryQueryKey } from '@workspace/api-client-react';
import { ArrowLeft, ArrowRight, Bug, Eye, EyeOff, LockKeyhole, Mail, UserRound } from 'lucide-react';
import { Brand } from '@/components/app-shell';

export default function AuthPage({ mode }: { mode: 'login' | 'register' }) {
  const isRegister = mode === 'register';
  const [, setLocation] = useLocation();
  const qc = useQueryClient();
  const login = useLoginUser();
  const register = useRegisterUser();
  const pending = login.isPending || register.isPending;
  const [email, setEmail] = useState('');
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [issue, setIssue] = useState('');
  const complete = (response: { token: string }) => {
    localStorage.setItem('tracefixer-token', response.token);
    qc.invalidateQueries({ queryKey: getGetCurrentUserQueryKey() });
    qc.invalidateQueries({ queryKey: getGetDebugSummaryQueryKey() });
    setLocation('/dashboard');
  };
  const submit = (e: FormEvent) => {
    e.preventDefault();
    setIssue('');
    if (isRegister) {
      if (username.trim().length < 2) return setIssue('Username must be at least 2 characters.');
      if (password.length < 8) return setIssue('Use at least 8 characters for your password.');
      register.mutate({ data: { username: username.trim(), email: email.trim(), password } }, {
        onSuccess: complete,
        onError: () => setIssue('We could not create your account. Check the details and try again.'),
      });
    } else {
      login.mutate({ data: { email: email.trim(), password } }, {
        onSuccess: complete,
        onError: () => setIssue('Those details did not match an account. Try again.'),
      });
    }
  };
  return <div className="grid min-h-[100dvh] bg-background lg:grid-cols-[1fr_.9fr]">
    <section className="relative flex min-h-[100dvh] flex-col px-6 py-6 md:px-12 md:py-9">
      <div className="flex items-center justify-between"><Brand /><Link href="/" data-testid="link-back-home" className="inline-flex items-center gap-2 text-xs font-semibold text-muted-foreground hover:text-foreground"><ArrowLeft size={14} /> Home</Link></div>
      <div className="mx-auto my-auto w-full max-w-[420px] py-12">
        <div className="mono text-[10px] tracking-[.18em] text-[#809343]">{isRegister ? 'OPEN A WORKSPACE' : 'WELCOME BACK'}</div>
        <h1 className="mt-3 text-4xl font-extrabold tracking-[-.06em]">{isRegister ? 'Start with the trace.' : 'Pick up the thread.'}</h1>
        <p className="mt-3 text-sm leading-6 text-muted-foreground">{isRegister ? 'Your debugging context, organized from the very first diagnosis.' : 'Your recent diagnoses are right where you left them.'}</p>
        <form onSubmit={submit} className="mt-8 space-y-4" data-testid="form-auth">
          {isRegister && <label className="block"><span className="mb-1.5 block text-xs font-bold">Username</span><span className="relative block"><UserRound size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" /><input value={username} onChange={e => setUsername(e.target.value)} minLength={2} maxLength={50} required autoComplete="username" data-testid="input-username" placeholder="How should we call you?" className="h-11 w-full rounded-lg border border-input bg-card pl-9 pr-3 text-sm outline-none transition focus:border-[#839748] focus:ring-2 focus:ring-[#839748]/20" /></span></label>}
          <label className="block"><span className="mb-1.5 block text-xs font-bold">Email address</span><span className="relative block"><Mail size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" /><input type="email" value={email} onChange={e => setEmail(e.target.value)} maxLength={100} required autoComplete="email" data-testid="input-email" placeholder="you@team.dev" className="h-11 w-full rounded-lg border border-input bg-card pl-9 pr-3 text-sm outline-none transition focus:border-[#839748] focus:ring-2 focus:ring-[#839748]/20" /></span></label>
          <label className="block"><span className="mb-1.5 block text-xs font-bold">Password</span><span className="relative block"><LockKeyhole size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" /><input type={showPassword ? 'text' : 'password'} value={password} onChange={e => setPassword(e.target.value)} minLength={isRegister ? 8 : 1} maxLength={128} required autoComplete={isRegister ? 'new-password' : 'current-password'} data-testid="input-password" placeholder={isRegister ? 'At least 8 characters' : 'Your password'} className="h-11 w-full rounded-lg border border-input bg-card pl-9 pr-11 text-sm outline-none transition focus:border-[#839748] focus:ring-2 focus:ring-[#839748]/20" /><button type="button" onClick={() => setShowPassword(!showPassword)} data-testid="button-toggle-password" aria-label={showPassword ? 'Hide password' : 'Show password'} className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground">{showPassword ? <EyeOff size={15} /> : <Eye size={15} />}</button></span></label>
          {issue && <div role="alert" data-testid="status-auth-error" className="rounded-lg border border-[#e6c6b9] bg-[#fff1e9] px-3 py-2.5 text-xs leading-5 text-[#8b422f]">{issue}</div>}
          <button type="submit" disabled={pending} data-testid="button-auth-submit" className="flex h-11 w-full items-center justify-center gap-2 rounded-lg bg-primary text-sm font-extrabold text-[#20271a] transition hover:brightness-95 disabled:cursor-wait disabled:opacity-65">{pending ? 'Working through it…' : isRegister ? 'Create account' : 'Sign in'} {pending ? <span className="size-3 animate-spin rounded-full border-2 border-current border-r-transparent" /> : <ArrowRight size={15} />}</button>
        </form>
        <p className="mt-6 text-center text-xs text-muted-foreground">{isRegister ? 'Already tracing with us?' : 'New to TraceFixer?'} <Link href={isRegister ? '/login' : '/register'} data-testid="link-switch-auth" className="font-bold text-foreground underline underline-offset-4">{isRegister ? 'Sign in' : 'Create an account'}</Link></p>
        <p className="mt-10 flex items-center justify-center gap-2 text-[10px] text-muted-foreground"><LockKeyhole size={12} /> Only your account can access your saved debugging history.</p>
      </div>
      <div className="mono text-[9px] tracking-[.15em] text-muted-foreground">TRACEFIXER / YOUR DEBUGGING CO-PILOT</div>
    </section>
    <aside className="relative hidden overflow-hidden bg-[#202833] p-12 text-[#f1f0e7] lg:flex lg:flex-col lg:justify-between">
      <div className="absolute inset-0 grid-paper opacity-20" />
      <div className="relative flex justify-end"><span className="mono text-[10px] tracking-[.15em] text-[#aab2a8]">LESS GUESS. MORE SIGNAL.</span></div>
      <div className="relative mx-auto max-w-lg">
        <div className="mb-7 grid size-14 place-items-center rounded-2xl bg-primary text-[#20271a]"><Bug size={25} /></div>
        <p className="mono text-[10px] tracking-[.18em] text-[#becb87]">THE DEBUGGING LOOP, UNTANGLED</p>
        <h2 className="mt-4 text-5xl font-extrabold leading-[1.08] tracking-[-.065em]">Good fixes start with a clear explanation.</h2>
        <p className="mt-5 max-w-md text-sm leading-7 text-[#c1c7bf]">Bring your code and logs. Keep the reasoning, the patch, and the follow-up in one place.</p>
        <div className="mt-9 flex gap-2"><span className="rounded-full border border-white/15 px-3 py-1.5 mono text-[9px] text-[#dce2d6]">ROOT CAUSE</span><span className="rounded-full border border-white/15 px-3 py-1.5 mono text-[9px] text-[#dce2d6]">REVIEWABLE PATCH</span><span className="rounded-full border border-white/15 px-3 py-1.5 mono text-[9px] text-[#dce2d6]">HISTORY</span></div>
      </div>
      <div className="relative flex items-center justify-between border-t border-white/10 pt-5 mono text-[9px] tracking-[.12em] text-[#aab2a8]"><span>CODE / CONTEXT / CLARITY</span><span>01—03</span></div>
    </aside>
  </div>;
}
