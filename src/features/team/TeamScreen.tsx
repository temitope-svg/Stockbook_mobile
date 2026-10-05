import {
  ArrowLeft,
  ChevronRight,
  Mail,
  Shield,
  UserPlus,
} from 'lucide-react-native';
import { useEffect, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Pressable,
  RefreshControl,
  ScrollView,
  Share,
  Text,
  View,
} from 'react-native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useAuth } from '../../auth/AuthContext';
import { goBackInStack } from '../../navigation/pushInTab';
import { roleLabel, type InviteRole } from '../auth/inviteRole';
import { colors } from '../../theme/colors';
import { avatarTone, daysSince } from '../../utils/customer';
import { initials } from '../../utils/initials';
import type { MoreStackParamList } from '../more/MoreStack';
import { InviteMemberSheet } from './components/InviteMemberSheet';
import { MemberDetailSheet } from './components/MemberDetailSheet';
import { RolesInfoSheet } from './components/RolesInfoSheet';
import { inviteUrl, useTeam } from './hooks/useTeam';
import type { PendingInvite, TeamMember } from './types';
import { TAB_BAR_STYLE } from '../app/tabBarTheme';


type Props = NativeStackScreenProps<MoreStackParamList, 'Team'>;

function relativeActiveLabel(iso: string | null) {
  if (!iso) return 'No sales yet';
  const days = daysSince(iso);
  if (days === 0) return 'Active today';
  if (days === 1) return 'Active yesterday';
  if (days < 7) return `Active ${days} days ago`;
  return `Last sale ${new Date(iso).toLocaleDateString('en-GB', {
    day: 'numeric',
    month: 'short',
  })}`;
}

function sentAgoLabel(iso: string) {
  const days = daysSince(iso);
  if (days === 0) return 'sent today';
  if (days === 1) return 'sent 1 day ago';
  return `sent ${days} days ago`;
}

function roleBadgeStyle(role: string) {
  if (role === 'owner') {
    return { wrap: 'bg-accent-tint', text: 'text-accent' };
  }
  if (role === 'manager') {
    return { wrap: 'bg-teal-tint', text: 'text-teal' };
  }
  return { wrap: 'bg-background', text: 'text-text-muted' };
}

export function TeamScreen({ navigation }: Props) {
  const insets = useSafeAreaInsets();
  const { profile } = useAuth();
  const team = useTeam();
  const [inviteOpen, setInviteOpen] = useState(false);
  const [rolesOpen, setRolesOpen] = useState(false);
  const [selectedMember, setSelectedMember] = useState<TeamMember | null>(null);

  useEffect(() => {
    const parent = navigation.getParent();
    parent?.setOptions({ tabBarStyle: { display: 'none' } });
    return () => {
      parent?.setOptions({ tabBarStyle: TAB_BAR_STYLE });
    };
  }, [navigation]);

  const subtitle = useMemo(() => {
    const memberLabel = `${team.members.length} member${
      team.members.length === 1 ? '' : 's'
    }`;
    if (!team.canManage || team.invites.length === 0) return memberLabel;
    return `${memberLabel} · ${team.invites.length} pending invite${
      team.invites.length === 1 ? '' : 's'
    }`;
  }, [team.members.length, team.invites.length, team.canManage]);

  async function onResend(invite: PendingInvite) {
    try {
      const result = await team.createInvite(invite.email, invite.role);
      const url = inviteUrl(result.token);
      await Share.share({
        message: `Join ${profile?.shop_name ?? 'our shop'} on StockBook: ${url}`,
        url,
      });
    } catch (e) {
      Alert.alert(
        "Couldn't resend",
        e instanceof Error ? e.message : 'Try again.',
      );
    }
  }

  function onRevoke(invite: PendingInvite) {
    Alert.alert('Revoke invite?', `${invite.email} won't be able to join.`, [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Revoke',
        style: 'destructive',
        onPress: () => {
          void team.revokeInvite(invite.id).catch(e =>
            Alert.alert(
              "Couldn't revoke",
              e instanceof Error ? e.message : 'Try again.',
            ),
          );
        },
      },
    ]);
  }

  return (
    <View className="flex-1 bg-background" style={{ paddingTop: insets.top }}>
      <View className="flex-row items-start gap-3 px-4 py-2">
        <Pressable
          className="h-11 w-11 items-center justify-center rounded-full bg-surface active:opacity-80"
          onPress={() => goBackInStack(navigation, 'MoreHome')}
        >
          <ArrowLeft color={colors.text} size={20} strokeWidth={1.8} />
        </Pressable>
        <View className="min-w-0 flex-1">
          <Text className="text-[20px] font-bold text-text">Team</Text>
          <Text className="mt-0.5 text-[13px] text-text-muted">{subtitle}</Text>
        </View>
        {team.canManage ? (
          <Pressable
            accessibilityLabel="Invite team member"
            className="h-11 w-11 items-center justify-center rounded-full bg-primary active:opacity-90"
            onPress={() => setInviteOpen(true)}
          >
            <UserPlus color={colors.white} size={18} strokeWidth={2} />
          </Pressable>
        ) : null}
      </View>

      {team.loading && team.members.length === 0 ? (
        <View className="flex-1 items-center justify-center">
          <ActivityIndicator color={colors.primary} size="large" />
        </View>
      ) : (
        <ScrollView
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl
              refreshing={team.refreshing}
              onRefresh={() => void team.refresh()}
              tintColor={colors.primary}
            />
          }
          contentContainerStyle={{
            paddingHorizontal: 20,
            paddingTop: 8,
            paddingBottom: 32 + Math.max(insets.bottom, 8),
          }}
        >
          {team.error ? (
            <Text className="mb-3 text-[13px] text-danger">{team.error}</Text>
          ) : null}

          {!team.canManage ? (
            <View className="mb-4 rounded-2xl bg-surface px-4 py-3.5">
              <Text className="text-[13px] leading-5 text-text-muted">
                Only the owner can invite or manage staff.
              </Text>
            </View>
          ) : null}

          <Text className="mb-2 text-[11px] font-semibold uppercase tracking-[0.14em] text-text-subtle">
            Members
          </Text>
          <View className="overflow-hidden rounded-[22px] bg-surface">
            {team.members.map((member, index) => {
              const isYou = member.user_id === team.currentUserId;
              const name =
                member.display_name?.trim() ||
                (isYou ? 'You' : 'Teammate');
              const title = isYou ? 'You' : name;
              const subtitleLine =
                member.role === 'owner'
                  ? 'Full access'
                  : relativeActiveLabel(member.lastActiveAt);
              const showDot =
                member.role !== 'owner' &&
                member.lastActiveAt != null &&
                daysSince(member.lastActiveAt) === 0;
              const badge = roleBadgeStyle(member.role);
              const tone = avatarTone(name);
              const canOpen =
                team.canManage && member.role !== 'owner' && !isYou;

              return (
                <Pressable
                  key={member.id}
                  disabled={!canOpen}
                  onPress={() => setSelectedMember(member)}
                  className={
                    index < team.members.length - 1
                      ? 'flex-row items-center gap-3 border-b border-text/5 px-4 py-3.5 active:bg-background'
                      : 'flex-row items-center gap-3 px-4 py-3.5 active:bg-background'
                  }
                >
                  <View
                    className={`h-11 w-11 items-center justify-center rounded-full ${tone.bg}`}
                  >
                    <Text className={`text-[13px] font-bold ${tone.text}`}>
                      {initials(isYou ? profile?.shop_name || name : name)}
                    </Text>
                  </View>
                  <View className="min-w-0 flex-1">
                    <Text className="text-[15px] font-semibold text-text">
                      {title}
                    </Text>
                    <View className="mt-0.5 flex-row items-center gap-1.5">
                      {showDot ? (
                        <View className="h-1.5 w-1.5 rounded-full bg-primary" />
                      ) : null}
                      <Text className="text-[12px] text-text-subtle">
                        {subtitleLine}
                      </Text>
                    </View>
                  </View>
                  <View className={`rounded-full px-2.5 py-1 ${badge.wrap}`}>
                    <Text className={`text-[11px] font-semibold ${badge.text}`}>
                      {roleLabel(member.role === 'owner' ? 'owner' : (member.role as InviteRole))}
                    </Text>
                  </View>
                  {canOpen ? (
                    <ChevronRight
                      color={colors.textSubtle}
                      size={18}
                      strokeWidth={1.8}
                    />
                  ) : null}
                </Pressable>
              );
            })}
          </View>

          {team.canManage && team.invites.length > 0 ? (
            <>
              <Text className="mb-2 mt-6 text-[11px] font-semibold uppercase tracking-[0.14em] text-text-subtle">
                Pending invites
              </Text>
              <View className="gap-3">
                {team.invites.map(invite => (
                  <View
                    key={invite.id}
                    className="rounded-[22px] bg-surface px-4 py-4"
                  >
                    <View className="flex-row items-start gap-3">
                      <View className="h-11 w-11 items-center justify-center rounded-xl border border-dashed border-text/20 bg-background">
                        <Mail
                          color={colors.textSubtle}
                          size={18}
                          strokeWidth={1.8}
                        />
                      </View>
                      <View className="min-w-0 flex-1">
                        <Text
                          className="text-[15px] font-semibold text-text"
                          numberOfLines={1}
                        >
                          {invite.email}
                        </Text>
                        <Text className="mt-0.5 text-[12px] text-text-subtle">
                          {roleLabel(invite.role)} · {sentAgoLabel(invite.created_at)}
                        </Text>
                      </View>
                      <View className="rounded-full bg-accent-tint px-2.5 py-1">
                        <Text className="text-[11px] font-semibold text-accent">
                          Pending
                        </Text>
                      </View>
                    </View>
                    <View className="mt-3 flex-row gap-2.5">
                      <Pressable
                        className="flex-1 items-center rounded-2xl bg-background py-3 active:opacity-80"
                        onPress={() => void onResend(invite)}
                      >
                        <Text className="text-[14px] font-semibold text-primary">
                          Resend link
                        </Text>
                      </Pressable>
                      <Pressable
                        className="flex-1 items-center rounded-2xl bg-background py-3 active:opacity-80"
                        onPress={() => onRevoke(invite)}
                      >
                        <Text className="text-[14px] font-semibold text-danger">
                          Revoke
                        </Text>
                      </Pressable>
                    </View>
                  </View>
                ))}
              </View>
            </>
          ) : null}

          <Pressable
            onPress={() => setRolesOpen(true)}
            className="mt-6 flex-row items-center gap-3 rounded-[22px] bg-surface px-4 py-4 active:opacity-90"
          >
            <View className="h-10 w-10 items-center justify-center rounded-xl bg-background">
              <Shield color={colors.textMuted} size={18} strokeWidth={1.8} />
            </View>
            <Text className="min-w-0 flex-1 text-[15px] font-medium text-text">
              What can each role do?
            </Text>
            <ChevronRight color={colors.textSubtle} size={18} strokeWidth={1.8} />
          </Pressable>
        </ScrollView>
      )}

      <InviteMemberSheet
        open={inviteOpen}
        shopName={profile?.shop_name ?? 'your shop'}
        onClose={() => setInviteOpen(false)}
        onInvite={async (email, role) => team.createInvite(email, role)}
      />

      <MemberDetailSheet
        open={selectedMember != null}
        member={selectedMember}
        onClose={() => setSelectedMember(null)}
        onSave={(memberId, role) => team.updateMemberRole(memberId, role)}
        onRemove={memberId => team.removeMember(memberId)}
      />

      <RolesInfoSheet open={rolesOpen} onClose={() => setRolesOpen(false)} />
    </View>
  );
}
