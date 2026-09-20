import assert from "node:assert/strict";
import { once } from "node:events";
import { after, before, test } from "node:test";
import type { Server } from "node:http";
import mongoose from "mongoose";
import app from "../src/app";
import { connectMongo, seedMongo } from "../src/lib/mongo";

type Role = "admin" | "citizen" | "centre" | "driver";
type JsonValue = Record<string, any> | any[];
type RequestOptions = {
  method?: string;
  token?: string;
  body?: Record<string, unknown>;
};

let server: Server;
let baseUrl: string;

async function request(path: string, options: RequestOptions = {}) {
  const response = await fetch(`${baseUrl}${path}`, {
    method: options.method ?? "GET",
    headers: {
      ...(options.body ? { "content-type": "application/json" } : {}),
      ...(options.token ? { authorization: `Bearer ${options.token}` } : {}),
    },
    body: options.body ? JSON.stringify(options.body) : undefined,
  });
  const text = await response.text();
  let data: JsonValue | { error: string } | null = null;
  if (text) {
    try {
      data = JSON.parse(text) as JsonValue;
    } catch {
      data = { error: text };
    }
  }
  return { status: response.status, data };
}

async function login(role: Role) {
  const response = await request("/auth/login", {
    method: "POST",
    body: {
      email: `${role}@plasticloop.local`,
      password: "plasticloop",
    },
  });
  assert.equal(response.status, 200, `expected ${role} login to succeed`);
  assert.equal((response.data as any).user.role, role);
  return (response.data as any).token as string;
}

before(async () => {
  await connectMongo();
  await mongoose.connection.dropDatabase();
  await seedMongo();

  server = app.listen(0, "127.0.0.1");
  await once(server, "listening");
  const address = server.address();
  assert.ok(address && typeof address === "object");
  baseUrl = `http://127.0.0.1:${address.port}/api`;
});

after(async () => {
  if (server?.listening) {
    await new Promise<void>((resolve, reject) => {
      server.close((error) => (error ? reject(error) : resolve()));
    });
  }
  if (mongoose.connection.readyState === 1) {
    await mongoose.connection.dropDatabase();
    await mongoose.disconnect();
  }
});

test("signs in every supported role and returns the signed role claim", async () => {
  for (const role of ["admin", "citizen", "centre", "driver"] as const) {
    const token = await login(role);
    const currentUser = await request("/auth/me", { token });
    assert.equal(currentUser.status, 200);
    assert.equal((currentUser.data as any).role, role);
  }

  const invalidPassword = await request("/auth/login", {
    method: "POST",
    body: { email: "admin@plasticloop.local", password: "not-the-password" },
  });
  assert.equal(invalidPassword.status, 401);
});

test("rejects unauthenticated and wrong-role protected requests", async () => {
  const unauthenticated = await request("/dashboard");
  assert.equal(unauthenticated.status, 401);

  const citizenToken = await login("citizen");
  const citizenPickups = await request("/pickups", { token: citizenToken });
  assert.equal(citizenPickups.status, 403);

  const driverToken = await login("driver");
  const driverAnalytics = await request("/admin/analytics", { token: driverToken });
  assert.equal(driverAnalytics.status, 403);

  const centreToken = await login("centre");
  const centreRoute = await request("/routes/active", { token: centreToken });
  assert.equal(centreRoute.status, 403);
});

test("covers deposit, pickup routing, hotspot cleanup, and reward writes", async () => {
  const citizenToken = await login("citizen");
  const centreToken = await login("centre");
  const driverToken = await login("driver");
  const adminToken = await login("admin");

  const deposit = await request("/deposits", {
    method: "POST",
    token: citizenToken,
    body: {
      citizenName: "Ananya Rao",
      centreId: "c4",
      category: "PET bottles",
      weight: 110,
    },
  });
  assert.equal(deposit.status, 201);
  assert.equal((deposit.data as any).creditsEarned, 550);

  const pickups = await request("/pickups", { token: centreToken });
  assert.equal(pickups.status, 200);
  assert.ok((pickups.data as any[]).some((pickup) => pickup.quantity === 202 && pickup.status === "pending"));

  const generatedRoute = await request("/routes/generate", {
    method: "POST",
    token: adminToken,
    body: { vehicleCapacity: 700 },
  });
  assert.equal(generatedRoute.status, 201);
  assert.ok((generatedRoute.data as any).stops.length > 0);

  const activeRoute = await request("/routes/active", { token: driverToken });
  assert.equal(activeRoute.status, 200);
  const firstStop = (activeRoute.data as any).stops[0];
  const updatedStop = await request(`/routes/${(activeRoute.data as any).id}/stops/${firstStop.id}`, {
    method: "PATCH",
    token: driverToken,
    body: { status: "Collected" },
  });
  assert.equal(updatedStop.status, 200);
  assert.equal((updatedStop.data as any).stops[0].status, "Collected");

  const hotspot = await request("/hotspots", {
    method: "POST",
    token: citizenToken,
    body: {
      location: "Test Loop Corner",
      description: "A test report for the hotspot workflow.",
      severity: "High",
    },
  });
  assert.equal(hotspot.status, 201);
  const hotspotId = (hotspot.data as any).id as string;

  const verifiedHotspot = await request(`/admin/hotspots/${hotspotId}/status`, {
    method: "PATCH",
    token: adminToken,
    body: { status: "Verified" },
  });
  assert.equal(verifiedHotspot.status, 200);
  assert.equal((verifiedHotspot.data as any).status, "Verified");

  const cleanupAction = await request(`/admin/hotspots/${hotspotId}/cleanup-action`, {
    method: "POST",
    token: adminToken,
    body: { assignedDriver: "Vikram Singh", estimatedQuantity: 12 },
  });
  assert.equal(cleanupAction.status, 201);
  const cleanupActionId = (cleanupAction.data as any).id as string;

  const completedCleanup = await request(`/admin/cleanup-actions/${cleanupActionId}/status`, {
    method: "PATCH",
    token: adminToken,
    body: { status: "completed" },
  });
  assert.equal(completedCleanup.status, 200);

  const rewards = await request("/rewards", { token: citizenToken });
  assert.equal(rewards.status, 200);
  assert.ok((rewards.data as any[]).some((reward) => reward.id === "rw1"));

  const redemption = await request("/rewards/redeem", {
    method: "POST",
    token: citizenToken,
    body: { rewardId: "rw1" },
  });
  assert.equal(redemption.status, 201);
  assert.equal((redemption.data as any).creditsUsed, 120);
  assert.equal((redemption.data as any).status, "completed");
});