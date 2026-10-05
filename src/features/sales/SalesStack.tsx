import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { RecordSaleScreen } from './RecordSaleScreen';
import { SaleDetailScreen } from './SaleDetailScreen';
import { SalesScreen } from './SalesScreen';

export type SalesStackParamList = {
  SalesList: undefined;
  RecordSale: { productId?: string; customerId?: string } | undefined;
  SaleDetail: { saleId: string; pending?: boolean };
};

const Stack = createNativeStackNavigator<SalesStackParamList>();

export function SalesStack() {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen name="SalesList" component={SalesScreen} />
      <Stack.Screen name="RecordSale" component={RecordSaleScreen} />
      <Stack.Screen name="SaleDetail" component={SaleDetailScreen} />
    </Stack.Navigator>
  );
}
