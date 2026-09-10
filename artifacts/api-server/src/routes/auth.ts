import { Router, type IRouter } from "express";
import bcrypt from "bcryptjs";
import { LoginBody, RegisterBody } from "@workspace/api-zod";
import { authenticate, issueToken, type AppRole, type AuthUser } from "../middleware/auth";

const router: IRouter = Router();
type StoredUser = AuthUser & { passwordHash: string };

const users: StoredUser[] = [
  { id: "u-admin", name: "Amina Mensah", email: "admin@plasticloop.local", role: "admin", passwordHash: bcrypt.hashSync("plasticloop", 10) },
  { id: "u-citizen", name: "Ananya Rao", email: "citizen@plasticloop.local", role: "citizen", passwordHash: bcrypt.hashSync("plasticloop", 10) },
  { id: "u-centre", name: "Maya Shah", email: "centre@plasticloop.local", role: "centre", passwordHash: bcrypt.hashSync("plasticloop", 10) },
  { id: "u-driver", name: "Vikram Singh", email: "driver@plasticloop.local", role: "driver", passwordHash: bcrypt.hashSync("plasticloop", 10) },
];

const publicUser = ({ passwordHash: _passwordHash, ...user }: StoredUser): AuthUser => user;

router.post("/auth/register", async (req, res) => {
  const parsed = RegisterBody.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ error: "Enter a name, valid email, password, and supported role." });
  if (users.some((user) => user.email === parsed.data.email.toLowerCase())) {
    return res.status(409).json({ error: "That email is already registered." });
  }
  const user: StoredUser = {
    id: `u-${users.length + 1}`,
    name: parsed.data.name,
    email: parsed.data.email.toLowerCase(),
    role: parsed.data.role as AppRole,
    passwordHash: await bcrypt.hash(parsed.data.password, 10),
  };
  users.push(user);
  const sessionUser = publicUser(user);
  return res.status(201).json({ token: issueToken(sessionUser), user: sessionUser });
});

router.post("/auth/login", async (req, res) => {
  const parsed = LoginBody.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ error: "Enter your email and password." });
  const user = users.find((candidate) => candidate.email === parsed.data.email.toLowerCase());
  if (!user || !(await bcrypt.compare(parsed.data.password, user.passwordHash))) {
    return res.status(401).json({ error: "Email or password is incorrect." });
  }
  const sessionUser = publicUser(user);
  return res.json({ token: issueToken(sessionUser), user: sessionUser });
});

router.get("/auth/me", authenticate, (req, res) => res.json(req.user));

export default router;