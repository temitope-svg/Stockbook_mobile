import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react';
import type { Session, User } from '@supabase/supabase-js';
import { supabase } from '../lib/supabase';
import type { Profile, ShopMembership, ShopRole } from '../types/domain';

type AuthContextValue = {
  session: Session | null;
  user: User | null;
  profile: Profile | null;
  shopId: string | null;
  role: ShopRole | null;
  membership: ShopMembership | null;
  loading: boolean;
  profileLoading: boolean;
  refreshProfile: () => Promise<void>;
  signOut: () => Promise<void>;
};

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);
  const [membership, setMembership] = useState<ShopMembership | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [profileLoading, setProfileLoading] = useState(false);

  useEffect(() => {
    let mounted = true;

    supabase.auth.getSession().then(({ data }) => {
      if (!mounted) return;
      setSession(data.session);
      setLoading(false);
    });

    const { data: listener } = supabase.auth.onAuthStateChange(
      (_event, next) => {
        setSession(next);
      },
    );

    return () => {
      mounted = false;
      listener.subscription.unsubscribe();
    };
  }, []);

  const refreshProfile = useCallback(async () => {
    const userId = session?.user.id;
    if (!userId) {
      setMembership(null);
      setProfile(null);
      setProfileLoading(false);
      return;
    }

    setProfileLoading(true);

    const { data: rows, error: memberError } = await supabase
      .from('shop_members')
      .select('id, shop_id, user_id, role, status, display_name')
      .eq('user_id', userId)
      .eq('status', 'active');

    if (memberError) {
      setMembership(null);
      setProfile(null);
      setProfileLoading(false);
      return;
    }

    const list = (rows ?? []) as ShopMembership[];
    const invited = list.find(r => r.shop_id !== r.user_id);
    const owned = list.find(r => r.shop_id === r.user_id && r.role === 'owner');
    const nextMembership = invited ?? owned ?? list[0] ?? null;
    setMembership(nextMembership);

    const profileId = nextMembership?.shop_id ?? userId;
    const { data: nextProfile } = await supabase
      .from('profiles')
      .select(
        'id, shop_name, owner_name, phone_number, avatar_url, business_type, low_stock_threshold, debt_reminder_days, field_overrides, category_settings, custom_product_fields',
      )
      .eq('id', profileId)
      .maybeSingle();

    setProfile((nextProfile as Profile | null) ?? null);
    setProfileLoading(false);
  }, [session?.user.id]);

  useEffect(() => {
    void refreshProfile();
  }, [refreshProfile]);

  const signOut = useCallback(async () => {
    await supabase.auth.signOut();
    setMembership(null);
    setProfile(null);
  }, []);

  const userId = session?.user.id ?? null;
  const role: ShopRole | null =
    membership?.role ?? (profile?.id === userId ? 'owner' : null);
  const shopId =
    membership?.shop_id ??
    (profile && profile.id === userId ? profile.id : null);

  const value = useMemo<AuthContextValue>(
    () => ({
      session,
      user: session?.user ?? null,
      profile,
      shopId,
      role,
      membership,
      loading,
      profileLoading,
      refreshProfile,
      signOut,
    }),
    [
      session,
      profile,
      shopId,
      role,
      membership,
      loading,
      profileLoading,
      refreshProfile,
      signOut,
    ],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) {
    throw new Error('useAuth must be used within AuthProvider');
  }
  return ctx;
}
