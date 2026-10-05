import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import type { NavigatorScreenParams } from '@react-navigation/native';
import { Platform } from 'react-native';
import { CustomersStack, type CustomersStackParamList } from '../customers/CustomersStack';
import { DashboardScreen } from '../dashboard/DashboardScreen';
import { MoreStack, type MoreStackParamList } from '../more/MoreStack';
import { ProductsStack, type ProductsStackParamList } from '../products/ProductsStack';
import { SalesStack, type SalesStackParamList } from '../sales/SalesStack';
import { BubbleTabBar } from './BubbleTabBar';
import { TAB_BAR_STYLE } from './tabBarTheme';

export type AppTabParamList = {
  HomeTab: undefined;
  ProductsTab: NavigatorScreenParams<ProductsStackParamList> | undefined;
  SalesTab: NavigatorScreenParams<SalesStackParamList> | undefined;
  CustomersTab: NavigatorScreenParams<CustomersStackParamList> | undefined;
  MoreTab: NavigatorScreenParams<MoreStackParamList> | undefined;
};

const Tab = createBottomTabNavigator<AppTabParamList>();

export function AppTabs() {
  return (
    <Tab.Navigator
      tabBar={props => <BubbleTabBar {...props} />}
      screenOptions={{
        headerShown: false,
        tabBarShowLabel: false,
        animation: 'shift',
        transitionSpec: {
          animation: 'timing',
          config: { duration: 220 },
        },
        tabBarStyle: TAB_BAR_STYLE,
        tabBarHideOnKeyboard: Platform.OS === 'android',
      }}
    >
      <Tab.Screen name="HomeTab" component={DashboardScreen} />
      <Tab.Screen name="ProductsTab" component={ProductsStack} />
      <Tab.Screen
        name="SalesTab"
        component={SalesStack}
        listeners={({ navigation }) => ({
          tabPress: () => {
            const state = navigation.getState();
            const tabRoute = state.routes.find(r => r.name === 'SalesTab');
            const nested = tabRoute?.state;
            const activeName =
              nested && 'index' in nested && Array.isArray(nested.routes)
                ? nested.routes[nested.index ?? 0]?.name
                : undefined;
            if (activeName === 'RecordSale') return;
            navigation.navigate('SalesTab', { screen: 'SalesList' });
          },
        })}
      />
      <Tab.Screen name="CustomersTab" component={CustomersStack} />
      <Tab.Screen name="MoreTab" component={MoreStack} />
    </Tab.Navigator>
  );
}
