import type { NextFunction, Request, Response } from "express";
import jwt, { type SignOptions } from "jsonwebtoken";

export type AppRole = "citizen" | "centre" | "driver" | "admin";
export type AuthUser = { id: string; name: string; email: string; role: AppRole };

declare global {
  namespace Express {
    interface Request {
      user?: AuthUser;
    }
  }
}

const secret = () => process.env.JWT_SECRET ?? process.env.SESSION_SECRET ?? "plastic-loop-development-secret";

export function issueToken(user: AuthUser): string {
  const options: SignOptions = { expiresIn: (process.env.JWT_EXPIRY ?? "1d") as SignOptions["expiresIn"] };
  return jwt.sign(user, secret(), options);
}

export function authenticate(req: Request, res: Response, next: NextFunction) {
  const header = req.header("authorization");
  const token = header?.startsWith("Bearer ") ? header.slice(7) : null;
  if (!token) return res.status(401).json({ error: "Sign in is required." });
  try {
    req.user = jwt.verify(token, secret()) as AuthUser;
    return next();
  } catch {
    return res.status(401).json({ error: "Your session has expired. Sign in again." });
  }
}

export function requireRole(...roles: AppRole[]) {
  return (req: Request, res: Response, next: NextFunction) => {
    if (!req.user || !roles.includes(req.user.role)) {
      return res.status(403).json({ error: "You do not have permission for this action." });
    }
    return next();
  };
}