export type InviteRole = 'cashier' | 'manager';

export type CapabilityItem = {
  allowed: boolean;
  label: string;
};

export function roleLabel(role: InviteRole | 'owner'): string {
  if (role === 'owner') return 'Owner';
  return role === 'manager' ? 'Manager' : 'Cashier';
}

export function roleShortDescription(role: InviteRole): string {
  if (role === 'manager') return 'Stock, customers, exports, insights';
  return 'Sells and takes payments';
}

export function shopInitials(shopName: string): string {
  const parts = shopName
    .replace(/['’]/g, '')
    .trim()
    .split(/\s+/)
    .filter(Boolean);

  if (parts.length === 0) return '?';
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return `${parts[0][0] ?? ''}${parts[1][0] ?? ''}`.toUpperCase();
}

export function capabilitiesFor(role: InviteRole): {
  heading: string;
  items: CapabilityItem[];
} {
  if (role === 'manager') {
    return {
      heading: "As a Manager, you'll be able to:",
      items: [
        { allowed: true, label: 'Record sales and take payments' },
        { allowed: true, label: 'Manage products, stock, and customers' },
        { allowed: true, label: 'See cost prices, insights, and exports' },
        { allowed: false, label: "Can't manage the team" },
      ],
    };
  }

  return {
    heading: "As a Cashier, you'll be able to:",
    items: [
      { allowed: true, label: 'Record sales and payments' },
      { allowed: true, label: 'View products and customers' },
      {
        allowed: false,
        label: "Can't see cost prices, insights or exports",
      },
    ],
  };
}
