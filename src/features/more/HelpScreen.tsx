import {
  ArrowLeft,
  ChevronRight,
  HelpCircle,
  Mail,
  MessageCircle,
  MessageSquarePlus,
  Search,
} from 'lucide-react-native';
import { useEffect, useMemo, useState } from 'react';
import {
  Alert,
  Pressable,
  ScrollView,
  Text,
  TextInput,
  View,
} from 'react-native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useAuth } from '../../auth/AuthContext';
import { SUPPORT_EMAIL } from '../../config/env';
import { goBackInStack } from '../../navigation/pushInTab';
import { colors } from '../../theme/colors';
import { FaqAccordion } from './components/FaqAccordion';
import { FeedbackSheet } from './components/FeedbackSheet';
import {
  hasWhatsAppSupport,
  openSupportEmail,
  openSupportWhatsApp,
} from './help/contact';
import {
  FAQ_TOPICS,
  filterFaqSections,
  type FaqTopicId,
} from './help/faqContent';
import type { MoreStackParamList } from './MoreStack';
import { TAB_BAR_STYLE } from '../app/tabBarTheme';


type Props = NativeStackScreenProps<MoreStackParamList, 'Help'>;

export function HelpScreen({ navigation }: Props) {
  const insets = useSafeAreaInsets();
  const { profile, role } = useAuth();
  const [search, setSearch] = useState('');
  const [topic, setTopic] = useState<FaqTopicId | 'all'>('all');
  const [feedbackOpen, setFeedbackOpen] = useState(false);

  useEffect(() => {
    const parent = navigation.getParent();
    parent?.setOptions({ tabBarStyle: { display: 'none' } });
    return () => {
      parent?.setOptions({ tabBarStyle: TAB_BAR_STYLE });
    };
  }, [navigation]);

  const sections = useMemo(
    () => filterFaqSections(search, topic),
    [search, topic],
  );

  async function onEmail() {
    try {
      await openSupportEmail(profile?.shop_name);
    } catch (e) {
      Alert.alert(
        "Couldn't open mail",
        e instanceof Error ? e.message : `Email us at ${SUPPORT_EMAIL}`,
      );
    }
  }

  async function onWhatsApp() {
    try {
      await openSupportWhatsApp(profile?.shop_name);
    } catch (e) {
      Alert.alert(
        'WhatsApp unavailable',
        e instanceof Error ? e.message : 'Could not open WhatsApp.',
      );
    }
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
        <View className="min-w-0 flex-1">
          <Text className="text-[20px] font-bold text-text">Help & feedback</Text>
          <Text className="mt-0.5 text-[13px] text-text-muted">
            Quick answers for running your shop
          </Text>
        </View>
      </View>

      <ScrollView
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{
          paddingHorizontal: 20,
          paddingTop: 8,
          paddingBottom: 32 + Math.max(insets.bottom, 8),
        }}
      >
        <View className="mb-4 flex-row items-start gap-3 rounded-[22px] bg-primary-tint px-4 py-4">
          <View className="h-10 w-10 items-center justify-center rounded-xl bg-surface">
            <HelpCircle color={colors.primary} size={20} strokeWidth={1.8} />
          </View>
          <View className="min-w-0 flex-1">
            <Text className="text-[15px] font-semibold text-primary">
              Stuck mid-sale?
            </Text>
            <Text className="mt-1 text-[13px] leading-5 text-primary/80">
              Search below for sales, credit (“book”), stock, team roles, and
              Insights — written for busy shop days.
            </Text>
          </View>
        </View>

        <View className="mb-3 flex-row items-center rounded-full bg-surface px-4 py-3">
          <Search color={colors.textSubtle} size={18} strokeWidth={1.8} />
          <TextInput
            value={search}
            onChangeText={setSearch}
            placeholder="Search help…"
            placeholderTextColor={colors.textSubtle}
            className="ml-2.5 flex-1 text-[15px] text-text"
            autoCapitalize="none"
            autoCorrect={false}
            clearButtonMode="while-editing"
          />
        </View>

        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          className="mb-5"
          contentContainerStyle={{ gap: 8 }}
        >
          {FAQ_TOPICS.map(item => {
            const active = topic === item.id;
            return (
              <Pressable
                key={item.id}
                onPress={() => setTopic(item.id)}
                className={
                  active
                    ? 'rounded-full bg-primary px-3.5 py-2'
                    : 'rounded-full border border-text/10 bg-surface px-3.5 py-2'
                }
              >
                <Text
                  className={
                    active
                      ? 'text-[13px] font-semibold text-white'
                      : 'text-[13px] font-medium text-text'
                  }
                >
                  {item.label}
                </Text>
              </Pressable>
            );
          })}
        </ScrollView>

        {sections.length === 0 ? (
          <View className="mb-5 items-center rounded-[22px] bg-surface px-5 py-8">
            <Text className="text-[15px] font-semibold text-text">
              No matching answers
            </Text>
            <Text className="mt-2 text-center text-[13px] text-text-muted">
              Try another word, or send us a note — we’ll help.
            </Text>
            <Pressable
              className="mt-4 rounded-2xl bg-primary px-4 py-3"
              onPress={() => setFeedbackOpen(true)}
            >
              <Text className="text-[14px] font-semibold text-white">
                Send feedback
              </Text>
            </Pressable>
          </View>
        ) : (
          <FaqAccordion sections={sections} />
        )}

        <Text className="mb-2 mt-6 text-[11px] font-semibold uppercase tracking-[0.14em] text-text-subtle">
          Still need help?
        </Text>
        <View className="overflow-hidden rounded-[22px] bg-surface">
          <Pressable
            onPress={() => void onEmail()}
            className="flex-row items-center gap-3 border-b border-text/5 px-4 py-3.5 active:bg-background"
          >
            <View className="h-10 w-10 items-center justify-center rounded-xl bg-primary-tint">
              <Mail color={colors.primary} size={18} strokeWidth={1.9} />
            </View>
            <View className="min-w-0 flex-1">
              <Text className="text-[15px] font-semibold text-text">
                Email support
              </Text>
              <Text className="mt-0.5 text-[12px] text-text-subtle">
                {SUPPORT_EMAIL}
              </Text>
            </View>
            <ChevronRight color={colors.textSubtle} size={18} strokeWidth={1.8} />
          </Pressable>

          {hasWhatsAppSupport() ? (
            <Pressable
              onPress={() => void onWhatsApp()}
              className="flex-row items-center gap-3 border-b border-text/5 px-4 py-3.5 active:bg-background"
            >
              <View className="h-10 w-10 items-center justify-center rounded-xl bg-teal-tint">
                <MessageCircle color={colors.teal} size={18} strokeWidth={1.9} />
              </View>
              <View className="min-w-0 flex-1">
                <Text className="text-[15px] font-semibold text-text">
                  WhatsApp us
                </Text>
                <Text className="mt-0.5 text-[12px] text-text-subtle">
                  Usually faster during shop hours
                </Text>
              </View>
              <ChevronRight
                color={colors.textSubtle}
                size={18}
                strokeWidth={1.8}
              />
            </Pressable>
          ) : null}

          <Pressable
            onPress={() => setFeedbackOpen(true)}
            className="flex-row items-center gap-3 px-4 py-3.5 active:bg-background"
          >
            <View className="h-10 w-10 items-center justify-center rounded-xl bg-accent-tint">
              <MessageSquarePlus
                color={colors.accent}
                size={18}
                strokeWidth={1.9}
              />
            </View>
            <View className="min-w-0 flex-1">
              <Text className="text-[15px] font-semibold text-text">
                Send feedback
              </Text>
              <Text className="mt-0.5 text-[12px] text-text-subtle">
                Bug, confusion, or idea
              </Text>
            </View>
            <ChevronRight color={colors.textSubtle} size={18} strokeWidth={1.8} />
          </Pressable>
        </View>
      </ScrollView>

      <FeedbackSheet
        open={feedbackOpen}
        shopName={profile?.shop_name}
        role={role}
        onClose={() => setFeedbackOpen(false)}
      />
    </View>
  );
}
