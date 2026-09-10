import { useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import {
  getGetAdminAnalyticsQueryKey,
  getListAdminUsersQueryKey,
  getListAdminVehiclesQueryKey,
  getListAdminRewardsQueryKey,
  getListCleanupActionsQueryKey,
  getListHotspotsQueryKey,
  useCreateAdminReward,
  useCreateCleanupAction,
  useGetAdminAnalytics,
  useListAdminRewards,
  useListAdminUsers,
  useListAdminVehicles,
  useListCleanupActions,
  useListHotspots,
  useUpdateCleanupActionStatus,
  useUpdateHotspotStatus,
} from "@workspace/api-client-react";
import { ArrowUpRight, Check, CircleAlert, Plus, ShieldCheck, Truck, Users, X } from "lucide-react";
import { useAuth } from "@/context/auth-context";

const formatNumber = (value: number) => new Intl.NumberFormat("en-IN", { maximumFractionDigits: 0 }).format(value);

export default function Admin() {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const analytics = useGetAdminAnalytics({ query: { enabled: user?.role === "admin", queryKey: getGetAdminAnalyticsQueryKey() } });
  const users = useListAdminUsers({ query: { enabled: user?.role === "admin", queryKey: getListAdminUsersQueryKey() } });
  const vehicles = useListAdminVehicles({ query: { enabled: user?.role === "admin", queryKey: getListAdminVehiclesQueryKey() } });
  const rewards = useListAdminRewards({ query: { enabled: user?.role === "admin", queryKey: getListAdminRewardsQueryKey() } });
  const hotspots = useListHotspots({ query: { enabled: user?.role === "admin", queryKey: getListHotspotsQueryKey() } });
  const cleanup = useListCleanupActions({ query: { enabled: user?.role === "admin", queryKey: getListCleanupActionsQueryKey() } });
  const verifyHotspot = useUpdateHotspotStatus();
  const createCleanup = useCreateCleanupAction();
  const updateCleanup = useUpdateCleanupActionStatus();
  const createReward = useCreateAdminReward();
  const [rewardName, setRewardName] = useState("");
  const [rewardDescription, setRewardDescription] = useState("");
  const [rewardCost, setRewardCost] = useState("120");
  const [notice, setNotice] = useState("");

  if (user?.role !== "admin") return <section className="mx-auto max-w-3xl p-8"><div className="rounded-2xl border border-[#efc8c1] bg-[#fff1ee] p-6"><CircleAlert className="h-6 w-6 text-[#85372d]" /><h1 className="mt-4 font-display text-2xl font-bold">Administrator access only</h1><p className="mt-2 text-sm text-muted-foreground">Sign in with an administrator account to manage the network.</p></div></section>;
  const data = analytics.data;
  const refresh = () => {
    queryClient.invalidateQueries({ queryKey: getGetAdminAnalyticsQueryKey() });
    queryClient.invalidateQueries({ queryKey: getListHotspotsQueryKey() });
    queryClient.invalidateQueries({ queryKey: getListCleanupActionsQueryKey() });
    queryClient.invalidateQueries({ queryKey: getListAdminRewardsQueryKey() });
  };
  const action = async (work: () => Promise<unknown>, message: string) => {
    try { await work(); setNotice(message); refresh(); } catch { setNotice("That action could not be completed."); }
  };
  return <section className="mx-auto max-w-[1440px] p-5 sm:p-8">
    <div className="flex flex-col justify-between gap-4 md:flex-row md:items-end"><div><p className="font-mono text-[11px] uppercase tracking-[.18em] text-primary">Control centre</p><h1 className="mt-2 font-display text-4xl font-bold tracking-[-.04em]">Admin overview</h1><p className="mt-2 text-sm text-muted-foreground">Keep the network accountable, moving, and ready for its next handoff.</p></div><div className="flex items-center gap-2 rounded-xl border border-[#b9dbba] bg-[#e9f5e9] px-3 py-2 text-xs font-bold text-[#24563d]"><ShieldCheck className="h-4 w-4" /> Protected workspace</div></div>
    {notice ? <div className="mt-5 rounded-xl border border-[#b9dbba] bg-[#e9f5e9] px-4 py-3 text-sm font-semibold text-[#24563d]">{notice}</div> : null}
    <div className="mt-8 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">{[
      ["Collected to date", `${formatNumber(data?.totalCollected ?? 0)} kg`, "Across all active centres"],
      ["Active citizens", formatNumber(data?.activeCitizens ?? 0), "Participating this month"],
      ["Route completion", `${data?.routeCompletionRate ?? 0}%`, "Successful route handoffs"],
      ["Avg. hotspot resolution", `${data?.averageResolutionHours ?? 0}h`, "From report to closure"],
    ].map(([label, value, note]) => <div key={label} className="rounded-2xl border border-card-border bg-card p-5 shadow-sm"><p className="text-sm text-muted-foreground">{label}</p><p className="mt-3 font-display text-3xl font-bold">{value}</p><p className="mt-1 text-xs text-muted-foreground">{note}</p></div>)}</div>
    <div className="mt-5 grid gap-5 xl:grid-cols-[1.1fr_.9fr]"><div className="rounded-2xl border border-card-border bg-card p-5 shadow-sm"><div className="flex items-center justify-between"><div><p className="font-mono text-[10px] uppercase tracking-[.16em] text-muted-foreground">Network trend</p><h2 className="mt-1 font-display text-xl font-bold">Monthly collection</h2></div><span className="rounded-lg bg-secondary px-2 py-1 font-mono text-[10px]">KG / MONTH</span></div><div className="mt-7 flex h-44 items-end gap-3">{(data?.monthlyCollection ?? []).map((value, index) => <div key={index} className="flex flex-1 flex-col items-center gap-2"><div className="w-full rounded-t-lg bg-primary transition-all" style={{ height: `${Math.max(10, (value / Math.max(...(data?.monthlyCollection ?? [1]))) * 100)}%` }} /><span className="font-mono text-[10px] text-muted-foreground">{["Apr", "May", "Jun", "Jul", "Aug", "Sep"][index]}</span></div>)}</div></div><div className="rounded-2xl border border-card-border bg-card p-5 shadow-sm"><p className="font-mono text-[10px] uppercase tracking-[.16em] text-muted-foreground">Hotspot funnel</p><h2 className="mt-1 font-display text-xl font-bold">Report to resolution</h2><div className="mt-6 space-y-4">{Object.entries(data?.hotspotCounts ?? {}).map(([label, value]) => <div key={label}><div className="flex justify-between text-sm"><span>{label}</span><span className="font-mono text-xs text-muted-foreground">{value}</span></div><div className="mt-2 h-2 rounded-full bg-secondary"><div className="h-full rounded-full bg-primary" style={{ width: `${Math.min(100, Number(value) * 20 + 12)}%` }} /></div></div>)}</div></div></div>
    <div className="mt-5 grid gap-5 xl:grid-cols-[1.1fr_.9fr]"><div className="rounded-2xl border border-card-border bg-card shadow-sm"><div className="border-b border-border p-5"><p className="font-mono text-[10px] uppercase tracking-[.16em] text-muted-foreground">Needs a decision</p><h2 className="mt-1 font-display text-xl font-bold">Hotspot reports</h2></div><div className="divide-y divide-border">{(hotspots.data ?? []).map((item) => <div key={item.id} className="flex flex-col gap-3 p-5 sm:flex-row sm:items-center"><div className="min-w-0 flex-1"><div className="flex items-center gap-2"><span className="font-bold">{item.location}</span><span className="rounded-md bg-secondary px-2 py-1 font-mono text-[10px]">{item.severity}</span></div><p className="mt-1 text-xs text-muted-foreground">{item.description}</p><p className="mt-2 font-mono text-[10px] uppercase tracking-[.1em] text-primary">{item.status}</p></div>{item.status === "Reported" ? <div className="flex gap-2"><button type="button" onClick={() => action(() => verifyHotspot.mutateAsync({ hotspotId: item.id, data: { status: "Verified" } }), "Hotspot verified.")} className="rounded-lg bg-primary px-3 py-2 text-xs font-bold text-primary-foreground"><Check className="mr-1 inline h-3.5 w-3.5" /> Verify</button><button type="button" onClick={() => action(() => verifyHotspot.mutateAsync({ hotspotId: item.id, data: { status: "Rejected" } }), "Hotspot rejected.")} className="rounded-lg border border-border px-3 py-2 text-xs font-bold"><X className="mr-1 inline h-3.5 w-3.5" /> Reject</button></div> : item.status === "Verified" ? <button type="button" onClick={() => action(() => createCleanup.mutateAsync({ hotspotId: item.id, data: { assignedDriver: "Vikram Singh", estimatedQuantity: 30 } }), "Cleanup action assigned.")} className="rounded-lg bg-accent px-3 py-2 text-xs font-bold text-accent-foreground">Assign cleanup <ArrowUpRight className="ml-1 inline h-3.5 w-3.5" /></button> : null}</div>)}</div></div><div className="rounded-2xl border border-card-border bg-card shadow-sm"><div className="border-b border-border p-5"><p className="font-mono text-[10px] uppercase tracking-[.16em] text-muted-foreground">Field work</p><h2 className="mt-1 font-display text-xl font-bold">Cleanup actions</h2></div><div className="divide-y divide-border">{(cleanup.data ?? []).map((item) => <div key={item.id} className="flex items-center justify-between gap-3 p-5"><div><p className="text-sm font-bold">Report {item.hotspotReportId.toUpperCase()}</p><p className="mt-1 text-xs text-muted-foreground">{item.assignedDriver} · {item.estimatedQuantity} kg estimated</p></div><select value={item.status} onChange={(event) => action(() => updateCleanup.mutateAsync({ actionId: item.id, data: { status: event.target.value as "pending" | "in-progress" | "completed" } }), "Cleanup status updated.")} className="rounded-lg border border-input bg-background px-2 py-2 text-xs font-bold"><option value="pending">Pending</option><option value="in-progress">In progress</option><option value="completed">Completed</option></select></div>)}</div></div></div>
    <div className="mt-5 grid gap-5 xl:grid-cols-[1.1fr_.9fr]"><div className="rounded-2xl border border-card-border bg-card shadow-sm"><div className="flex items-center justify-between border-b border-border p-5"><div><p className="font-mono text-[10px] uppercase tracking-[.16em] text-muted-foreground">People and fleet</p><h2 className="mt-1 font-display text-xl font-bold">Platform users</h2></div><Users className="h-5 w-5 text-primary" /></div><div className="divide-y divide-border">{(users.data ?? []).map((item) => <div key={item.id} className="flex items-center justify-between p-4"><div><p className="text-sm font-bold">{item.name}</p><p className="text-xs text-muted-foreground">{item.email}</p></div><span className="rounded-md bg-secondary px-2 py-1 font-mono text-[10px] uppercase">{item.role}</span></div>)}</div></div><div className="rounded-2xl border border-card-border bg-card shadow-sm"><div className="flex items-center justify-between border-b border-border p-5"><div><p className="font-mono text-[10px] uppercase tracking-[.16em] text-muted-foreground">Fleet health</p><h2 className="mt-1 font-display text-xl font-bold">Vehicles</h2></div><Truck className="h-5 w-5 text-primary" /></div><div className="divide-y divide-border">{(vehicles.data ?? []).map((item) => <div key={item.id} className="flex items-center justify-between p-4"><div><p className="text-sm font-bold">{item.registrationNumber}</p><p className="text-xs text-muted-foreground">{item.capacity} kg · {item.driver}</p></div><span className="rounded-md bg-secondary px-2 py-1 font-mono text-[10px] uppercase">{item.status}</span></div>)}</div></div></div>
    <div className="mt-5 rounded-2xl border border-card-border bg-card shadow-sm"><div className="border-b border-border p-5"><p className="font-mono text-[10px] uppercase tracking-[.16em] text-muted-foreground">Citizen rewards</p><h2 className="mt-1 font-display text-xl font-bold">Configure a new reward</h2></div><form onSubmit={(event) => { event.preventDefault(); action(() => createReward.mutateAsync({ data: { name: rewardName, description: rewardDescription, creditCost: Number(rewardCost) } }), "Reward created."); setRewardName(""); setRewardDescription(""); }} className="grid gap-3 p-5 md:grid-cols-[1fr_1.4fr_140px_auto]"><input required value={rewardName} onChange={(event) => setRewardName(event.target.value)} placeholder="Reward name" className="rounded-xl border border-input bg-background px-3 py-2.5 text-sm outline-none focus:ring-2 focus:ring-ring" /><input required value={rewardDescription} onChange={(event) => setRewardDescription(event.target.value)} placeholder="Short description" className="rounded-xl border border-input bg-background px-3 py-2.5 text-sm outline-none focus:ring-2 focus:ring-ring" /><input required min="1" type="number" value={rewardCost} onChange={(event) => setRewardCost(event.target.value)} placeholder="Credits" className="rounded-xl border border-input bg-background px-3 py-2.5 text-sm outline-none focus:ring-2 focus:ring-ring" /><button className="rounded-xl bg-primary px-4 py-2.5 text-sm font-bold text-primary-foreground"><Plus className="mr-1 inline h-4 w-4" /> Add reward</button></form><div className="grid gap-3 border-t border-border p-5 md:grid-cols-3">{(rewards.data ?? []).map((item) => <div key={item.id} className="rounded-xl bg-secondary p-4"><div className="flex justify-between gap-2"><p className="text-sm font-bold">{item.name}</p><span className="font-mono text-xs text-primary">{item.creditCost} pts</span></div><p className="mt-2 text-xs text-muted-foreground">{item.description}</p></div>)}</div></div>
  </section>;
}