export type FaqTopicId =
  | 'sales'
  | 'debt'
  | 'stock'
  | 'team'
  | 'offline'
  | 'insights';

export type FaqItem = {
  id: string;
  question: string;
  answer: string;
  keywords?: string[];
};

export type FaqSection = {
  id: FaqTopicId;
  title: string;
  subtitle: string;
  items: FaqItem[];
};

export const FAQ_TOPICS: { id: FaqTopicId | 'all'; label: string }[] = [
  { id: 'all', label: 'All' },
  { id: 'sales', label: 'Sales' },
  { id: 'debt', label: 'Credit' },
  { id: 'stock', label: 'Stock' },
  { id: 'team', label: 'Team' },
  { id: 'offline', label: 'Offline' },
  { id: 'insights', label: 'Insights' },
];

export const FAQ_SECTIONS: FaqSection[] = [
  {
    id: 'sales',
    title: 'Sales',
    subtitle: 'Recording what left the shop',
    items: [
      {
        id: 'sale-record',
        question: 'How do I record a sale?',
        answer:
          'Tap Sale on the home screen (or open Sales → New sale). Add one or more products, choose a walk-in or named customer, pick paid / credit / partial, then save. Stock drops as soon as the sale is saved.',
        keywords: ['new sale', 'record', 'till'],
      },
      {
        id: 'sale-status',
        question: 'What’s the difference between paid, credit, and partial?',
        answer:
          'Paid means the customer settled in full (cash, transfer, or POS). Credit (“book”) means they owe the full amount. Partial means they paid some now and still owe the rest — that remaining balance shows under the customer.',
        keywords: ['book', 'owe', 'partial', 'payment status'],
      },
      {
        id: 'sale-method',
        question: 'How do I mark cash, transfer, or POS?',
        answer:
          'When the sale is paid or partial, pick the payment method before saving. That helps you see how money came in — it doesn’t change stock.',
        keywords: ['cash', 'transfer', 'pos'],
      },
    ],
  },
  {
    id: 'debt',
    title: 'Credit & customers',
    subtitle: 'Who still owes your shop',
    items: [
      {
        id: 'debt-where',
        question: 'Where do I see who owes me?',
        answer:
          'Open Customers — people with open balances rise to the top. The home screen also shows money owed and “needs attention” for overdue debts.',
        keywords: ['balance', 'owe', 'customers'],
      },
      {
        id: 'debt-pay',
        question: 'How do I take a payment on a debt?',
        answer:
          'Open the customer → tap Take payment (or Payment on home). Choose the open debt, enter the amount and method, then save. When the debt is fully paid, the related sale flips to paid.',
        keywords: ['collect', 'payment', 'settle'],
      },
      {
        id: 'debt-overdue',
        question: 'What does “overdue” mean?',
        answer:
          'A debt becomes overdue after the reminder days set in Settings (for example, 7 days). Change that under Settings → Debt overdue after. Notifications use the same number for follow-ups.',
        keywords: ['reminder', 'follow up', 'settings'],
      },
      {
        id: 'debt-whatsapp',
        question: 'How do WhatsApp reminders work?',
        answer:
          'On a customer’s page, tap WhatsApp to open a ready message with their balance. StockBook doesn’t send messages by itself — you send from WhatsApp on your phone.',
        keywords: ['remind', 'message', 'chat'],
      },
    ],
  },
  {
    id: 'stock',
    title: 'Stock',
    subtitle: 'Products, restock, and low stock',
    items: [
      {
        id: 'stock-restock',
        question: 'How do I restock?',
        answer:
          'Open a product → Restock. Enter quantity and buying price (optional selling price and supplier). Use Restock when you bought more stock — not for fixing wrong counts.',
        keywords: ['buy', 'supplier', 'reorder'],
      },
      {
        id: 'stock-adjust',
        question: 'When should I use Adjust stock?',
        answer:
          'Use Adjust for damage, theft, or a recount when the number on the shelf doesn’t match the app. Don’t use Restock for that — Restock is for purchases.',
        keywords: ['damage', 'theft', 'recount', 'fix'],
      },
      {
        id: 'stock-low',
        question: 'What does “low stock” mean?',
        answer:
          'A product is low when its quantity is at or below the shop threshold in Settings (or its own override on the product). You’ll see it on the home screen and in Notifications.',
        keywords: ['threshold', 'alert', 'running out'],
      },
      {
        id: 'stock-fields',
        question: 'Why don’t I see Size, Condition, or IMEI on products?',
        answer:
          'Those fields are optional. Turn them on in Settings → Product fields. Nothing is locked to your business type — enable only what your products need.',
        keywords: ['variant', 'imei', 'condition', 'settings'],
      },
    ],
  },
  {
    id: 'team',
    title: 'Team & roles',
    subtitle: 'Owner, manager, cashier',
    items: [
      {
        id: 'team-roles',
        question: 'What’s the difference between Owner, Manager, and Cashier?',
        answer:
          'Owner: full control including Team. Manager: stock, customers, exports, Insights — but not Team. Cashier: record sales and take payments; they can’t see cost prices, Insights, or exports.',
        keywords: ['permission', 'staff', 'access'],
      },
      {
        id: 'team-invite',
        question: 'How do I invite staff?',
        answer:
          'More → Team → invite. Enter their email and role, then share the link. The invite only works for that email address. They should open it on the web to join, then sign in on the app.',
        keywords: ['invite', 'email', 'join'],
      },
      {
        id: 'team-cashier',
        question: 'Why can’t my cashier see Insights or cost?',
        answer:
          'That’s by design so helpers can sell without seeing your margins. Promote them to Manager in Team if they should manage stock and see Insights.',
        keywords: ['cost price', 'hidden', 'manager'],
      },
    ],
  },
  {
    id: 'offline',
    title: 'Offline & sync',
    subtitle: 'Working without internet',
    items: [
      {
        id: 'offline-what',
        question: 'What works without internet?',
        answer:
          'You can record sales and view products and customers offline. Insights, Team, exports, and some updates need a connection. When you’re back online, StockBook syncs what it can.',
        keywords: ['no network', 'airplane', 'sync'],
      },
      {
        id: 'offline-conflict',
        question: 'What if something doesn’t sync?',
        answer:
          'Check Notifications for sync notes. Keep the app open on a good network and pull to refresh. If a sale looks wrong, open it and confirm stock and payment status.',
        keywords: ['conflict', 'failed', 'sync'],
      },
    ],
  },
  {
    id: 'insights',
    title: 'Insights',
    subtitle: 'How the shop is really doing',
    items: [
      {
        id: 'insights-profit',
        question: 'What is “estimated profit”?',
        answer:
          'It’s revenue minus each product’s current cost price × qty sold. It’s an estimate — update cost prices when you restock so profit stays realistic. Restock spend only counts restocks saved with a buying price.',
        keywords: ['margin', 'cost', 'profit'],
      },
      {
        id: 'insights-who',
        question: 'Why don’t I see Insights?',
        answer:
          'Insights is for owners and managers only. Cashiers won’t see it under More. Ask the owner to change your role if you should have access.',
        keywords: ['missing', 'permission', 'manager'],
      },
      {
        id: 'insights-slow',
        question: 'What are slow movers?',
        answer:
          'Active products with the fewest units sold in the period — including items with zero sales. Useful for spotting stock sitting on the shelf.',
        keywords: ['unsold', 'dead stock'],
      },
    ],
  },
];

export function filterFaqSections(
  query: string,
  topic: FaqTopicId | 'all',
): FaqSection[] {
  const q = query.trim().toLowerCase();
  return FAQ_SECTIONS.map(section => {
    if (topic !== 'all' && section.id !== topic) {
      return { ...section, items: [] };
    }
    if (!q) return section;
    const items = section.items.filter(item => {
      const hay = [
        item.question,
        item.answer,
        ...(item.keywords ?? []),
        section.title,
      ]
        .join(' ')
        .toLowerCase();
      return hay.includes(q);
    });
    return { ...section, items };
  }).filter(section => section.items.length > 0);
}
