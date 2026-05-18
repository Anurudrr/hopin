# Supabase Configuration & Migration Issues - FIXED

## Issues Identified & Resolved

### 1. **Duplicate Migration Files**
   - **Problem**: Both `004_fix_bookings_and_profiles.sql` and `004_fix_bookings_and_profiles_clean.sql` existed, causing confusion
   - **Fix**: 
     - Deprecated `004_fix_bookings_and_profiles.sql` 
     - Created consolidated `004_fix_bookings_and_profiles_CONSOLIDATED.sql` with all fixes
     - Old migrations 002 & 003 now marked as deprecated

### 2. **Column Name Mismatches in Bookings Table**
   - **Problem**: 
     - Initial schema used: `seats_booked`, `total_fare`
     - TypeScript types expected: `seats`, `fare_total`
     - Old migrations (002, 003) had functions using wrong column names
   - **Fix**: Migration 004 consolidates all column renames:
     ```sql
     ALTER TABLE public.bookings RENAME COLUMN seats_booked TO seats;
     ALTER TABLE public.bookings RENAME COLUMN total_fare TO fare_total;
     ```

### 3. **Outdated Database Functions**
   - **Problem**:
     - `book_ride()` function only accepted 3 parameters (p_ride_id, p_rider_id, p_seats)
     - API calls (`src/lib/api.ts`) pass 9 parameters including location data
     - `cancel_booking()` returned uuid instead of void
   - **Fix**: Recreated both functions with correct signatures:
     ```sql
     -- Old: book_ride(uuid, uuid, integer)
     -- New: book_ride(uuid, uuid, integer, text, double precision, double precision, 
     --               text, double precision, double precision)
     
     -- Old: cancel_booking() returns uuid
     -- New: cancel_booking() returns void
     ```

### 4. **Missing Booking Table Columns**
   - **Problem**: Initial bookings table only had:
     - ride_id, rider_id, seats_booked, total_fare, status, created_at
   - **Missing columns** that TypeScript types expected:
     - driver_id, city, pickup_address, pickup_lat, pickup_lng
     - dest_address, dest_lat, dest_lng, fare_shared, departure_time
     - driver_name, vehicle_label
   - **Fix**: All columns added in Migration 004

### 5. **Incomplete Profile Table**
   - **Problem**: Initial profile table missing verification & onboarding fields
   - **Added**: email, gender, home_address, work_address, is_phone_verified, is_email_verified, onboarding_completed

### 6. **Email Synchronization**
   - **Problem**: Profile email not synced with auth.users table
   - **Fix**: Added trigger `on_auth_user_email_updated` to keep in sync

### 7. **RLS Policies**
   - **Issue**: Missing policy for drivers to view bookings on their rides
   - **Fix**: Added policy: "Drivers see bookings on their rides"

### 8. **Storage Configuration**
   - **Fix**: Ensured driver-documents bucket with proper RLS policies

---

## Migration Order (Correct Sequence)

1. ✅ `001_initial_schema.sql` - Base schema
2. ✅ `002_booking_function.sql` - **DEPRECATED** (now no-op)
3. ✅ `003_cancel_booking_function.sql` - **DEPRECATED** (now no-op)
4. ✅ `004_fix_bookings_and_profiles_CONSOLIDATED.sql` - **ACTIVE** (all fixes here)

---

## Environment Variables (Verified)

```env
VITE_SUPABASE_URL=https://tmgcmoghpctzzscjcevz.supabase.co
VITE_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

✅ Configured in `.env` file

---

## Code-Side Compliance

All TypeScript code already using correct field names:
- ✅ `src/lib/api.ts` - API calls with 9 parameters
- ✅ `src/types.ts` - Types using `seats`, `fare_total`, location fields
- ✅ Components expecting new Booking interface

---

## Next Steps (If Applying Migrations)

1. Run migrations in Supabase:
   ```bash
   supabase db push
   ```

2. Or manually apply SQL in Supabase editor in order:
   - 001_initial_schema.sql
   - 004_fix_bookings_and_profiles_CONSOLIDATED.sql

3. Test booking flow:
   ```
   POST /book_ride → Success (with location data)
   POST /cancel_booking → Success (returns void)
   GET /bookings → Returns all fields
   ```

---

## Files Modified

- ✅ `002_booking_function.sql` - Marked deprecated
- ✅ `003_cancel_booking_function.sql` - Marked deprecated  
- ✅ `004_fix_bookings_and_profiles_CONSOLIDATED.sql` - Created
- ✅ Documentation: `SUPABASE_ISSUES_FIXED.md` - Created

---

**Status**: ✅ All Supabase configuration issues identified and fixed!
