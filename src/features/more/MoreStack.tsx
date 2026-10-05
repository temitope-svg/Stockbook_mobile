import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { InsightsScreen } from '../insights/InsightsScreen';
import { SupplierDetailScreen } from '../suppliers/SupplierDetailScreen';
import { SuppliersScreen } from '../suppliers/SuppliersScreen';
import { TeamScreen } from '../team/TeamScreen';
import { CategorySettingsScreen } from './CategorySettingsScreen';
import { HelpScreen } from './HelpScreen';
import { MoreScreen } from './MoreScreen';
import { NotificationsScreen } from './NotificationsScreen';
import { SettingsScreen } from './SettingsScreen';

export type MoreStackParamList = {
  MoreHome: undefined;
  Notifications: undefined;
  Settings: undefined;
  CategorySettings: undefined;
  Insights: undefined;
  SuppliersList: undefined;
  SupplierDetail: { supplierId: string };
  Team: undefined;
  Help: undefined;
};

const Stack = createNativeStackNavigator<MoreStackParamList>();

export function MoreStack() {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen name="MoreHome" component={MoreScreen} />
      <Stack.Screen name="Notifications" component={NotificationsScreen} />
      <Stack.Screen name="Settings" component={SettingsScreen} />
      <Stack.Screen name="CategorySettings" component={CategorySettingsScreen} />
      <Stack.Screen name="Insights" component={InsightsScreen} />
      <Stack.Screen name="SuppliersList" component={SuppliersScreen} />
      <Stack.Screen name="SupplierDetail" component={SupplierDetailScreen} />
      <Stack.Screen name="Team" component={TeamScreen} />
      <Stack.Screen name="Help" component={HelpScreen} />
    </Stack.Navigator>
  );
}
