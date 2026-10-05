import type { ShopRole } from '../types/domain';

export type { ShopRole };

export type ShopPermissions = {
  role: ShopRole;
  canManageTeam: boolean;
  canEditPreferences: boolean;
  canEditProducts: boolean;
  canViewCost: boolean;
  canExport: boolean;
  canRecordSale: boolean;
  canRecordPayment: boolean;
  canEditCustomers: boolean;
};

export function permissionsFor(
  role: ShopRole | null | undefined,
): ShopPermissions {
  const r = role ?? 'cashier';
  const isOwner = r === 'owner';
  const isManager = r === 'manager';
  const elevated = isOwner || isManager;

  return {
    role: r,
    canManageTeam: isOwner,
    canEditPreferences: elevated,
    canEditProducts: elevated,
    canViewCost: elevated,
    canExport: elevated,
    canRecordSale: true,
    canRecordPayment: true,
    canEditCustomers: elevated,
  };
}
