import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { MailCheck } from 'lucide-react-native';
import { useState } from 'react';
import {
  KeyboardAvoidingView,
  Platform,
  Text,
  View,
} from 'react-native';
import { AuthShell } from '../../components/ui/AuthShell';
import { PrimaryButton } from '../../components/ui/PrimaryButton';
import { TextField } from '../../components/ui/TextField';
import { supabase } from '../../lib/supabase';
import type { RootStackParamList } from '../../navigation/types';
import { colors } from '../../theme/colors';

type ForgotNav = NativeStackNavigationProp<RootStackParamList, 'ForgotPassword'>;

export function ForgotPasswordScreen() {
  const navigation = useNavigation<ForgotNav>();
  const [email, setEmail] = useState('');
  const [error, setError] = useState<string | undefined>();
  const [formError, setFormError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [sentTo, setSentTo] = useState<string | null>(null);

  async function onSubmit() {
    const trimmed = email.trim().toLowerCase();
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(trimmed)) {
      setError('Enter a valid email');
      return;
    }

    setError(undefined);
    setFormError(null);
    setSubmitting(true);

    const { error: resetError } = await supabase.auth.resetPasswordForEmail(
      trimmed,
    );
    setSubmitting(false);

    if (resetError) {
      setFormError(resetError.message);
      return;
    }

    setSentTo(trimmed);
  }

  return (
    <KeyboardAvoidingView
      className="flex-1"
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <AuthShell
        footer={
          <Text className="text-center text-[14px] text-text-muted">
            Remembered it?{' '}
            <Text
              className="font-semibold text-primary"
              onPress={() => navigation.navigate('Login')}
            >
              Back to log in
            </Text>
          </Text>
        }
      >
        {sentTo ? (
          <View className="items-center">
            <View className="h-12 w-12 items-center justify-center rounded-full bg-primary-tint">
              <MailCheck color={colors.primary} size={22} strokeWidth={1.8} />
            </View>
            <Text className="mt-4 text-center text-[26px] font-bold tracking-tight text-text">
              Check your inbox
            </Text>
            <Text className="mt-2 text-center text-[14px] leading-relaxed text-text-muted">
              If an account exists for{' '}
              <Text className="font-semibold text-text">{sentTo}</Text>, we sent
              a reset link. Open it to choose a new password.
            </Text>
            <PrimaryButton
              className="mt-6 w-full"
              variant="secondary"
              label="Use a different email"
              onPress={() => setSentTo(null)}
            />
          </View>
        ) : (
          <>
            <Text className="text-[26px] font-bold tracking-tight text-text">
              Reset password
            </Text>
            <Text className="mt-2 text-[14px] text-text-muted">
              Enter the email you use for StockBook. We'll send a reset link.
            </Text>

            <View className="mt-7">
              <TextField
                label="Email"
                placeholder="you@email.com"
                autoCapitalize="none"
                keyboardType="email-address"
                textContentType="emailAddress"
                value={email}
                onChangeText={setEmail}
                error={error}
              />
            </View>

            {formError ? (
              <Text className="mt-3 text-[13px] text-danger">{formError}</Text>
            ) : null}

            <PrimaryButton
              className="mt-6"
              label="Send reset link"
              loading={submitting}
              onPress={() => void onSubmit()}
            />
          </>
        )}
      </AuthShell>
    </KeyboardAvoidingView>
  );
}
