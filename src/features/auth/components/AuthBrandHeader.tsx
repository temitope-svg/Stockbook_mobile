import { Image, Text, View } from 'react-native';

const logoSource = require('../../../assets/brand/logo.png');

export function AuthBrandHeader() {
  return (
    <View className="flex-row items-center justify-center gap-2.5">
      <Image
        accessibilityLabel="StockBook"
        source={logoSource}
        style={{ width: 36, height: 36 }}
        resizeMode="contain"
      />
      <Text className="text-[20px] font-bold tracking-tight text-text">
        StockBook
      </Text>
    </View>
  );
}
