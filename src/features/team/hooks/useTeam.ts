import { useCallback, useEffect, useState } from 'react';
import { useAuth } from '../../../auth/AuthContext';
import { permissionsFor } from '../../../auth/permissions';
import type { InviteRole } from '../../auth/inviteRole';
import { WEB_APP_URL } from '../../../config/env';
import { supabase } from '../../../lib/supabase';
import { addDays, startOfDay } from '../../../utils/dates';
import type {
  CreateInviteResult,
  PendingInvite,
  TeamMember,
} from '../types';

function startOfWeek(date = new Date()) {
  const d = startOfDay(date);
  const day = d.getDay();
  const diff = day === 0 ? -6 : 1 - day;
  return addDays(d, diff);
}

export function inviteUrl(token: string) {
  return `${WEB_APP_URL.replace(/\/$/, '')}/invite/${token}`;
}

export function useTeam() {
  const { shopId, role, user } = useAuth();
  const canManage = permissionsFor(role).canManageTeam;

  const [members, setMembers] = useState<TeamMember[]>([]);
  const [invites, setInvites] = useState<PendingInvite[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(
    async (isRefresh = false) => {
      if (!shopId) {
        setMembers([]);
        setInvites([]);
        setLoading(false);
        return;
      }

      if (isRefresh) setRefreshing(true);
      else setLoading(true);
      setError(null);

      try {
        const membersRes = await supabase
          .from('shop_members')
          .select('id, user_id, role, display_name, status, created_at')
          .eq('shop_id', shopId)
          .eq('status', 'active')
          .order('created_at', { ascending: true });

        if (membersRes.error) throw membersRes.error;

        const rawMembers = membersRes.data ?? [];
        const userIds = rawMembers.map(m => m.user_id as string);
        const weekStart = startOfWeek().toISOString();

        const statsByUser = new Map<
          string,
          { salesThisWeek: number; lastActiveAt: string | null }
        >();

        if (userIds.length > 0) {
          const { data: sales } = await supabase
            .from('sales')
            .select('created_by, created_at')
            .eq('user_id', shopId)
            .in('created_by', userIds)
            .order('created_at', { ascending: false });

          for (const sale of sales ?? []) {
            const uid = sale.created_by as string | null;
            if (!uid) continue;
            const prev = statsByUser.get(uid) ?? {
              salesThisWeek: 0,
              lastActiveAt: null,
            };
            const createdAt = sale.created_at as string;
            if (!prev.lastActiveAt || createdAt > prev.lastActiveAt) {
              prev.lastActiveAt = createdAt;
            }
            if (createdAt >= weekStart) prev.salesThisWeek += 1;
            statsByUser.set(uid, prev);
          }
        }

        setMembers(
          rawMembers.map(m => {
            const stats = statsByUser.get(m.user_id as string);
            return {
              id: m.id as string,
              user_id: m.user_id as string,
              role: m.role as TeamMember['role'],
              display_name: (m.display_name as string | null) ?? null,
              status: m.status as string,
              created_at: m.created_at as string,
              salesThisWeek: stats?.salesThisWeek ?? 0,
              lastActiveAt: stats?.lastActiveAt ?? null,
            };
          }),
        );

        if (canManage) {
          const invitesRes = await supabase
            .from('shop_invites')
            .select('id, email, role, token, expires_at, accepted_at, created_at')
            .eq('shop_id', shopId)
            .is('accepted_at', null)
            .gt('expires_at', new Date().toISOString())
            .order('created_at', { ascending: false });

          if (invitesRes.error) throw invitesRes.error;
          setInvites((invitesRes.data as PendingInvite[]) ?? []);
        } else {
          setInvites([]);
        }
      } catch (e) {
        setError(e instanceof Error ? e.message : 'Couldn’t load team');
        setMembers([]);
        setInvites([]);
      } finally {
        setLoading(false);
        setRefreshing(false);
      }
    },
    [shopId, canManage],
  );

  useEffect(() => {
    void load();
  }, [load]);

  const createInvite = useCallback(
    async (email: string, inviteRole: InviteRole) => {
      const { data, error: rpcError } = await supabase.rpc('create_shop_invite', {
        p_email: email.trim(),
        p_role: inviteRole,
      });
      if (rpcError) throw rpcError;
      await load(true);
      return data as CreateInviteResult;
    },
    [load],
  );

  const revokeInvite = useCallback(
    async (inviteId: string) => {
      const { error: rpcError } = await supabase.rpc('revoke_shop_invite', {
        p_invite_id: inviteId,
      });
      if (rpcError) throw rpcError;
      await load(true);
    },
    [load],
  );

  const updateMemberRole = useCallback(
    async (memberId: string, nextRole: InviteRole) => {
      const { error: rpcError } = await supabase.rpc('update_shop_member_role', {
        p_member_id: memberId,
        p_role: nextRole,
      });
      if (rpcError) throw rpcError;
      await load(true);
    },
    [load],
  );

  const removeMember = useCallback(
    async (memberId: string) => {
      const { error: rpcError } = await supabase.rpc('remove_shop_member', {
        p_member_id: memberId,
      });
      if (rpcError) throw rpcError;
      await load(true);
    },
    [load],
  );

  return {
    members,
    invites,
    loading,
    refreshing,
    error,
    canManage,
    currentUserId: user?.id ?? null,
    refresh: () => load(true),
    createInvite,
    revokeInvite,
    updateMemberRole,
    removeMember,
  };
}
