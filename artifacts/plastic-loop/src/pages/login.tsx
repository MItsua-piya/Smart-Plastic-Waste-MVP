import { useState } from "react";
import { ArrowRight, LockKeyhole, Recycle, ShieldCheck } from "lucide-react";
import { useAuth, type UserRole } from "@/context/auth-context";

const demos: Array<{ label: string; email: string; role: string }> = [
  { label: "Administrator", email: "admin@plasticloop.local", role: "Full network access" },
  { label: "Citizen", email: "citizen@plasticloop.local", role: "Deposit and report hotspots" },
  { label: "Centre staff", email: "centre@plasticloop.local", role: "Stock and pickup requests" },
  { label: "Driver", email: "driver@plasticloop.local", role: "Assigned route execution" },
];

export default function Login() {
  const { login, register, loading, error } = useAuth();
  const [mode, setMode] = useState<"login" | "register">("login");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("admin@plasticloop.local");
  const [password, setPassword] = useState("plasticloop");
  const [role, setRole] = useState<Exclude<UserRole, "admin">>("citizen");

  async function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    try {
      if (mode === "login") await login(email, password);
      else await register(name, email, password, role);
    } catch {
      // The provider exposes the error inline.
    }
  }

  return <main className="min-h-[100dvh] bg-background px-5 py-8 sm:px-10">
    <div className="mx-auto grid min-h-[calc(100dvh-4rem)] max-w-6xl items-center gap-10 lg:grid-cols-[1.1fr_.9fr]">
      <section className="hidden rounded-[2rem] bg-primary p-10 text-primary-foreground lg:block">
        <div className="flex items-center gap-3"><span className="flex h-11 w-11 items-center justify-center rounded-xl bg-sidebar-primary text-sidebar-primary-foreground"><Recycle className="h-5 w-5" /></span><div><p className="font-display text-xl font-bold">plastic loop</p><p className="font-mono text-[9px] uppercase tracking-[.2em] text-primary-foreground/60">local impact system</p></div></div>
        <div className="mt-28 max-w-md"><p className="font-mono text-[11px] uppercase tracking-[.2em] text-accent">A clearer way forward</p><h1 className="mt-4 font-display text-6xl font-bold leading-[.95] tracking-[-.05em]">Keep your community moving.</h1><p className="mt-6 text-base leading-7 text-primary-foreground/70">One secure place for every handoff: from the first deposit to the final return to the loop.</p></div>
        <div className="mt-28 grid gap-3 sm:grid-cols-2"><div className="rounded-2xl border border-primary-foreground/15 bg-primary-foreground/5 p-4"><ShieldCheck className="h-5 w-5 text-accent" /><p className="mt-8 text-sm font-semibold">Role-aware access</p><p className="mt-1 text-xs leading-5 text-primary-foreground/60">Every action stays in the right hands.</p></div><div className="rounded-2xl border border-primary-foreground/15 bg-primary-foreground/5 p-4"><LockKeyhole className="h-5 w-5 text-accent" /><p className="mt-8 text-sm font-semibold">Secure sessions</p><p className="mt-1 text-xs leading-5 text-primary-foreground/60">Your workspace follows you safely.</p></div></div>
      </section>
      <section className="mx-auto w-full max-w-md">
        <div className="mb-8 flex items-center gap-3 lg:hidden"><span className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary text-primary-foreground"><Recycle className="h-5 w-5" /></span><p className="font-display text-xl font-bold">plastic loop</p></div>
        <p className="font-mono text-[11px] uppercase tracking-[.18em] text-primary">{mode === "login" ? "Welcome back" : "Join the loop"}</p>
        <h2 className="mt-3 font-display text-4xl font-bold tracking-[-.04em]">{mode === "login" ? "Sign in to your workspace." : "Create your account."}</h2>
        <p className="mt-3 text-sm leading-6 text-muted-foreground">{mode === "login" ? "Choose your role workspace and pick up where the network needs you." : "Start contributing to a cleaner, more circular neighbourhood."}</p>
        <form onSubmit={submit} className="mt-8 space-y-4">
          {mode === "register" ? <label className="block"><span className="mb-2 block text-xs font-bold uppercase tracking-[.1em] text-muted-foreground">Name</span><input required minLength={2} value={name} onChange={(event) => setName(event.target.value)} className="w-full rounded-xl border border-input bg-card px-4 py-3 text-sm outline-none focus:ring-2 focus:ring-ring" placeholder="Your full name" /></label> : null}
          <label className="block"><span className="mb-2 block text-xs font-bold uppercase tracking-[.1em] text-muted-foreground">Email</span><input required autoComplete="email" type="email" value={email} onChange={(event) => setEmail(event.target.value)} className="w-full rounded-xl border border-input bg-card px-4 py-3 text-sm outline-none focus:ring-2 focus:ring-ring" placeholder="you@example.com" /></label>
          <label className="block"><span className="mb-2 block text-xs font-bold uppercase tracking-[.1em] text-muted-foreground">Password</span><input required autoComplete={mode === "register" ? "new-password" : "current-password"} minLength={mode === "register" ? 8 : 1} type="password" value={password} onChange={(event) => setPassword(event.target.value)} className="w-full rounded-xl border border-input bg-card px-4 py-3 text-sm outline-none focus:ring-2 focus:ring-ring" placeholder="Your password" /></label>
          {mode === "register" ? <label className="block"><span className="mb-2 block text-xs font-bold uppercase tracking-[.1em] text-muted-foreground">Role</span><select value={role} onChange={(event) => setRole(event.target.value as Exclude<UserRole, "admin">)} className="w-full rounded-xl border border-input bg-card px-4 py-3 text-sm outline-none focus:ring-2 focus:ring-ring"><option value="citizen">Citizen</option><option value="centre">Collection centre staff</option><option value="driver">Driver</option></select></label> : null}
          {error ? <p className="rounded-xl border border-[#efc8c1] bg-[#fff1ee] px-4 py-3 text-sm font-semibold text-[#85372d]">{error}</p> : null}
          <button disabled={loading} className="flex w-full items-center justify-center gap-2 rounded-xl bg-primary px-4 py-3.5 text-sm font-bold text-primary-foreground transition hover:brightness-110 disabled:cursor-wait disabled:opacity-60">{loading ? "Opening workspace…" : mode === "login" ? "Sign in" : "Create account"}<ArrowRight className="h-4 w-4" /></button>
        </form>
        {mode === "login" ? <div className="mt-8"><p className="font-mono text-[10px] uppercase tracking-[.16em] text-muted-foreground">Demo workspaces</p><div className="mt-3 grid gap-2 sm:grid-cols-2">{demos.map((demo) => <button key={demo.email} type="button" onClick={() => { setEmail(demo.email); setPassword("plasticloop"); }} className="rounded-xl border border-border bg-card p-3 text-left transition hover:border-primary"><p className="text-sm font-bold">{demo.label}</p><p className="mt-1 text-[11px] text-muted-foreground">{demo.role}</p></button>)}</div></div> : null}
        <button type="button" onClick={() => setMode(mode === "login" ? "register" : "login")} className="mt-8 text-sm font-bold text-primary hover:underline">{mode === "login" ? "Need an account? Register here" : "Already have an account? Sign in"}</button>
      </section>
    </div>
  </main>;
}