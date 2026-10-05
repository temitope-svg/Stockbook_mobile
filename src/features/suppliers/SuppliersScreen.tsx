import { ArrowLeft, Download, Plus, Search } from 'lucide-react-native';
import { useEffect, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  FlatList,
  Pressable,
  RefreshControl,
  Share,
  Text,
  TextInput,
  View,
} from 'react-native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useAuth } from '../../auth/AuthContext';
import { permissionsFor } from '../../auth/permissions';
import { goBackInStack } from '../../navigation/pushInTab';
import { colors } from '../../theme/colors';
import type { MoreStackParamList } from '../more/MoreStack';
import { SupplierFormSheet } from './components/SupplierFormSheet';
import { SupplierRow } from './components/SupplierRow';
import { SuppliersSummaryCards } from './components/SuppliersSummaryCards';
import { filterSuppliers, useSupplierList } from './hooks/useSupplierList';
import { TAB_BAR_STYLE } from '../app/tabBarTheme';


type Props = NativeStackScreenProps<MoreStackParamList, 'SuppliersList'>;

function currentMonthLabel() {
  return new Date().toLocaleDateString('en-GB', { month: 'short' });
}

function escapeCsv(value: string | number) {
  const text = String(value);
  if (/[",\n]/.test(text)) return `"${text.replace(/"/g, '""')}"`;
  return text;
}

export function SuppliersScreen({ navigation }: Props) {
  const insets = useSafeAreaInsets();
  const { role } = useAuth();
  const permissions = permissionsFor(role);
  const list = useSupplierList();
  const [search, setSearch] = useState('');
  const [addOpen, setAddOpen] = useState(false);

  useEffect(() => {
    const parent = navigation.getParent();
    parent?.setOptions({ tabBarStyle: { display: 'none' } });
    return () => {
      parent?.setOptions({ tabBarStyle: TAB_BAR_STYLE });
    };
  }, [navigation]);

  useEffect(() => {
    if (!permissions.canEditProducts) {
      goBackInStack(navigation, 'MoreHome');
    }
  }, [permissions.canEditProducts, navigation]);

  const filtered = useMemo(
    () => filterSuppliers(list.rows, search),
    [list.rows, search],
  );

  async function onExportCsv() {
    if (!permissions.canExport) {
      Alert.alert('Export unavailable', 'Only owners and managers can export.');
      return;
    }
    if (filtered.length === 0) {
      Alert.alert('Nothing to export', 'No suppliers match the search.');
      return;
    }

    const stamp = new Date().toISOString().slice(0, 10);
    const header = [
      'Name',
      'Phone',
      'Notes',
      'Restocks',
      'Spend (NGN)',
      'Added on',
    ];
    const lines = [
      header.join(','),
      ...filtered.map(s =>
        [
          escapeCsv(s.name),
          escapeCsv(s.phone_number ?? ''),
          escapeCsv(s.notes ?? ''),
          s.restockCount,
          Math.round(s.spend),
          s.created_at.slice(0, 10),
        ].join(','),
      ),
    ];

    try {
      await Share.share({
        title: `stockbook-suppliers-${stamp}.csv`,
        message: lines.join('\n'),
      });
    } catch {
      Alert.alert("Couldn't export", 'Sharing failed on this device.');
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
        <Text className="min-w-0 flex-1 text-[20px] font-bold text-text">
          Suppliers
        </Text>
        {permissions.canExport ? (
          <Pressable
            accessibilityLabel="Export CSV"
            className="h-11 w-11 items-center justify-center rounded-full bg-surface active:opacity-80"
            onPress={() => void onExportCsv()}
          >
            <Download color={colors.text} size={18} strokeWidth={1.8} />
          </Pressable>
        ) : null}
        <Pressable
          accessibilityLabel="Add supplier"
          className="h-11 w-11 items-center justify-center rounded-full bg-primary active:opacity-90"
          onPress={() => setAddOpen(true)}
        >
          <Plus color={colors.white} size={20} strokeWidth={2.2} />
        </Pressable>
      </View>

      {list.loading && list.rows.length === 0 ? (
        <View className="flex-1 items-center justify-center">
          <ActivityIndicator color={colors.primary} size="large" />
        </View>
      ) : (
        <FlatList
          data={filtered}
          keyExtractor={item => item.id}
          refreshControl={
            <RefreshControl
              refreshing={list.refreshing}
              onRefresh={() => void list.refresh()}
              tintColor={colors.primary}
            />
          }
          contentContainerStyle={{
            paddingHorizontal: 20,
            paddingTop: 8,
            paddingBottom: 32 + Math.max(insets.bottom, 8),
            flexGrow: 1,
          }}
          ListHeaderComponent={
            <View className="mb-4 gap-3">
              <SuppliersSummaryCards
                monthSpend={list.monthSpend}
                supplierCount={list.suppliers.length}
                monthLabel={currentMonthLabel()}
              />

              <View className="flex-row items-center rounded-full bg-surface px-4 py-3">
                <Search color={colors.textSubtle} size={18} strokeWidth={1.8} />
                <TextInput
                  value={search}
                  onChangeText={setSearch}
                  placeholder="Search suppliers"
                  placeholderTextColor={colors.textSubtle}
                  className="ml-2.5 flex-1 text-[15px] text-text"
                  autoCapitalize="none"
                  autoCorrect={false}
                  clearButtonMode="while-editing"
                />
              </View>

              {list.error ? (
                <Text className="text-[13px] text-danger">{list.error}</Text>
              ) : null}
            </View>
          }
          renderItem={({ item, index }) => (
            <View
              className={
                filtered.length === 1
                  ? 'overflow-hidden rounded-[22px] bg-surface'
                  : index === 0
                    ? 'overflow-hidden rounded-t-[22px] bg-surface'
                    : index === filtered.length - 1
                      ? 'overflow-hidden rounded-b-[22px] bg-surface'
                      : 'overflow-hidden bg-surface'
              }
            >
              <SupplierRow
                supplier={item}
                showDivider={index < filtered.length - 1}
                onPress={() =>
                  navigation.navigate('SupplierDetail', {
                    supplierId: item.id,
                  })
                }
              />
            </View>
          )}
          ListEmptyComponent={
            <View className="mt-2 items-center rounded-[22px] bg-surface px-6 py-10">
              <Text className="text-[16px] font-semibold text-text">
                {search.trim() ? 'No matches' : 'No suppliers yet'}
              </Text>
              <Text className="mt-2 text-center text-[13px] text-text-muted">
                {search.trim()
                  ? 'Try another name or phone.'
                  : 'Add who you buy from, then link them when you restock.'}
              </Text>
              {!search.trim() ? (
                <Pressable
                  className="mt-4 rounded-2xl bg-primary px-4 py-3 active:opacity-90"
                  onPress={() => setAddOpen(true)}
                >
                  <Text className="text-[14px] font-semibold text-white">
                    Add supplier
                  </Text>
                </Pressable>
              ) : null}
            </View>
          }
        />
      )}

      <SupplierFormSheet
        open={addOpen}
        mode="add"
        onClose={() => setAddOpen(false)}
        onSaved={() => {
          void list.refresh();
        }}
      />
    </View>
  );
}
