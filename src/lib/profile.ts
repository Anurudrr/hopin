import type { User } from "@supabase/supabase-js";

import type { Profile, UserRole } from "../types";

export interface ProfileRow {
  id: string;
  full_name: string | null;
  phone: string | null;
  city: string | null;
  role: UserRole | null;
  avatar_url: string | null;
  created_at: string;
  updated_at: string;
}

function normalizeRole(role: unknown): UserRole {
  if (role === "driver" || role === "admin") {
    return role
  }

  return "rider"
}

export function buildProfile(row: ProfileRow | null, user: User | null): Profile | null {
  if (!row && !user) {
    return null
  }

  const now = new Date().toISOString()
  const fullName =
    row?.full_name ??
    (typeof user?.user_metadata?.full_name === "string" ? user.user_metadata.full_name : null)

  return {
    id: row?.id ?? user?.id ?? "",
    full_name: fullName,
    avatar_url: row?.avatar_url ?? null,
    phone: row?.phone ?? null,
    email: user?.email ?? null,
    role: normalizeRole(row?.role),
    city: row?.city ?? null,
    gender: null,
    home_address: null,
    work_address: null,
    is_phone_verified: Boolean(row?.phone),
    is_email_verified: Boolean(user?.email_confirmed_at),
    onboarding_completed: Boolean(row?.city),
    created_at: row?.created_at ?? now,
    updated_at: row?.updated_at ?? row?.created_at ?? now,
  }
}
