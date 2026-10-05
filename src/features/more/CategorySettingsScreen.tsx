import { ArrowLeft, Plus } from 'lucide-react-native';
import { useEffect, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Pressable,
  ScrollView,
  Switch,
  Text,
  TextInput,
  View,
} from 'react-native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useAuth } from '../../auth/AuthContext';
import { supabase } from '../../lib/supabase';
import { goBackInStack } from '../../navigation/pushInTab';
import { colors } from '../../theme/colors';
import type { CategorySettings } from '../../types/domain';
import {
  baseCategoriesFor,
  createCustomCategory,
  emptyCategorySettings,
  isBaseCategoryEnabled,
  normalizeCategorySettings,
  toggleBaseCategory,
} from '../../utils/productCategories';
import type { MoreStackParamList } from './MoreStack';
import { TAB_BAR_STYLE } from '../app/tabBarTheme';


type Props = NativeStackScreenProps<MoreStackParamList, 'CategorySettings'>;

export function CategorySettingsScreen({ navigation }: Props) {
  const insets = useSafeAreaInsets();
  const { profile, shopId, refreshProfile } = useAuth();
  const businessType = profile?.business_type ?? 'general';
  const [settings, setSettings] = useState<CategorySettings>(
    emptyCategorySettings(),
  );
  const [saving, setSaving] = useState(false);
  const [addOpen, setAddOpen] = useState(false);
  const [newLabel, setNewLabel] = useState('');

  const base = useMemo(() => baseCategoriesFor(businessType), [businessType]);

  useEffect(() => {
    const parent = navigation.getParent();
    parent?.setOptions({ tabBarStyle: { display: 'none' } });
    return () => {
      parent?.setOptions({ tabBarStyle: TAB_BAR_STYLE });
    };
  }, [navigation]);

  useEffect(() => {
    setSettings(normalizeCategorySettings(profile?.category_settings));
  }, [profile?.category_settings]);

  async function persist(next: CategorySettings, okMessage?: string) {
    if (!shopId) return false;
    const previous = settings;
    setSettings(next);
    setSaving(true);
    const { error } = await supabase
      .from('profiles')
      .update({ category_settings: next })
      .eq('id', shopId);
    setSaving(false);
    if (error) {
      setSettings(previous);
      Alert.alert(
        "Couldn't save",
        error.message.includes('category_settings')
          ? 'Run the category settings migration in Supabase, then try again.'
          : error.message,
      );
      return false;
    }
    await refreshProfile();
    if (okMessage) Alert.alert('Saved', okMessage);
    return true;
  }

  async function onToggleBase(name: string, enabled: boolean) {
    await persist(toggleBaseCategory(name, enabled, settings));
  }

  async function onToggleCustom(id: string, enabled: boolean) {
    await persist({
      ...settings,
      custom: settings.custom.map(c =>
        c.id === id ? { ...c, enabled } : c,
      ),
    });
  }

  async function onAdd() {
    const label = newLabel.trim();
    if (!label) {
      Alert.alert('Category name required', 'Type a name for your new category.');
      return;
    }
    if (base.some(n => n.toLowerCase() === label.toLowerCase())) {
      Alert.alert(
        'Already a base category',
        'Turn that one on above instead of adding it again.',
      );
      return;
    }
    if (
      settings.custom.some(c => c.label.toLowerCase() === label.toLowerCase())
    ) {
      Alert.alert('Already added', 'You already have a category with that name.');
      return;
    }
    const next = createCustomCategory(label);
    const ok = await persist(
      { ...settings, custom: [...settings.custom, next] },
      'Category added.',
    );
    if (ok) {
      setNewLabel('');
      setAddOpen(false);
    }
  }

  return (
    <View className="flex-1 bg-background" style={{ paddingTop: insets.top }}>
      <View className="flex-row items-center gap-3 px-4 py-2">
        <Pressable
          className="h-11 w-11 items-center justify-center rounded-full bg-surface active:opacity-80"
          onPress={() => goBackInStack(navigation, 'Settings')}
        >
          <ArrowLeft color={colors.text} size={20} strokeWidth={1.8} />
        </Pressable>
        <View className="min-w-0 flex-1">
          <Text className="text-[20px] font-bold text-text">
            Product categories
          </Text>
          <Text className="mt-0.5 text-[13px] text-text-muted">
            What shows on Products and when adding items
          </Text>
        </View>
        {saving ? <ActivityIndicator color={colors.primary} /> : null}
      </View>

      <ScrollView
        contentContainerStyle={{
          paddingHorizontal: 20,
          paddingTop: 8,
          paddingBottom: 28 + Math.max(insets.bottom, 8),
        }}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        <Text className="mb-3 text-[13px] leading-5 text-text-muted">
          Base categories come from your business type. Turn off ones you don’t
          use, or add your own.
        </Text>

        <View className="overflow-hidden rounded-[20px] bg-surface">
          {base.map((name, index) => (
            <View
              key={name}
              className={
                index < base.length - 1 || settings.custom.length > 0
                  ? 'flex-row items-center justify-between gap-4 border-b border-text/5 px-4 py-3.5'
                  : 'flex-row items-center justify-between gap-4 px-4 py-3.5'
              }
            >
              <View className="min-w-0 flex-1 pr-2">
                <Text className="text-[15px] font-medium text-text">{name}</Text>
                <Text className="mt-0.5 text-[12px] text-text-subtle">
                  Suggested for your shop type
                </Text>
              </View>
              <Switch
                value={isBaseCategoryEnabled(name, settings)}
                onValueChange={checked => void onToggleBase(name, checked)}
                trackColor={{
                  false: 'rgba(44,44,42,0.15)',
                  true: colors.primary,
                }}
                thumbColor={colors.white}
                ios_backgroundColor="rgba(44,44,42,0.15)"
              />
            </View>
          ))}

          {settings.custom.map((category, index) => (
            <View
              key={category.id}
              className={
                index < settings.custom.length - 1
                  ? 'flex-row items-center justify-between gap-4 border-b border-text/5 px-4 py-3.5'
                  : 'flex-row items-center justify-between gap-4 px-4 py-3.5'
              }
            >
              <View className="min-w-0 flex-1 pr-2">
                <Text className="text-[15px] font-medium text-text">
                  {category.label}
                </Text>
                <Text className="mt-0.5 text-[12px] text-text-subtle">
                  Your custom category
                </Text>
              </View>
              <Switch
                value={category.enabled}
                onValueChange={checked =>
                  void onToggleCustom(category.id, checked)
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
        </View>

        <View className="mt-4 rounded-[20px] bg-surface px-4 py-4">
          {!addOpen ? (
            <Pressable
              className="flex-row items-center gap-2 active:opacity-80"
              onPress={() => setAddOpen(true)}
            >
              <Plus color={colors.primary} size={18} strokeWidth={2.2} />
              <Text className="text-[15px] font-semibold text-primary">
                Add category
              </Text>
            </Pressable>
          ) : (
            <View>
              <Text className="mb-2 text-[12px] font-medium text-text-muted">
                Category name
              </Text>
              <TextInput
                value={newLabel}
                onChangeText={setNewLabel}
                placeholder="e.g. Shoes, Spare parts, Hair"
                placeholderTextColor={colors.textSubtle}
                className="rounded-2xl border border-text/10 bg-background px-4 py-3.5 text-[15px] text-text"
                autoFocus
              />
              <View className="mt-3 flex-row gap-2">
                <Pressable
                  className="h-11 flex-1 items-center justify-center rounded-2xl bg-primary active:opacity-90"
                  onPress={() => void onAdd()}
                >
                  <Text className="text-[14px] font-semibold text-white">
                    Add category
                  </Text>
                </Pressable>
                <Pressable
                  className="h-11 flex-1 items-center justify-center rounded-2xl bg-background active:opacity-80"
                  onPress={() => {
                    setAddOpen(false);
                    setNewLabel('');
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
      </ScrollView>
    </View>
  );
}
