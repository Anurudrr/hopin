import { createHash, randomBytes, randomUUID, scryptSync, timingSafeEqual } from "node:crypto";

export function createId() {
  return randomUUID();
}

export function nowIso() {
  return new Date().toISOString();
}

export function createPasswordRecord(password: string) {
  const salt = randomBytes(16).toString("hex");
  const hash = hashPassword(password, salt);

  return { hash, salt };
}

export function hashPassword(password: string, salt: string) {
  return scryptSync(password, salt, 64).toString("hex");
}

export function verifyPassword(password: string, salt: string, expectedHash: string) {
  const hashed = Buffer.from(hashPassword(password, salt), "hex");
  const expected = Buffer.from(expectedHash, "hex");

  if (hashed.length !== expected.length) {
    return false;
  }

  return timingSafeEqual(hashed, expected);
}

export function createSessionToken() {
  return randomBytes(32).toString("hex");
}

export function hashSessionToken(token: string) {
  return createHash("sha256").update(token).digest("hex");
}
