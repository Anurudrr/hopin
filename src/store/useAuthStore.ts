import { create } from 'zustand'
import type { Session, User } from '@supabase/supabase-js'

import { getErrorMessage, logDevError } from '@/src/lib/errors'
import { buildProfile, type ProfileRow } from '@/src/lib/profile'
import { supabase } from '@/src/lib/supabase'
import type { Profile } from '../types'

interface AuthState {
  user: User | null
  session: Session | null
  profile: Profile | null
  loading: boolean
  signUp: (email: string, password: string, fullName: string) => Promise<void>
  signIn: (email: string, password: string) => Promise<void>
  signOut: () => Promise<void>
  fetchProfile: () => Promise<void>
  initialize: () => Promise<void>
}

let initializePromise: Promise<void> | null = null
let authSubscriptionRegistered = false

export const useAuthStore = create<AuthState>((set, get) => ({
  user: null,
  session: null,
  profile: null,
  loading: true,

  initialize: async () => {
    if (initializePromise) {
      return initializePromise
    }

    initializePromise = (async () => {
      try {
        const {
          data: { session },
        } = await supabase.auth.getSession()

        set({ session, user: session?.user ?? null, loading: Boolean(session?.user) })

        if (session?.user) {
          await get().fetchProfile()
        }

        set({ loading: false })

        if (!authSubscriptionRegistered) {
          supabase.auth.onAuthStateChange((_event, nextSession) => {
            if (nextSession?.user) {
              set({ session: nextSession, user: nextSession.user, loading: true })

              void get().fetchProfile()
                .catch((error) => {
                  logDevError('auth.onAuthStateChange.fetchProfile', error)
                })
                .finally(() => {
                  set({ loading: false })
                })
              return
            }

            set({ profile: null, session: null, user: null, loading: false })
          })

          authSubscriptionRegistered = true
        }
      } catch (error) {
        logDevError('auth.initialize', error)
        set({ loading: false, session: null, user: null, profile: null })
        throw new Error(getErrorMessage(error, 'Could not restore your session.'))
      }
    })()

    try {
      await initializePromise
    } finally {
      initializePromise = null
    }
  },

  signUp: async (email, password, fullName) => {
    try {
      const { error } = await supabase.auth.signUp({
        email,
        password,
        options: { data: { full_name: fullName } },
      })

      if (error) {
        throw error
      }
    } catch (error) {
      logDevError('auth.signUp', error)
      throw new Error(getErrorMessage(error, 'Could not create that account.'))
    }
  },

  signIn: async (email, password) => {
    try {
      const { error } = await supabase.auth.signInWithPassword({ email, password })

      if (error) {
        throw error
      }
    } catch (error) {
      logDevError('auth.signIn', error)
      throw new Error(getErrorMessage(error, 'Could not sign in right now.'))
    }
  },

  signOut: async () => {
    try {
      const { error } = await supabase.auth.signOut()

      if (error) {
        throw error
      }

      set({ user: null, session: null, profile: null })
    } catch (error) {
      logDevError('auth.signOut', error)
      throw new Error(getErrorMessage(error, 'Could not sign out right now.'))
    }
  },

  fetchProfile: async () => {
    const userId = get().user?.id

    if (!userId) {
      set({ profile: null })
      return
    }

    try {
      const user = get().user
      const [profileResult, applicationResult] = await Promise.all([
        supabase.from('profiles').select('*').eq('id', userId).maybeSingle(),
        supabase.from('driver_applications').select('status').eq('user_id', userId).maybeSingle(),
      ])

      if (profileResult.error) {
        throw profileResult.error
      }

      if (applicationResult.error) {
        throw applicationResult.error
      }

      const profileRow = (profileResult.data as ProfileRow | null) ?? null
      const applicationStatus = applicationResult.data?.status
      const normalizedProfileRow =
        profileRow && profileRow.role !== 'admin'
          ? {
              ...profileRow,
              role:
                applicationStatus === 'approved'
                  ? 'driver'
                  : applicationStatus
                    ? 'rider'
                    : profileRow.role,
            }
          : profileRow

      set({ profile: buildProfile(normalizedProfileRow, user) })
    } catch (error) {
      logDevError('auth.fetchProfile', error)
      throw new Error(getErrorMessage(error, 'Could not load your profile right now.'))
    }
  },
}))
