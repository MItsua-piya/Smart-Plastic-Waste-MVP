import { Router, type IRouter } from "express";
import bcrypt from "bcryptjs";
import { LoginBody, RegisterBody } from "@workspace/api-zod";
import { authenticate, issueToken, type AppRole, type AuthUser } from "../middleware/auth";
import { UserModel } from "../lib/mongo";

const router: IRouter = Router();
const publicUser = (user: { id: string; name: string; email: string; role: string }): AuthUser => ({
  id: user.id, name: user.name, email: user.email, role: user.role as AppRole,
});

router.post("/auth/register", async (req, res) => {
  try {
    const parsed = RegisterBody.safeParse(req.body);
    if (!parsed.success) return res.status(400).json({ error: "Enter a name, valid email, password, and supported role." });
    const email = parsed.data.email.toLowerCase();
    if (await UserModel.exists({ email })) return res.status(409).json({ error: "That email is already registered." });
    const user = await UserModel.create({
      id: `u-${crypto.randomUUID()}`, name: parsed.data.name, email, role: parsed.data.role,
      status: "active", passwordHash: await bcrypt.hash(parsed.data.password, 10),
    });
    const sessionUser = publicUser(user);
    return res.status(201).json({ token: issueToken(sessionUser), user: sessionUser });
  } catch (error) {
    req.log.error({ error }, "registration failed");
    return res.status(500).json({ error: "Unable to create the account." });
  }
});

router.post("/auth/login", async (req, res) => {
  try {
    const parsed = LoginBody.safeParse(req.body);
    if (!parsed.success) return res.status(400).json({ error: "Enter your email and password." });
    const user = await UserModel.findOne({ email: parsed.data.email.toLowerCase(), status: "active" }).lean();
    if (!user || !(await bcrypt.compare(parsed.data.password, user.passwordHash))) {
      return res.status(401).json({ error: "Email or password is incorrect." });
    }
    const sessionUser = publicUser(user);
    return res.json({ token: issueToken(sessionUser), user: sessionUser });
  } catch (error) {
    req.log.error({ error }, "login failed");
    return res.status(500).json({ error: "Unable to sign in right now." });
  }
});

router.get("/auth/me", authenticate, (req, res) => res.json(req.user));

export default router;