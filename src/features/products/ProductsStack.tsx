import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { ProductDetailScreen } from './ProductDetailScreen';
import { ProductFormScreen } from './ProductFormScreen';
import { ProductsScreen } from './ProductsScreen';

export type ProductsStackParamList = {
  ProductsList: undefined;
  ProductDetail: { productId: string };
  ProductForm: { productId?: string } | undefined;
};

const Stack = createNativeStackNavigator<ProductsStackParamList>();

export function ProductsStack() {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen name="ProductsList" component={ProductsScreen} />
      <Stack.Screen name="ProductDetail" component={ProductDetailScreen} />
      <Stack.Screen name="ProductForm" component={ProductFormScreen} />
    </Stack.Navigator>
  );
}
