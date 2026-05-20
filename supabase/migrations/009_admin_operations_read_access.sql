-- 009: expose core operations data to admin users

DROP POLICY IF EXISTS "Admins can read all rides" ON public.rides;
CREATE POLICY "Admins can read all rides"
  ON public.rides
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1
      FROM public.profiles AS admin_profile
      WHERE admin_profile.id = auth.uid()
        AND admin_profile.role = 'admin'
    )
  );

DROP POLICY IF EXISTS "Admins can read all bookings" ON public.bookings;
CREATE POLICY "Admins can read all bookings"
  ON public.bookings
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1
      FROM public.profiles AS admin_profile
      WHERE admin_profile.id = auth.uid()
        AND admin_profile.role = 'admin'
    )
  );

DROP POLICY IF EXISTS "Admins can read all contact messages" ON public.contact_messages;
CREATE POLICY "Admins can read all contact messages"
  ON public.contact_messages
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1
      FROM public.profiles AS admin_profile
      WHERE admin_profile.id = auth.uid()
        AND admin_profile.role = 'admin'
    )
  );

DROP POLICY IF EXISTS "Admins can read all newsletter subscriptions" ON public.newsletter_subscriptions;
CREATE POLICY "Admins can read all newsletter subscriptions"
  ON public.newsletter_subscriptions
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1
      FROM public.profiles AS admin_profile
      WHERE admin_profile.id = auth.uid()
        AND admin_profile.role = 'admin'
    )
  );
