import { useNavigation, useRoute, type RouteProp } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { Check, Tag, X } from 'lucide-react-native';
import { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  Text,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useAuth } from '../../auth/AuthContext';
import { PasswordField } from '../../components/ui/PasswordField';
import { PrimaryButton } from '../../components/ui/PrimaryButton';
import { supabase } from '../../lib/supabase';
import type { RootStackParamList } from '../../navigation/types';
import { colors } from '../../theme/colors';
import type { ShopRole } from '../../types/domain';
import { AuthBrandHeader } from './components/AuthBrandHeader';
import {
  capabilitiesFor,
  roleLabel,
  shopInitials,
  type InviteRole,
} from './inviteRole';

type InviteNav = NativeStackNavigationProp<RootStackParamList, 'InviteAccept'>;
type InviteRoute = RouteProp<RootStackParamList, 'InviteAccept'>;

type InviteInfo = {
  email: string;
  role: ShopRole;
  shop_name: string;
  expires_at: string;
};

function asInviteRole(role: ShopRole | undefined): InviteRole {
  return role === 'manager' ? 'manager' : 'cashier';
}

export function InviteAcceptScreen() {
  const navigation = useNavigation<InviteNav>();
  const route = useRoute<InviteRoute>();
  const insets = useSafeAreaInsets();
  const { session, refreshProfile } = useAuth();
  const { token } = route.params;

  const [invite, setInvite] = useState<InviteInfo | null>(null);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [loadingInvite, setLoadingInvite] = useState(true);
  const [password, setPassword] = useState('');
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    let cancelled = false;
    async function load() {
      if (!token) {
        setLoadError('This invite link is missing a token.');
        setLoadingInvite(false);
        return;
      }
      setLoadingInvite(true);
      setLoadError(null);
      const { data, error } = await supabase.rpc('get_shop_invite', {
        p_token: token,
      });
      if (cancelled) return;
      if (error || !data) {
        setLoadError(error?.message ?? 'This invite link is invalid or expired.');
        setInvite(null);
      } else {
        setInvite(data as unknown as InviteInfo);
      }
      setLoadingInvite(false);
    }
    void load();
    return () => {
      cancelled = true;
    };
  }, [token]);

  const shopName =
    invite?.shop_name ?? route.params.shopName ?? 'this shop';
  const role = asInviteRole(invite?.role ?? route.params.role);
  const initials = shopInitials(shopName);
  const roleName = roleLabel(role);
  const capabilities = capabilitiesFor(role);

  async function acceptInvite() {
    setSubmitting(true);
    const { error } = await supabase.rpc('accept_shop_invite', {
      p_token: token,
    });
    if (error) {
      setSubmitting(false);
      Alert.alert("Couldn't join shop", error.message);
      return;
    }
    await refreshProfile();
    setSubmitting(false);
    Alert.alert("You're on the team", `Welcome to ${shopName}.`);
    navigation.reset({ index: 0, routes: [{ name: 'AppHome' }] });
  }

  async function onJoin() {
    if (!invite) return;

    if (session) {
      await acceptInvite();
      return;
    }

    if (password.trim().length < 6) {
      Alert.alert('Password needed', 'Use at least 6 characters.');
      return;
    }

    setSubmitting(true);
    const { error: signUpError } = await supabase.auth.signUp({
      email: invite.email,
      password: password.trim(),
    });
    if (signUpError) {
      setSubmitting(false);
      Alert.alert("Couldn't create account", signUpError.message);
      return;
    }
    setSubmitting(false);
    await acceptInvite();
  }

  if (loadingInvite) {
    return (
      <View
        className="flex-1 items-center justify-center bg-background"
        style={{ paddingTop: insets.top }}
      >
        <ActivityIndicator color={colors.primary} size="large" />
      </View>
    );
  }

  if (loadError || !invite) {
    return (
      <View
        className="flex-1 bg-background px-6"
        style={{ paddingTop: insets.top }}
      >
        <View className="mt-10 items-center">
          <AuthBrandHeader />
        </View>
        <Text className="mt-10 text-center text-[20px] font-bold text-text">
          Invite unavailable
        </Text>
        <Text className="mt-2 text-center text-[14px] text-text-muted">
          {loadError ?? 'This invite link is invalid or expired.'}
        </Text>
        <PrimaryButton
          className="mt-8"
          label="Back to welcome"
          onPress={() => navigation.navigate('Welcome')}
        />
      </View>
    );
  }

  return (
    <View className="flex-1 bg-background" style={{ paddingTop: insets.top }}>
      <KeyboardAvoidingView
        className="flex-1"
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <ScrollView
          className="flex-1"
          contentContainerStyle={{
            flexGrow: 1,
            paddingHorizontal: 24,
            paddingBottom: Math.max(insets.bottom, 24),
          }}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          <View className="mt-8 items-center">
            <AuthBrandHeader />
          </View>

          <View className="mt-8 rounded-[28px] bg-surface px-5 pb-6 pt-7">
            <View className="items-center">
              <View className="h-16 w-16 items-center justify-center rounded-full bg-primary-tint">
                <Text className="text-[20px] font-bold text-primary">
                  {initials}
                </Text>
              </View>

              <Text className="mt-5 text-center text-[15px] text-text-muted">
                You've been invited to join
              </Text>
              <Text className="mt-1 text-center text-[26px] font-bold tracking-tight text-text">
                {shopName}
              </Text>

              <View className="mt-4 flex-row items-center gap-1.5 rounded-full bg-accent-tint px-3 py-1.5">
                <Tag color={colors.accent} size={14} strokeWidth={2} />
                <Text className="text-[13px] font-semibold text-accent">
                  Joining as {roleName}
                </Text>
              </View>
            </View>

            <View className="mt-6 rounded-2xl bg-background px-4 py-4">
              <Text className="text-[14px] font-semibold text-text">
                {capabilities.heading}
              </Text>
              <View className="mt-3 gap-2.5">
                {capabilities.items.map(item => (
                  <View key={item.label} className="flex-row items-start gap-2.5">
                    <View className="mt-0.5">
                      {item.allowed ? (
                        <Check
                          color={colors.primary}
                          size={16}
                          strokeWidth={2.4}
                        />
                      ) : (
                        <X
                          color={colors.textSubtle}
                          size={16}
                          strokeWidth={2.4}
                        />
                      )}
                    </View>
                    <Text
                      className={
                        item.allowed
                          ? 'flex-1 text-[14px] leading-snug text-text'
                          : 'flex-1 text-[14px] leading-snug text-text-subtle'
                      }
                    >
                      {item.label}
                    </Text>
                  </View>
                ))}
              </View>
            </View>

            <Text className="mt-4 text-[13px] text-text-muted">
              Accept with{' '}
              <Text className="font-semibold text-text">{invite.email}</Text>
            </Text>

            {!session ? (
              <View className="mt-4">
                <PasswordField
                  label="Set a password"
                  placeholder="••••••••"
                  textContentType="newPassword"
                  value={password}
                  onChangeText={setPassword}
                />
              </View>
            ) : null}

            <PrimaryButton
              className="mt-5"
              label={`Join ${shopName}`}
              loading={submitting}
              onPress={() => void onJoin()}
            />

            {!session ? (
              <PrimaryButton
                className="mt-2.5"
                variant="secondary"
                label="I already have an account"
                onPress={() => navigation.navigate('Login')}
              />
            ) : null}
          </View>

          <View className="mt-auto pt-8">
            <Text className="text-center text-[14px] text-text-muted">
              Not you?{' '}
              <Text
                className="font-semibold text-primary"
                onPress={() => navigation.navigate('Welcome')}
              >
                Ignore this invite
              </Text>
            </Text>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </View>
  );
}
