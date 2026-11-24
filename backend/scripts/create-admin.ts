// Creates (or resets the password of) an admin user.
// Usage: npm run admin:create -- <email> "<Full Name>"
// The password is read from the ADMIN_PASSWORD env var or prompted for, never passed as an argument.
import "dotenv/config";
import { createInterface } from "node:readline/promises";
import { hashPassword } from "../src/services/admin-auth.js";
import { prisma } from "../src/lib/prisma.js";

const [email, ...nameParts] = process.argv.slice(2);
const name = nameParts.join(" ").trim();

if (!email || !name) {
  console.error('Usage: npm run admin:create -- <email> "<Full Name>"');
  process.exit(1);
}

let password = process.env.ADMIN_PASSWORD;
if (!password) {
  const rl = createInterface({ input: process.stdin, output: process.stdout });
  password = await rl.question("Password (min 10 characters): ");
  rl.close();
}
if (password.length < 10) {
  console.error("Password must be at least 10 characters.");
  process.exit(1);
}

const passwordHash = await hashPassword(password);
const admin = await prisma.adminUser.upsert({
  where: { email: email.toLowerCase() },
  create: { email: email.toLowerCase(), name, passwordHash },
  update: { name, passwordHash, isActive: true },
});
// Sign out existing sessions when a password is reset
await prisma.adminSession.deleteMany({ where: { adminId: admin.id } });

console.log(`Admin ready: ${admin.email} (${admin.name})`);
await prisma.$disconnect();
