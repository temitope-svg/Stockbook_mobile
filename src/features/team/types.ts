import type { InviteRole } from '../auth/inviteRole';
import type { ShopRole } from '../../types/domain';

export type TeamMember = {
  id: string;
  user_id: string;
  role: ShopRole;
  display_name: string | null;
  status: string;
  created_at: string;
  salesThisWeek: number;
  lastActiveAt: string | null;
};

export type PendingInvite = {
  id: string;
  email: string;
  role: InviteRole;
  token: string;
  expires_at: string;
  created_at: string;
  accepted_at: string | null;
};

export type CreateInviteResult = {
  id: string;
  token: string;
  email: string;
  role: string;
  expires_at: string;
};
