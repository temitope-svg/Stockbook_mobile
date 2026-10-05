import type { InviteRole } from '../features/auth/inviteRole';

export type { InviteRole };

export type RootStackParamList = {
  Welcome: undefined;
  Login: undefined;
  SignUp: undefined;
  ForgotPassword: undefined;
  InviteAccept: {
    token: string;
    shopName?: string;
    role?: InviteRole;
  };
  AppHome: undefined;
};
