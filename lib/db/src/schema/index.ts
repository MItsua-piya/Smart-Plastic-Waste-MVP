import { pgTable, real, text, timestamp, uniqueIndex } from "drizzle-orm/pg-core";

export const users = pgTable("plastic_loop_users", {
  id: text("id").primaryKey(),
  name: text("name").notNull(),
  email: text("email").notNull(),
  role: text("role").notNull(),
  status: text("status").notNull().default("active"),
  passwordHash: text("password_hash").notNull(),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
}, (table) => ({
  emailIndex: uniqueIndex("plastic_loop_users_email_idx").on(table.email),
}));

export const centres = pgTable("plastic_loop_centres", {
  id: text("id").primaryKey(),
  name: text("name").notNull(),
  address: text("address").notNull(),
  currentQuantity: real("current_quantity").notNull().default(0),
  capacity: real("capacity").notNull(),
  thresholdPercent: real("threshold_percent").notNull().default(80),
  status: text("status").notNull().default("active"),
  lat: real("lat").notNull(),
  long: real("long").notNull(),
});

export const deposits = pgTable("plastic_loop_deposits", {
  id: text("id").primaryKey(),
  citizenId: text("citizen_id"),
  citizenName: text("citizen_name").notNull(),
  centreId: text("centre_id").notNull(),
  category: text("category").notNull(),
  weight: real("weight").notNull(),
  creditsEarned: real("credits_earned").notNull(),
  timestamp: timestamp("timestamp", { withTimezone: true }).notNull().defaultNow(),
});

export const pickups = pgTable("plastic_loop_pickups", {
  id: text("id").primaryKey(),
  centreId: text("centre_id").notNull(),
  quantity: real("quantity").notNull(),
  priority: text("priority").notNull(),
  status: text("status").notNull().default("pending"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export const vehicles = pgTable("plastic_loop_vehicles", {
  id: text("id").primaryKey(),
  registrationNumber: text("registration_number").notNull(),
  capacity: real("capacity").notNull(),
  status: text("status").notNull(),
  driver: text("driver").notNull(),
});

export const routes = pgTable("plastic_loop_routes", {
  id: text("id").primaryKey(),
  vehicleId: text("vehicle_id"),
  vehicle: text("vehicle").notNull(),
  driver: text("driver").notNull(),
  estimatedDistance: real("estimated_distance").notNull(),
  totalQuantity: real("total_quantity").notNull(),
  status: text("status").notNull(),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export const routeStops = pgTable("plastic_loop_route_stops", {
  id: text("id").primaryKey(),
  routeId: text("route_id").notNull(),
  centreId: text("centre_id").notNull(),
  address: text("address").notNull(),
  quantity: real("quantity").notNull(),
  status: text("status").notNull().default("Pending"),
  sequence: real("sequence").notNull(),
});

export const hotspots = pgTable("plastic_loop_hotspots", {
  id: text("id").primaryKey(),
  reporterId: text("reporter_id"),
  location: text("location").notNull(),
  description: text("description").notNull(),
  severity: text("severity").notNull(),
  status: text("status").notNull().default("Reported"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export const rewards = pgTable("plastic_loop_rewards", {
  id: text("id").primaryKey(),
  name: text("name").notNull(),
  description: text("description").notNull(),
  creditCost: real("credit_cost").notNull(),
  status: text("status").notNull().default("active"),
});

export const rewardTransactions = pgTable("plastic_loop_reward_transactions", {
  id: text("id").primaryKey(),
  userId: text("user_id").notNull(),
  rewardId: text("reward_id").notNull(),
  rewardName: text("reward_name").notNull(),
  creditsUsed: real("credits_used").notNull(),
  status: text("status").notNull(),
  timestamp: timestamp("timestamp", { withTimezone: true }).notNull().defaultNow(),
});

export const cleanupActions = pgTable("plastic_loop_cleanup_actions", {
  id: text("id").primaryKey(),
  hotspotReportId: text("hotspot_report_id").notNull(),
  assignedDriver: text("assigned_driver").notNull(),
  estimatedQuantity: real("estimated_quantity").notNull(),
  status: text("status").notNull().default("pending"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export type User = typeof users.$inferSelect;
export type Centre = typeof centres.$inferSelect;
export type Deposit = typeof deposits.$inferSelect;
export type Pickup = typeof pickups.$inferSelect;
export type Vehicle = typeof vehicles.$inferSelect;
export type Route = typeof routes.$inferSelect;
export type RouteStop = typeof routeStops.$inferSelect;
export type Hotspot = typeof hotspots.$inferSelect;
export type Reward = typeof rewards.$inferSelect;
export type RewardTransaction = typeof rewardTransactions.$inferSelect;
export type CleanupAction = typeof cleanupActions.$inferSelect;