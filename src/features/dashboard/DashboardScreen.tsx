import { useCallback } from 'react';
import {
  ActivityIndicator,
  RefreshControl,
  ScrollView,
  Text,
  View,
} from 'react-native';
import type { BottomTabNavigationProp } from '@react-navigation/bottom-tabs';
import { useNavigation } from '@react-navigation/native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { permissionsFor } from '../../auth/permissions';
import { useAuth } from '../../auth/AuthContext';
import { pushInTab } from '../../navigation/pushInTab';
import type { AppTabParamList } from '../app/AppTabs';
import { colors } from '../../theme/colors';
import { DashboardHeader } from './components/DashboardHeader';
import { NeedsAttention } from './components/NeedsAttention';
import { QuickActions } from './components/QuickActions';
import { RecentSales } from './components/RecentSales';
import { SalesHeroCard } from './components/SalesHeroCard';
import { SnapshotCards } from './components/SnapshotCards';
import { useAttentionItems } from './hooks/useAttentionItems';
import { useDashboardData } from './hooks/useDashboardData';

export function DashboardScreen() {
  const insets = useSafeAreaInsets();
  const navigation =
    useNavigation<BottomTabNavigationProp<AppTabParamList>>();
  const { profile, role } = useAuth();
  const permissions = permissionsFor(role);
  const { data, loading, error, refresh } = useDashboardData();
  const attention = useAttentionItems();

  const onRefresh = useCallback(() => {
    void refresh();
    void attention.refresh();
  }, [refresh, attention]);

  const shopName = profile?.shop_name ?? 'Your shop';
  const notificationCount = attention.items.length;

  if (loading && data.todaySales === 0 && data.recentSales.length === 0) {
    return (
      <View
        className="flex-1 items-center justify-center bg-background"
        style={{ paddingTop: insets.top }}
      >
        <ActivityIndicator color={colors.primary} size="large" />
      </View>
    );
  }

  return (
    <View className="flex-1 bg-background" style={{ paddingTop: insets.top }}>
      <ScrollView
        className="flex-1"
        contentContainerStyle={{ paddingBottom: 28 }}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={loading}
            onRefresh={onRefresh}
            tintColor={colors.primary}
          />
        }
      >
        <DashboardHeader
          shopName={shopName}
          notificationCount={notificationCount}
          onNotificationsPress={() =>
            pushInTab(
              navigation,
              'MoreTab',
              'MoreHome',
              'Notifications',
            )
          }
        />

        {error ? (
          <Text className="mx-5 mt-4 text-[13px] text-danger">{error}</Text>
        ) : null}

        <View className="mt-5">
          <SalesHeroCard
            todaySales={data.todaySales}
            yesterdaySales={data.yesterdaySales}
            saleCount={data.todaySaleCount}
          />
        </View>

        <View className="mt-3">
          <SnapshotCards
            totalOwed={data.totalOwed}
            overdueCount={data.overdueCount}
            lowStockCount={data.lowStockCount}
            productsInStock={data.productsInStock}
            onOwedPress={() =>
              navigation.navigate('CustomersTab', { screen: 'CustomersList' })
            }
            onLowStockPress={() =>
              navigation.navigate('ProductsTab', { screen: 'ProductsList' })
            }
          />
        </View>

        <View className="mt-5">
          <QuickActions
            onSale={() =>
              pushInTab(navigation, 'SalesTab', 'SalesList', 'RecordSale')
            }
            onProduct={
              permissions.canEditProducts
                ? () =>
                    pushInTab(
                      navigation,
                      'ProductsTab',
                      'ProductsList',
                      'ProductForm',
                    )
                : undefined
            }
            onPayment={() =>
              navigation.navigate('CustomersTab', { screen: 'CustomersList' })
            }
            onRestock={() =>
              navigation.navigate('ProductsTab', { screen: 'ProductsList' })
            }
          />
        </View>

        <View className="mt-7">
          <RecentSales
            sales={data.recentSales}
            onViewAll={() =>
              navigation.navigate('SalesTab', { screen: 'SalesList' })
            }
            onSalePress={saleId =>
              pushInTab(navigation, 'SalesTab', 'SalesList', 'SaleDetail', {
                saleId,
              })
            }
          />
        </View>

        <View className="mt-7">
          <NeedsAttention
            items={attention.items}
            onItemPress={item => {
              if (item.kind === 'low_stock' && item.productId) {
                pushInTab(
                  navigation,
                  'ProductsTab',
                  'ProductsList',
                  'ProductDetail',
                  { productId: item.productId },
                );
                return;
              }
              if (item.kind === 'debt' && item.customerId) {
                pushInTab(
                  navigation,
                  'CustomersTab',
                  'CustomersList',
                  'CustomerDetail',
                  { customerId: item.customerId },
                );
              }
            }}
          />
        </View>
      </ScrollView>
    </View>
  );
}
