import { StyleSheet, Text, View } from 'react-native';
import type { SaleReceiptModel } from '../utils/saleReceipt';

type SaleReceiptCardProps = {
  receipt: SaleReceiptModel;
};

function MetaRow({ label, value, strong }: { label: string; value: string; strong?: boolean }) {
  return (
    <View style={styles.row}>
      <Text style={styles.muted}>{label}</Text>
      <Text style={strong ? styles.strong : styles.value} numberOfLines={2}>
        {value}
      </Text>
    </View>
  );
}

export function SaleReceiptCard({ receipt }: SaleReceiptCardProps) {
  return (
    <View style={styles.card}>
      <View style={styles.center}>
        <Text style={styles.shop}>{receipt.shopName}</Text>
        {receipt.shopPhone ? (
          <Text style={styles.phone}>{receipt.shopPhone}</Text>
        ) : null}
        <Text style={styles.badge}>Sales receipt</Text>
      </View>

      <View style={styles.section}>
        <MetaRow label="Receipt" value={receipt.receiptNo} strong />
        <MetaRow label="Date" value={receipt.dateLabel} />
        <MetaRow label="Customer" value={receipt.customer} strong />
        {receipt.customerPhone ? (
          <MetaRow label="Phone" value={receipt.customerPhone} />
        ) : null}
        <MetaRow label="Status" value={receipt.status} />
      </View>

      <View style={styles.tableHead}>
        <Text style={[styles.th, styles.itemCol]}>Item</Text>
        <Text style={[styles.th, styles.numCol]}>Qty</Text>
        <Text style={[styles.th, styles.priceCol]}>Price</Text>
        <Text style={[styles.th, styles.amountCol]}>Amount</Text>
      </View>

      {receipt.lines.map(line => (
        <View key={line.key} style={styles.tableRow}>
          <Text style={[styles.itemName, styles.itemCol]}>{line.name}</Text>
          <Text style={[styles.cell, styles.numCol]}>{line.quantity}</Text>
          <Text style={[styles.cell, styles.priceCol]}>{line.unitPrice}</Text>
          <Text style={[styles.cellStrong, styles.amountCol]}>{line.amount}</Text>
        </View>
      ))}

      <View style={styles.section}>
        <View style={styles.row}>
          <Text style={styles.totalLabel}>Total</Text>
          <Text style={styles.totalValue}>{receipt.total}</Text>
        </View>
      </View>

      {receipt.balanceOwed ? (
        <View style={styles.section}>
          <Text style={styles.upper}>Balance</Text>
          <View style={styles.row}>
            <Text style={styles.muted}>Still owed</Text>
            <Text style={styles.strong}>{receipt.balanceOwed}</Text>
          </View>
        </View>
      ) : null}

      <View style={[styles.section, styles.center]}>
        <Text style={styles.thanks}>Thank you for your patronage</Text>
        <Text style={styles.powered}>Powered by StockBook</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    width: 360,
    backgroundColor: '#ffffff',
    paddingHorizontal: 20,
    paddingVertical: 22,
  },
  center: {
    alignItems: 'center',
  },
  shop: {
    fontSize: 20,
    fontWeight: '700',
    color: '#111111',
    letterSpacing: -0.3,
    textAlign: 'center',
  },
  phone: {
    marginTop: 4,
    fontSize: 11,
    color: '#666666',
  },
  badge: {
    marginTop: 12,
    fontSize: 10,
    fontWeight: '700',
    letterSpacing: 1.8,
    textTransform: 'uppercase',
    color: '#777777',
  },
  section: {
    marginTop: 14,
    paddingTop: 12,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: '#bbbbbb',
    borderStyle: 'dashed',
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 12,
    marginTop: 4,
  },
  muted: {
    fontSize: 12,
    color: '#777777',
  },
  value: {
    flex: 1,
    fontSize: 12,
    color: '#111111',
    textAlign: 'right',
  },
  strong: {
    flex: 1,
    fontSize: 12,
    fontWeight: '700',
    color: '#111111',
    textAlign: 'right',
  },
  upper: {
    fontSize: 10,
    fontWeight: '700',
    letterSpacing: 1.2,
    textTransform: 'uppercase',
    color: '#777777',
    marginBottom: 4,
  },
  tableHead: {
    flexDirection: 'row',
    marginTop: 14,
    paddingBottom: 6,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: '#cccccc',
  },
  tableRow: {
    flexDirection: 'row',
    paddingVertical: 8,
    alignItems: 'flex-start',
  },
  th: {
    fontSize: 10,
    fontWeight: '700',
    letterSpacing: 0.8,
    textTransform: 'uppercase',
    color: '#777777',
  },
  itemCol: {
    flex: 1.4,
    paddingRight: 6,
  },
  numCol: {
    width: 36,
    textAlign: 'right',
  },
  priceCol: {
    width: 78,
    textAlign: 'right',
  },
  amountCol: {
    width: 86,
    textAlign: 'right',
  },
  itemName: {
    fontSize: 12,
    fontWeight: '600',
    color: '#111111',
  },
  cell: {
    fontSize: 12,
    color: '#111111',
  },
  cellStrong: {
    fontSize: 12,
    fontWeight: '700',
    color: '#111111',
  },
  totalLabel: {
    fontSize: 14,
    fontWeight: '700',
    color: '#111111',
  },
  totalValue: {
    fontSize: 22,
    fontWeight: '700',
    color: '#111111',
    letterSpacing: -0.4,
  },
  thanks: {
    fontSize: 14,
    fontWeight: '700',
    color: '#111111',
  },
  powered: {
    marginTop: 4,
    fontSize: 11,
    color: '#999999',
  },
});
