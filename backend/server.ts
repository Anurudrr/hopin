import { createReadStream } from "node:fs";
import { stat } from "node:fs/promises";
import { createServer, type IncomingMessage, type ServerResponse } from "node:http";
import path from "node:path";
import { fileURLToPath } from "node:url";

import type { DriverApplicationInput, Profile, UserRole } from "../src/types";
import {
  buildAuthSession,
  cancelBooking,
  createAuthSession,
  createBooking,
  createContactMessage,
  createNewsletterSubscription,
  createOrUpdateDriverApplication,
  createUser,
  deleteSession,
  getCurrentSession,
  getDatabasePath,
  getDriverDashboard,
  getRiderBookings,
  getUserByEmail,
  isSupportedCity,
  setDriverAvailability,
  updateProfile,
} from "./db";
import { createPasswordRecord, verifyPassword } from "./security";

const rootDir = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const distDir = path.join(rootDir, "dist");
const port = Number(process.env.PORT || process.env.API_PORT || 4100);
const sessionDays = Math.max(1, Number(process.env.AUTH_SESSION_DAYS || 21));

class HttpError extends Error {
  status: number;

  constructor(status: number, message: string) {
    super(message);
    this.status = status;
  }
}

function sendJson(response: ServerResponse, statusCode: number, payload: unknown) {
  response.writeHead(statusCode, {
    "Content-Type": "application/json; charset=utf-8",
    "Cache-Control": "no-store",
  });
  response.end(JSON.stringify(payload));
}

function sendError(response: ServerResponse, error: unknown) {
  if (error instanceof HttpError) {
    sendJson(response, error.status, { error: error.message });
    return;
  }

  console.error(error);
  sendJson(response, 500, { error: "Something went wrong on the server." });
}

function assertCondition(condition: unknown, status: number, message: string): asserts condition {
  if (!condition) {
    throw new HttpError(status, message);
  }
}

async function parseJsonBody<T>(request: IncomingMessage) {
  const chunks: Buffer[] = [];

  for await (const chunk of request) {
    chunks.push(Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk));
  }

  if (!chunks.length) {
    return {} as T;
  }

  try {
    return JSON.parse(Buffer.concat(chunks).toString("utf8")) as T;
  } catch {
    throw new HttpError(400, "Request body must be valid JSON.");
  }
}

function getBearerToken(request: IncomingMessage) {
  const authorization = request.headers.authorization;

  if (!authorization?.startsWith("Bearer ")) {
    return null;
  }

  return authorization.slice("Bearer ".length).trim() || null;
}

function requireSession(request: IncomingMessage) {
  const token = getBearerToken(request);
  assertCondition(token, 401, "Sign in to continue.");

  const session = getCurrentSession(token);
  assertCondition(session, 401, "Your session has expired. Sign in again.");

  return { token, session };
}

function normalizeEmail(email: unknown) {
  const value = typeof email === "string" ? email.trim().toLowerCase() : "";
  assertCondition(/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value), 400, "Enter a valid email address.");
  return value;
}

function normalizePassword(password: unknown) {
  const value = typeof password === "string" ? password : "";
  assertCondition(value.length >= 8, 400, "Password must be at least 8 characters.");
  return value;
}

function normalizePhone(phone: unknown) {
  const value = typeof phone === "string" ? phone.trim() : "";
  assertCondition(/^[6-9]\d{9}$/.test(value), 400, "Enter a valid Indian mobile number.");
  return value;
}

function normalizeRole(role: unknown): UserRole {
  const value = role === "driver" ? "driver" : role === "admin" ? "admin" : "rider";
  assertCondition(value === "rider" || value === "driver", 400, "Choose a valid account role.");
  return value;
}

function normalizeName(name: unknown, label = "full name") {
  const value = typeof name === "string" ? name.trim() : "";
  assertCondition(value.length >= 2, 400, `Enter your ${label}.`);
  return value;
}

function normalizeTextField(value: unknown, label: string, minimumLength = 1) {
  const text = typeof value === "string" ? value.trim() : "";
  assertCondition(text.length >= minimumLength, 400, `Enter ${label}.`);
  return text;
}

function normalizeProfilePatch(body: Partial<Profile>) {
  const patch: Partial<Profile> = {};

  if (body.avatar_url !== undefined) {
    assertCondition(
      body.avatar_url === null ||
        body.avatar_url === "" ||
        (typeof body.avatar_url === "string" && /^https?:\/\//.test(body.avatar_url)),
      400,
      "Avatar URL must be empty or use http/https.",
    );
    patch.avatar_url = body.avatar_url;
  }

  if (body.city !== undefined) {
    assertCondition(typeof body.city === "string" && isSupportedCity(body.city), 400, "Choose a supported city.");
    patch.city = body.city;
  }

  if (body.gender !== undefined) {
    assertCondition(typeof body.gender === "string" && body.gender.trim().length > 0, 400, "Choose a gender value.");
    patch.gender = body.gender.trim();
  }

  if (body.home_address !== undefined) {
    assertCondition(typeof body.home_address === "string", 400, "Home address must be a string.");
    patch.home_address = body.home_address;
  }

  if (body.work_address !== undefined) {
    assertCondition(typeof body.work_address === "string", 400, "Work address must be a string.");
    patch.work_address = body.work_address;
  }

  if (body.onboarding_completed !== undefined) {
    assertCondition(typeof body.onboarding_completed === "boolean", 400, "Onboarding status must be a boolean.");
    patch.onboarding_completed = body.onboarding_completed;
  }

  if (body.full_name !== undefined) {
    patch.full_name = normalizeName(body.full_name);
  }

  if (body.phone !== undefined) {
    patch.phone = normalizePhone(body.phone);
  }

  return patch;
}

function normalizeDriverApplication(body: Record<string, unknown>): DriverApplicationInput {
  const documents = body.documents as Record<string, unknown> | undefined;
  const license = Boolean(documents?.license);
  const aadhaar = Boolean(documents?.aadhaar);
  const pan = Boolean(documents?.pan);

  assertCondition(license && aadhaar && pan, 400, "All driver documents must be confirmed before submission.");

  const yearValue =
    typeof body.year === "number"
      ? body.year
      : typeof body.year === "string"
        ? Number(body.year)
        : Number.NaN;

  assertCondition(Number.isInteger(yearValue) && yearValue >= 2000 && yearValue <= 2100, 400, "Enter a valid 4-digit model year.");

  return {
    experience: normalizeTextField(body.experience, "your driving experience"),
    history: normalizeTextField(body.history, "your fleet history"),
    documents: {
      license,
      aadhaar,
      pan,
    },
    make: normalizeTextField(body.make, "the vehicle make"),
    model: normalizeTextField(body.model, "the vehicle model"),
    year: yearValue,
    plate: normalizeTextField(body.plate, "the license plate"),
  };
}

function normalizeBookingInput(body: Record<string, unknown>) {
  const pickup = body.pickup as Record<string, unknown> | undefined;
  const destination = body.destination as Record<string, unknown> | undefined;
  const seatsValue =
    typeof body.seats === "number"
      ? body.seats
      : typeof body.seats === "string"
        ? Number(body.seats)
        : Number.NaN;
  const city = typeof body.city === "string" ? body.city.trim() : "";

  assertCondition(isSupportedCity(city), 400, "Choose a supported city.");
  assertCondition(
    pickup &&
      typeof pickup.address === "string" &&
      typeof pickup.lat === "number" &&
      typeof pickup.lng === "number",
    400,
    "Pickup details are incomplete.",
  );
  assertCondition(
    destination &&
      typeof destination.address === "string" &&
      typeof destination.lat === "number" &&
      typeof destination.lng === "number",
    400,
    "Destination details are incomplete.",
  );
  assertCondition(pickup.address !== destination.address, 400, "Pickup and destination must be different.");
  assertCondition(Number.isInteger(seatsValue) && seatsValue >= 1 && seatsValue <= 3, 400, "Seats must be between 1 and 3.");

  return {
    city,
    pickup: {
      address: pickup.address.trim(),
      lat: pickup.lat,
      lng: pickup.lng,
    },
    destination: {
      address: destination.address.trim(),
      lat: destination.lat,
      lng: destination.lng,
    },
    seats: seatsValue,
  };
}

function normalizeContactBody(body: Record<string, unknown>) {
  return {
    name: normalizeName(body.name, "name"),
    email: normalizeEmail(body.email),
    topic: normalizeTextField(body.topic, "a topic"),
    message: normalizeTextField(body.message, "a message", 8),
    requestedRole: typeof body.requestedRole === "string" ? body.requestedRole : null,
    requestedCity: typeof body.requestedCity === "string" ? body.requestedCity : null,
  };
}

async function serveStaticAsset(requestPath: string, response: ServerResponse) {
  const normalizedPath = requestPath === "/" ? "/index.html" : requestPath;
  const resolvedPath = path.resolve(distDir, `.${normalizedPath}`);

  if (!resolvedPath.startsWith(distDir)) {
    throw new HttpError(403, "Forbidden.");
  }

  try {
    const fileStats = await stat(resolvedPath);

    if (fileStats.isFile()) {
      response.writeHead(200, {
        "Content-Type": getContentType(resolvedPath),
      });
      createReadStream(resolvedPath).pipe(response);
      return;
    }
  } catch {
    // Fall through to SPA fallback.
  }

  const indexPath = path.join(distDir, "index.html");

  try {
    await stat(indexPath);
    response.writeHead(200, {
      "Content-Type": "text/html; charset=utf-8",
    });
    createReadStream(indexPath).pipe(response);
  } catch {
    throw new HttpError(503, "Frontend build not found. Run npm run build before starting the server.");
  }
}

function getContentType(filePath: string) {
  const extension = path.extname(filePath).toLowerCase();
  const contentTypes: Record<string, string> = {
    ".css": "text/css; charset=utf-8",
    ".html": "text/html; charset=utf-8",
    ".js": "application/javascript; charset=utf-8",
    ".json": "application/json; charset=utf-8",
    ".svg": "image/svg+xml",
    ".webmanifest": "application/manifest+json; charset=utf-8",
  };

  return contentTypes[extension] || "application/octet-stream";
}

const server = createServer(async (request, response) => {
  try {
    const method = request.method || "GET";
    const url = new URL(request.url || "/", "http://localhost");
    const pathname = url.pathname;

    if (method === "OPTIONS") {
      response.writeHead(204, {
        "Access-Control-Allow-Headers": "Content-Type, Authorization",
        "Access-Control-Allow-Methods": "GET,POST,PATCH,OPTIONS",
      });
      response.end();
      return;
    }

    if (pathname === "/api/health" && method === "GET") {
      sendJson(response, 200, {
        ok: true,
        databasePath: getDatabasePath(),
      });
      return;
    }

    if (pathname === "/api/auth/register" && method === "POST") {
      const body = await parseJsonBody<Record<string, unknown>>(request);
      const email = normalizeEmail(body.email);
      const password = normalizePassword(body.password);
      const fullName = normalizeName(body.fullName);
      const phone = normalizePhone(body.phone);
      const role = normalizeRole(body.role);

      assertCondition(!getUserByEmail(email), 409, "An account with this email already exists.");

      const passwordRecord = createPasswordRecord(password);
      const row = createUser({
        email,
        fullName,
        passwordHash: passwordRecord.hash,
        passwordSalt: passwordRecord.salt,
        phone,
        role,
      });
      const token = createAuthSession(row.id, sessionDays).token;

      sendJson(response, 201, buildAuthSession(row, token));
      return;
    }

    if (pathname === "/api/auth/login" && method === "POST") {
      const body = await parseJsonBody<Record<string, unknown>>(request);
      const email = normalizeEmail(body.email);
      const password = normalizePassword(body.password);
      const row = getUserByEmail(email);

      assertCondition(row, 401, "Incorrect email or password.");
      assertCondition(
        verifyPassword(password, row.password_salt, row.password_hash),
        401,
        "Incorrect email or password.",
      );

      const token = createAuthSession(row.id, sessionDays).token;

      sendJson(response, 200, buildAuthSession(row, token));
      return;
    }

    if (pathname === "/api/auth/logout" && method === "POST") {
      const token = getBearerToken(request);
      if (token) {
        deleteSession(token);
      }

      sendJson(response, 200, { ok: true });
      return;
    }

    if (pathname === "/api/auth/me" && method === "GET") {
      const { session } = requireSession(request);
      sendJson(response, 200, session);
      return;
    }

    if (pathname === "/api/profile" && method === "PATCH") {
      const { session } = requireSession(request);
      const body = await parseJsonBody<Partial<Profile>>(request);
      const patch = normalizeProfilePatch(body);
      const payload = updateProfile(session.user.id, patch);

      sendJson(response, 200, payload);
      return;
    }

    if (pathname === "/api/bookings" && method === "POST") {
      const { session } = requireSession(request);
      const body = await parseJsonBody<Record<string, unknown>>(request);
      const booking = createBooking(session.user.id, normalizeBookingInput(body));

      sendJson(response, 201, { booking });
      return;
    }

    if (pathname === "/api/bookings/me" && method === "GET") {
      const { session } = requireSession(request);
      sendJson(response, 200, { recentBookings: getRiderBookings(session.user.id) });
      return;
    }

    if (pathname.startsWith("/api/bookings/") && pathname.endsWith("/cancel") && method === "PATCH") {
      const { session } = requireSession(request);
      const bookingId = pathname.replace("/api/bookings/", "").replace("/cancel", "");
      const booking = cancelBooking(session.user.id, bookingId);

      assertCondition(booking, 404, "Booking not found.");
      sendJson(response, 200, { booking });
      return;
    }

    if (pathname === "/api/dashboard/driver" && method === "GET") {
      const { session } = requireSession(request);
      sendJson(response, 200, getDriverDashboard(session.user.id));
      return;
    }

    if (pathname === "/api/driver/application" && method === "POST") {
      const { session } = requireSession(request);
      assertCondition(session.user.role === "driver", 403, "Create or use a driver account to submit this application.");
      assertCondition(
        session.profile.onboarding_completed && session.profile.city,
        400,
        "Complete rider onboarding first so your city and profile details are available.",
      );

      const body = await parseJsonBody<Record<string, unknown>>(request);
      const result = createOrUpdateDriverApplication(session.user.id, normalizeDriverApplication(body));

      sendJson(response, 201, result);
      return;
    }

    if (pathname === "/api/driver/availability" && method === "PATCH") {
      const { session } = requireSession(request);
      assertCondition(session.user.role === "driver", 403, "Only driver accounts can update availability.");

      const body = await parseJsonBody<Record<string, unknown>>(request);
      assertCondition(typeof body.isOnline === "boolean", 400, "Availability must be a boolean.");
      const driverRecord = setDriverAvailability(session.user.id, body.isOnline);

      assertCondition(driverRecord, 404, "Complete the driver application before changing availability.");
      sendJson(response, 200, { driverRecord });
      return;
    }

    if (pathname === "/api/contact" && method === "POST") {
      const body = await parseJsonBody<Record<string, unknown>>(request);
      sendJson(response, 201, createContactMessage(normalizeContactBody(body)));
      return;
    }

    if (pathname === "/api/newsletter" && method === "POST") {
      const body = await parseJsonBody<Record<string, unknown>>(request);
      sendJson(response, 201, createNewsletterSubscription(normalizeEmail(body.email)));
      return;
    }

    if (pathname.startsWith("/api/")) {
      throw new HttpError(404, "API route not found.");
    }

    if (method !== "GET" && method !== "HEAD") {
      throw new HttpError(405, "Method not allowed.");
    }

    await serveStaticAsset(pathname, response);
  } catch (error) {
    sendError(response, error);
  }
});

server.listen(port, "0.0.0.0", () => {
  console.log(`HopIn server listening on http://localhost:${port}`);
  console.log(`SQLite data file: ${getDatabasePath()}`);
});
