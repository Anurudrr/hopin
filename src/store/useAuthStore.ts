import { create } from "zustand";

import {
  clearStoredAuthToken,
  getCurrentSession,
  getStoredAuthToken,
  logoutAccount,
  storeAuthToken,
} from "../lib/api";
import type { AuthSession, Profile, SessionUser } from "../types";

let initializePromise: Promise<void> | null = null;

interface AuthState {
  user: SessionUser | null;
  profile: Profile | null;
  loading: boolean;
  initialized: boolean;
  initialize: () => Promise<void>;
  refreshProfile: () => Promise<void>;
  setSession: (session: AuthSession) => void;
  signOut: () => Promise<void>;
}

export const useAuthStore = create<AuthState>((set, get) => ({
  user: null,
  profile: null,
  loading: true,
  initialized: false,

  setSession: (session) => {
    storeAuthToken(session.token);
    set({
      user: session.user,
      profile: session.profile,
      loading: false,
      initialized: true,
    });
  },

  signOut: async () => {
    try {
      if (getStoredAuthToken()) {
        await logoutAccount();
      }
    } catch (error) {
      console.warn("Session sign-out request failed, clearing local session anyway.", error);
    } finally {
      clearStoredAuthToken();
      set({
        user: null,
        profile: null,
        loading: false,
        initialized: true,
      });
    }
  },

  refreshProfile: async () => {
    try {
      const session = await getCurrentSession();
      set({
        user: session.user,
        profile: session.profile,
      });
    } catch (error) {
      clearStoredAuthToken();
      set({
        user: null,
        profile: null,
      });
      throw error;
    }
  },

  initialize: async () => {
    if (get().initialized) {
      return;
    }

    if (initializePromise) {
      return initializePromise;
    }

    initializePromise = (async () => {
      const token = getStoredAuthToken();

      if (!token) {
        set({
          user: null,
          profile: null,
          loading: false,
          initialized: true,
        });
        return;
      }

      set({ loading: true });

      try {
        const session = await getCurrentSession();
        set({
          user: session.user,
          profile: session.profile,
          initialized: true,
        });
      } catch (error) {
        console.warn("Auth initialization failed. Clearing stale local session.", error);
        clearStoredAuthToken();
        set({
          user: null,
          profile: null,
          initialized: true,
        });
      } finally {
        set({ loading: false });
      }
    })();

    try {
      await initializePromise;
    } finally {
      initializePromise = null;
    }
  },
}));
