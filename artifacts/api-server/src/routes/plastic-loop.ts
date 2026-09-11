import { Router, type IRouter } from "express";
import {
  CreateAdminRewardBody, CreateCleanupActionBody, CreateDepositBody, CreateHotspotBody,
  GenerateRouteBody, GetAdminAnalyticsResponse, RedeemRewardBody,
  UpdateCleanupActionStatusBody, UpdateCleanupActionStatusParams, UpdateHotspotStatusBody,
  UpdateHotspotStatusParams, UpdateRouteStopBody, UpdateRouteStopParams,
} from "@workspace/api-zod";
import { authenticate, requireRole } from "../middleware/auth";
import {
  CentreModel, CleanupActionModel, DepositModel, HotspotModel, PickupModel, RewardModel,
  RewardTransactionModel, RouteModel, RouteStopModel, UserModel, VehicleModel,
} from "../lib/mongo";

const router: IRouter = Router();
router.use(authenticate);
const iso = (value: Date | string) => new Date(value).toISOString();
const creditsFor = (category: string, weight: number) => Math.round(weight * (category.includes("PET") ? 5 : category.includes("HDPE") ? 7 : 6));

async function routeView(route: any) {
  if (!route) return null;
  const [stops, centres] = await Promise.all([
    RouteStopModel.find({ routeId: route.id }).sort({ sequence: 1 }).lean(),
    CentreModel.find({ id: { $in: await RouteStopModel.find({ routeId: route.id }).distinct("centreId") } }).lean(),
  ]);
  const centreById = new Map(centres.map((centre) => [centre.id, centre]));
  return {
    id: route.id, vehicle: route.vehicle, driver: route.driver, estimatedDistance: route.estimatedDistance,
    totalQuantity: route.totalQuantity, status: route.status,
    stops: stops.map((stop) => ({ id: stop.id, centreName: centreById.get(stop.centreId)?.name ?? stop.centreId, address: stop.address, quantity: stop.quantity, status: stop.status, sequence: stop.sequence })),
  };
}

router.get("/dashboard", requireRole("citizen", "centre", "driver", "admin"), async (_req, res) => {
  const [deposits, centres, pickups] = await Promise.all([DepositModel.find().sort({ timestamp: -1 }).lean(), CentreModel.find().lean(), PickupModel.find().lean()]);
  const totalCollected = deposits.reduce((sum, item) => sum + item.weight, 0);
  const categoryTotals = new Map<string, number>();
  deposits.forEach((item) => categoryTotals.set(item.category, (categoryTotals.get(item.category) ?? 0) + item.weight));
  const categoryBreakdown = [...categoryTotals.entries()].map(([category, quantity]) => ({ category, quantity, percentage: totalCollected ? Math.round(quantity / totalCollected * 100) : 0 }));
  return res.json({
    totalCollected, activeCentres: centres.filter((centre) => centre.status === "active").length,
    pendingPickups: pickups.filter((pickup) => pickup.status !== "completed").length, co2Saved: Number((totalCollected * 0.72).toFixed(1)),
    weeklyCollected: [840, 920, 760, 1110, 980, 1260, 1080],
    categoryBreakdown, recentActivity: deposits.slice(0, 4).map((item) => ({ id: item.id, label: `${item.weight} kg deposited`, detail: `${item.centreId} · ${item.citizenName}`, timestamp: iso(item.timestamp), kind: "deposit" })),
  });
});

router.get("/centres", requireRole("citizen", "centre", "driver", "admin"), async (_req, res) => res.json(await CentreModel.find().sort({ name: 1 }).lean()));
router.get("/deposits", requireRole("citizen", "centre", "admin"), async (_req, res) => {
  const [deposits, centres] = await Promise.all([DepositModel.find().sort({ timestamp: -1 }).lean(), CentreModel.find().lean()]);
  const names = new Map(centres.map((centre) => [centre.id, centre.name]));
  res.json(deposits.map((item) => ({ id: item.id, citizenName: item.citizenName, centreName: names.get(item.centreId) ?? item.centreId, category: item.category, weight: item.weight, creditsEarned: item.creditsEarned, timestamp: iso(item.timestamp) })));
});
router.post("/deposits", requireRole("citizen", "centre", "admin"), async (req, res) => {
  const parsed = CreateDepositBody.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ error: "Enter a valid citizen, centre, category, and positive weight." });
  const centre = await CentreModel.findOne({ id: parsed.data.centreId });
  if (!centre) return res.status(404).json({ error: "Collection centre not found." });
  const deposit = { id: `d-${crypto.randomUUID()}`, citizenId: req.user?.role === "citizen" ? req.user.id : undefined, citizenName: parsed.data.citizenName, centreId: centre.id, category: parsed.data.category, weight: parsed.data.weight, creditsEarned: creditsFor(parsed.data.category, parsed.data.weight), timestamp: new Date() };
  await DepositModel.create(deposit);
  centre.currentQuantity += parsed.data.weight;
  await centre.save();
  const openPickup = await PickupModel.exists({ centreId: centre.id, status: { $ne: "completed" } });
  if (centre.currentQuantity / centre.capacity >= centre.thresholdPercent / 100 && !openPickup) {
    await PickupModel.create({ id: `p-${crypto.randomUUID()}`, centreId: centre.id, quantity: centre.currentQuantity, priority: "High", status: "pending", createdAt: new Date() });
  }
  const output = { ...deposit, centreName: centre.name, timestamp: iso(deposit.timestamp) };
  return res.status(201).json(output);
});

router.get("/pickups", requireRole("centre", "driver", "admin"), async (_req, res) => {
  const [pickups, centres] = await Promise.all([PickupModel.find().sort({ createdAt: -1 }).lean(), CentreModel.find().lean()]);
  const names = new Map(centres.map((centre) => [centre.id, centre.name]));
  res.json(pickups.map((item) => ({ id: item.id, centreName: names.get(item.centreId) ?? item.centreId, quantity: item.quantity, priority: item.priority, status: item.status, createdAt: iso(item.createdAt) })));
});
router.get("/routes/active", requireRole("driver", "admin"), async (_req, res) => {
  const route = await RouteModel.findOne().sort({ createdAt: -1 }).lean();
  res.json(await routeView(route));
});
router.post("/routes/generate", requireRole("admin"), async (req, res) => {
  const parsed = GenerateRouteBody.safeParse(req.body ?? {});
  const capacity = parsed.success && parsed.data.vehicleCapacity ? parsed.data.vehicleCapacity : 700;
  const pending = await PickupModel.find({ status: "pending" }).sort({ quantity: -1 }).lean();
  const selected: typeof pending = [];
  let total = 0;
  for (const pickup of pending) {
    if (selected.length === 0 || total + pickup.quantity <= capacity) { selected.push(pickup); total += pickup.quantity; }
  }
  const vehicle = await VehicleModel.findOne({ capacity: { $gte: capacity }, status: { $ne: "maintenance" } }).sort({ capacity: 1 }).lean();
  const centres = await CentreModel.find({ id: { $in: selected.map((item) => item.centreId) } }).lean();
  const centreById = new Map(centres.map((centre) => [centre.id, centre]));
  const routeId = `r-${crypto.randomUUID()}`;
  await RouteModel.create({ id: routeId, vehicleId: vehicle?.id, vehicle: vehicle?.registrationNumber ?? "Unassigned vehicle", driver: vehicle?.driver ?? "Unassigned", estimatedDistance: 18.6 + selected.length * 2.4, totalQuantity: total, status: "planned", createdAt: new Date() });
  if (selected.length) await RouteStopModel.insertMany(selected.map((pickup, index) => ({ id: `s-${crypto.randomUUID()}`, routeId, centreId: pickup.centreId, address: centreById.get(pickup.centreId)?.address ?? "", quantity: pickup.quantity, status: "Pending", sequence: index + 1 })));
  await PickupModel.updateMany({ id: { $in: selected.map((item) => item.id) } }, { $set: { status: "assigned" } });
  return res.status(201).json(await routeView(await RouteModel.findOne({ id: routeId }).lean()));
});
router.patch("/routes/:routeId/stops/:stopId", requireRole("driver", "admin"), async (req, res) => {
  const params = UpdateRouteStopParams.safeParse(req.params);
  const body = UpdateRouteStopBody.safeParse(req.body);
  if (!params.success || !body.success) return res.status(400).json({ error: "Invalid route stop update." });
  const stop = await RouteStopModel.findOneAndUpdate({ id: params.data.stopId, routeId: params.data.routeId }, { $set: { status: body.data.status } }, { new: true });
  if (!stop) return res.status(404).json({ error: "Route stop not found." });
  return res.json(await routeView(await RouteModel.findOne({ id: params.data.routeId }).lean()));
});

router.get("/hotspots", requireRole("citizen", "admin"), async (_req, res) => {
  const hotspots = await HotspotModel.find().sort({ createdAt: -1 }).lean();
  res.json(hotspots.map((item) => ({ id: item.id, location: item.location, description: item.description, severity: item.severity, status: item.status, createdAt: iso(item.createdAt) })));
});
router.post("/hotspots", requireRole("citizen"), async (req, res) => {
  const parsed = CreateHotspotBody.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ error: "Location and description are required." });
  const hotspot = await HotspotModel.create({ id: `h-${crypto.randomUUID()}`, reporterId: req.user?.id, ...parsed.data, severity: parsed.data.severity ?? "Medium", status: "Reported", createdAt: new Date() });
  return res.status(201).json({ id: hotspot.id, location: hotspot.location, description: hotspot.description, severity: hotspot.severity, status: hotspot.status, createdAt: iso(hotspot.createdAt) });
});

router.get("/credits", requireRole("citizen"), async (req, res) => {
  const [earned, redeemed] = await Promise.all([
    DepositModel.aggregate([{ $match: { citizenId: req.user?.id } }, { $group: { _id: null, total: { $sum: "$creditsEarned" } } }]),
    RewardTransactionModel.aggregate([{ $match: { userId: req.user?.id, status: "completed" } }, { $group: { _id: null, total: { $sum: "$creditsUsed" } } }]),
  ]);
  const totalEarned = earned[0]?.total ?? 0; const totalRedeemed = redeemed[0]?.total ?? 0;
  res.json({ availableCredits: totalEarned - totalRedeemed, totalEarned, totalRedeemed });
});
router.get("/rewards", requireRole("citizen"), async (_req, res) => res.json(await RewardModel.find({ status: "active" }).sort({ creditCost: 1 }).lean()));
router.post("/rewards/redeem", requireRole("citizen"), async (req, res) => {
  const parsed = RedeemRewardBody.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ error: "Choose a reward to redeem." });
  const reward = await RewardModel.findOne({ id: parsed.data.rewardId, status: "active" }).lean();
  if (!reward) return res.status(404).json({ error: "Reward not found." });
  const [earned, redeemed] = await Promise.all([
    DepositModel.aggregate([{ $match: { citizenId: req.user?.id } }, { $group: { _id: null, total: { $sum: "$creditsEarned" } } }]),
    RewardTransactionModel.aggregate([{ $match: { userId: req.user?.id, status: "completed" } }, { $group: { _id: null, total: { $sum: "$creditsUsed" } } }]),
  ]);
  if ((earned[0]?.total ?? 0) - (redeemed[0]?.total ?? 0) < reward.creditCost) return res.status(400).json({ error: "You do not have enough credits for this reward." });
  const transaction = await RewardTransactionModel.create({ id: `rt-${crypto.randomUUID()}`, userId: req.user?.id, rewardId: reward.id, rewardName: reward.name, creditsUsed: reward.creditCost, status: "completed", timestamp: new Date() });
  return res.status(201).json({ id: transaction.id, rewardName: transaction.rewardName, creditsUsed: transaction.creditsUsed, status: transaction.status, timestamp: iso(transaction.timestamp) });
});

router.get("/admin/analytics", requireRole("admin"), async (_req, res) => {
  const [deposits, centres, hotspots, routes, routeStops, users] = await Promise.all([DepositModel.find().lean(), CentreModel.find().lean(), HotspotModel.find().lean(), RouteModel.find().lean(), RouteStopModel.find().lean(), UserModel.find().lean()]);
  const totalCollected = deposits.reduce((sum, item) => sum + item.weight, 0);
  const categoryTotals = new Map<string, number>(); deposits.forEach((item) => categoryTotals.set(item.category, (categoryTotals.get(item.category) ?? 0) + item.weight));
  const months = Array.from({ length: 6 }, () => 0); deposits.forEach((item) => { const month = new Date(item.timestamp).getMonth(); months[month % 6] += item.weight; });
  const completedStops = routeStops.filter((stop) => stop.status === "Completed").length;
  const data = {
    totalCollected, activeCitizens: new Set(deposits.map((item) => item.citizenId).filter(Boolean)).size,
    routeCompletionRate: routeStops.length ? Math.round(completedStops / routeStops.length * 100) : 0,
    averageResolutionHours: hotspots.length ? 24 : 0,
    monthlyCollection: months,
    centrePerformance: centres.map((centre) => ({ centreName: centre.name, quantity: centre.currentQuantity, utilization: Math.round(centre.currentQuantity / centre.capacity * 100) })),
    hotspotCounts: { Reported: hotspots.filter((item) => item.status === "Reported").length, Verified: hotspots.filter((item) => item.status === "Verified").length, Resolved: hotspots.filter((item) => item.status === "Resolved").length, Rejected: hotspots.filter((item) => item.status === "Rejected").length },
  };
  void routes; void users; void categoryTotals;
  res.json(GetAdminAnalyticsResponse.parse(data));
});
router.get("/admin/users", requireRole("admin"), async (_req, res) => {
  const users = await UserModel.find().sort({ name: 1 }).lean();
  res.json(users.map(({ id, name, email, role, status }) => ({ id, name, email, role, status })));
});
router.get("/admin/vehicles", requireRole("admin"), async (_req, res) => res.json(await VehicleModel.find().sort({ registrationNumber: 1 }).lean()));
router.get("/admin/rewards", requireRole("admin"), async (_req, res) => res.json(await RewardModel.find().sort({ creditCost: 1 }).lean()));
router.post("/admin/rewards", requireRole("admin"), async (req, res) => {
  const parsed = CreateAdminRewardBody.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ error: "Reward name, description, and a positive cost are required." });
  return res.status(201).json(await RewardModel.create({ id: `rw-${crypto.randomUUID()}`, ...parsed.data, status: "active" }));
});
router.patch("/admin/hotspots/:hotspotId/status", requireRole("admin"), async (req, res) => {
  const params = UpdateHotspotStatusParams.safeParse(req.params); const body = UpdateHotspotStatusBody.safeParse(req.body);
  if (!params.success || !body.success) return res.status(400).json({ error: "Invalid hotspot status." });
  const hotspot = await HotspotModel.findOneAndUpdate({ id: params.data.hotspotId }, { $set: { status: body.data.status } }, { new: true }).lean();
  if (!hotspot) return res.status(404).json({ error: "Hotspot report not found." });
  return res.json({ ...hotspot, createdAt: iso(hotspot.createdAt) });
});
router.post("/admin/hotspots/:hotspotId/cleanup-action", requireRole("admin"), async (req, res) => {
  const parsed = CreateCleanupActionBody.safeParse(req.body);
  const hotspot = await HotspotModel.findOne({ id: req.params.hotspotId });
  if (!hotspot || !parsed.success) return res.status(400).json({ error: "Choose a report, driver, and estimated quantity." });
  hotspot.status = "Assigned"; await hotspot.save();
  return res.status(201).json(await CleanupActionModel.create({ id: `ca-${crypto.randomUUID()}`, hotspotReportId: hotspot.id, ...parsed.data, status: "pending", createdAt: new Date() }));
});
router.get("/admin/cleanup-actions", requireRole("admin"), async (_req, res) => res.json(await CleanupActionModel.find().sort({ createdAt: -1 }).lean()));
router.patch("/admin/cleanup-actions/:actionId/status", requireRole("admin"), async (req, res) => {
  const params = UpdateCleanupActionStatusParams.safeParse(req.params); const body = UpdateCleanupActionStatusBody.safeParse(req.body);
  if (!params.success || !body.success) return res.status(400).json({ error: "Invalid cleanup status." });
  const action = await CleanupActionModel.findOneAndUpdate({ id: params.data.actionId }, { $set: { status: body.data.status } }, { new: true }).lean();
  if (!action) return res.status(404).json({ error: "Cleanup action not found." });
  if (body.data.status === "completed") await HotspotModel.updateOne({ id: action.hotspotReportId }, { $set: { status: "Resolved" } });
  return res.json(action);
});

export default router;