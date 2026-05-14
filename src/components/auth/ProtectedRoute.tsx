import * as React from 'react';
import { Navigate } from 'react-router-dom';

import { useAuthStore } from '../../store/useAuthStore';

export function ProtectedRoute({
  children,
  requireOnboarding = false,
}: {
  children: React.ReactNode;
  requireOnboarding?: boolean;
}) {
  const { user, profile, loading } = useAuthStore();

  if (loading) {
    return (
      <div className="section-shell flex min-h-[calc(100vh-5rem)] items-center justify-center">
        <div className="panel flex items-center gap-4 px-6 py-5">
          <div className="h-10 w-10 animate-spin rounded-full border-2 border-brand-border border-t-brand-accent" />
          <p className="text-sm text-brand-text-secondary">Checking access.</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  if (requireOnboarding && profile && !profile.city) {
    return <Navigate to="/onboarding" replace />;
  }

  return <>{children}</>;
}
