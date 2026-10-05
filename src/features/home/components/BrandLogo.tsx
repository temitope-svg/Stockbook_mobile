import { Image, View } from 'react-native';

const logoSource = require('../../../assets/brand/logo.png');

type BrandLogoProps = {
  size?: 'md' | 'lg';
};

export function BrandLogo({ size = 'lg' }: BrandLogoProps) {
  if (size === 'md') {
    return (
      <View className="h-12 w-12 items-center justify-center">
        <Image
          accessibilityLabel="StockBook"
          source={logoSource}
          style={{ width: 48, height: 48 }}
          resizeMode="contain"
        />
      </View>
    );
  }

  return (
    <View className="h-16 w-16 items-center justify-center">
      <Image
        accessibilityLabel="StockBook"
        source={logoSource}
        style={{ width: 64, height: 64 }}
        resizeMode="contain"
      />
    </View>
  );
}
