-- 005: synchronize driver approval state with profile roles and live-ride access
-- This migration closes the remaining approval drift between driver_applications
-- and profiles.role, tightens self-service application policies so users cannot
-- self-approve, and aligns ride visibility with the app's scheduled/active flow.

-- 1. Keep profiles.role synchronized with driver application review outcomes.
--    Approved applications promote the user to driver, while non-approved
--    applications demote a previously promoted driver back to rider.
CREATE OR REPLACE FUNCTION public.sync_driver_profile_role()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NEW.status = 'approved' THEN
    UPDATE public.profiles
    SET role = 'driver'
    WHERE id = NEW.user_id
      AND role <> 'admin'
      AND role IS DISTINCT FROM 'driver';
  ELSE
    UPDATE public.profiles
    SET role = 'rider'
    WHERE id = NEW.user_id
      AND role = 'driver';
  END IF;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS sync_driver_profile_role_on_application ON public.driver_applications;
CREATE TRIGGER sync_driver_profile_role_on_application
  AFTER INSERT OR UPDATE OF status ON public.driver_applications
  FOR EACH ROW
  EXECUTE FUNCTION public.sync_driver_profile_role();

-- 2. Backfill any existing role drift so approved applications and profile roles
--    agree immediately after the migration is applied.
UPDATE public.profiles AS p
SET role = 'driver'
WHERE p.role <> 'admin'
  AND EXISTS (
    SELECT 1
    FROM public.driver_applications AS da
    WHERE da.user_id = p.id
      AND da.status = 'approved'
  );

UPDATE public.profiles AS p
SET role = 'rider'
WHERE p.role = 'driver'
  AND EXISTS (
    SELECT 1
    FROM public.driver_applications AS da
    WHERE da.user_id = p.id
  )
  AND NOT EXISTS (
    SELECT 1
    FROM public.driver_applications AS da
    WHERE da.user_id = p.id
      AND da.status = 'approved'
  );

-- 3. Recreate the self-service application policies so authenticated users can
--    submit or resubmit applications, but only in the pending state. This keeps
--    client-side upserts working without letting users mark themselves approved.
DROP POLICY IF EXISTS "Users can submit application" ON public.driver_applications;
CREATE POLICY "Users can submit application"
  ON public.driver_applications
  FOR INSERT
  WITH CHECK (
    auth.uid() = user_id
    AND status = 'pending'
  );

DROP POLICY IF EXISTS "Users can update own pending application" ON public.driver_applications;
CREATE POLICY "Users can update own pending application"
  ON public.driver_applications
  FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (
    auth.uid() = user_id
    AND status = 'pending'
  );

-- 4. Allow the public booking surface to read both scheduled and active rides,
--    matching the frontend query and the booking RPC's accepted ride statuses.
DROP POLICY IF EXISTS "Anyone can read scheduled rides" ON public.rides;
DROP POLICY IF EXISTS "Anyone can read live rides" ON public.rides;
CREATE POLICY "Anyone can read live rides"
  ON public.rides
  FOR SELECT
  USING (status IN ('scheduled', 'active'));
