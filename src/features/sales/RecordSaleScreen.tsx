import {
  ArrowLeft,
  ChevronDown,
  Info,
  Plus,
  UserPlus,
} from 'lucide-react-native';
import { useEffect, useMemo, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Pressable,
  ScrollView,
  Text,
  TextInput,
  View,
} from 'react-native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { QtyStepper } from '../../components/ui/QtyStepper';
import { useAuth } from '../../auth/AuthContext';
import { useOffline } from '../../offline/OfflineContext';
import { enqueueSale } from '../../offline/outbox';
import { fetchIsOnline } from '../../offline/network';
import { alertNeedsConnection } from '../../offline/requireOnline';
import { colors } from '../../theme/colors';
import type { PaymentMethod, PaymentStatus } from '../../types/domain';
import { formatNaira } from '../../utils/money';
import { PAYMENT_METHOD_OPTIONS } from '../../utils/paymentMethod';
import { summarizeSaleItems } from '../../utils/sales';
import { AddCustomerSheet } from '../customers/components/AddCustomerSheet';
import { useCustomerLedger } from '../customers/hooks/useCustomerLedger';
import { CustomerPickerSheet } from './components/CustomerPickerSheet';
import { ProductPickerSheet } from './components/ProductPickerSheet';
import { SaleCartList } from './components/SaleCartList';
import { createSale } from './hooks/useCreateSale';
import { useSaleCart } from './hooks/useSaleCart';
import { useSaleCatalog } from './hooks/useSaleCatalog';
import type { SalesStackParamList } from './SalesStack';
import { goBackInStack, pushInTab } from '../../navigation/pushInTab';
import { TAB_BAR_STYLE } from '../app/tabBarTheme';


type Props = NativeStackScreenProps<SalesStackParamList, 'RecordSale'>;

const PAYMENT_OPTIONS: { value: PaymentStatus; label: string }[] = [
  { value: 'paid', label: 'Paid' },
  { value: 'credit', label: 'On credit' },
  { value: 'partial', label: 'Partial' },
];

export function RecordSaleScreen({ navigation, route }: Props) {
  const insets = useSafeAreaInsets();
  const { shopId } = useAuth();
  const { isOnline, refreshOfflineState, syncNow } = useOffline();
  const {
    products,
    loading: productsLoading,
    refresh: refreshProducts,
    fromCache: productsFromCache,
    error: productsError,
  } = useSaleCatalog();
  const {
    rows: customerRows,
    loading: customersLoading,
    refresh: refreshCustomers,
  } = useCustomerLedger();
  const customers = useMemo(
    () =>
      customerRows.map(row => ({
        id: row.id,
        user_id: row.user_id,
        name: row.name,
        phone_number: row.phone_number,
        photo_url: row.photo_url,
        notes: row.notes,
        created_at: row.created_at,
      })),
    [customerRows],
  );

  const {
    lines,
    total,
    productById,
    remainingStock,
    addLine,
    updateLine,
    removeLine,
  } = useSaleCart(products);

  const [productId, setProductId] = useState('');
  const [quantity, setQuantity] = useState(1);
  const [unitPriceText, setUnitPriceText] = useState('');
  const [paymentStatus, setPaymentStatus] = useState<PaymentStatus>('paid');
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('cash');
  const [customerId, setCustomerId] = useState('');
  const [amountPaidText, setAmountPaidText] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [productPickerOpen, setProductPickerOpen] = useState(false);
  const [customerPickerOpen, setCustomerPickerOpen] = useState(false);
  const [addCustomerOpen, setAddCustomerOpen] = useState(false);

  const productBootstrapped = useRef(false);
  const customerBootstrapped = useRef(false);

  const selected = useMemo(
    () => products.find(p => p.id === productId) ?? null,
    [products, productId],
  );
  const stockLeft = selected ? remainingStock(selected.id) : 0;
  const unitPrice = Number(unitPriceText.replace(/\D/g, '')) || 0;
  const amountPaid = Number(amountPaidText.replace(/\D/g, '')) || 0;
  const needsCustomer = paymentStatus !== 'paid';
  const collectsMoney =
    paymentStatus === 'paid' || paymentStatus === 'partial';
  const selectedCustomer = customers.find(c => c.id === customerId);

  useEffect(() => {
    const parent = navigation.getParent();
    parent?.setOptions({ tabBarStyle: { display: 'none' } });
    return () => {
      parent?.setOptions({ tabBarStyle: TAB_BAR_STYLE });
    };
  }, [navigation]);

  useEffect(() => {
    if (productBootstrapped.current || productsLoading || products.length === 0) {
      return;
    }
    productBootstrapped.current = true;
    const fromRoute = route.params?.productId;
    if (fromRoute && products.some(p => p.id === fromRoute)) {
      const product = products.find(p => p.id === fromRoute)!;
      setProductId(product.id);
      setUnitPriceText(String(Math.round(Number(product.selling_price))));
      if (product.quantity > 0) {
        addLine(product.id, 1, Number(product.selling_price));
      }
      return;
    }
    const first = products.find(p => p.quantity > 0) ?? products[0];
    setProductId(first.id);
    setUnitPriceText(String(Math.round(Number(first.selling_price))));
  }, [products, productsLoading, route.params?.productId]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    if (customerBootstrapped.current || customersLoading) return;
    customerBootstrapped.current = true;
    const fromRoute = route.params?.customerId;
    if (fromRoute && customers.some(c => c.id === fromRoute)) {
      setCustomerId(fromRoute);
    }
  }, [customers, customersLoading, route.params?.customerId]);

  useEffect(() => {
    if (!selected || !productBootstrapped.current) return;
    if (route.params?.productId === selected.id) return;
    setUnitPriceText(String(Math.round(Number(selected.selling_price))));
    setQuantity(1);
  }, [selected?.id]); // eslint-disable-line react-hooks/exhaustive-deps

  function onAddItem() {
    if (!selected) return;
    const result = addLine(selected.id, quantity, unitPrice);
    if (!result.ok) {
      if (result.reason === 'stock') {
        Alert.alert(
          'Not enough stock',
          stockLeft === 0
            ? `${selected.name} is already fully added.`
            : `Only ${result.remaining} left in stock.`,
        );
      } else if (result.reason === 'qty') {
        Alert.alert('Check quantity', 'Quantity must be at least 1.');
      } else {
        Alert.alert('Check price', 'Enter a valid price.');
      }
      return;
    }
    setQuantity(1);
  }

  async function onComplete() {
    if (lines.length === 0) {
      Alert.alert('Add an item', 'Add at least one product before completing.');
      return;
    }
    if (needsCustomer && !customerId) {
      Alert.alert(
        'Customer required',
        'Select a customer for credit or partial sales.',
      );
      return;
    }
    if (paymentStatus === 'partial') {
      if (amountPaid <= 0) {
        Alert.alert('Amount needed', 'Enter how much was paid.');
        return;
      }
      if (amountPaid >= total) {
        Alert.alert(
          'Use Paid instead',
          'Partial payment must be less than the total.',
        );
        return;
      }
    }

    if (!shopId) {
      Alert.alert('Not signed in', 'Sign in again to record a sale.');
      return;
    }

    const items = lines.map(line => ({
      product_id: line.productId,
      quantity: line.quantity,
      unit_price: line.unitPrice,
    }));
    const itemSummary = summarizeSaleItems(
      lines.map(line => ({
        quantity: line.quantity,
        product: { name: productById.get(line.productId)?.name ?? 'Item' },
      })),
    );
    const payload = {
      customerId: customerId || null,
      customerName: selectedCustomer?.name?.trim() || 'Walk-in',
      paymentStatus,
      paymentMethod: collectsMoney ? paymentMethod : null,
      amountPaid: paymentStatus === 'partial' ? amountPaid : 0,
      items,
      itemSummary,
      totalAmount: total,
    };

    setSubmitting(true);
    try {
      const online = await fetchIsOnline();

      if (!online) {
        const pending = await enqueueSale(shopId, payload);
        await refreshOfflineState();
        await refreshProducts();
        const itemCount = lines.reduce((sum, line) => sum + line.quantity, 0);
        Alert.alert(
          'Sale saved offline',
          `${formatNaira(total)} · ${itemCount} item${itemCount === 1 ? '' : 's'} · will sync when you’re back online.`,
        );
        navigation.reset({
          index: 1,
          routes: [
            { name: 'SalesList' },
            {
              name: 'SaleDetail',
              params: { saleId: pending.clientSaleId, pending: true },
            },
          ],
        });
        return;
      }

      const saleId = await createSale({
        customerId: payload.customerId,
        paymentStatus: payload.paymentStatus,
        paymentMethod: payload.paymentMethod,
        amountPaid: payload.amountPaid,
        items: payload.items,
      });

      await Promise.all([refreshProducts(), refreshCustomers(), syncNow()]);

      const itemCount = lines.reduce((sum, line) => sum + line.quantity, 0);
      Alert.alert(
        'Sale recorded',
        `${formatNaira(total)} · ${itemCount} item${itemCount === 1 ? '' : 's'} · stock updated.`,
      );
      navigation.reset({
        index: 1,
        routes: [
          { name: 'SalesList' },
          { name: 'SaleDetail', params: { saleId } },
        ],
      });
    } catch (e) {
      const msg = e instanceof Error ? e.message : 'Please try again.';
      const looksLikeNetwork =
        /network|fetch|timeout|offline|failed to fetch/i.test(msg);

      if (looksLikeNetwork) {
        const pending = await enqueueSale(shopId, payload);
        await refreshOfflineState();
        await refreshProducts();
        Alert.alert(
          'Sale saved offline',
          'Connection dropped — we’ll sync this sale when you’re back online.',
        );
        navigation.reset({
          index: 1,
          routes: [
            { name: 'SalesList' },
            {
              name: 'SaleDetail',
              params: { saleId: pending.clientSaleId, pending: true },
            },
          ],
        });
        return;
      }

      Alert.alert(
        "Couldn't complete sale",
        msg.includes('create_sale') || msg.includes('Could not find the function')
          ? 'Sale RPC missing in Supabase — run the create_sale / client_sale_id migration, then try again.'
          : msg,
      );
    } finally {
      setSubmitting(false);
    }
  }

  if (productsLoading || customersLoading) {
    return (
      <View
        className="flex-1 items-center justify-center bg-background"
        style={{ paddingTop: insets.top }}
      >
        <ActivityIndicator color={colors.primary} size="large" />
      </View>
    );
  }

  if (products.length === 0) {
    const needsDownload =
      !isOnline ||
      productsFromCache ||
      (productsError?.toLowerCase().includes('connect') ?? false);
    return (
      <View className="flex-1 bg-background" style={{ paddingTop: insets.top }}>
        <View className="flex-row items-center gap-3 px-4 py-2">
          <Pressable
            className="h-11 w-11 items-center justify-center rounded-full bg-surface active:opacity-80"
            onPress={() => goBackInStack(navigation, 'SalesList')}
          >
            <ArrowLeft color={colors.text} size={20} strokeWidth={1.8} />
          </Pressable>
          <Text className="text-[20px] font-bold text-text">Record sale</Text>
        </View>
        <View className="flex-1 items-center justify-center px-8">
          <Text className="text-center text-[16px] font-semibold text-text">
            {needsDownload && !isOnline
              ? 'Products not downloaded yet'
              : 'No products to sell yet'}
          </Text>
          <Text className="mt-2 text-center text-[13px] text-text-muted">
            {needsDownload && !isOnline
              ? 'Go online once so StockBook can save your catalog on this phone. Then you can sell offline.'
              : 'Add a product first, then come back to record a sale.'}
          </Text>
          {isOnline ? (
            <Pressable
              className="mt-5 rounded-2xl bg-primary px-5 py-3.5 active:opacity-90"
              onPress={() => {
                const parent = navigation.getParent();
                if (parent) {
                  pushInTab(
                    parent,
                    'ProductsTab',
                    'ProductsList',
                    'ProductForm',
                  );
                }
              }}
            >
              <Text className="text-[15px] font-semibold text-white">
                Add product
              </Text>
            </Pressable>
          ) : (
            <Pressable
              className="mt-5 rounded-2xl bg-primary px-5 py-3.5 active:opacity-90"
              onPress={() => void refreshProducts()}
            >
              <Text className="text-[15px] font-semibold text-white">
                Try again
              </Text>
            </Pressable>
          )}
        </View>
      </View>
    );
  }

  return (
    <View className="flex-1 bg-background" style={{ paddingTop: insets.top }}>
      <View className="flex-row items-center gap-3 px-4 py-2">
        <Pressable
          className="h-11 w-11 items-center justify-center rounded-full bg-surface active:opacity-80"
          onPress={() => goBackInStack(navigation, 'SalesList')}
        >
          <ArrowLeft color={colors.text} size={20} strokeWidth={1.8} />
        </Pressable>
        <View className="min-w-0 flex-1">
          <Text className="text-[20px] font-bold text-text">Record sale</Text>
          <Text className="mt-0.5 text-[13px] text-text-muted">
            Add items, then take payment
          </Text>
        </View>
      </View>

      <ScrollView
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{
          paddingHorizontal: 20,
          paddingTop: 8,
          paddingBottom: 28 + Math.max(insets.bottom, 8),
        }}
      >
        <Text className="mb-1.5 text-[12px] font-medium text-text-muted">
          Product
        </Text>
        <Pressable
          onPress={() => setProductPickerOpen(true)}
          className="mb-4 flex-row items-center justify-between rounded-2xl bg-surface px-4 py-3.5 active:opacity-90"
        >
          <View className="min-w-0 flex-1 pr-3">
            <Text className="text-[15px] font-semibold text-text" numberOfLines={1}>
              {selected?.name ?? 'Choose product'}
            </Text>
            {selected ? (
              <Text className="mt-0.5 text-[12px] text-text-subtle">
                {stockLeft} left to add · {formatNaira(selected.selling_price)}
              </Text>
            ) : null}
          </View>
          <ChevronDown color={colors.textSubtle} size={18} strokeWidth={1.8} />
        </Pressable>

        <View className="mb-4 flex-row gap-3">
          <View className="flex-1">
            <Text className="mb-1.5 text-[12px] font-medium text-text-muted">
              Quantity
            </Text>
            <QtyStepper
              value={quantity}
              onChange={setQuantity}
              min={1}
              max={Math.max(stockLeft, 1)}
            />
          </View>

          <View className="flex-1">
            <Text className="mb-1.5 text-[12px] font-medium text-text-muted">
              Price
            </Text>
            <View className="h-12 flex-row items-center rounded-2xl bg-surface px-3.5">
              <Text className="text-[15px] font-semibold text-text">₦</Text>
              <TextInput
                value={unitPriceText}
                onChangeText={text => setUnitPriceText(text.replace(/\D/g, ''))}
                keyboardType="number-pad"
                placeholder="0"
                placeholderTextColor={colors.textSubtle}
                className="ml-1 flex-1 text-[16px] font-semibold text-text"
              />
            </View>
          </View>
        </View>

        <Pressable
          onPress={onAddItem}
          disabled={stockLeft <= 0}
          className={
            stockLeft <= 0
              ? 'mb-5 h-12 flex-row items-center justify-center gap-2 rounded-2xl bg-surface opacity-50'
              : 'mb-5 h-12 flex-row items-center justify-center gap-2 rounded-2xl bg-primary-tint active:opacity-90'
          }
        >
          <Plus color={colors.primary} size={18} strokeWidth={2.2} />
          <Text className="text-[15px] font-semibold text-primary">
            Add to sale
          </Text>
        </Pressable>

        <Text className="mb-2 text-[12px] font-medium text-text-muted">
          Items on this sale ({lines.length})
        </Text>
        <SaleCartList
          lines={lines}
          productById={productById}
          remainingStock={remainingStock}
          onUpdate={updateLine}
          onRemove={removeLine}
        />

        <View className="mt-4 flex-row items-center justify-between rounded-2xl bg-surface px-4 py-3.5">
          <Text className="text-[14px] font-medium text-text-muted">Total</Text>
          <Text className="text-[18px] font-bold text-text">
            {formatNaira(total)}
          </Text>
        </View>

        <Text className="mb-2 mt-5 text-[12px] font-medium text-text-muted">
          Payment status
        </Text>
        <View className="mb-4 flex-row gap-2">
          {PAYMENT_OPTIONS.map(option => {
            const active = paymentStatus === option.value;
            return (
              <Pressable
                key={option.value}
                onPress={() => setPaymentStatus(option.value)}
                className={
                  active
                    ? 'flex-1 items-center rounded-full bg-primary py-2.5'
                    : 'flex-1 items-center rounded-full border border-text/10 bg-surface py-2.5'
                }
              >
                <Text
                  className={
                    active
                      ? 'text-[13px] font-semibold text-white'
                      : 'text-[13px] font-medium text-text'
                  }
                >
                  {option.label}
                </Text>
              </Pressable>
            );
          })}
        </View>

        {collectsMoney ? (
          <>
            <Text className="mb-2 text-[12px] font-medium text-text-muted">
              Payment method
            </Text>
            <View className="mb-4 flex-row gap-2">
              {PAYMENT_METHOD_OPTIONS.map(option => {
                const active = paymentMethod === option.value;
                return (
                  <Pressable
                    key={option.value}
                    onPress={() => setPaymentMethod(option.value)}
                    className={
                      active
                        ? 'flex-1 items-center rounded-full bg-primary py-2.5'
                        : 'flex-1 items-center rounded-full border border-text/10 bg-surface py-2.5'
                    }
                  >
                    <Text
                      className={
                        active
                          ? 'text-[13px] font-semibold text-white'
                          : 'text-[13px] font-medium text-text'
                      }
                    >
                      {option.label}
                    </Text>
                  </Pressable>
                );
              })}
            </View>
          </>
        ) : null}

        <View
          className={
            needsCustomer
              ? 'rounded-[22px] bg-danger-tint/70 px-4 py-4'
              : 'rounded-[22px] bg-surface px-4 py-4'
          }
        >
          {needsCustomer ? (
            <View className="mb-3 flex-row items-start gap-2">
              <Info color={colors.danger} size={16} strokeWidth={2} />
              <Text className="min-w-0 flex-1 text-[13px] text-danger">
                Select a customer if this sale isn’t fully paid
              </Text>
            </View>
          ) : (
            <Text className="mb-3 text-[12px] text-text-subtle">
              Customer (optional) · leave empty for walk-in
            </Text>
          )}

          <Pressable
            onPress={() => setCustomerPickerOpen(true)}
            className="flex-row items-center justify-between rounded-2xl bg-background px-4 py-3.5 active:opacity-90"
          >
            <View className="min-w-0 flex-1 pr-3">
              <Text className="text-[15px] font-semibold text-text">
                {selectedCustomer?.name ??
                  (needsCustomer ? 'Select customer…' : 'Walk-in / no customer')}
              </Text>
              {selectedCustomer?.phone_number ? (
                <Text className="mt-0.5 text-[12px] text-text-subtle">
                  {selectedCustomer.phone_number}
                </Text>
              ) : null}
            </View>
            <ChevronDown color={colors.textSubtle} size={18} strokeWidth={1.8} />
          </Pressable>

          <Pressable
            onPress={() => {
              if (!isOnline) {
                alertNeedsConnection('Adding a customer');
                return;
              }
              setAddCustomerOpen(true);
            }}
            className="mt-3 flex-row items-center gap-1.5 self-start active:opacity-80"
          >
            <UserPlus
              color={needsCustomer ? colors.danger : colors.primary}
              size={15}
              strokeWidth={2}
            />
            <Text
              className={
                needsCustomer
                  ? 'text-[14px] font-semibold text-danger'
                  : 'text-[14px] font-semibold text-primary'
              }
            >
              New customer
            </Text>
          </Pressable>

          {paymentStatus === 'partial' ? (
            <View className="mt-3">
              <Text className="mb-1.5 text-[12px] font-medium text-text-muted">
                Amount paid now
              </Text>
              <View className="h-12 flex-row items-center rounded-2xl bg-background px-3.5">
                <Text className="text-[15px] font-semibold text-text">₦</Text>
                <TextInput
                  value={amountPaidText}
                  onChangeText={text =>
                    setAmountPaidText(text.replace(/\D/g, ''))
                  }
                  keyboardType="number-pad"
                  placeholder="0"
                  placeholderTextColor={colors.textSubtle}
                  className="ml-1 flex-1 text-[16px] font-semibold text-text"
                />
              </View>
            </View>
          ) : null}
        </View>

        <View className="mt-6 gap-2.5">
          <Pressable
            onPress={() => void onComplete()}
            disabled={submitting || lines.length === 0}
            className={
              submitting || lines.length === 0
                ? 'h-12 items-center justify-center rounded-2xl bg-accent opacity-50'
                : 'h-12 items-center justify-center rounded-2xl bg-accent active:opacity-90'
            }
          >
            {submitting ? (
              <ActivityIndicator color={colors.white} />
            ) : (
              <Text className="text-[15px] font-semibold text-white">
                Complete sale
              </Text>
            )}
          </Pressable>
          <Pressable
            onPress={() => goBackInStack(navigation, 'SalesList')}
            className="h-12 items-center justify-center rounded-2xl bg-surface active:opacity-80"
          >
            <Text className="text-[15px] font-semibold text-text">Cancel</Text>
          </Pressable>
        </View>
      </ScrollView>

      <ProductPickerSheet
        open={productPickerOpen}
        products={products}
        remainingStock={remainingStock}
        selectedId={productId || null}
        onClose={() => setProductPickerOpen(false)}
        onSelect={id => {
          setProductId(id);
          const product = products.find(p => p.id === id);
          if (product) {
            setUnitPriceText(String(Math.round(Number(product.selling_price))));
            setQuantity(1);
          }
        }}
      />

      <CustomerPickerSheet
        open={customerPickerOpen}
        customers={customers}
        selectedId={customerId}
        allowWalkIn={!needsCustomer}
        onClose={() => setCustomerPickerOpen(false)}
        onSelect={setCustomerId}
        onAddNew={() => {
          if (!isOnline) {
            alertNeedsConnection('Adding a customer');
            return;
          }
          setAddCustomerOpen(true);
        }}
      />

      <AddCustomerSheet
        open={addCustomerOpen}
        onClose={() => setAddCustomerOpen(false)}
        onSaved={id => {
          void refreshCustomers();
          setCustomerId(id);
        }}
      />
    </View>
  );
}
