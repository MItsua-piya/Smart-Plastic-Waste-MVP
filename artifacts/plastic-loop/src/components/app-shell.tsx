import { type ReactNode, useState } from "react";
import { Link, useLocation } from "wouter";
import { Activity, Bell, Boxes, ChevronDown, CircleUserRound, LayoutDashboard, Map, MapPinned, Menu, PackageCheck, Recycle, Route as RouteIcon, X } from "lucide-react";

const navItems = [
  { href: "/", label: "Overview", icon: LayoutDashboard },
  { href: "/deposits", label: "Deposits", icon: Recycle },
  { href: "/centres", label: "Collection centres", icon: Boxes },
  { href: "/pickups", label: "Pickup queue", icon: PackageCheck },
  { href: "/routes", label: "Driver routes", icon: RouteIcon },
  { href: "/hotspots", label: "Hotspot reports", icon: MapPinned },
];

export function AppShell({ children }: { children: ReactNode }) {
  const [location] = useLocation();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [role, setRole] = useState(() => localStorage.getItem("plastic-loop-role") ?? "Operations lead");
  const visibleItems = role === "Citizen"
    ? navItems.filter((item) => ["/", "/deposits", "/centres", "/hotspots"].includes(item.href))
    : role === "Centre staff"
      ? navItems.filter((item) => ["/", "/deposits", "/centres", "/pickups"].includes(item.href))
      : role === "Driver"
        ? navItems.filter((item) => ["/", "/pickups", "/routes"].includes(item.href))
        : navItems;
  const updateRole = (nextRole: string) => {
    setRole(nextRole);
    localStorage.setItem("plastic-loop-role", nextRole);
  };
  return <div className="min-h-[100dvh] bg-background">
    <aside className={`fixed inset-y-0 left-0 z-40 flex w-[264px] flex-col bg-sidebar px-4 py-5 text-sidebar-foreground transition-transform duration-300 lg:translate-x-0 ${mobileOpen ? "translate-x-0" : "-translate-x-full"}`}>
      <div className="flex items-center justify-between px-3"><Link href="/" className="flex items-center gap-3" onClick={() => setMobileOpen(false)} data-testid="link-brand"><span className="flex h-10 w-10 items-center justify-center rounded-xl bg-sidebar-primary text-sidebar-primary-foreground"><Recycle className="h-5 w-5" /></span><span><span className="block font-display text-xl font-bold tracking-tight">plastic loop</span><span className="block font-mono text-[9px] uppercase tracking-[.2em] text-sidebar-foreground/60">local impact system</span></span></Link><button data-testid="button-close-menu" className="rounded-lg p-2 text-sidebar-foreground/60 hover:bg-sidebar-accent lg:hidden" onClick={() => setMobileOpen(false)}><X className="h-5 w-5" /></button></div>
      <div className="mt-10 px-3"><p className="font-mono text-[10px] uppercase tracking-[.18em] text-sidebar-foreground/45">Workspace</p><nav className="mt-3 space-y-1">{visibleItems.map(({ href, label, icon: Icon }) => { const active = href === "/" ? location === "/" : location.startsWith(href); return <Link key={href} href={href} onClick={() => setMobileOpen(false)} data-testid={`link-nav-${label.toLowerCase().replace(/\s+/g, "-")}`} className={`group flex items-center gap-3 rounded-xl px-3 py-3 text-sm font-semibold transition-all ${active ? "bg-sidebar-primary text-sidebar-primary-foreground shadow-sm" : "text-sidebar-foreground/72 hover:bg-sidebar-accent hover:text-sidebar-foreground"}`}><Icon className="h-[18px] w-[18px]" /><span>{label}</span>{label === "Pickup queue" ? <span className={`ml-auto rounded-full px-2 py-0.5 font-mono text-[10px] ${active ? "bg-sidebar-primary-foreground/15" : "bg-sidebar-foreground/10"}`}>12</span> : null}</Link> })}</nav></div>
      <div className="mt-auto space-y-3"><div className="rounded-2xl border border-sidebar-border bg-sidebar-accent/50 p-4"><div className="flex items-center gap-2 text-sidebar-primary"><Activity className="h-4 w-4" /><span className="font-mono text-[10px] uppercase tracking-[.12em]">Network pulse</span></div><p className="mt-3 text-sm leading-5 text-sidebar-foreground/80">Every handoff is moving material back into the loop.</p><div className="mt-4 h-1.5 overflow-hidden rounded-full bg-sidebar-foreground/10"><div className="h-full w-[78%] rounded-full bg-sidebar-primary" /></div><p className="mt-2 font-mono text-[10px] text-sidebar-foreground/50">78% route capacity planned</p></div><div className="flex items-center gap-3 rounded-xl px-2 py-2"><span className="flex h-9 w-9 items-center justify-center rounded-full bg-[#f3c6bc] text-xs font-extrabold text-[#85372d]">AM</span><div className="min-w-0 flex-1"><p className="truncate text-sm font-bold">Amina Mensah</p><p className="truncate text-xs text-sidebar-foreground/50">{role}</p></div><CircleUserRound className="h-4 w-4 text-sidebar-foreground/40" /></div></div>
    </aside>
    {mobileOpen ? <button aria-label="Close navigation" data-testid="button-mobile-backdrop" className="fixed inset-0 z-30 bg-[#173c32]/40 lg:hidden" onClick={() => setMobileOpen(false)} /> : null}
    <main className="lg:pl-[264px]"><header className="sticky top-0 z-20 flex h-[72px] items-center justify-between border-b border-border bg-background/90 px-5 backdrop-blur-md sm:px-8"><div className="flex items-center gap-3"><button data-testid="button-open-menu" className="rounded-xl border border-border bg-card p-2.5 lg:hidden" onClick={() => setMobileOpen(true)}><Menu className="h-5 w-5" /></button><div className="hidden items-center gap-2 text-xs font-semibold text-muted-foreground sm:flex"><Map className="h-4 w-4 text-primary" /> Greater Accra network <span className="mx-1 text-border">/</span> 06:40 local</div></div><div className="flex items-center gap-2 sm:gap-4"><label className="relative flex items-center gap-2 rounded-xl border border-border bg-card px-3 py-2"><span className="hidden text-[10px] font-bold uppercase tracking-[.1em] text-muted-foreground sm:block">Viewing as</span><select data-testid="select-active-role" value={role} onChange={(event) => updateRole(event.target.value)} className="appearance-none bg-transparent pr-5 text-xs font-bold outline-none"><option>Operations lead</option><option>Citizen</option><option>Centre staff</option><option>Driver</option><option>Administrator</option></select><ChevronDown className="pointer-events-none absolute right-2 h-3.5 w-3.5 text-muted-foreground" /></label><button data-testid="button-notifications" onClick={() => window.alert("No new notifications. Your network is up to date.")} className="relative rounded-xl border border-border bg-card p-2.5 text-muted-foreground hover:text-foreground"><Bell className="h-[18px] w-[18px]" /><span className="absolute right-1.5 top-1.5 h-1.5 w-1.5 rounded-full bg-[#e68d43]" /></button><span className="hidden h-8 w-px bg-border sm:block" /><span className="hidden text-xs font-semibold text-muted-foreground md:block">Tuesday, 24 September 2024</span></div></header><div className="page-enter">{children}</div></main>
  </div>;
}