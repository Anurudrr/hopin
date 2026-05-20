-- 008: add an explicit admin review workflow for driver applications

ALTER TABLE public.driver_applications
  ADD COLUMN IF NOT EXISTS reviewed_by uuid REFERENCES public.profiles(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS review_notes text;

-- Admins need read access to the records involved in application review.
DROP POLICY IF EXISTS "Admins can read all profiles" ON public.profiles;
CREATE POLICY "Admins can read all profiles"
  ON public.profiles
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1
      FROM public.profiles AS admin_profile
      WHERE admin_profile.id = auth.uid()
        AND admin_profile.role = 'admin'
    )
  );

DROP POLICY IF EXISTS "Admins can read all vehicles" ON public.vehicles;
CREATE POLICY "Admins can read all vehicles"
  ON public.vehicles
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1
      FROM public.profiles AS admin_profile
      WHERE admin_profile.id = auth.uid()
        AND admin_profile.role = 'admin'
    )
  );

DROP POLICY IF EXISTS "Admins can read all driver applications" ON public.driver_applications;
CREATE POLICY "Admins can read all driver applications"
  ON public.driver_applications
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1
      FROM public.profiles AS admin_profile
      WHERE admin_profile.id = auth.uid()
        AND admin_profile.role = 'admin'
    )
  );

-- Allow admin reviewers to inspect uploaded license documents.
DROP POLICY IF EXISTS "Admins read driver documents" ON storage.objects;
CREATE POLICY "Admins read driver documents"
  ON storage.objects FOR SELECT
  USING (
    bucket_id = 'driver-documents'
    AND EXISTS (
      SELECT 1
      FROM public.profiles AS admin_profile
      WHERE admin_profile.id = auth.uid()
        AND admin_profile.role = 'admin'
    )
  );

DROP FUNCTION IF EXISTS public.review_driver_application(uuid, text, text);
CREATE OR REPLACE FUNCTION public.review_driver_application(
  p_application_id uuid,
  p_status text,
  p_review_notes text DEFAULT NULL
)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_role text;
BEGIN
  IF auth.uid() IS NULL THEN
    RAISE EXCEPTION 'Not authenticated';
  END IF;

  SELECT role
  INTO v_role
  FROM public.profiles
  WHERE id = auth.uid();

  IF v_role IS DISTINCT FROM 'admin' THEN
    RAISE EXCEPTION 'Permission denied';
  END IF;

  IF p_application_id IS NULL THEN
    RAISE EXCEPTION 'Application id is required';
  END IF;

  IF p_status NOT IN ('approved', 'rejected', 'pending') THEN
    RAISE EXCEPTION 'Invalid application status';
  END IF;

  UPDATE public.driver_applications
  SET status = p_status,
      reviewed_at = now(),
      reviewed_by = auth.uid(),
      review_notes = NULLIF(BTRIM(p_review_notes), '')
  WHERE id = p_application_id;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Driver application not found';
  END IF;

  RETURN p_application_id;
END;
$$;
