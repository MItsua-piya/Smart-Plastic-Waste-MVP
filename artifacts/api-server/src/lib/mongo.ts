import bcrypt from "bcryptjs";
import mongoose, { Schema, type InferSchemaType, type Model } from "mongoose";

const mongoUri = process.env.MONGODB_TEST_URI ?? process.env.MONGODB_URI ?? "";
if (!mongoUri) throw new Error("MONGODB_URI must be configured for the MERN API.");

export async function connectMongo() {
  if (mongoose.connection.readyState === 1) return;
  await mongoose.connect(mongoUri, {
    ...(process.env.MONGODB_DB_NAME ? { dbName: process.env.MONGODB_DB_NAME } : {}),
    serverSelectionTimeoutMS: 15000,
    family: 4,
    tls: true,
  });
}

const userSchema = new Schema({
  id: { type: String, required: true, unique: true },
  name: { type: String, required: true },
  email: { type: String, required: true, unique: true, lowercase: true, index: true },
  role: { type: String, required: true, enum: ["citizen", "centre", "driver", "admin"] },
  status: { type: String, required: true, default: "active" },
  passwordHash: { type: String, required: true },
}, { timestamps: true, collection: "users" });

const centreSchema = new Schema({
  id: { type: String, required: true, unique: true },
  name: { type: String, required: true },
  address: { type: String, required: true },
  currentQuantity: { type: Number, required: true, default: 0 },
  capacity: { type: Number, required: true },
  thresholdPercent: { type: Number, required: true, default: 80 },
  status: { type: String, required: true, default: "active" },
  lat: { type: Number, required: true },
  long: { type: Number, required: true },
}, { timestamps: true, collection: "centres" });

const depositSchema = new Schema({
  id: { type: String, required: true, unique: true },
  citizenId: { type: String },
  citizenName: { type: String, required: true },
  centreId: { type: String, required: true },
  category: { type: String, required: true },
  weight: { type: Number, required: true },
  creditsEarned: { type: Number, required: true },
  timestamp: { type: Date, required: true, default: Date.now },
}, { timestamps: true, collection: "deposits" });

const pickupSchema = new Schema({
  id: { type: String, required: true, unique: true },
  centreId: { type: String, required: true },
  quantity: { type: Number, required: true },
  priority: { type: String, required: true },
  status: { type: String, required: true, default: "pending" },
  createdAt: { type: Date, required: true, default: Date.now },
}, { timestamps: true, collection: "pickups" });

const vehicleSchema = new Schema({
  id: { type: String, required: true, unique: true },
  registrationNumber: { type: String, required: true },
  capacity: { type: Number, required: true },
  status: { type: String, required: true },
  driver: { type: String, required: true },
}, { timestamps: true, collection: "vehicles" });

const routeSchema = new Schema({
  id: { type: String, required: true, unique: true },
  vehicleId: { type: String },
  vehicle: { type: String, required: true },
  driver: { type: String, required: true },
  estimatedDistance: { type: Number, required: true },
  totalQuantity: { type: Number, required: true },
  status: { type: String, required: true },
  createdAt: { type: Date, required: true, default: Date.now },
}, { timestamps: true, collection: "routes" });

const routeStopSchema = new Schema({
  id: { type: String, required: true, unique: true },
  routeId: { type: String, required: true, index: true },
  centreId: { type: String, required: true },
  address: { type: String, required: true },
  quantity: { type: Number, required: true },
  status: { type: String, required: true, default: "Pending" },
  sequence: { type: Number, required: true },
}, { timestamps: true, collection: "route_stops" });

const hotspotSchema = new Schema({
  id: { type: String, required: true, unique: true },
  reporterId: { type: String },
  location: { type: String, required: true },
  description: { type: String, required: true },
  severity: { type: String, required: true },
  status: { type: String, required: true, default: "Reported" },
  createdAt: { type: Date, required: true, default: Date.now },
}, { timestamps: true, collection: "hotspots" });

const rewardSchema = new Schema({
  id: { type: String, required: true, unique: true },
  name: { type: String, required: true },
  description: { type: String, required: true },
  creditCost: { type: Number, required: true },
  status: { type: String, required: true, default: "active" },
}, { timestamps: true, collection: "rewards" });

const rewardTransactionSchema = new Schema({
  id: { type: String, required: true, unique: true },
  userId: { type: String, required: true, index: true },
  rewardId: { type: String, required: true },
  rewardName: { type: String, required: true },
  creditsUsed: { type: Number, required: true },
  status: { type: String, required: true },
  timestamp: { type: Date, required: true, default: Date.now },
}, { timestamps: true, collection: "reward_transactions" });

const cleanupActionSchema = new Schema({
  id: { type: String, required: true, unique: true },
  hotspotReportId: { type: String, required: true, index: true },
  assignedDriver: { type: String, required: true },
  estimatedQuantity: { type: Number, required: true },
  status: { type: String, required: true, default: "pending" },
  createdAt: { type: Date, required: true, default: Date.now },
}, { timestamps: true, collection: "cleanup_actions" });

type User = InferSchemaType<typeof userSchema>;
type Centre = InferSchemaType<typeof centreSchema>;
type Deposit = InferSchemaType<typeof depositSchema>;
type Pickup = InferSchemaType<typeof pickupSchema>;
type Vehicle = InferSchemaType<typeof vehicleSchema>;
type Route = InferSchemaType<typeof routeSchema>;
type RouteStop = InferSchemaType<typeof routeStopSchema>;
type Hotspot = InferSchemaType<typeof hotspotSchema>;
type Reward = InferSchemaType<typeof rewardSchema>;
type RewardTransaction = InferSchemaType<typeof rewardTransactionSchema>;
type CleanupAction = InferSchemaType<typeof cleanupActionSchema>;

export const UserModel: Model<User> = mongoose.models.PlasticLoopUser ?? mongoose.model<User>("PlasticLoopUser", userSchema);
export const CentreModel: Model<Centre> = mongoose.models.PlasticLoopCentre ?? mongoose.model<Centre>("PlasticLoopCentre", centreSchema);
export const DepositModel: Model<Deposit> = mongoose.models.PlasticLoopDeposit ?? mongoose.model<Deposit>("PlasticLoopDeposit", depositSchema);
export const PickupModel: Model<Pickup> = mongoose.models.PlasticLoopPickup ?? mongoose.model<Pickup>("PlasticLoopPickup", pickupSchema);
export const VehicleModel: Model<Vehicle> = mongoose.models.PlasticLoopVehicle ?? mongoose.model<Vehicle>("PlasticLoopVehicle", vehicleSchema);
export const RouteModel: Model<Route> = mongoose.models.PlasticLoopRoute ?? mongoose.model<Route>("PlasticLoopRoute", routeSchema);
export const RouteStopModel: Model<RouteStop> = mongoose.models.PlasticLoopRouteStop ?? mongoose.model<RouteStop>("PlasticLoopRouteStop", routeStopSchema);
export const HotspotModel: Model<Hotspot> = mongoose.models.PlasticLoopHotspot ?? mongoose.model<Hotspot>("PlasticLoopHotspot", hotspotSchema);
export const RewardModel: Model<Reward> = mongoose.models.PlasticLoopReward ?? mongoose.model<Reward>("PlasticLoopReward", rewardSchema);
export const RewardTransactionModel: Model<RewardTransaction> = mongoose.models.PlasticLoopRewardTransaction ?? mongoose.model<RewardTransaction>("PlasticLoopRewardTransaction", rewardTransactionSchema);
export const CleanupActionModel: Model<CleanupAction> = mongoose.models.PlasticLoopCleanupAction ?? mongoose.model<CleanupAction>("PlasticLoopCleanupAction", cleanupActionSchema);

const seedIfEmpty = async (model: Model<any>, rows: any[]) => {
  if (await model.exists({})) return;
  await model.insertMany(rows, { ordered: false });
};

export async function seedMongo() {
  const passwordHash = await bcrypt.hash("plasticloop", 10);
  await seedIfEmpty(UserModel, [
    { id: "u-admin", name: "Amina Mensah", email: "admin@plasticloop.local", role: "admin", status: "active", passwordHash },
    { id: "u-citizen", name: "Ananya Rao", email: "citizen@plasticloop.local", role: "citizen", status: "active", passwordHash },
    { id: "u-centre", name: "Maya Shah", email: "centre@plasticloop.local", role: "centre", status: "active", passwordHash },
    { id: "u-driver", name: "Vikram Singh", email: "driver@plasticloop.local", role: "driver", status: "active", passwordHash },
  ]);
  await seedIfEmpty(CentreModel, [
    { id: "c1", name: "Indiranagar Loop", address: "12th Main, Indiranagar", currentQuantity: 386, capacity: 500, thresholdPercent: 80, status: "active", lat: 12.9716, long: 77.6412 },
    { id: "c2", name: "Koramangala Green Hub", address: "80 Feet Road, Koramangala", currentQuantity: 248, capacity: 400, thresholdPercent: 80, status: "active", lat: 12.9352, long: 77.6245 },
    { id: "c3", name: "Jayanagar Refill Point", address: "4th Block, Jayanagar", currentQuantity: 174, capacity: 300, thresholdPercent: 80, status: "active", lat: 12.925, long: 77.5938 },
    { id: "c4", name: "Whitefield Circular", address: "ITPL Main Road, Whitefield", currentQuantity: 92, capacity: 250, thresholdPercent: 80, status: "active", lat: 12.9698, long: 77.75 },
  ]);
  await seedIfEmpty(DepositModel, [
    { id: "d1", citizenId: "u-citizen", citizenName: "Ananya Rao", centreId: "c1", category: "PET bottles", weight: 8.4, creditsEarned: 42, timestamp: new Date("2026-08-25T09:42:00+05:30") },
    { id: "d2", citizenId: "u-citizen", citizenName: "Ananya Rao", centreId: "c2", category: "Mixed plastic", weight: 5.2, creditsEarned: 31, timestamp: new Date("2026-08-25T08:18:00+05:30") },
    { id: "d3", citizenId: "u-citizen", citizenName: "Ananya Rao", centreId: "c3", category: "HDPE containers", weight: 3.8, creditsEarned: 27, timestamp: new Date("2026-08-24T18:06:00+05:30") },
    { id: "d4", citizenId: "u-citizen", citizenName: "Ananya Rao", centreId: "c1", category: "PET bottles", weight: 2.6, creditsEarned: 13, timestamp: new Date("2026-08-24T16:31:00+05:30") },
    { id: "d5", citizenId: "u-citizen", citizenName: "Ananya Rao", centreId: "c4", category: "Mixed plastic", weight: 100, creditsEarned: 600, timestamp: new Date("2026-08-20T11:15:00+05:30") },
  ]);
  await seedIfEmpty(PickupModel, [
    { id: "p1", centreId: "c1", quantity: 386, priority: "High", status: "pending", createdAt: new Date("2026-08-25T10:02:00+05:30") },
    { id: "p2", centreId: "c3", quantity: 174, priority: "Medium", status: "pending", createdAt: new Date("2026-08-24T17:45:00+05:30") },
    { id: "p3", centreId: "c2", quantity: 248, priority: "Medium", status: "assigned", createdAt: new Date("2026-08-24T13:20:00+05:30") },
  ]);
  await seedIfEmpty(VehicleModel, [
    { id: "v1", registrationNumber: "KA 05 MJ 2048", capacity: 700, status: "on-route", driver: "Vikram Singh" },
    { id: "v2", registrationNumber: "KA 03 HN 7712", capacity: 500, status: "available", driver: "Riya Kapoor" },
    { id: "v3", registrationNumber: "KA 01 AB 4420", capacity: 900, status: "maintenance", driver: "Unassigned" },
  ]);
  await seedIfEmpty(RouteModel, [{ id: "r1", vehicleId: "v1", vehicle: "KA 05 MJ 2048", driver: "Vikram Singh", estimatedDistance: 21.4, totalQuantity: 560, status: "active", createdAt: new Date("2026-08-25T06:40:00+05:30") }]);
  await seedIfEmpty(RouteStopModel, [
    { id: "s1", routeId: "r1", centreId: "c1", address: "12th Main, Indiranagar", quantity: 386, status: "Completed", sequence: 1 },
    { id: "s2", routeId: "r1", centreId: "c2", address: "80 Feet Road, Koramangala", quantity: 174, status: "Arrived", sequence: 2 },
  ]);
  await seedIfEmpty(HotspotModel, [
    { id: "h1", reporterId: "u-citizen", location: "Ulsoor Lake East Gate", description: "Plastic packaging collecting beside the pedestrian path.", severity: "High", status: "Verified", createdAt: new Date("2026-08-25T07:15:00+05:30") },
    { id: "h2", reporterId: "u-citizen", location: "Ejipura Junction", description: "Overflowing bin and loose plastic near the bus stop.", severity: "Medium", status: "Reported", createdAt: new Date("2026-08-24T19:40:00+05:30") },
  ]);
  await seedIfEmpty(RewardModel, [
    { id: "rw1", name: "Community tree planting", description: "Fund one native tree in a neighbourhood green space.", creditCost: 120, status: "active" },
    { id: "rw2", name: "Refill station voucher", description: "A voucher for a partner refill station.", creditCost: 240, status: "active" },
    { id: "rw3", name: "Loop champion kit", description: "Reusable essentials for your next collection run.", creditCost: 400, status: "active" },
  ]);
  await seedIfEmpty(CleanupActionModel, [{ id: "ca1", hotspotReportId: "h1", assignedDriver: "Vikram Singh", estimatedQuantity: 42, status: "in-progress", createdAt: new Date("2026-08-25T08:00:00+05:30") }]);
}