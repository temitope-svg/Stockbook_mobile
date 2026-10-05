import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useState } from 'react';
import {
  KeyboardAvoidingView,
  Platform,
  Pressable,
  Text,
  View,
} from 'react-native';
import { useAuth } from '../../auth/AuthContext';
import { AuthShell } from '../../components/ui/AuthShell';
import { PasswordField } from '../../components/ui/PasswordField';
import { PrimaryButton } from '../../components/ui/PrimaryButton';
import { TextField } from '../../components/ui/TextField';
import { supabase } from '../../lib/supabase';
import type { RootStackParamList } from '../../navigation/types';
import { InviteCallout } from './components/InviteCallout';

type LoginNav = NativeStackNavigationProp<RootStackParamList, 'Login'>;

function looksLikeEmail(value: string) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value.trim());
}

export function LoginScreen() {
  const navigation = useNavigation<LoginNav>();
  const { session, loading, profileLoading } = useAuth();
  const [identifier, setIdentifier] = useState('');
  const [password, setPassword] = useState('');
  const [errors, setErrors] = useState<{
    identifier?: string;
    password?: string;
    form?: string;
  }>({});
  const [submitting, setSubmitting] = useState(false);

  async function onSubmit() {
    const nextErrors: typeof errors = {};
    const trimmed = identifier.trim();

    if (!trimmed) {
      nextErrors.identifier = 'Enter your email';
    } else if (!looksLikeEmail(trimmed)) {
      nextErrors.identifier = 'Log in with the email on your account';
    }
    if (!password) {
      nextErrors.password = 'Enter your password';
    }

    setErrors(nextErrors);
    if (Object.keys(nextErrors).length > 0) return;

    setSubmitting(true);
    setErrors({});
    const { error } = await supabase.auth.signInWithPassword({
      email: trimmed.toLowerCase(),
      password,
    });
    setSubmitting(false);

    if (error) {
      setErrors({ form: error.message });
    }
  }

  if (loading || (session && profileLoading)) {
    return (
      <View className="flex-1 items-center justify-center bg-background">
        <Text className="text-text-muted">Loading…</Text>
      </View>
    );
  }

  return (
    <KeyboardAvoidingView
      className="flex-1"
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <AuthShell
        footer={
          <Text className="text-center text-[14px] text-text-muted">
            Don't have a shop yet?{' '}
            <Text
              className="font-semibold text-primary"
              onPress={() => navigation.navigate('SignUp')}
            >
              Create one
            </Text>
          </Text>
        }
      >
        <Text className="text-center text-[28px] font-bold tracking-tight text-text">
          Welcome back
        </Text>
        <Text className="mt-2 text-center text-[15px] text-text-muted">
          Log in to your shop
        </Text>

        <View className="mt-7 gap-4">
          <TextField
            label="Email"
            placeholder="you@email.com"
            autoCapitalize="none"
            autoCorrect={false}
            keyboardType="email-address"
            textContentType="emailAddress"
            autoComplete="email"
            value={identifier}
            onChangeText={setIdentifier}
            error={errors.identifier}
          />
          <View>
            <PasswordField
              label="Password"
              placeholder="••••••••"
              textContentType="password"
              value={password}
              onChangeText={setPassword}
              error={errors.password}
            />
            <Pressable
              accessibilityRole="link"
              className="mt-2.5 self-end active:opacity-70"
              onPress={() => navigation.navigate('ForgotPassword')}
            >
              <Text className="text-[14px] font-semibold text-primary">
                Forgot password?
              </Text>
            </Pressable>
          </View>
        </View>

        {errors.form ? (
          <Text className="mt-3 text-[13px] text-danger">{errors.form}</Text>
        ) : null}

        <PrimaryButton
          className="mt-6"
          label="Log in"
          loading={submitting}
          onPress={() => void onSubmit()}
        />

        <View className="mt-7 flex-row items-center gap-3">
          <View className="h-px flex-1 bg-text/10" />
          <Text className="text-[13px] text-text-subtle">or</Text>
          <View className="h-px flex-1 bg-text/10" />
        </View>

        <View className="mt-6">
          <InviteCallout />
        </View>
      </AuthShell>
    </KeyboardAvoidingView>
  );
}
