import {
  ArrowLeft,
  Camera,
  ChevronRight,
  Download,
  Plus,
  Trash2,
  WifiOff,
} from 'lucide-react-native';
import { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Image,
  Modal,
  Pressable,
  ScrollView,
  Switch,
  Text,
  TextInput,
  View,
} from 'react-native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import {
  launchCamera,
  launchImageLibrary,
  type Asset,
  type ImagePickerResponse,
} from 'react-native-image-picker';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { permissionsFor } from '../../auth/permissions';
import { useAuth } from '../../auth/AuthContext';
import { BusinessTypePicker } from '../../components/ui/BusinessTypePicker';
import { PasswordField } from '../../components/ui/PasswordField';
import { PhoneField } from '../../components/ui/PhoneField';
import { businessTypeShortLabel } from '../../lib/businessTypes';
import { formatLocalDisplay, parsePhone } from '../../lib/phone';
import { supabase } from '../../lib/supabase';
import { uploadAvatar } from '../../lib/uploadAvatar';
import { colors } from '../../theme/colors';
import type { BusinessType, CustomProductField } from '../../types/domain';
import {
  defaultNicheFieldsFor,
  NICHE_FIELD_KEYS,
  NICHE_FIELD_META,
  nicheFieldsMatchDefaults,
  nicheFieldsToOverrides,
  resolveNicheFields,
  type NicheFieldVisibility,
} from '../../utils/businessTypeFields';
import {
  createCustomProductField,
  normalizeCustomProductFields,
} from '../../utils/customProductFields';
import { initials } from '../../utils/initials';
import {
  emptyCategorySettings,
  normalizeCategorySettings,
  resolveCategories,
} from '../../utils/productCategories';
import { goBackInStack } from '../../navigation/pushInTab';
import { useOffline } from '../../offline/OfflineContext';
import { alertNeedsConnection } from '../../offline/requireOnline';
import { promptShopCsvExport } from './exportShopCsv';
import type { MoreStackParamList } from './MoreStack';
import { TAB_BAR_STYLE } from '../app/tabBarTheme';

type Props = NativeStackScreenProps<MoreStackParamList, 'Settings'>;

const STOCK_OPTIONS = [3, 5, 10, 15, 20];
const DEBT_OPTIONS = [
  { value: 3, label: '3 days' },
  { value: 7, label: '7 days' },
  { value: 14, label: '14 days' },
  { value: 30, label: '30 days' },
];

const AVATAR_PICKER_OPTIONS = {
  mediaType: 'photo' as const,
  includeBase64: true,
  maxWidth: 800,
  maxHeight: 800,
  quality: 0.85 as const,
};

export function SettingsScreen({ navigation }: Props) {
  const insets = useSafeAreaInsets();
  const { profile, shopId, role, refreshProfile } = useAuth();
  const permissions = permissionsFor(role);
  const { isOnline } = useOffline();

  const [shopName, setShopName] = useState(profile?.shop_name ?? '');
  const [ownerName, setOwnerName] = useState(profile?.owner_name ?? '');
  const [phone, setPhone] = useState(profile?.phone_number ?? '');
  const [avatarUrl, setAvatarUrl] = useState(profile?.avatar_url ?? null);
  const [businessType, setBusinessType] = useState<BusinessType>(
    profile?.business_type ?? 'general',
  );
  const [fields, setFields] = useState<NicheFieldVisibility>(
    resolveNicheFields(
      profile?.business_type ?? 'general',
      profile?.field_overrides,
    ),
  );
  const [customFields, setCustomFields] = useState<CustomProductField[]>(
    normalizeCustomProductFields(profile?.custom_product_fields),
  );
  const [threshold, setThreshold] = useState(profile?.low_stock_threshold ?? 5);
  const [reminderDays, setReminderDays] = useState(
    profile?.debt_reminder_days ?? 7,
  );
  const [saving, setSaving] = useState(false);
  const [uploadingAvatar, setUploadingAvatar] = useState(false);
  const [shopNameOpen, setShopNameOpen] = useState(false);
  const [ownerNameOpen, setOwnerNameOpen] = useState(false);
  const [phoneOpen, setPhoneOpen] = useState(false);
  const [passwordOpen, setPasswordOpen] = useState(false);
  const [businessOpen, setBusinessOpen] = useState(false);
  const [stockOpen, setStockOpen] = useState(false);
  const [debtOpen, setDebtOpen] = useState(false);
  const [draftShopName, setDraftShopName] = useState('');
  const [draftOwnerName, setDraftOwnerName] = useState('');
  const [draftPhone, setDraftPhone] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [savingPassword, setSavingPassword] = useState(false);
  const [addFieldOpen, setAddFieldOpen] = useState(false);
  const [newFieldLabel, setNewFieldLabel] = useState('');

  useEffect(() => {
    const parent = navigation.getParent();
    parent?.setOptions({ tabBarStyle: { display: 'none' } });
    return () => {
      parent?.setOptions({ tabBarStyle: TAB_BAR_STYLE });
    };
  }, [navigation]);

  useEffect(() => {
    if (!profile) return;
    setShopName(profile.shop_name);
    setOwnerName(profile.owner_name ?? '');
    setPhone(profile.phone_number ?? '');
    setAvatarUrl(profile.avatar_url ?? null);
    setBusinessType(profile.business_type);
    setFields(resolveNicheFields(profile.business_type, profile.field_overrides));
    setCustomFields(normalizeCustomProductFields(profile.custom_product_fields));
    setThreshold(profile.low_stock_threshold ?? 5);
    setReminderDays(profile.debt_reminder_days ?? 7);
  }, [profile]);

  async function patchProfile(
    update: Record<string, unknown>,
    okMessage?: string,
  ) {
    if (!shopId) return false;
    if (!isOnline) {
      alertNeedsConnection('Saving settings');
      return false;
    }
    setSaving(true);
    const { error } = await supabase
      .from('profiles')
      .update(update)
      .eq('id', shopId);
    setSaving(false);
    if (error) {
      Alert.alert(
        "Couldn't save",
        error.message.includes('field_overrides') ||
          error.message.includes('debt_reminder_days') ||
          error.message.includes('custom_product_fields') ||
          error.message.includes('category_settings')
          ? 'Run the latest SQL migration in Supabase, then try again.'
          : error.message,
      );
      return false;
    }
    await refreshProfile();
    if (okMessage) Alert.alert('Saved', okMessage);
    return true;
  }

  async function onSaveShopName() {
    const trimmed = draftShopName.trim();
    if (!trimmed) {
      Alert.alert('Shop name required', 'Enter your shop name.');
      return;
    }
    const previous = shopName;
    setShopName(trimmed);
    setShopNameOpen(false);
    const ok = await patchProfile({ shop_name: trimmed });
    if (!ok) setShopName(previous);
  }

  async function onSaveOwnerName() {
    const trimmed = draftOwnerName.trim();
    if (!trimmed) {
      Alert.alert('Your name required', 'Enter your full name.');
      return;
    }
    const previous = ownerName;
    setOwnerName(trimmed);
    setOwnerNameOpen(false);
    const ok = await patchProfile({ owner_name: trimmed });
    if (!ok) {
      setOwnerName(previous);
      return;
    }
    void supabase.auth.updateUser({
      data: { owner_name: trimmed, full_name: trimmed },
    });
  }

  async function onSavePhone() {
    const previous = phone;
    const next = draftPhone.trim();
    setPhone(next);
    setPhoneOpen(false);
    const ok = await patchProfile({ phone_number: next || null });
    if (!ok) setPhone(previous);
  }

  async function applyAvatarAsset(asset: Asset | undefined) {
    if (!shopId || !asset?.base64) {
      Alert.alert('Photo failed', 'Could not read that image. Try another one.');
      return;
    }
    setUploadingAvatar(true);
    const uploaded = await uploadAvatar(shopId, {
      base64: asset.base64,
      contentType: asset.type || 'image/jpeg',
      fileName: asset.fileName,
    });
    if (!uploaded) {
      setUploadingAvatar(false);
      Alert.alert(
        'Image upload failed',
        'Create the avatars storage bucket (run stockbook-avatar-migration.sql), then try again.',
      );
      return;
    }
    const previous = avatarUrl;
    setAvatarUrl(uploaded);
    const ok = await patchProfile({ avatar_url: uploaded });
    setUploadingAvatar(false);
    if (!ok) setAvatarUrl(previous);
  }

  function handleAvatarPickerResult(result: ImagePickerResponse) {
    if (result.didCancel) return;
    if (result.errorCode) {
      Alert.alert(
        'Photo unavailable',
        result.errorMessage ??
          'Check camera or photo permissions and try again.',
      );
      return;
    }
    void applyAvatarAsset(result.assets?.[0]);
  }

  function onChangePhoto() {
    Alert.alert('Profile photo', 'Choose a source', [
      {
        text: 'Camera',
        onPress: () => {
          void launchCamera(AVATAR_PICKER_OPTIONS).then(handleAvatarPickerResult);
        },
      },
      {
        text: 'Photo library',
        onPress: () => {
          void launchImageLibrary(AVATAR_PICKER_OPTIONS).then(
            handleAvatarPickerResult,
          );
        },
      },
      ...(avatarUrl
        ? [
            {
              text: 'Remove photo',
              style: 'destructive' as const,
              onPress: () => {
                void (async () => {
                  const previous = avatarUrl;
                  setAvatarUrl(null);
                  const ok = await patchProfile({ avatar_url: null });
                  if (!ok) setAvatarUrl(previous);
                })();
              },
            },
          ]
        : []),
      { text: 'Cancel', style: 'cancel' },
    ]);
  }

  async function onSavePassword() {
    if (newPassword.length < 6) {
      Alert.alert('Password too short', 'Use at least 6 characters.');
      return;
    }
    if (newPassword !== confirmPassword) {
      Alert.alert(
        "Passwords don't match",
        'Confirm the same password in both fields.',
      );
      return;
    }
    setSavingPassword(true);
    const { error } = await supabase.auth.updateUser({ password: newPassword });
    setSavingPassword(false);
    if (error) {
      Alert.alert("Couldn't update password", error.message);
      return;
    }
    setNewPassword('');
    setConfirmPassword('');
    setPasswordOpen(false);
    Alert.alert(
      'Password updated',
      'Your new password is ready for the next login.',
    );
  }

  async function onBusinessTypeChange(next: BusinessType) {
    const previousType = businessType;
    const previousFields = fields;
    const previousCategories = normalizeCategorySettings(
      profile?.category_settings,
    );
    const nextFields = defaultNicheFieldsFor(next);
    const nextCategories = {
      disabled_base: [] as string[],
      custom: previousCategories.custom,
    };
    setBusinessType(next);
    setFields(nextFields);
    setBusinessOpen(false);
    const ok = await patchProfile(
      {
        business_type: next,
        field_overrides: null,
        category_settings: nextCategories,
      },
      'Business type updated — fields and categories reset to defaults.',
    );
    if (!ok) {
      setBusinessType(previousType);
      setFields(previousFields);
    }
  }

  const enabledCategoryCount = resolveCategories(
    businessType,
    normalizeCategorySettings(profile?.category_settings ?? emptyCategorySettings()),
  ).length;

  async function onFieldToggle(
    key: keyof NicheFieldVisibility,
    checked: boolean,
  ) {
    const previous = fields;
    const next = { ...fields, [key]: checked };
    setFields(next);
    const overrides = nicheFieldsMatchDefaults(businessType, next)
      ? null
      : nicheFieldsToOverrides(next);
    const ok = await patchProfile({ field_overrides: overrides });
    if (!ok) setFields(previous);
  }

  function onRemoveNicheField(key: keyof NicheFieldVisibility) {
    const meta = NICHE_FIELD_META[key];
    Alert.alert(
      'Remove field?',
      `Hide “${meta.title}” from product forms? You can add it again anytime.`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Remove',
          style: 'destructive',
          onPress: () => void onFieldToggle(key, false),
        },
      ],
    );
  }

  function onAddFieldPress() {
    const availableBuiltIns = NICHE_FIELD_KEYS.filter(key => !fields[key]);
    const buttons: {
      text: string;
      style?: 'cancel' | 'destructive' | 'default';
      onPress?: () => void;
    }[] = availableBuiltIns.map(key => ({
      text: NICHE_FIELD_META[key].title,
      onPress: () => void onFieldToggle(key, true),
    }));
    buttons.push({
      text: 'Custom field…',
      onPress: () => setAddFieldOpen(true),
    });
    buttons.push({ text: 'Cancel', style: 'cancel' });
    Alert.alert('Add field', 'Choose a built-in field or make your own.', buttons);
  }

  async function onCustomFieldToggle(id: string, enabled: boolean) {
    const previous = customFields;
    const next = customFields.map(f => (f.id === id ? { ...f, enabled } : f));
    setCustomFields(next);
    const ok = await patchProfile({ custom_product_fields: next });
    if (!ok) setCustomFields(previous);
  }

  function onDeleteCustomField(field: CustomProductField) {
    Alert.alert(
      'Delete field?',
      `Remove “${field.label}” from product forms? Values already saved on products stay in the database but won’t show.`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: () => {
            void (async () => {
              const previous = customFields;
              const next = customFields.filter(f => f.id !== field.id);
              setCustomFields(next);
              const ok = await patchProfile({ custom_product_fields: next });
              if (!ok) setCustomFields(previous);
            })();
          },
        },
      ],
    );
  }

  async function onAddCustomField() {
    const label = newFieldLabel.trim();
    if (!label) {
      Alert.alert('Field name required', 'Type a name for your new field.');
      return;
    }
    if (
      customFields.some(f => f.label.toLowerCase() === label.toLowerCase())
    ) {
      Alert.alert('Already added', 'You already have a field with that name.');
      return;
    }
    const previous = customFields;
    const next = [...customFields, createCustomProductField(label)];
    setCustomFields(next);
    const ok = await patchProfile(
      { custom_product_fields: next },
      'Field added.',
    );
    if (!ok) {
      setCustomFields(previous);
      return;
    }
    setNewFieldLabel('');
    setAddFieldOpen(false);
  }

  async function onThresholdChange(value: number) {
    const previous = threshold;
    setThreshold(value);
    setStockOpen(false);
    const ok = await patchProfile({ low_stock_threshold: value });
    if (!ok) setThreshold(previous);
  }

  async function onReminderChange(value: number) {
    const previous = reminderDays;
    setReminderDays(value);
    setDebtOpen(false);
    const ok = await patchProfile({ debt_reminder_days: value });
    if (!ok) setReminderDays(previous);
  }

  return (
    <View className="flex-1 bg-background" style={{ paddingTop: insets.top }}>
      <View className="flex-row items-center gap-3 px-4 py-2">
        <Pressable
          className="h-11 w-11 items-center justify-center rounded-full bg-surface active:opacity-80"
          onPress={() => goBackInStack(navigation, 'MoreHome')}
        >
          <ArrowLeft color={colors.text} size={20} strokeWidth={1.8} />
        </Pressable>
        <Text className="text-[20px] font-bold text-text">Settings</Text>
        {saving ? <ActivityIndicator color={colors.primary} /> : null}
      </View>

      <ScrollView
        keyboardShouldPersistTaps="handled"
        contentContainerStyle={{
          paddingHorizontal: 20,
          paddingTop: 8,
          paddingBottom: 28 + Math.max(insets.bottom, 8),
        }}
      >
        <SectionLabel>Profile</SectionLabel>
        <View className="overflow-hidden rounded-[20px] bg-surface">
          <Pressable
            onPress={onChangePhoto}
            disabled={uploadingAvatar}
            className="flex-row items-center gap-3 border-b border-text/5 px-4 py-3.5 active:bg-background"
          >
            <View className="relative">
              {avatarUrl ? (
                <Image
                  source={{ uri: avatarUrl }}
                  className="h-14 w-14 rounded-full bg-primary-tint"
                />
              ) : (
                <View className="h-14 w-14 items-center justify-center rounded-full bg-primary-tint">
                  <Text className="text-[16px] font-bold text-primary">
                    {initials(ownerName || shopName || 'Shop')}
                  </Text>
                </View>
              )}
              <View className="absolute -bottom-0.5 -right-0.5 h-6 w-6 items-center justify-center rounded-full bg-primary">
                {uploadingAvatar ? (
                  <ActivityIndicator color="#fff" size="small" />
                ) : (
                  <Camera color="#fff" size={12} strokeWidth={2} />
                )}
              </View>
            </View>
            <View className="min-w-0 flex-1">
              <Text className="text-[15px] font-medium text-text">
                Profile photo
              </Text>
              <Text className="mt-0.5 text-[13px] text-text-muted">
                Tap to change
              </Text>
            </View>
            <ChevronRight color={colors.textSubtle} size={18} strokeWidth={1.8} />
          </Pressable>
          <SettingsNavRow
            label="Your name"
            value={ownerName.trim() || 'Add name'}
            onPress={() => {
              setDraftOwnerName(ownerName);
              setOwnerNameOpen(true);
            }}
          />
          <SettingsNavRow
            label="Phone"
            value={
              phone.trim()
                ? (() => {
                    const { country, local } = parsePhone(phone);
                    return `+${country.dial} ${formatLocalDisplay(local)}`;
                  })()
                : 'Add phone'
            }
            showDivider={false}
            onPress={() => {
              setDraftPhone(phone);
              setPhoneOpen(true);
            }}
          />
        </View>

        <SectionLabel className="mt-6">Shop</SectionLabel>
        <View className="overflow-hidden rounded-[20px] bg-surface">
          <SettingsNavRow
            label="Shop name"
            value={shopName}
            onPress={() => {
              setDraftShopName(shopName);
              setShopNameOpen(true);
            }}
          />
          <SettingsNavRow
            label="Business type"
            value={businessTypeShortLabel(businessType)}
            showDivider={false}
            onPress={() => setBusinessOpen(true)}
          />
        </View>

        <SectionLabel className="mt-6">Product categories</SectionLabel>
        <View className="overflow-hidden rounded-[20px] bg-surface">
          <SettingsNavRow
            label="Manage categories"
            value={`${enabledCategoryCount} on`}
            showDivider={false}
            onPress={() => navigation.navigate('CategorySettings')}
          />
        </View>
        <Text className="mt-2 px-1 text-[12px] leading-5 text-text-muted">
          Choose which categories show on Products and when adding items.
        </Text>

        <SectionLabel className="mt-6">Product fields</SectionLabel>
        <View className="overflow-hidden rounded-[20px] bg-surface">
          {NICHE_FIELD_KEYS.filter(key => fields[key]).map(key => {
            const meta = NICHE_FIELD_META[key];
            return (
              <View
                key={key}
                className="flex-row items-center justify-between gap-3 border-b border-text/5 px-4 py-3.5"
              >
                <View className="min-w-0 flex-1 pr-1">
                  <Text className="text-[15px] font-medium text-text">
                    {meta.title}
                  </Text>
                  {meta.description ? (
                    <Text className="mt-0.5 text-[12px] text-text-subtle">
                      {meta.description}
                    </Text>
                  ) : (
                    <Text className="mt-0.5 text-[12px] text-text-subtle">
                      Built-in field · shown when adding a product
                    </Text>
                  )}
                </View>
                <Pressable
                  accessibilityRole="button"
                  accessibilityLabel={`Remove ${meta.title}`}
                  className="h-9 w-9 items-center justify-center rounded-full active:bg-background"
                  onPress={() => onRemoveNicheField(key)}
                >
                  <Trash2 color={colors.danger} size={16} strokeWidth={1.8} />
                </Pressable>
              </View>
            );
          })}

          {customFields.map(field => (
            <View
              key={field.id}
              className="flex-row items-center justify-between gap-3 border-b border-text/5 px-4 py-3.5"
            >
              <View className="min-w-0 flex-1 pr-1">
                <Text className="text-[15px] font-medium text-text">
                  {field.label}
                </Text>
                <Text className="mt-0.5 text-[12px] text-text-subtle">
                  Your custom field · shown when adding a product
                </Text>
              </View>
              <Pressable
                accessibilityRole="button"
                accessibilityLabel={`Delete ${field.label}`}
                className="h-9 w-9 items-center justify-center rounded-full active:bg-background"
                onPress={() => onDeleteCustomField(field)}
              >
                <Trash2 color={colors.danger} size={16} strokeWidth={1.8} />
              </Pressable>
              <Switch
                value={field.enabled}
                onValueChange={checked =>
                  void onCustomFieldToggle(field.id, checked)
                }
                trackColor={{
                  false: 'rgba(44,44,42,0.15)',
                  true: colors.primary,
                }}
                thumbColor={colors.white}
                ios_backgroundColor="rgba(44,44,42,0.15)"
              />
            </View>
          ))}

          <View className="px-4 py-4">
            {!addFieldOpen ? (
              <Pressable
                className="flex-row items-center gap-2 active:opacity-80"
                onPress={onAddFieldPress}
              >
                <Plus color={colors.primary} size={18} strokeWidth={2.2} />
                <Text className="text-[15px] font-semibold text-primary">
                  Add field
                </Text>
              </Pressable>
            ) : (
              <View>
                <Text className="mb-2 text-[12px] font-medium text-text-muted">
                  Custom field name
                </Text>
                <TextInput
                  value={newFieldLabel}
                  onChangeText={setNewFieldLabel}
                  placeholder="e.g. Expiry date, Batch no, Colour"
                  placeholderTextColor={colors.textSubtle}
                  className="rounded-2xl border border-text/10 bg-background px-4 py-3.5 text-[15px] text-text"
                  autoFocus
                />
                <View className="mt-3 flex-row gap-2">
                  <Pressable
                    className="h-11 flex-1 items-center justify-center rounded-2xl bg-primary active:opacity-90"
                    onPress={() => void onAddCustomField()}
                  >
                    <Text className="text-[14px] font-semibold text-white">
                      Add field
                    </Text>
                  </Pressable>
                  <Pressable
                    className="h-11 flex-1 items-center justify-center rounded-2xl bg-background active:opacity-80"
                    onPress={() => {
                      setAddFieldOpen(false);
                      setNewFieldLabel('');
                    }}
                  >
                    <Text className="text-[14px] font-semibold text-text">
                      Cancel
                    </Text>
                  </Pressable>
                </View>
              </View>
            )}
          </View>
        </View>
        <Text className="mt-2 px-1 text-[12px] leading-5 text-text-muted">
          Only fields you add show on product forms. Remove any you don’t need.
        </Text>

        <SectionLabel className="mt-6">Alerts</SectionLabel>
        <View className="overflow-hidden rounded-[20px] bg-surface">
          <SettingsNavRow
            label="Low stock at"
            value={`${threshold} units`}
            onPress={() => setStockOpen(true)}
          />
          <SettingsNavRow
            label="Debt overdue after"
            value={`${reminderDays} days`}
            showDivider={false}
            onPress={() => setDebtOpen(true)}
          />
        </View>

        {permissions.canExport ? (
          <>
            <SectionLabel className="mt-6">Data</SectionLabel>
            <Pressable
              className="flex-row items-center gap-3 rounded-[20px] bg-surface px-4 py-3.5 active:opacity-90"
              onPress={() => {
                if (!isOnline) {
                  alertNeedsConnection('CSV export');
                  return;
                }
                promptShopCsvExport(shopId, permissions.canExport, {
                  businessType,
                  fieldOverrides: profile?.field_overrides,
                  lowStockFallback: threshold,
                });
              }}
            >
              <View className="h-10 w-10 items-center justify-center rounded-xl bg-primary-tint">
                <Download color={colors.primary} size={18} strokeWidth={1.9} />
              </View>
              <View className="min-w-0 flex-1">
                <Text className="text-[15px] font-semibold text-text">
                  Export as CSV
                </Text>
                <Text className="mt-0.5 text-[12px] text-text-subtle">
                  Products, sales, customers, suppliers
                </Text>
              </View>
              <ChevronRight
                color={colors.textSubtle}
                size={18}
                strokeWidth={1.8}
              />
            </Pressable>
          </>
        ) : null}

        <SectionLabel className="mt-6">Password</SectionLabel>
        <View className="overflow-hidden rounded-[20px] bg-surface">
          <SettingsNavRow
            label="Change password"
            value=""
            showDivider={false}
            onPress={() => {
              setNewPassword('');
              setConfirmPassword('');
              setPasswordOpen(true);
            }}
          />
        </View>

        <SectionLabel className="mt-6">Offline</SectionLabel>
        <View className="flex-row items-start gap-3 rounded-[20px] bg-surface px-4 py-4">
          <View className="h-10 w-10 items-center justify-center rounded-xl bg-accent-tint">
            <WifiOff color={colors.accent} size={18} strokeWidth={1.9} />
          </View>
          <View className="min-w-0 flex-1">
            <Text className="text-[15px] font-semibold text-text">
              Works without internet
            </Text>
            <Text className="mt-1 text-[13px] leading-5 text-text-muted">
              Record sales and view products and customers offline. Everything
              else needs a connection.
            </Text>
          </View>
        </View>
      </ScrollView>

      <Modal visible={shopNameOpen} animationType="slide" transparent>
        <Pressable
          className="flex-1 justify-end bg-black/35"
          onPress={() => setShopNameOpen(false)}
        >
          <Pressable
            className="rounded-t-3xl bg-surface px-5 pt-4"
            style={{ paddingBottom: Math.max(insets.bottom, 16) }}
            onPress={e => e.stopPropagation()}
          >
            <Text className="text-[17px] font-bold text-text">Shop name</Text>
            <TextInput
              value={draftShopName}
              onChangeText={setDraftShopName}
              autoFocus
              className="mt-4 rounded-2xl border border-text/10 bg-background px-4 py-3.5 text-[15px] text-text"
            />
            <Pressable
              className="mt-4 h-12 items-center justify-center rounded-2xl bg-primary active:opacity-90"
              onPress={() => void onSaveShopName()}
            >
              <Text className="text-[15px] font-semibold text-white">Save</Text>
            </Pressable>
          </Pressable>
        </Pressable>
      </Modal>

      <Modal visible={ownerNameOpen} animationType="slide" transparent>
        <Pressable
          className="flex-1 justify-end bg-black/35"
          onPress={() => setOwnerNameOpen(false)}
        >
          <Pressable
            className="rounded-t-3xl bg-surface px-5 pt-4"
            style={{ paddingBottom: Math.max(insets.bottom, 16) }}
            onPress={e => e.stopPropagation()}
          >
            <Text className="text-[17px] font-bold text-text">Your name</Text>
            <TextInput
              value={draftOwnerName}
              onChangeText={setDraftOwnerName}
              autoFocus
              autoCapitalize="words"
              placeholder="e.g. Ada Okonkwo"
              placeholderTextColor={colors.textSubtle}
              className="mt-4 rounded-2xl border border-text/10 bg-background px-4 py-3.5 text-[15px] text-text"
            />
            <Pressable
              className="mt-4 h-12 items-center justify-center rounded-2xl bg-primary active:opacity-90"
              onPress={() => void onSaveOwnerName()}
            >
              <Text className="text-[15px] font-semibold text-white">Save</Text>
            </Pressable>
          </Pressable>
        </Pressable>
      </Modal>

      <Modal visible={phoneOpen} animationType="slide" transparent>
        <Pressable
          className="flex-1 justify-end bg-black/35"
          onPress={() => setPhoneOpen(false)}
        >
          <Pressable
            className="rounded-t-3xl bg-surface px-5 pt-4"
            style={{ paddingBottom: Math.max(insets.bottom, 16) }}
            onPress={e => e.stopPropagation()}
          >
            <Text className="mb-4 text-[17px] font-bold text-text">Phone</Text>
            <PhoneField value={draftPhone} onChange={setDraftPhone} />
            <Pressable
              className="mt-4 h-12 items-center justify-center rounded-2xl bg-primary active:opacity-90"
              onPress={() => void onSavePhone()}
            >
              <Text className="text-[15px] font-semibold text-white">Save</Text>
            </Pressable>
          </Pressable>
        </Pressable>
      </Modal>

      <Modal visible={passwordOpen} animationType="slide" transparent>
        <Pressable
          className="flex-1 justify-end bg-black/35"
          onPress={() => setPasswordOpen(false)}
        >
          <Pressable
            className="rounded-t-3xl bg-surface px-5 pt-4"
            style={{ paddingBottom: Math.max(insets.bottom, 16) }}
            onPress={e => e.stopPropagation()}
          >
            <Text className="text-[17px] font-bold text-text">
              Change password
            </Text>
            <Text className="mt-1 text-[13px] text-text-muted">
              Change the password you use to log in to StockBook.
            </Text>
            <View className="mt-4 gap-3">
              <PasswordField
                label="New password"
                textContentType="newPassword"
                value={newPassword}
                onChangeText={setNewPassword}
              />
              <PasswordField
                label="Confirm new password"
                textContentType="newPassword"
                value={confirmPassword}
                onChangeText={setConfirmPassword}
              />
            </View>
            <Pressable
              className="mt-4 h-12 items-center justify-center rounded-2xl bg-primary active:opacity-90"
              disabled={savingPassword || !newPassword}
              onPress={() => void onSavePassword()}
            >
              {savingPassword ? (
                <ActivityIndicator color="#fff" />
              ) : (
                <Text className="text-[15px] font-semibold text-white">
                  Update password
                </Text>
              )}
            </Pressable>
          </Pressable>
        </Pressable>
      </Modal>

      <Modal visible={businessOpen} animationType="slide" transparent>
        <Pressable
          className="flex-1 justify-end bg-black/35"
          onPress={() => setBusinessOpen(false)}
        >
          <Pressable
            className="rounded-t-3xl bg-surface px-5 pt-4"
            style={{ paddingBottom: Math.max(insets.bottom, 16) }}
            onPress={e => e.stopPropagation()}
          >
            <Text className="mb-4 text-[17px] font-bold text-text">
              Business type
            </Text>
            <BusinessTypePicker
              value={businessType}
              onChange={value => void onBusinessTypeChange(value)}
            />
          </Pressable>
        </Pressable>
      </Modal>

      <OptionSheet
        open={stockOpen}
        title="Low stock at"
        insetsBottom={insets.bottom}
        onClose={() => setStockOpen(false)}
        options={STOCK_OPTIONS.map(value => ({
          value,
          label: `${value} units`,
          selected: threshold === value,
        }))}
        onSelect={value => void onThresholdChange(value)}
      />

      <OptionSheet
        open={debtOpen}
        title="Debt overdue after"
        insetsBottom={insets.bottom}
        onClose={() => setDebtOpen(false)}
        options={DEBT_OPTIONS.map(opt => ({
          value: opt.value,
          label: opt.label,
          selected: reminderDays === opt.value,
        }))}
        onSelect={value => void onReminderChange(value)}
      />
    </View>
  );
}

function SectionLabel({
  children,
  className = '',
}: {
  children: string;
  className?: string;
}) {
  return (
    <Text
      className={`mb-2 text-[11px] font-semibold uppercase tracking-[0.14em] text-text-subtle ${className}`}
    >
      {children}
    </Text>
  );
}

function SettingsNavRow({
  label,
  value,
  onPress,
  showDivider = true,
}: {
  label: string;
  value: string;
  onPress: () => void;
  showDivider?: boolean;
}) {
  return (
    <Pressable
      onPress={onPress}
      className={
        showDivider
          ? 'flex-row items-center gap-3 border-b border-text/5 px-4 py-3.5 active:bg-background'
          : 'flex-row items-center gap-3 px-4 py-3.5 active:bg-background'
      }
    >
      <Text className="flex-1 text-[15px] font-medium text-text">{label}</Text>
      {value ? (
        <Text
          className="max-w-[45%] text-right text-[14px] text-text-muted"
          numberOfLines={1}
        >
          {value}
        </Text>
      ) : null}
      <ChevronRight color={colors.textSubtle} size={18} strokeWidth={1.8} />
    </Pressable>
  );
}

function OptionSheet({
  open,
  title,
  options,
  onSelect,
  onClose,
  insetsBottom,
}: {
  open: boolean;
  title: string;
  options: { value: number; label: string; selected: boolean }[];
  onSelect: (value: number) => void;
  onClose: () => void;
  insetsBottom: number;
}) {
  return (
    <Modal visible={open} animationType="slide" transparent>
      <Pressable className="flex-1 justify-end bg-black/35" onPress={onClose}>
        <Pressable
          className="rounded-t-3xl bg-surface px-5 pt-4"
          style={{ paddingBottom: Math.max(insetsBottom, 16) }}
          onPress={e => e.stopPropagation()}
        >
          <Text className="mb-3 text-[17px] font-bold text-text">{title}</Text>
          {options.map(opt => (
            <Pressable
              key={opt.value}
              onPress={() => onSelect(opt.value)}
              className="border-b border-text/5 py-3.5 active:opacity-80"
            >
              <Text
                className={
                  opt.selected
                    ? 'text-[15px] font-semibold text-primary'
                    : 'text-[15px] font-medium text-text'
                }
              >
                {opt.label}
              </Text>
            </Pressable>
          ))}
        </Pressable>
      </Pressable>
    </Modal>
  );
}
