import bcrypt from "bcryptjs";
import { count } from "drizzle-orm";
import { db, centres, cleanupActions, deposits, hotspots, pickups, rewards, routeStops, routes, users, vehicles } from "@workspace/db";

export const makeId = (prefix: string) => `${prefix}-${crypto.randomUUID()}`;

export async function seedDatabase() {
  const existingUsers = await db.select({ count: count() }).from(users);
  if (Number(existingUsers[0]?.count ?? 0) === 0) {
    const passwordHash = await bcrypt.hash("plasticloop", 10);
    await db.insert(users).values([
      { id: "u-admin", name: "Amina Mensah", email: "admin@plasticloop.local", role: "admin", status: "active", passwordHash },
      { id: "u-citizen", name: "Ananya Rao", email: "citizen@plasticloop.local", role: "citizen", status: "active", passwordHash },
      { id: "u-centre", name: "Maya Shah", email: "centre@plasticloop.local", role: "centre", status: "active", passwordHash },
      { id: "u-driver", name: "Vikram Singh", email: "driver@plasticloop.local", role: "driver", status: "active", passwordHash },
    ]).onConflictDoNothing();
  }

  const centreRows = await db.select({ count: count() }).from(centres);
  if (Number(centreRows[0]?.count ?? 0) === 0) {
    await db.insert(centres).values([
      { id: "c1", name: "Indiranagar Loop", address: "12th Main, Indiranagar", currentQuantity: 386, capacity: 500, thresholdPercent: 80, status: "active", lat: 12.9716, long: 77.6412 },
      { id: "c2", name: "Koramangala Green Hub", address: "80 Feet Road, Koramangala", currentQuantity: 248, capacity: 400, thresholdPercent: 80, status: "active", lat: 12.9352, long: 77.6245 },
      { id: "c3", name: "Jayanagar Refill Point", address: "4th Block, Jayanagar", currentQuantity: 174, capacity: 300, thresholdPercent: 80, status: "active", lat: 12.925, long: 77.5938 },
      { id: "c4", name: "Whitefield Circular", address: "ITPL Main Road, Whitefield", currentQuantity: 92, capacity: 250, thresholdPercent: 80, status: "active", lat: 12.9698, long: 77.75 },
    ]).onConflictDoNothing();
  }

  const depositRows = await db.select({ count: count() }).from(deposits);
  if (Number(depositRows[0]?.count ?? 0) === 0) {
    await db.insert(deposits).values([
      { id: "d1", citizenId: "u-citizen", citizenName: "Ananya Rao", centreId: "c1", category: "PET bottles", weight: 8.4, creditsEarned: 42, timestamp: new Date("2026-08-25T09:42:00+05:30") },
      { id: "d2", citizenId: "u-citizen", citizenName: "Ananya Rao", centreId: "c2", category: "Mixed plastic", weight: 5.2, creditsEarned: 31, timestamp: new Date("2026-08-25T08:18:00+05:30") },
      { id: "d3", citizenId: "u-citizen", citizenName: "Ananya Rao", centreId: "c3", category: "HDPE containers", weight: 3.8, creditsEarned: 27, timestamp: new Date("2026-08-24T18:06:00+05:30") },
      { id: "d4", citizenId: "u-citizen", citizenName: "Ananya Rao", centreId: "c1", category: "PET bottles", weight: 2.6, creditsEarned: 13, timestamp: new Date("2026-08-24T16:31:00+05:30") },
      { id: "d5", citizenId: "u-citizen", citizenName: "Ananya Rao", centreId: "c4", category: "Mixed plastic", weight: 100, creditsEarned: 600, timestamp: new Date("2026-08-20T11:15:00+05:30") },
    ]).onConflictDoNothing();
  }

  const pickupRows = await db.select({ count: count() }).from(pickups);
  if (Number(pickupRows[0]?.count ?? 0) === 0) {
    await db.insert(pickups).values([
      { id: "p1", centreId: "c1", quantity: 386, priority: "High", status: "pending", createdAt: new Date("2026-08-25T10:02:00+05:30") },
      { id: "p2", centreId: "c3", quantity: 174, priority: "Medium", status: "pending", createdAt: new Date("2026-08-24T17:45:00+05:30") },
      { id: "p3", centreId: "c2", quantity: 248, priority: "Medium", status: "assigned", createdAt: new Date("2026-08-24T13:20:00+05:30") },
    ]).onConflictDoNothing();
  }

  const vehicleRows = await db.select({ count: count() }).from(vehicles);
  if (Number(vehicleRows[0]?.count ?? 0) === 0) {
    await db.insert(vehicles).values([
      { id: "v1", registrationNumber: "KA 05 MJ 2048", capacity: 700, status: "on-route", driver: "Vikram Singh" },
      { id: "v2", registrationNumber: "KA 03 HN 7712", capacity: 500, status: "available", driver: "Riya Kapoor" },
      { id: "v3", registrationNumber: "KA 01 AB 4420", capacity: 900, status: "maintenance", driver: "Unassigned" },
    ]).onConflictDoNothing();
  }

  const routeRows = await db.select({ count: count() }).from(routes);
  if (Number(routeRows[0]?.count ?? 0) === 0) {
    await db.insert(routes).values({ id: "r1", vehicleId: "v1", vehicle: "KA 05 MJ 2048", driver: "Vikram Singh", estimatedDistance: 21.4, totalQuantity: 560, status: "active", createdAt: new Date("2026-08-25T06:40:00+05:30") }).onConflictDoNothing();
    await db.insert(routeStops).values([
      { id: "s1", routeId: "r1", centreId: "c1", address: "12th Main, Indiranagar", quantity: 386, status: "Completed", sequence: 1 },
      { id: "s2", routeId: "r1", centreId: "c2", address: "80 Feet Road, Koramangala", quantity: 174, status: "Arrived", sequence: 2 },
    ]).onConflictDoNothing();
  }

  const hotspotRows = await db.select({ count: count() }).from(hotspots);
  if (Number(hotspotRows[0]?.count ?? 0) === 0) {
    await db.insert(hotspots).values([
      { id: "h1", reporterId: "u-citizen", location: "Ulsoor Lake East Gate", description: "Plastic packaging collecting beside the pedestrian path.", severity: "High", status: "Verified", createdAt: new Date("2026-08-25T07:15:00+05:30") },
      { id: "h2", reporterId: "u-citizen", location: "Ejipura Junction", description: "Overflowing bin and loose plastic near the bus stop.", severity: "Medium", status: "Reported", createdAt: new Date("2026-08-24T19:40:00+05:30") },
    ]).onConflictDoNothing();
  }

  const rewardRows = await db.select({ count: count() }).from(rewards);
  if (Number(rewardRows[0]?.count ?? 0) === 0) {
    await db.insert(rewards).values([
      { id: "rw1", name: "Community tree planting", description: "Fund one native tree in a neighbourhood green space.", creditCost: 120, status: "active" },
      { id: "rw2", name: "Refill station voucher", description: "A voucher for a partner refill station.", creditCost: 240, status: "active" },
      { id: "rw3", name: "Loop champion kit", description: "Reusable essentials for your next collection run.", creditCost: 400, status: "active" },
    ]).onConflictDoNothing();
  }

  const cleanupRows = await db.select({ count: count() }).from(cleanupActions);
  if (Number(cleanupRows[0]?.count ?? 0) === 0) {
    await db.insert(cleanupActions).values({ id: "ca1", hotspotReportId: "h1", assignedDriver: "Vikram Singh", estimatedQuantity: 42, status: "in-progress", createdAt: new Date("2026-08-25T08:00:00+05:30") }).onConflictDoNothing();
  }
}