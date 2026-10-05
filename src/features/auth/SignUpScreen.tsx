import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { ChevronLeft, CircleCheck, Info, Mail } from 'lucide-react-native';
import { useEffect, useMemo, useState } from 'react';
import {
  KeyboardAvoidingView,
  Platform,
  Pressable,
  Text,
  View,
} from 'react-native';
import { useAuth } from '../../auth/AuthContext';
import { AuthShell } from '../../components/ui/AuthShell';
import { BusinessTypePicker } from '../../components/ui/BusinessTypePicker';
import { OtpInput } from '../../components/ui/OtpInput';
import { PasswordField } from '../../components/ui/PasswordField';
import { PhoneField } from '../../components/ui/PhoneField';
import { PrimaryButton } from '../../components/ui/PrimaryButton';
import { StepDots, StepLabel } from '../../components/ui/StepDots';
import { TextField } from '../../components/ui/TextField';
import { businessTypeLabel, firstNameFrom } from '../../lib/businessTypes';
import { isValidAfricanPhone } from '../../lib/phone';
import { supabase } from '../../lib/supabase';
import type { RootStackParamList } from '../../navigation/types';
import { colors } from '../../theme/colors';
import type { BusinessType } from '../../types/domain';

type SignUpNav = NativeStackNavigationProp<RootStackParamList, 'SignUp'>;
type Step = 1 | 2 | 3;

type AccountDraft = {
  owner_name: string;
  email: string;
  phone_number: string;
  password: string;
};

export function SignUpScreen() {
  const navigation = useNavigation<SignUpNav>();
  const { session, user, profile, loading, profileLoading, refreshProfile } =
    useAuth();

  const [step, setStep] = useState<Step>(1);
  const [awaitingEmailOtp, setAwaitingEmailOtp] = useState(false);
  const [otp, setOtp] = useState('');
  const [otpSubmitting, setOtpSubmitting] = useState(false);
  const [resendCooldown, setResendCooldown] = useState(0);
  const [formError, setFormError] = useState<string | null>(null);
  const [accountDraft, setAccountDraft] = useState<AccountDraft | null>(null);
  const [authUserId, setAuthUserId] = useState<string | null>(null);
  const [finishing, setFinishing] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const [ownerName, setOwnerName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});

  const [shopName, setShopName] = useState('');
  const [businessType, setBusinessType] =
    useState<BusinessType>('phones_gadgets');
  const [completedShop, setCompletedShop] = useState<{
    shop_name: string;
    business_type: BusinessType;
  } | null>(null);

  useEffect(() => {
    if (resendCooldown <= 0) return;
    const id = setTimeout(() => setResendCooldown(s => s - 1), 1000);
    return () => clearTimeout(id);
  }, [resendCooldown]);

  useEffect(() => {
    if (loading || profileLoading || finishing || awaitingEmailOtp) return;

    if (profile && step !== 3) {
      navigation.replace('AppHome');
      return;
    }

    if (session && !profile && step === 1) {
      const meta = user?.user_metadata ?? {};
      if (typeof meta.owner_name === 'string' && meta.owner_name) {
        setOwnerName(meta.owner_name);
        setAccountDraft(prev => ({
          owner_name: meta.owner_name,
          email: user?.email ?? prev?.email ?? '',
          phone_number:
            typeof meta.phone_number === 'string'
              ? meta.phone_number
              : (prev?.phone_number ?? ''),
          password: prev?.password ?? '',
        }));
      }
      setAuthUserId(session.user.id);
      setStep(2);
    }
  }, [
    loading,
    profileLoading,
    profile,
    session,
    step,
    navigation,
    user,
    finishing,
    awaitingEmailOtp,
  ]);

  useEffect(() => {
    if (user?.id) setAuthUserId(user.id);
  }, [user?.id]);

  const displayName = useMemo(() => {
    const raw =
      accountDraft?.owner_name ||
      (typeof user?.user_metadata?.owner_name === 'string'
        ? user.user_metadata.owner_name
        : '') ||
      ownerName;
    return firstNameFrom(raw);
  }, [accountDraft, user, ownerName]);

  async function onAccountContinue() {
    const nextErrors: Record<string, string> = {};
    if (ownerName.trim().length < 2) {
      nextErrors.owner_name = 'Enter your full name';
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) {
      nextErrors.email = 'Enter a valid email';
    }
    if (!isValidAfricanPhone(phone)) {
      nextErrors.phone = 'Enter a valid phone number for your country';
    }
    if (password.length < 6) {
      nextErrors.password = 'Password must be at least 6 characters';
    }
    if (password !== confirmPassword) {
      nextErrors.confirm_password = 'Passwords do not match';
    }

    setFieldErrors(nextErrors);
    setFormError(null);
    if (Object.keys(nextErrors).length > 0) return;

    setSubmitting(true);
    const values: AccountDraft = {
      owner_name: ownerName.trim(),
      email: email.trim().toLowerCase(),
      phone_number: phone,
      password,
    };

    const { data, error } = await supabase.auth.signUp({
      email: values.email,
      password: values.password,
      options: {
        data: {
          owner_name: values.owner_name,
          phone_number: values.phone_number,
        },
      },
    });
    setSubmitting(false);

    if (error) {
      setFormError(error.message);
      return;
    }

    setAccountDraft(values);

    if (!data.session) {
      setAwaitingEmailOtp(true);
      setOtp('');
      setResendCooldown(60);
      return;
    }

    if (data.user) setAuthUserId(data.user.id);
    setStep(2);
  }

  async function onVerifyOtp() {
    if (!accountDraft) return;
    if (otp.length !== 6) {
      setFormError('Enter the 6-digit code from your email');
      return;
    }

    setFormError(null);
    setOtpSubmitting(true);
    const { data, error } = await supabase.auth.verifyOtp({
      email: accountDraft.email,
      token: otp,
      type: 'signup',
    });
    setOtpSubmitting(false);

    if (error) {
      setFormError(error.message);
      return;
    }

    if (data.user) setAuthUserId(data.user.id);
    setAwaitingEmailOtp(false);
    setStep(2);
    // Session from verifyOtp keeps the user signed in; RootNavigator
    // switches to the onboarding-only SignUp stack automatically.
  }

  async function onResendCode() {
    if (!accountDraft || resendCooldown > 0) return;
    setFormError(null);
    const { error } = await supabase.auth.resend({
      type: 'signup',
      email: accountDraft.email,
    });
    if (error) {
      setFormError(error.message);
      return;
    }
    setResendCooldown(60);
  }

  async function onShopContinue() {
    const userId = authUserId ?? user?.id;
    if (!userId) {
      setFormError('Your session expired. Please create your account again.');
      setAwaitingEmailOtp(false);
      setStep(1);
      return;
    }

    if (shopName.trim().length < 2) {
      setFieldErrors({ shop_name: 'Enter your shop name' });
      return;
    }

    setFieldErrors({});
    setFormError(null);
    setFinishing(true);
    setSubmitting(true);

    const owner =
      accountDraft?.owner_name ||
      (typeof user?.user_metadata?.owner_name === 'string'
        ? user.user_metadata.owner_name
        : null);
    const phoneNumber =
      accountDraft?.phone_number ||
      (typeof user?.user_metadata?.phone_number === 'string'
        ? user.user_metadata.phone_number
        : null);

    const { error } = await supabase.from('profiles').insert({
      id: userId,
      shop_name: shopName.trim(),
      owner_name: owner,
      phone_number: phoneNumber,
      business_type: businessType,
    });

    setSubmitting(false);

    if (error) {
      setFinishing(false);
      setFormError(error.message);
      return;
    }

    setCompletedShop({
      shop_name: shopName.trim(),
      business_type: businessType,
    });
    setStep(3);
    await refreshProfile();
    // Once profile exists, RootNavigator moves them to AppHome — already signed in.
  }

  if (loading || (session && profileLoading && step !== 3 && !awaitingEmailOtp)) {
    return (
      <View className="flex-1 items-center justify-center bg-background">
        <Text className="text-text-muted">Loading…</Text>
      </View>
    );
  }

  if (awaitingEmailOtp && accountDraft) {
    return (
      <KeyboardAvoidingView
        className="flex-1"
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <AuthShell>
          <View className="items-center">
            <View className="h-14 w-14 items-center justify-center rounded-2xl bg-primary-tint">
              <Mail color={colors.primary} size={26} strokeWidth={1.8} />
            </View>
            <Text className="mt-5 text-center text-[26px] font-bold tracking-tight text-text">
              Check your email
            </Text>
            <Text className="mt-2 text-center text-[14px] leading-relaxed text-text-muted">
              We sent a 6-digit code to{' '}
              <Text className="font-semibold text-text">{accountDraft.email}</Text>
              . Enter it below to continue.
            </Text>
          </View>

          <View className="mt-7">
            <OtpInput
              value={otp}
              onChange={next => {
                setOtp(next);
                if (formError) setFormError(null);
              }}
              disabled={otpSubmitting}
              error={formError ?? undefined}
            />
          </View>

          <PrimaryButton
            className="mt-5"
            label="Verify email"
            loading={otpSubmitting}
            disabled={otp.length !== 6}
            onPress={() => void onVerifyOtp()}
          />

          <Text className="mt-5 text-center text-[14px] text-text-muted">
            Didn't get it?{' '}
            <Text
              className={
                resendCooldown > 0
                  ? 'font-semibold text-text-subtle'
                  : 'font-semibold text-primary'
              }
              onPress={() => {
                if (resendCooldown <= 0) void onResendCode();
              }}
            >
              {resendCooldown > 0 ? `Resend in ${resendCooldown}s` : 'Resend code'}
            </Text>
          </Text>

          <Pressable
            className="mt-3 items-center py-2 active:opacity-70"
            onPress={() => {
              setAwaitingEmailOtp(false);
              setOtp('');
              setFormError(null);
              setStep(1);
            }}
          >
            <Text className="text-[14px] text-text-subtle">
              Use a different email
            </Text>
          </Pressable>

          <StepDots current={1} />
        </AuthShell>
      </KeyboardAvoidingView>
    );
  }

  if (step === 2) {
    return (
      <KeyboardAvoidingView
        className="flex-1"
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <AuthShell showBrand={false}>
          <StepLabel current={2} />
          <Text className="mt-2 text-[26px] font-bold tracking-tight text-text">
            Tell us about your shop
          </Text>
          <Text className="mt-1.5 text-[14px] text-text-muted">
            This helps us set things up the way you'd expect.
          </Text>

          <View className="mt-6 gap-5">
            <TextField
              label="Shop name"
              placeholder="e.g. Tunde's Gadgets"
              value={shopName}
              onChangeText={setShopName}
              error={fieldErrors.shop_name}
            />
            <View>
              <Text className="mb-2.5 text-[13px] font-medium text-text-muted">
                What do you sell?
              </Text>
              <BusinessTypePicker
                value={businessType}
                onChange={setBusinessType}
              />
              <Text className="mt-3 text-[12px] text-text-subtle">
                You can change this anytime in Preferences.
              </Text>
            </View>
          </View>

          {formError ? (
            <Text className="mt-3 text-[13px] text-danger">{formError}</Text>
          ) : null}

          <PrimaryButton
            className="mt-6"
            label="Continue"
            loading={submitting}
            onPress={() => void onShopContinue()}
          />
          <StepDots current={2} />
        </AuthShell>
      </KeyboardAvoidingView>
    );
  }

  if (step === 3 && completedShop) {
    return (
      <AuthShell>
        <View className="items-center">
          <View className="h-16 w-16 items-center justify-center rounded-full bg-primary-tint">
            <CircleCheck color={colors.primary} size={32} strokeWidth={1.8} />
          </View>
          <Text className="mt-5 text-center text-[26px] font-bold tracking-tight text-text">
            You're all set, {displayName}
          </Text>
          <Text className="mt-3 text-center text-[14px] leading-relaxed text-text-muted">
            We've set up{' '}
            <Text className="font-semibold text-text">
              {completedShop.shop_name}
            </Text>{' '}
            and customized it for{' '}
            {businessTypeLabel(completedShop.business_type)}.
          </Text>
        </View>

        <View className="mt-6 flex-row gap-3 rounded-2xl bg-accent-tint px-4 py-3.5">
          <Info color={colors.accent} size={20} strokeWidth={1.8} />
          <Text className="flex-1 text-[13px] leading-relaxed text-accent">
            Selling something else too? Add your own product fields anytime in
            Preferences.
          </Text>
        </View>

        <PrimaryButton
          className="mt-7"
          variant="accent"
          label="Go to my dashboard"
          onPress={() => navigation.replace('AppHome')}
        />
        <StepDots current={3} />
      </AuthShell>
    );
  }

  return (
    <KeyboardAvoidingView
      className="flex-1"
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <AuthShell
        showBrand={false}
        footer={
          <Text className="text-center text-[14px] text-text-muted">
            Already have an account?{' '}
            <Text
              className="font-semibold text-primary"
              onPress={() => navigation.navigate('Login')}
            >
              Log in
            </Text>
          </Text>
        }
      >
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Back to welcome"
          className="mb-4 flex-row items-center gap-1 self-start active:opacity-70"
          onPress={() => navigation.navigate('Welcome')}
          hitSlop={8}
        >
          <ChevronLeft color={colors.textMuted} size={22} strokeWidth={2} />
          <Text className="text-[15px] text-text-muted">Back to welcome</Text>
        </Pressable>

        <Text className="text-[28px] font-bold tracking-tight text-text">
          Create your account
        </Text>
        <Text className="mt-2 text-[15px] text-text-muted">
          Free to start · No card needed
        </Text>

        <View className="mt-7 gap-4">
          <TextField
            label="Full name"
            placeholder="e.g. Tunde Adeyemi"
            autoCapitalize="words"
            textContentType="name"
            value={ownerName}
            onChangeText={setOwnerName}
            error={fieldErrors.owner_name}
          />
          <TextField
            label="Email"
            placeholder="you@email.com"
            autoCapitalize="none"
            autoCorrect={false}
            keyboardType="email-address"
            textContentType="emailAddress"
            value={email}
            onChangeText={setEmail}
            error={fieldErrors.email}
          />
          <PhoneField
            value={phone}
            onChange={setPhone}
            error={fieldErrors.phone}
          />
          <PasswordField
            label="Password"
            placeholder="••••••••"
            textContentType="newPassword"
            value={password}
            onChangeText={setPassword}
            error={fieldErrors.password}
          />
          <PasswordField
            label="Confirm password"
            placeholder="••••••••"
            textContentType="newPassword"
            value={confirmPassword}
            onChangeText={setConfirmPassword}
            error={fieldErrors.confirm_password}
          />
        </View>

        {formError ? (
          <Text className="mt-3 text-[13px] text-danger">{formError}</Text>
        ) : null}

        <PrimaryButton
          className="mt-6"
          label="Continue"
          loading={submitting}
          onPress={() => void onAccountContinue()}
        />

        <Text className="mt-4 text-center text-[12px] leading-relaxed text-text-subtle">
          By continuing, you agree to StockBook's Terms and Privacy Policy.
        </Text>

        <StepDots current={1} />
      </AuthShell>
    </KeyboardAvoidingView>
  );
}
