import { createHash, randomBytes } from "node:crypto";
import { hash, verify } from "@node-rs/argon2";
import type { RequestHandler } from "express";
import { prisma } from "../lib/prisma.js";
import { HttpError } from "../lib/http-error.js";

const SESSION_DAYS = 7;
const sha256 = (v: string) => createHash("sha256").update(v).digest("hex");

export const hashPassword = (password: string) => hash(password);

// ─── Login throttling (in-memory, per email + IP) ────────────────────────────
const attempts = new Map<string, { count: number; resetAt: number }>();
const MAX_ATTEMPTS = 5;
const WINDOW_MS = 15 * 60 * 1000;

function checkThrottle(key: string) {
  const now = Date.now();
  const entry = attempts.get(key);
  if (entry && entry.resetAt > now && entry.count >= MAX_ATTEMPTS) {
    throw new HttpError(429, "Too many attempts. Please wait 15 minutes and try again.");
  }
}

function recordFailure(key: string) {
  const now = Date.now();
  const entry = attempts.get(key);
  if (!entry || entry.resetAt <= now) attempts.set(key, { count: 1, resetAt: now + WINDOW_MS });
  else entry.count++;
}

// ─── Sessions ────────────────────────────────────────────────────────────────

export async function login(email: string, password: string, ip: string) {
  const key = `${email.toLowerCase()}|${ip}`;
  checkThrottle(key);

  const admin = await prisma.adminUser.findUnique({ where: { email: email.toLowerCase() } });
  const ok = admin?.isActive ? await verify(admin.passwordHash, password) : false;
  if (!admin || !ok) {
    recordFailure(key);
    throw new HttpError(401, "Incorrect email or password.");
  }
  attempts.delete(key);

  const token = randomBytes(32).toString("base64url");
  const expiresAt = new Date(Date.now() + SESSION_DAYS * 24 * 60 * 60 * 1000);
  await prisma.$transaction([
    prisma.adminSession.create({ data: { id: sha256(token), adminId: admin.id, expiresAt } }),
    prisma.adminUser.update({ where: { id: admin.id }, data: { lastLoginAt: new Date() } }),
    prisma.adminSession.deleteMany({ where: { adminId: admin.id, expiresAt: { lt: new Date() } } }),
  ]);

  return { token, expiresAt, admin: { id: admin.id, name: admin.name, email: admin.email } };
}

export async function logout(token: string) {
  await prisma.adminSession.deleteMany({ where: { id: sha256(token) } });
}

declare global {
  // eslint-disable-next-line @typescript-eslint/no-namespace
  namespace Express {
    interface Locals {
      admin: { id: string; name: string; email: string };
      adminToken: string;
    }
  }
}

/** Requires `Authorization: Bearer <token>` from a valid, unexpired admin session. */
export const requireAdmin: RequestHandler = async (req, res, next) => {
  const token = req.get("authorization")?.replace(/^Bearer\s+/i, "");
  if (!token) throw new HttpError(401, "Please sign in.");

  const session = await prisma.adminSession.findUnique({
    where: { id: sha256(token) },
    include: { admin: { select: { id: true, name: true, email: true, isActive: true } } },
  });
  if (!session || session.expiresAt < new Date() || !session.admin.isActive) {
    throw new HttpError(401, "Your session has expired. Please sign in again.");
  }

  const { isActive: _, ...admin } = session.admin;
  res.locals.admin = admin;
  res.locals.adminToken = token;
  next();
};
