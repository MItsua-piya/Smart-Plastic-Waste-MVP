import { type ReactNode } from "react";
import { AlertCircle, Check, LoaderCircle } from "lucide-react";

export function StatusPill({ value, tone }: { value: string; tone?: "good" | "warn" | "bad" | "info" }) {
  const lower = value.toLowerCase();
  const resolved = tone ?? (lower.includes("high") || lower.includes("urgent") || lower.includes("full") ? "bad" : lower.includes("medium") || lower.includes("pending") || lower.includes("arrived") ? "warn" : lower.includes("completed") || lower.includes("collected") || lower.includes("ready") || lower.includes("active") || lower.includes("good") ? "good" : "info");
  const tones = {
    good: "bg-[#dcefdc] text-[#24563d] border-[#b9dbba]",
    warn: "bg-[#fff0c7] text-[#805414] border-[#ecd18a]",
    bad: "bg-[#fbe0db] text-[#9a3d31] border-[#efb8ad]",
    info: "bg-[#dcecf0] text-[#245568] border-[#b7d5dc]",
  };
  return <span data-testid={`status-pill-${value.toLowerCase().replace(/\s+/g, "-")}`} className={`inline-flex items-center rounded-full border px-2.5 py-1 text-[11px] font-bold uppercase tracking-[.08em] ${tones[resolved]}`}>{value}</span>;
}

export function Button({ children, variant = "primary", size = "md", disabled, onClick, type = "button", className = "", testId }: { children: ReactNode; variant?: "primary" | "quiet" | "outline" | "danger"; size?: "sm" | "md"; disabled?: boolean; onClick?: () => void; type?: "button" | "submit"; className?: string; testId?: string }) {
  const styles = {
    primary: "bg-primary text-primary-foreground hover:bg-[#235f4d]",
    quiet: "bg-secondary text-secondary-foreground hover:bg-[#ded7c5]",
    outline: "border border-border bg-card text-foreground hover:border-primary hover:text-primary",
    danger: "bg-destructive text-destructive-foreground hover:brightness-95",
  };
  return <button data-testid={testId} type={type} disabled={disabled} onClick={onClick} className={`inline-flex items-center justify-center gap-2 rounded-xl font-bold transition-all duration-200 disabled:cursor-not-allowed disabled:opacity-50 ${size === "sm" ? "px-3 py-2 text-xs" : "px-4 py-2.5 text-sm"} ${styles[variant]} ${className}`}>{children}</button>;
}

export function MetricCard({ label, value, note, accent = "lime", icon }: { label: string; value: string; note: string; accent?: "lime" | "orange" | "blue" | "coral"; icon: ReactNode }) {
  const colors = { lime: "bg-accent text-accent-foreground", orange: "bg-[#f6d59e] text-[#714916]", blue: "bg-[#cce4e6] text-[#245568]", coral: "bg-[#f3c6bc] text-[#85372d]" };
  return <div data-testid={`metric-${label.toLowerCase().replace(/\s+/g, "-")}`} className="hover-elevate rounded-2xl border border-card-border bg-card p-5 shadow-sm">
    <div className="flex items-start justify-between"><div className={`flex h-10 w-10 items-center justify-center rounded-xl ${colors[accent]}`}>{icon}</div><span className="font-mono text-[10px] uppercase tracking-[.14em] text-muted-foreground">live</span></div>
    <p className="mt-5 text-sm font-semibold text-muted-foreground">{label}</p><p className="mt-1 font-display text-3xl font-bold tracking-tight">{value}</p><p className="mt-2 text-xs text-muted-foreground">{note}</p>
  </div>;
}

export function QueryLoading({ rows = 3 }: { rows?: number }) {
  return <div data-testid="state-loading" className="space-y-3">{Array.from({ length: rows }).map((_, index) => <div key={index} className="skeleton h-16 rounded-2xl border border-card-border" />)}</div>;
}

export function QueryError({ onRetry, message = "We couldn't load this view." }: { onRetry: () => void; message?: string }) {
  return <div data-testid="state-error" className="flex flex-col items-center justify-center rounded-2xl border border-[#efb8ad] bg-[#fff0ec] px-6 py-14 text-center"><AlertCircle className="mb-3 h-8 w-8 text-destructive" /><h3 className="font-display text-lg font-bold">{message}</h3><p className="mt-1 max-w-sm text-sm text-muted-foreground">The network may be taking a breather. Try again in a moment.</p><Button variant="outline" size="sm" onClick={onRetry} className="mt-5" testId="button-retry">Try again</Button></div>;
}

export function EmptyState({ title, detail, action }: { title: string; detail: string; action?: ReactNode }) {
  return <div data-testid="state-empty" className="rounded-2xl border border-dashed border-border bg-card/70 px-6 py-14 text-center"><div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-accent text-primary"><Check className="h-5 w-5" /></div><h3 className="mt-4 font-display text-lg font-bold">{title}</h3><p className="mx-auto mt-1 max-w-sm text-sm text-muted-foreground">{detail}</p>{action ? <div className="mt-5">{action}</div> : null}</div>;
}

export function Dialog({ title, description, onClose, children }: { title: string; description: string; onClose: () => void; children: ReactNode }) {
  return <div data-testid="dialog-overlay" className="fixed inset-0 z-50 flex items-end justify-center bg-[#173c32]/35 p-0 backdrop-blur-sm sm:items-center sm:p-5"><div role="dialog" aria-modal="true" className="page-enter max-h-[92dvh] w-full overflow-y-auto rounded-t-3xl border border-card-border bg-card p-6 shadow-2xl sm:max-w-lg sm:rounded-3xl"><div className="flex items-start justify-between gap-4"><div><h2 className="font-display text-2xl font-bold">{title}</h2><p className="mt-1 text-sm text-muted-foreground">{description}</p></div><button data-testid="button-close-dialog" onClick={onClose} className="rounded-lg p-2 text-muted-foreground hover:bg-secondary hover:text-foreground" aria-label="Close dialog">×</button></div>{children}</div></div>;
}

export function Field({ label, children, hint }: { label: string; children: ReactNode; hint?: string }) {
  return <label className="block"><span className="mb-1.5 block text-xs font-bold uppercase tracking-[.1em] text-muted-foreground">{label}</span>{children}{hint ? <span className="mt-1 block text-[11px] text-muted-foreground">{hint}</span> : null}</label>;
}

export function MiniBarChart({ values }: { values: number[] }) {
  const max = Math.max(...values, 1);
  return <div data-testid="chart-weekly-collected" className="flex h-44 items-end gap-2 sm:gap-3">{values.map((value, index) => <div key={index} className="group flex min-w-0 flex-1 flex-col items-center justify-end gap-2"><div className="relative w-full rounded-t-lg bg-primary/90 transition-all duration-300 group-hover:bg-[#b7c847]" style={{ height: `${Math.max(10, value / max * 100)}%` }}><span className="absolute -top-5 left-1/2 -translate-x-1/2 font-mono text-[9px] text-muted-foreground opacity-0 transition-opacity group-hover:opacity-100">{value.toFixed(1)}</span></div><span className="font-mono text-[9px] text-muted-foreground">{["M", "T", "W", "T", "F", "S", "S"][index] ?? "—"}</span></div>)}</div>;
}

export function ActionFeedback({ text }: { text: string }) {
  return <div data-testid="status-action-feedback" className="flex items-center gap-2 rounded-xl border border-[#b9dbba] bg-[#e9f5e9] px-3 py-2 text-sm font-semibold text-[#24563d]"><Check className="h-4 w-4" />{text}</div>;
}

export function PendingLabel({ text = "Working…" }: { text?: string }) {
  return <span className="inline-flex items-center gap-2 text-xs font-semibold text-muted-foreground"><LoaderCircle className="h-3.5 w-3.5 animate-spin" />{text}</span>;
}