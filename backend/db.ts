import { mkdirSync } from "node:fs";
import path from "node:path";
import { DatabaseSync } from "node:sqlite";
import { fileURLToPath } from "node:url";

import { supportedCities } from "../src/content/siteContent";
import type {
  AuthSession,
  Booking,
  BookingStatus,
  DriverApplicationInput,
  DriverDashboardData,
  DriverRecord,
  Profile,
  SessionUser,
  UserRole,
  Vehicle,
} from "../src/types";
import {
  createId,
  createPasswordRecord,
  createSessionToken,
  hashSessionToken,
  nowIso,
} from "./security";

type SqlValue = string | number | null;

interface UserRow {
  avatar_url: string | null;
  city: string | null;
  created_at: string;
  email: string;
  full_name: string | null;
  gender: string | null;
  home_address: string | null;
  id: string;
  is_email_verified: number;
  is_phone_verified: number;
  onboarding_completed: number;
  password_hash: string;
  password_salt: string;
  phone: string | null;
  role: UserRole;
  updated_at: string;
  work_address: string | null;
}

interface SessionLookupRow extends UserRow {
  expires_at: string;
  session_id: string;
}

interface DriverRow {
  aadhaar_ready: number;
  created_at: string;
  experience: string | null;
  history: string | null;
  id: string;
  is_demo: number;
  is_online: number;
  license_ready: number;
  pan_ready: number;
  status: "approved" | "pending" | "rejected";
  updated_at: string;
  user_id: string;
}

interface VehicleRow {
  color: string | null;
  created_at: string;
  driver_profile_id: string;
  id: string;
  license_plate: string;
  make: string;
  model: string;
  rc_ready: number;
  status: "approved" | "pending" | "rejected";
  type: "sedan" | "suv" | "hatchback" | "luxury";
  updated_at: string;
  year: number;
}

interface BookingRow {
  city: string;
  created_at: string;
  dest_address: string;
  dest_lat: number;
  dest_lng: number;
  driver_profile_id: string | null;
  fare_shared: number;
  fare_total: number;
  id: string;
  pickup_address: string;
  pickup_lat: number;
  pickup_lng: number;
  rider_id: string;
  seats: number;
  status: BookingStatus;
  updated_at: string;
}

const rootDir = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const dataFile = path.resolve(rootDir, process.env.HOPIN_DB_PATH || "./data/hopin.sqlite");

mkdirSync(path.dirname(dataFile), { recursive: true });

const database = new DatabaseSync(dataFile);

database.exec(`
  PRAGMA foreign_keys = ON;
  PRAGMA journal_mode = WAL;

  CREATE TABLE IF NOT EXISTS users (
    id TEXT PRIMARY KEY,
    email TEXT NOT NULL UNIQUE,
    password_hash TEXT NOT NULL,
    password_salt TEXT NOT NULL,
    full_name TEXT,
    phone TEXT,
    role TEXT NOT NULL,
    avatar_url TEXT,
    city TEXT,
    gender TEXT,
    home_address TEXT,
    work_address TEXT,
    is_phone_verified INTEGER NOT NULL DEFAULT 0,
    is_email_verified INTEGER NOT NULL DEFAULT 1,
    onboarding_completed INTEGER NOT NULL DEFAULT 0,
    created_at TEXT NOT NULL,
    updated_at TEXT NOT NULL
  );

  CREATE TABLE IF NOT EXISTS sessions (
    id TEXT PRIMARY KEY,
    user_id TEXT NOT NULL,
    token_hash TEXT NOT NULL UNIQUE,
    expires_at TEXT NOT NULL,
    created_at TEXT NOT NULL,
    FOREIGN KEY(user_id) REFERENCES users(id) ON DELETE CASCADE
  );

  CREATE TABLE IF NOT EXISTS driver_profiles (
    id TEXT PRIMARY KEY,
    user_id TEXT NOT NULL UNIQUE,
    experience TEXT,
    history TEXT,
    license_ready INTEGER NOT NULL DEFAULT 0,
    aadhaar_ready INTEGER NOT NULL DEFAULT 0,
    pan_ready INTEGER NOT NULL DEFAULT 0,
    is_online INTEGER NOT NULL DEFAULT 0,
    is_demo INTEGER NOT NULL DEFAULT 0,
    status TEXT NOT NULL DEFAULT 'pending',
    created_at TEXT NOT NULL,
    updated_at TEXT NOT NULL,
    FOREIGN KEY(user_id) REFERENCES users(id) ON DELETE CASCADE
  );

  CREATE TABLE IF NOT EXISTS vehicles (
    id TEXT PRIMARY KEY,
    driver_profile_id TEXT NOT NULL UNIQUE,
    make TEXT NOT NULL,
    model TEXT NOT NULL,
    year INTEGER NOT NULL,
    license_plate TEXT NOT NULL UNIQUE,
    color TEXT,
    type TEXT NOT NULL DEFAULT 'sedan',
    rc_ready INTEGER NOT NULL DEFAULT 1,
    status TEXT NOT NULL DEFAULT 'approved',
    created_at TEXT NOT NULL,
    updated_at TEXT NOT NULL,
    FOREIGN KEY(driver_profile_id) REFERENCES driver_profiles(id) ON DELETE CASCADE
  );

  CREATE TABLE IF NOT EXISTS bookings (
    id TEXT PRIMARY KEY,
    rider_id TEXT NOT NULL,
    driver_profile_id TEXT,
    city TEXT NOT NULL,
    pickup_address TEXT NOT NULL,
    pickup_lat REAL NOT NULL,
    pickup_lng REAL NOT NULL,
    dest_address TEXT NOT NULL,
    dest_lat REAL NOT NULL,
    dest_lng REAL NOT NULL,
    fare_total INTEGER NOT NULL,
    fare_shared INTEGER NOT NULL,
    seats INTEGER NOT NULL,
    status TEXT NOT NULL,
    created_at TEXT NOT NULL,
    updated_at TEXT NOT NULL,
    FOREIGN KEY(rider_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY(driver_profile_id) REFERENCES driver_profiles(id) ON DELETE SET NULL
  );

  CREATE TABLE IF NOT EXISTS contact_messages (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    email TEXT NOT NULL,
    topic TEXT NOT NULL,
    message TEXT NOT NULL,
    requested_role TEXT,
    requested_city TEXT,
    created_at TEXT NOT NULL
  );

  CREATE TABLE IF NOT EXISTS newsletter_subscriptions (
    id TEXT PRIMARY KEY,
    email TEXT NOT NULL UNIQUE,
    created_at TEXT NOT NULL
  );
`);

seedDemoDrivers();

function normalizeNullableString(value: string | null | undefined) {
  const trimmed = value?.trim();
  return trimmed ? trimmed : null;
}

function castSqlResult<T>(value: unknown) {
  return value as T;
}

function mapUserToSessionUser(row: UserRow): SessionUser {
  return {
    id: row.id,
    email: row.email,
    role: row.role,
  };
}

function mapUserToProfile(row: UserRow): Profile {
  return {
    id: row.id,
    full_name: row.full_name,
    avatar_url: row.avatar_url,
    phone: row.phone,
    email: row.email,
    role: row.role,
    city: row.city,
    gender: row.gender,
    home_address: row.home_address,
    work_address: row.work_address,
    is_phone_verified: Boolean(row.is_phone_verified),
    is_email_verified: Boolean(row.is_email_verified),
    onboarding_completed: Boolean(row.onboarding_completed),
    created_at: row.created_at,
  };
}

function mapDriverRow(row: DriverRow): DriverRecord {
  return {
    id: row.id,
    user_id: row.user_id,
    experience: row.experience,
    history: row.history,
    license_ready: Boolean(row.license_ready),
    aadhaar_ready: Boolean(row.aadhaar_ready),
    pan_ready: Boolean(row.pan_ready),
    is_online: Boolean(row.is_online),
    is_demo: Boolean(row.is_demo),
    status: row.status,
    created_at: row.created_at,
    updated_at: row.updated_at,
  };
}

function mapVehicleRow(row: VehicleRow): Vehicle {
  return {
    id: row.id,
    driver_id: row.driver_profile_id,
    make: row.make,
    model: row.model,
    year: row.year,
    license_plate: row.license_plate,
    color: row.color,
    type: row.type,
    rc_ready: Boolean(row.rc_ready),
    status: row.status,
    created_at: row.created_at,
    updated_at: row.updated_at,
  };
}

function mapBookingRow(row: BookingRow): Booking {
  return {
    id: row.id,
    rider_id: row.rider_id,
    driver_id: row.driver_profile_id,
    city: row.city,
    pickup_address: row.pickup_address,
    pickup_lat: row.pickup_lat,
    pickup_lng: row.pickup_lng,
    dest_address: row.dest_address,
    dest_lat: row.dest_lat,
    dest_lng: row.dest_lng,
    fare_total: row.fare_total,
    fare_shared: row.fare_shared,
    seats: row.seats,
    status: row.status,
    created_at: row.created_at,
    updated_at: row.updated_at,
  };
}

function getUserRowById(id: string) {
  return castSqlResult<UserRow | undefined>(
    database.prepare("SELECT * FROM users WHERE id = ?").get(id),
  );
}

function getDriverRowByUserId(userId: string) {
  return castSqlResult<DriverRow | undefined>(
    database.prepare("SELECT * FROM driver_profiles WHERE user_id = ?").get(userId),
  );
}

function getVehicleRowByDriverProfileId(driverProfileId: string) {
  return castSqlResult<VehicleRow | undefined>(
    database.prepare("SELECT * FROM vehicles WHERE driver_profile_id = ?").get(driverProfileId),
  );
}

function runInTransaction<T>(callback: () => T) {
  database.exec("BEGIN");

  try {
    const result = callback();
    database.exec("COMMIT");
    return result;
  } catch (error) {
    database.exec("ROLLBACK");
    throw error;
  }
}

function addDays(dateIso: string, days: number) {
  const date = new Date(dateIso);
  date.setDate(date.getDate() + days);
  return date.toISOString();
}

function seedDemoDrivers() {
  const demoDrivers = [
    {
      city: "Bangalore",
      email: "dispatch+bangalore@hopin.local",
      fullName: "Asha Nair",
      history: "Peak-hour airport and ORR commute specialist.",
      licensePlate: "KA03MQ4811",
      make: "Hyundai",
      model: "Creta",
      experience: "8 years",
      year: 2022,
    },
    {
      city: "Mumbai",
      email: "dispatch+mumbai@hopin.local",
      fullName: "Rahul Patil",
      history: "BKC and Powai corridor specialist.",
      licensePlate: "MH02TT1742",
      make: "Toyota",
      model: "Innova",
      experience: "6 years",
      year: 2021,
    },
    {
      city: "Hyderabad",
      email: "dispatch+hyderabad@hopin.local",
      fullName: "Neha Reddy",
      history: "Late-shift tech corridor driver.",
      licensePlate: "TS09KY6124",
      make: "Maruti",
      model: "Ertiga",
      experience: "7 years",
      year: 2023,
    },
  ];

  for (const driver of demoDrivers) {
    const existingUser = getUserByEmail(driver.email);
    if (existingUser) {
      continue;
    }

    const timestamp = nowIso();
    const passwordRecord = createPasswordRecord(createId());
    const userId = createId();
    const driverProfileId = createId();
    const vehicleId = createId();

    runInTransaction(() => {
      database
        .prepare(`
          INSERT INTO users (
            id, email, password_hash, password_salt, full_name, phone, role, avatar_url,
            city, gender, home_address, work_address, is_phone_verified, is_email_verified,
            onboarding_completed, created_at, updated_at
          ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        `)
        .run(
          userId,
          driver.email,
          passwordRecord.hash,
          passwordRecord.salt,
          driver.fullName,
          null,
          "driver",
          null,
          driver.city,
          null,
          null,
          null,
          1,
          1,
          1,
          timestamp,
          timestamp,
        );

      database
        .prepare(`
          INSERT INTO driver_profiles (
            id, user_id, experience, history, license_ready, aadhaar_ready, pan_ready,
            is_online, is_demo, status, created_at, updated_at
          ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        `)
        .run(
          driverProfileId,
          userId,
          driver.experience,
          driver.history,
          1,
          1,
          1,
          1,
          1,
          "approved",
          timestamp,
          timestamp,
        );

      database
        .prepare(`
          INSERT INTO vehicles (
            id, driver_profile_id, make, model, year, license_plate, color, type,
            rc_ready, status, created_at, updated_at
          ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        `)
        .run(
          vehicleId,
          driverProfileId,
          driver.make,
          driver.model,
          driver.year,
          driver.licensePlate,
          "White",
          "suv",
          1,
          "approved",
          timestamp,
          timestamp,
        );
    });
  }
}

function assignSearchingBookings(driverProfileId: string, city: string) {
  const rows = database
    .prepare(`
      SELECT id
      FROM bookings
      WHERE city = ?
        AND status = 'searching'
        AND driver_profile_id IS NULL
      ORDER BY created_at ASC
      LIMIT 3
    `)
    .all(city) as Array<{ id: string }>;

  if (!rows.length) {
    return;
  }

  const timestamp = nowIso();
  const updateStatement = database.prepare(`
    UPDATE bookings
    SET driver_profile_id = ?, status = 'matched', updated_at = ?
    WHERE id = ?
  `);

  for (const row of rows) {
    updateStatement.run(driverProfileId, timestamp, row.id);
  }
}

export function getDatabasePath() {
  return dataFile;
}

export function getUserByEmail(email: string) {
  return castSqlResult<UserRow | undefined>(
    database.prepare("SELECT * FROM users WHERE email = ?").get(email),
  );
}

export function createUser(input: {
  email: string;
  fullName: string;
  passwordHash: string;
  passwordSalt: string;
  phone: string;
  role: UserRole;
}) {
  const id = createId();
  const timestamp = nowIso();

  database
    .prepare(`
      INSERT INTO users (
        id, email, password_hash, password_salt, full_name, phone, role, avatar_url, city, gender,
        home_address, work_address, is_phone_verified, is_email_verified, onboarding_completed,
        created_at, updated_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `)
    .run(
      id,
      input.email,
      input.passwordHash,
      input.passwordSalt,
      input.fullName,
      input.phone,
      input.role,
      null,
      null,
      null,
      null,
      null,
      0,
      1,
      0,
      timestamp,
      timestamp,
    );

  const row = getUserRowById(id);
  if (!row) {
    throw new Error("User creation failed.");
  }

  return row;
}

export function createSession(userId: string, sessionDays: number) {
  const token = createSessionToken();
  const tokenHash = hashSessionToken(token);
  const createdAt = nowIso();

  database
    .prepare(`
      INSERT INTO sessions (id, user_id, token_hash, expires_at, created_at)
      VALUES (?, ?, ?, ?, ?)
    `)
    .run(createId(), userId, tokenHash, addDays(createdAt, sessionDays), createdAt);

  return token;
}

export function getSessionByToken(token: string) {
  const tokenHash = hashSessionToken(token);
  const now = nowIso();

  database.prepare("DELETE FROM sessions WHERE expires_at <= ?").run(now);

  return database
    .prepare(`
      SELECT u.*, s.id AS session_id, s.expires_at
      FROM sessions s
      JOIN users u ON u.id = s.user_id
      WHERE s.token_hash = ?
        AND s.expires_at > ?
      LIMIT 1
    `)
    .get(tokenHash, now) as unknown as SessionLookupRow | undefined;
}

export function deleteSession(token: string) {
  database.prepare("DELETE FROM sessions WHERE token_hash = ?").run(hashSessionToken(token));
}

export function createAuthSession(userId: string, sessionDays: number): AuthSession {
  const row = getUserRowById(userId);
  if (!row) {
    throw new Error("User not found.");
  }

  return {
    token: createSession(userId, sessionDays),
    user: mapUserToSessionUser(row),
    profile: mapUserToProfile(row),
  };
}

export function buildAuthSession(row: UserRow, token: string): AuthSession {
  return {
    token,
    user: mapUserToSessionUser(row),
    profile: mapUserToProfile(row),
  };
}

export function getCurrentSession(token: string) {
  const row = getSessionByToken(token);
  if (!row) {
    return null;
  }

  return {
    user: mapUserToSessionUser(row),
    profile: mapUserToProfile(row),
  };
}

export function updateProfile(userId: string, patch: Partial<Profile>) {
  const updates: Array<[string, SqlValue]> = [];

  if (patch.full_name !== undefined) {
    updates.push(["full_name", normalizeNullableString(patch.full_name)]);
  }

  if (patch.phone !== undefined) {
    updates.push(["phone", normalizeNullableString(patch.phone)]);
  }

  if (patch.avatar_url !== undefined) {
    updates.push(["avatar_url", normalizeNullableString(patch.avatar_url)]);
  }

  if (patch.city !== undefined) {
    updates.push(["city", normalizeNullableString(patch.city)]);
  }

  if (patch.gender !== undefined) {
    updates.push(["gender", normalizeNullableString(patch.gender)]);
  }

  if (patch.home_address !== undefined) {
    updates.push(["home_address", normalizeNullableString(patch.home_address)]);
  }

  if (patch.work_address !== undefined) {
    updates.push(["work_address", normalizeNullableString(patch.work_address)]);
  }

  if (patch.onboarding_completed !== undefined) {
    updates.push(["onboarding_completed", Number(Boolean(patch.onboarding_completed))]);
  }

  if (patch.is_phone_verified !== undefined) {
    updates.push(["is_phone_verified", Number(Boolean(patch.is_phone_verified))]);
  }

  if (!updates.length) {
    const current = getUserRowById(userId);
    if (!current) {
      throw new Error("Profile not found.");
    }

    return {
      user: mapUserToSessionUser(current),
      profile: mapUserToProfile(current),
    };
  }

  const timestamp = nowIso();
  const assignments = updates.map(([column]) => `${column} = ?`).join(", ");
  const values = updates.map(([, value]) => value);

  database
    .prepare(`UPDATE users SET ${assignments}, updated_at = ? WHERE id = ?`)
    .run(...values, timestamp, userId);

  const row = getUserRowById(userId);
  if (!row) {
    throw new Error("Profile update failed.");
  }

  return {
    user: mapUserToSessionUser(row),
    profile: mapUserToProfile(row),
  };
}

export function createOrUpdateDriverApplication(userId: string, input: DriverApplicationInput) {
  const user = getUserRowById(userId);
  if (!user) {
    throw new Error("User not found.");
  }

  const currentDriver = getDriverRowByUserId(userId);
  const currentVehicle = currentDriver ? getVehicleRowByDriverProfileId(currentDriver.id) : undefined;
  const timestamp = nowIso();

  const result = runInTransaction(() => {
    const driverProfileId = currentDriver?.id || createId();

    if (currentDriver) {
      database
        .prepare(`
          UPDATE driver_profiles
          SET experience = ?, history = ?, license_ready = ?, aadhaar_ready = ?, pan_ready = ?,
              status = 'approved', updated_at = ?
          WHERE id = ?
        `)
        .run(
          normalizeNullableString(input.experience),
          normalizeNullableString(input.history),
          Number(input.documents.license),
          Number(input.documents.aadhaar),
          Number(input.documents.pan),
          timestamp,
          driverProfileId,
        );
    } else {
      database
        .prepare(`
          INSERT INTO driver_profiles (
            id, user_id, experience, history, license_ready, aadhaar_ready, pan_ready,
            is_online, is_demo, status, created_at, updated_at
          ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        `)
        .run(
          driverProfileId,
          userId,
          normalizeNullableString(input.experience),
          normalizeNullableString(input.history),
          Number(input.documents.license),
          Number(input.documents.aadhaar),
          Number(input.documents.pan),
          0,
          0,
          "approved",
          timestamp,
          timestamp,
        );
    }

    if (currentVehicle) {
      database
        .prepare(`
          UPDATE vehicles
          SET make = ?, model = ?, year = ?, license_plate = ?, color = ?, type = ?,
              rc_ready = 1, status = 'approved', updated_at = ?
          WHERE id = ?
        `)
        .run(
          input.make.trim(),
          input.model.trim(),
          input.year,
          input.plate.trim().toUpperCase(),
          "Black",
          "sedan",
          timestamp,
          currentVehicle.id,
        );
    } else {
      database
        .prepare(`
          INSERT INTO vehicles (
            id, driver_profile_id, make, model, year, license_plate, color, type,
            rc_ready, status, created_at, updated_at
          ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        `)
        .run(
          createId(),
          driverProfileId,
          input.make.trim(),
          input.model.trim(),
          input.year,
          input.plate.trim().toUpperCase(),
          "Black",
          "sedan",
          1,
          "approved",
          timestamp,
          timestamp,
        );
    }

    const driverRow = getDriverRowByUserId(userId);
    const vehicleRow = driverRow ? getVehicleRowByDriverProfileId(driverRow.id) : undefined;

    if (!driverRow || !vehicleRow) {
      throw new Error("Driver application could not be saved.");
    }

    return {
      driverRecord: mapDriverRow(driverRow),
      vehicle: mapVehicleRow(vehicleRow),
    };
  });

  return result;
}

export function getDriverDashboard(userId: string): DriverDashboardData {
  const driverRow = getDriverRowByUserId(userId);

  if (!driverRow) {
    return {
      driverRecord: null,
      assignedTrips: [],
      vehicleCount: 0,
    };
  }

  const trips = database
    .prepare(`
      SELECT *
      FROM bookings
      WHERE driver_profile_id = ?
      ORDER BY created_at DESC
      LIMIT 6
    `)
    .all(driverRow.id) as unknown as BookingRow[];

  const vehicleCountRow = database
    .prepare("SELECT COUNT(*) AS total FROM vehicles WHERE driver_profile_id = ?")
    .get(driverRow.id) as { total: number };

  return {
    driverRecord: mapDriverRow(driverRow),
    assignedTrips: trips.map(mapBookingRow),
    vehicleCount: vehicleCountRow?.total ?? 0,
  };
}

export function setDriverAvailability(userId: string, isOnline: boolean) {
  const driverRow = getDriverRowByUserId(userId);
  const user = getUserRowById(userId);

  if (!driverRow || !user) {
    return null;
  }

  const timestamp = nowIso();

  database
    .prepare("UPDATE driver_profiles SET is_online = ?, updated_at = ? WHERE id = ?")
    .run(Number(isOnline), timestamp, driverRow.id);

  if (isOnline && user.city) {
    assignSearchingBookings(driverRow.id, user.city);
  }

  const updated = getDriverRowByUserId(userId);
  return updated ? mapDriverRow(updated) : null;
}

function haversineKm(lat1: number, lng1: number, lat2: number, lng2: number) {
  const radiusKm = 6371;
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLng = ((lng2 - lng1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLng / 2) ** 2;

  return radiusKm * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

function calculateFare(pickup: { lat: number; lng: number }, destination: { lat: number; lng: number }, seats: number) {
  const distance = haversineKm(pickup.lat, pickup.lng, destination.lat, destination.lng);
  const baseFare = Math.max(45, Math.round(distance * 12));
  return Math.round(baseFare / Math.max(1, seats));
}

function findAvailableDriver(city: string, excludeUserId: string | null) {
  const row = database
    .prepare(`
      SELECT dp.*
      FROM driver_profiles dp
      JOIN users u ON u.id = dp.user_id
      WHERE dp.status = 'approved'
        AND dp.is_online = 1
        AND u.city = ?
        AND (? IS NULL OR u.id != ?)
      ORDER BY dp.is_demo ASC, dp.updated_at ASC
      LIMIT 1
    `)
    .get(city, excludeUserId, excludeUserId) as unknown as DriverRow | undefined;

  return row;
}

export function createBooking(userId: string, input: {
  city: string;
  destination: { address: string; lat: number; lng: number };
  pickup: { address: string; lat: number; lng: number };
  seats: number;
}) {
  const availableDriver = findAvailableDriver(input.city, userId);
  const fare = calculateFare(input.pickup, input.destination, input.seats);
  const id = createId();
  const timestamp = nowIso();
  const status: BookingStatus = availableDriver ? "matched" : "searching";

  database
    .prepare(`
      INSERT INTO bookings (
        id, rider_id, driver_profile_id, city, pickup_address, pickup_lat, pickup_lng,
        dest_address, dest_lat, dest_lng, fare_total, fare_shared, seats, status,
        created_at, updated_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `)
    .run(
      id,
      userId,
      availableDriver?.id ?? null,
      input.city,
      input.pickup.address,
      input.pickup.lat,
      input.pickup.lng,
      input.destination.address,
      input.destination.lat,
      input.destination.lng,
      fare,
      fare,
      input.seats,
      status,
      timestamp,
      timestamp,
    );

  const row = database.prepare("SELECT * FROM bookings WHERE id = ?").get(id) as unknown as
    | BookingRow
    | undefined;
  if (!row) {
    throw new Error("Booking could not be created.");
  }

  return mapBookingRow(row);
}

export function getRiderBookings(userId: string) {
  const rows = database
    .prepare(`
      SELECT *
      FROM bookings
      WHERE rider_id = ?
      ORDER BY created_at DESC
      LIMIT 6
    `)
    .all(userId) as unknown as BookingRow[];

  return rows.map(mapBookingRow);
}

export function cancelBooking(userId: string, bookingId: string) {
  const booking = database
    .prepare("SELECT * FROM bookings WHERE id = ? AND rider_id = ?")
    .get(bookingId, userId) as unknown as BookingRow | undefined;

  if (!booking) {
    return null;
  }

  const timestamp = nowIso();

  database
    .prepare(`
      UPDATE bookings
      SET status = 'cancelled', updated_at = ?
      WHERE id = ?
        AND rider_id = ?
        AND status NOT IN ('completed', 'cancelled')
    `)
    .run(timestamp, bookingId, userId);

  const updated = database
    .prepare("SELECT * FROM bookings WHERE id = ?")
    .get(bookingId) as unknown as BookingRow | undefined;

  return updated ? mapBookingRow(updated) : null;
}

export function createContactMessage(input: {
  email: string;
  message: string;
  name: string;
  requestedCity?: string | null;
  requestedRole?: string | null;
  topic: string;
}) {
  const id = createId();

  database
    .prepare(`
      INSERT INTO contact_messages (
        id, name, email, topic, message, requested_role, requested_city, created_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `)
    .run(
      id,
      input.name.trim(),
      input.email.trim().toLowerCase(),
      input.topic.trim(),
      input.message.trim(),
      normalizeNullableString(input.requestedRole),
      normalizeNullableString(input.requestedCity),
      nowIso(),
    );

  return { id };
}

export function createNewsletterSubscription(email: string) {
  const normalizedEmail = email.trim().toLowerCase();

  database
    .prepare(`
      INSERT OR IGNORE INTO newsletter_subscriptions (id, email, created_at)
      VALUES (?, ?, ?)
    `)
    .run(createId(), normalizedEmail, nowIso());

  return { email: normalizedEmail };
}

export function isSupportedCity(city: string) {
  return supportedCities.includes(city as (typeof supportedCities)[number]);
}
