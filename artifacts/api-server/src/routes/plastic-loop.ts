import { Router, type IRouter } from "express";
import {
  CreateDepositBody,
  CreateHotspotBody,
  GenerateRouteBody,
  UpdateRouteStopBody,
  UpdateRouteStopParams,
} from "@workspace/api-zod";

const router: IRouter = Router();

type Centre = {
  id: string; name: string; address: string; currentQuantity: number;
  capacity: number; thresholdPercent: number; status: string; lat: number; long: number;
};
type Deposit = {
  id: string; citizenName: string; centreName: string; category: string;
  weight: number; creditsEarned: number; timestamp: string;
};
type Pickup = {
  id: string; centreName: string; quantity: number; priority: string;
  status: string; createdAt: string;
};
type RouteStop = {
  id: string; centreName: string; address: string; quantity: number;
  status: string; sequence: number;
};
type Route = {
  id: string; vehicle: string; driver: string; estimatedDistance: number;
  totalQuantity: number; status: string; stops: RouteStop[];
};
type Hotspot = {
  id: string; location: string; description: string; severity: string;
  status: string; createdAt: string;
};

const centres: Centre[] = [
  { id: "c1", name: "Indiranagar Loop", address: "12th Main, Indiranagar", currentQuantity: 386, capacity: 500, thresholdPercent: 80, status: "active", lat: 12.9716, long: 77.6412 },
  { id: "c2", name: "Koramangala Green Hub", address: "80 Feet Road, Koramangala", currentQuantity: 248, capacity: 400, thresholdPercent: 80, status: "active", lat: 12.9352, long: 77.6245 },
  { id: "c3", name: "Jayanagar Refill Point", address: "4th Block, Jayanagar", currentQuantity: 174, capacity: 300, thresholdPercent: 80, status: "active", lat: 12.925, long: 77.5938 },
  { id: "c4", name: "Whitefield Circular", address: "ITPL Main Road, Whitefield", currentQuantity: 92, capacity: 250, thresholdPercent: 80, status: "active", lat: 12.9698, long: 77.75 },
];

const deposits: Deposit[] = [
  { id: "d1", citizenName: "Ananya Rao", centreName: "Indiranagar Loop", category: "PET bottles", weight: 8.4, creditsEarned: 42, timestamp: "2026-08-25T09:42:00+05:30" },
  { id: "d2", citizenName: "Rohan Mehta", centreName: "Koramangala Green Hub", category: "Mixed plastic", weight: 5.2, creditsEarned: 31, timestamp: "2026-08-25T08:18:00+05:30" },
  { id: "d3", citizenName: "Meera Shah", centreName: "Jayanagar Refill Point", category: "HDPE containers", weight: 3.8, creditsEarned: 27, timestamp: "2026-08-24T18:06:00+05:30" },
  { id: "d4", citizenName: "Kabir Nair", centreName: "Indiranagar Loop", category: "PET bottles", weight: 2.6, creditsEarned: 13, timestamp: "2026-08-24T16:31:00+05:30" },
];

const pickups: Pickup[] = [
  { id: "p1", centreName: "Indiranagar Loop", quantity: 386, priority: "High", status: "pending", createdAt: "2026-08-25T10:02:00+05:30" },
  { id: "p2", centreName: "Jayanagar Refill Point", quantity: 174, priority: "Medium", status: "pending", createdAt: "2026-08-24T17:45:00+05:30" },
  { id: "p3", centreName: "Koramangala Green Hub", quantity: 248, priority: "Medium", status: "assigned", createdAt: "2026-08-24T13:20:00+05:30" },
];

let activeRoute: Route = {
  id: "r1", vehicle: "KA 05 MJ 2048", driver: "Vikram Singh", estimatedDistance: 21.4,
  totalQuantity: 560, status: "active",
  stops: [
    { id: "s1", centreName: "Indiranagar Loop", address: "12th Main, Indiranagar", quantity: 386, status: "Completed", sequence: 1 },
    { id: "s2", centreName: "Koramangala Green Hub", address: "80 Feet Road, Koramangala", quantity: 174, status: "Arrived", sequence: 2 },
  ],
};
const hotspots: Hotspot[] = [
  { id: "h1", location: "Ulsoor Lake East Gate", description: "Plastic packaging collecting beside the pedestrian path.", severity: "High", status: "Verified", createdAt: "2026-08-25T07:15:00+05:30" },
  { id: "h2", location: "Ejipura Junction", description: "Overflowing bin and loose plastic near the bus stop.", severity: "Medium", status: "Reported", createdAt: "2026-08-24T19:40:00+05:30" },
];

const now = () => new Date().toISOString();
const creditsFor = (category: string, weight: number) =>
  Math.round(weight * (category.includes("PET") ? 5 : category.includes("HDPE") ? 7 : 6));

router.get("/dashboard", (_req, res) => {
  const totalCollected = 12480 + deposits.reduce((sum, item) => sum + item.weight, 0);
  res.json({
    totalCollected, activeCentres: centres.filter((c) => c.status === "active").length,
    pendingPickups: pickups.filter((p) => p.status !== "completed").length, co2Saved: 8.7,
    weeklyCollected: [840, 920, 760, 1110, 980, 1260, 1080],
    categoryBreakdown: [
      { category: "PET bottles", quantity: 5120, percentage: 41 },
      { category: "HDPE containers", quantity: 3640, percentage: 29 },
      { category: "Mixed plastic", quantity: 3720, percentage: 30 },
    ],
    recentActivity: deposits.slice(0, 4).map((item) => ({
      id: item.id, label: `${item.weight} kg deposited`, detail: `${item.centreName} · ${item.citizenName}`,
      timestamp: item.timestamp, kind: "deposit",
    })),
  });
});

router.get("/centres", (_req, res) => res.json(centres));
router.get("/deposits", (_req, res) => res.json(deposits));
router.post("/deposits", (req, res) => {
  const parsed = CreateDepositBody.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ error: "Enter a valid citizen, centre, category, and positive weight." });
  const centre = centres.find((item) => item.id === parsed.data.centreId);
  if (!centre) return res.status(404).json({ error: "Collection centre not found." });
  const creditsEarned = creditsFor(parsed.data.category, parsed.data.weight);
  const deposit: Deposit = {
    id: `d${deposits.length + 1}`, citizenName: parsed.data.citizenName, centreName: centre.name,
    category: parsed.data.category, weight: parsed.data.weight, creditsEarned, timestamp: now(),
  };
  deposits.unshift(deposit);
  centre.currentQuantity += parsed.data.weight;
  if (centre.currentQuantity / centre.capacity >= centre.thresholdPercent / 100 &&
      !pickups.some((item) => item.centreName === centre.name && item.status !== "completed")) {
    pickups.unshift({ id: `p${pickups.length + 1}`, centreName: centre.name, quantity: centre.currentQuantity, priority: "High", status: "pending", createdAt: now() });
  }
  return res.status(201).json(deposit);
});

router.get("/pickups", (_req, res) => res.json(pickups));
router.get("/routes/active", (_req, res) => res.json(activeRoute));
router.post("/routes/generate", (req, res) => {
  const parsed = GenerateRouteBody.safeParse(req.body ?? {});
  const capacity = parsed.success && parsed.data.vehicleCapacity ? parsed.data.vehicleCapacity : 700;
  const pending = pickups.filter((item) => item.status === "pending").sort((a, b) => b.quantity - a.quantity);
  const selected = pending.filter((_, index) => index === 0 || pending.slice(0, index + 1).reduce((sum, item) => sum + item.quantity, 0) <= capacity);
  activeRoute = {
    ...activeRoute, id: `r${Date.now()}`, totalQuantity: selected.reduce((sum, item) => sum + item.quantity, 0),
    status: "planned", estimatedDistance: 18.6 + selected.length * 2.4,
    stops: selected.map((item, index) => {
      const centre = centres.find((candidate) => candidate.name === item.centreName)!;
      return { id: `s${index + 1}`, centreName: centre.name, address: centre.address, quantity: item.quantity, status: "Pending", sequence: index + 1 };
    }),
  };
  selected.forEach((item) => { item.status = "assigned"; });
  return res.status(201).json(activeRoute);
});
router.patch("/routes/:routeId/stops/:stopId", (req, res) => {
  const params = UpdateRouteStopParams.safeParse(req.params);
  const body = UpdateRouteStopBody.safeParse(req.body);
  if (!params.success || !body.success) return res.status(400).json({ error: "Invalid route stop update." });
  const stop = activeRoute.stops.find((item) => item.id === params.data.stopId);
  if (!stop) return res.status(404).json({ error: "Route stop not found." });
  stop.status = body.data.status;
  return res.json(activeRoute);
});

router.get("/hotspots", (_req, res) => res.json(hotspots));
router.post("/hotspots", (req, res) => {
  const parsed = CreateHotspotBody.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ error: "Location and description are required." });
  const hotspot: Hotspot = { id: `h${hotspots.length + 1}`, location: parsed.data.location, description: parsed.data.description, severity: parsed.data.severity ?? "Medium", status: "Reported", createdAt: now() };
  hotspots.unshift(hotspot);
  return res.status(201).json(hotspot);
});

export default router;