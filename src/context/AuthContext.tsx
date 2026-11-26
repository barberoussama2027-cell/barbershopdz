import React, { createContext, useContext, useEffect, useState, useCallback } from 'react';
import type { Profile } from '../types';
import { isSupabaseConfigured, supabase } from '../lib/supabase/client';
import { DEMO_PROFILES } from '../lib/demoData';

interface AuthContextValue {
  profile: Profile | null;
  loading: boolean;
  isDemoMode: boolean;
  signIn: (email: string, password: string) => Promise<{ error: string | null }>;
  signInDemo: (profileId: string) => void;
  signOut: () => Promise<void>;
  refreshProfile: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined);
const DEMO_USER_KEY = 'barbershopdz_demo_user';
const CACHED_PROFILE_KEY = 'barbershopdz_active_profile';

function readCachedProfile(): Profile | null {
  try {
    const raw = localStorage.getItem(CACHED_PROFILE_KEY);
    return raw ? (JSON.parse(raw) as Profile) : null;
  } catch {
    return null;
  }
}

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [profile, setProfileState] = useState<Profile | null>(() => readCachedProfile());
  const [loading, setLoading] = useState(() => !readCachedProfile());
  const isDemoMode = !isSupabaseConfigured;

  const setProfile = useCallback((p: Profile | null) => {
    setProfileState(p);
    if (p) {
      localStorage.setItem(CACHED_PROFILE_KEY, JSON.stringify(p));
    } else {
      localStorage.removeItem(CACHED_PROFILE_KEY);
    }
  }, []);

  const fetchSupabaseProfile = useCallback(async (userId: string) => {
    if (!supabase) return null;
    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', userId)
      .maybeSingle();

    if (error) {
      console.error('[BarberShop] fetchSupabaseProfile error:', error.code, error.message, error.details);
      return null;
    }
    if (!data) {
      console.warn('[BarberShop] fetchSupabaseProfile: no profile found for uid', userId);
      return null;
    }
    return data as Profile;
  }, []);

  const refreshProfile = useCallback(async () => {
    if (isDemoMode) {
      const savedId = localStorage.getItem(DEMO_USER_KEY);
      if (savedId) {
        const storedProfilesRaw = localStorage.getItem('barbershopdz_demo_profiles');
        const allProfiles: Profile[] = storedProfilesRaw
          ? JSON.parse(storedProfilesRaw)
          : DEMO_PROFILES;
        const found = allProfiles.find((p) => p.id === savedId && p.is_active);
        setProfile(found ?? null);
      }
      setLoading(false);
      return;
    }

    if (!supabase) {
      setLoading(false);
      return;
    }

    try {
      const { data: sessionData } = await supabase.auth.getSession();
      const user = sessionData.session?.user;
      if (!user) {
        setProfile(null);
        setLoading(false);
        return;
      }

      const prof = await fetchSupabaseProfile(user.id);
      if (prof) {
        if (!prof.is_active) {
          await supabase.auth.signOut().catch(() => {});
          setProfile(null);
        } else {
          setProfile(prof);
        }
      }
      // Si prof est temporairement null (réseau/veille), on conserve le profil en cache
    } finally {
      setLoading(false);
    }
  }, [fetchSupabaseProfile, isDemoMode, setProfile]);

  useEffect(() => {
    void refreshProfile();

    if (!supabase) return;
    const client = supabase;
    const { data: listener } = client.auth.onAuthStateChange(async (event, session) => {
      if (event === 'SIGNED_OUT' || (!session?.user && event !== 'INITIAL_SESSION')) {
        setProfile(null);
        setLoading(false);
      } else if (session?.user) {
        const prof = await fetchSupabaseProfile(session.user.id);
        if (prof) {
          if (!prof.is_active) {
            await client.auth.signOut().catch(() => {});
            setProfile(null);
          } else {
            setProfile(prof);
          }
        }
        setLoading(false);
      }
    });

    return () => {
      listener.subscription.unsubscribe();
    };
  }, [fetchSupabaseProfile, refreshProfile, setProfile]);

  const signIn = useCallback(
    async (email: string, password: string): Promise<{ error: string | null }> => {
      if (isDemoMode) {
        const storedProfilesRaw = localStorage.getItem('barbershopdz_demo_profiles');
        const allProfiles: Profile[] = storedProfilesRaw
          ? JSON.parse(storedProfilesRaw)
          : DEMO_PROFILES;
        const found = allProfiles.find(
          (p) => p.email.toLowerCase() === email.trim().toLowerCase()
        );
        if (!found) return { error: 'auth.invalidCredentials' };
        if (!found.is_active) return { error: 'auth.inactiveAccount' };
        localStorage.setItem(DEMO_USER_KEY, found.id);
        setProfile(found);
        return { error: null };
      }

      if (!supabase) return { error: 'Supabase non configuré' };
      const { data, error } = await supabase.auth.signInWithPassword({
        email: email.trim(),
        password,
      });
      if (error || !data.user) {
        return { error: 'auth.invalidCredentials' };
      }
      const prof = await fetchSupabaseProfile(data.user.id);
      if (!prof) {
        console.error('[BarberShop] signIn: profile not found after sign-in for user', data.user.id);
        await supabase.auth.signOut();
        return { error: 'auth.profileNotFound' };
      }
      if (!prof.is_active) {
        await supabase.auth.signOut();
        return { error: 'auth.inactiveAccount' };
      }
      setProfile(prof);
      return { error: null };
    },
    [fetchSupabaseProfile, isDemoMode]
  );

  const signInDemo = useCallback((profileId: string) => {
    const storedProfilesRaw = localStorage.getItem('barbershopdz_demo_profiles');
    const allProfiles: Profile[] = storedProfilesRaw
      ? JSON.parse(storedProfilesRaw)
      : DEMO_PROFILES;
    const found = allProfiles.find((p) => p.id === profileId && p.is_active);
    if (found) {
      localStorage.setItem(DEMO_USER_KEY, found.id);
      setProfile(found);
    }
  }, []);

  const signOut = useCallback(async () => {
    localStorage.removeItem(DEMO_USER_KEY);
    localStorage.removeItem(CACHED_PROFILE_KEY);
    if (supabase) {
      await supabase.auth.signOut().catch(() => {});
    }
    setProfile(null);
  }, [setProfile]);

  return (
    <AuthContext.Provider
      value={{ profile, loading, isDemoMode, signIn, signInDemo, signOut, refreshProfile }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = (): AuthContextValue => {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within an AuthProvider');
  return ctx;
};
