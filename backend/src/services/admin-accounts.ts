// Admin → Admin Accounts and Profile: who can sign in to the admin panel.
// Every admin has the same "Admin" role. Safety rules: you can't disable or delete yourself,
// and there is always at least one active admin.
import { createHash } from "node:crypto";
import { verify } from "@node-rs/argon2";
import { z } from "zod";
import { prisma } from "../lib/prisma.js";
import { HttpError, notFound } from "../lib/http-error.js";
import { hashPassword } from "./admin-auth.js";

const sha256 = (v: string) => createHash("sha256").update(v).digest("hex");

const name = z.string().trim().min(2, "Enter a name").max(80);
const email = z.email("Enter a valid email address").trim().toLowerCase().max(120);
const password = z.string().min(10, "Use at least 10 characters").max(200);

export const NewAdminInput = z.object({ name, email, password });
export const ProfileInput = z.object({ name, email });
export const PasswordReset = z.object({ password });
export const PasswordChange = z.object({ currentPassword: z.string().min(1, "Enter your current password").max(200), newPassword: password });

const publicFields = { id: true, name: true, email: true, isActive: true, lastLoginAt: true, createdAt: true } as const;

export async function listAdmins(meId: string) {
  const admins = await prisma.adminUser.findMany({ orderBy: { createdAt: "asc" }, select: publicFields });
  return admins.map((a) => ({ ...a, isYou: a.id === meId }));
}

async function emailFree(address: string, exceptId?: string) {
  const taken = await prisma.adminUser.findFirst({ where: { email: address, id: { not: exceptId } }, select: { id: true } });
  if (taken) throw new HttpError(409, "An admin with that email already exists.");
}

export async function createAdmin(input: z.infer<typeof NewAdminInput>) {
  await emailFree(input.email);
  const admin = await prisma.adminUser.create({
    data: { name: input.name, email: input.email, passwordHash: await hashPassword(input.password) },
    select: publicFields,
  });
  return { ...admin, isYou: false };
}

/** At least one other active admin must remain before someone loses access */
async function assertNotLastActive(id: string) {
  const others = await prisma.adminUser.count({ where: { isActive: true, id: { not: id } } });
  if (others === 0) throw new HttpError(409, "There must always be at least one active admin.");
}

export async function setAdminActive(id: string, isActive: boolean, meId: string) {
  if (id === meId) throw new HttpError(409, "You can't turn off your own access.");
  const admin = await prisma.adminUser.findUnique({ where: { id }, select: { id: true } });
  if (!admin) throw notFound("Admin");
  if (!isActive) await assertNotLastActive(id);
  await prisma.$transaction([
    prisma.adminUser.update({ where: { id }, data: { isActive } }),
    // Turning access off signs them out everywhere
    ...(isActive ? [] : [prisma.adminSession.deleteMany({ where: { adminId: id } })]),
  ]);
  return { id, isActive };
}

export async function resetAdminPassword(id: string, newPassword: string, meId: string, myToken: string) {
  const admin = await prisma.adminUser.findUnique({ where: { id }, select: { id: true } });
  if (!admin) throw notFound("Admin");
  await prisma.$transaction([
    prisma.adminUser.update({ where: { id }, data: { passwordHash: await hashPassword(newPassword) } }),
    // Sign them out everywhere (but keep this browser signed in if it's your own account)
    prisma.adminSession.deleteMany({ where: { adminId: id, ...(id === meId && { id: { not: sha256(myToken) } }) } }),
  ]);
}

export async function deleteAdmin(id: string, meId: string) {
  if (id === meId) throw new HttpError(409, "You can't delete your own account.");
  const admin = await prisma.adminUser.findUnique({ where: { id }, select: { isActive: true } });
  if (!admin) throw notFound("Admin");
  if (admin.isActive) await assertNotLastActive(id);
  // Sessions go with the account; their order history notes stay, without a name
  await prisma.adminUser.delete({ where: { id } });
}

export async function updateProfile(meId: string, input: z.infer<typeof ProfileInput>) {
  await emailFree(input.email, meId);
  return prisma.adminUser.update({ where: { id: meId }, data: input, select: publicFields });
}

export async function changeOwnPassword(meId: string, myToken: string, input: z.infer<typeof PasswordChange>) {
  const me = await prisma.adminUser.findUniqueOrThrow({ where: { id: meId }, select: { passwordHash: true } });
  if (!(await verify(me.passwordHash, input.currentPassword))) {
    throw new HttpError(400, "Your current password isn't right.");
  }
  await resetAdminPassword(meId, input.newPassword, meId, myToken);
}
