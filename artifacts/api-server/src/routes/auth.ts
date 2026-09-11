import { Router, type IRouter } from "express";
import bcrypt from "bcryptjs";
import { eq } from "drizzle-orm";
import { LoginBody, RegisterBody } from "@workspace/api-zod";
import { db, users } from "@workspace/db";
import { authenticate, issueToken, type AppRole, type AuthUser } from "../middleware/auth";
import { makeId } from "../lib/database";

const router: IRouter = Router();
const publicUser = (user: typeof users.$inferSelect): AuthUser => ({
  id: user.id,
  name: user.name,
  email: user.email,
  role: user.role as AppRole,
});

router.post("/auth/register", async (req, res) => {
  const parsed = RegisterBody.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ error: "Enter a name, valid email, password, and supported role." });
  const email = parsed.data.email.toLowerCase();
  const existing = await db.select({ id: users.id }).from(users).where(eq(users.email, email)).limit(1);
  if (existing.length > 0) {
    return res.status(409).json({ error: "That email is already registered." });
  }
  const user = {
    id: makeId("u"),
    name: parsed.data.name,
    email,
    role: parsed.data.role as AppRole,
    passwordHash: await bcrypt.hash(parsed.data.password, 10),
  };
  const [created] = await db.insert(users).values(user).returning();
  if (!created) return res.status(500).json({ error: "Unable to create the account." });
  const sessionUser = publicUser(created);
  return res.status(201).json({ token: issueToken(sessionUser), user: sessionUser });
});

router.post("/auth/login", async (req, res) => {
  const parsed = LoginBody.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ error: "Enter your email and password." });
  const [user] = await db.select().from(users).where(eq(users.email, parsed.data.email.toLowerCase())).limit(1);
  if (!user || !(await bcrypt.compare(parsed.data.password, user.passwordHash))) {
    return res.status(401).json({ error: "Email or password is incorrect." });
  }
  const sessionUser = publicUser(user);
  return res.json({ token: issueToken(sessionUser), user: sessionUser });
});

router.get("/auth/me", authenticate, (req, res) => res.json(req.user));

export default router;