import { Camera } from 'lucide-react-native';
import {
  Alert,
  Image,
  Pressable,
  Text,
  View,
} from 'react-native';
import {
  launchCamera,
  launchImageLibrary,
  type Asset,
  type ImagePickerResponse,
} from 'react-native-image-picker';
import type { ProductImageUpload } from '../../../lib/uploadProductImage';
import { colors } from '../../../theme/colors';

const PICKER_OPTIONS = {
  mediaType: 'photo' as const,
  includeBase64: true,
  maxWidth: 1200,
  maxHeight: 1200,
  quality: 0.8 as const,
};

type CustomerPhotoFieldProps = {
  previewUri: string | null;
  onPicked: (image: ProductImageUpload, previewUri: string) => void;
  onCleared: () => void;
};

export function CustomerPhotoField({
  previewUri,
  onPicked,
  onCleared,
}: CustomerPhotoFieldProps) {
  function applyAsset(asset: Asset | undefined) {
    if (!asset?.uri || !asset.base64) {
      Alert.alert('Photo failed', 'Could not read that image. Try another one.');
      return;
    }
    onPicked(
      {
        base64: asset.base64,
        contentType: asset.type || 'image/jpeg',
        fileName: asset.fileName,
      },
      asset.uri,
    );
  }

  function handleResult(result: ImagePickerResponse) {
    if (result.didCancel) return;
    if (result.errorCode) {
      Alert.alert(
        'Photo unavailable',
        result.errorMessage ??
          'Check camera or photo permissions and try again.',
      );
      return;
    }
    applyAsset(result.assets?.[0]);
  }

  function onPress() {
    Alert.alert('Customer photo', 'Optional — skip anytime', [
      {
        text: 'Camera',
        onPress: () => {
          void launchCamera(PICKER_OPTIONS).then(handleResult);
        },
      },
      {
        text: 'Photo library',
        onPress: () => {
          void launchImageLibrary(PICKER_OPTIONS).then(handleResult);
        },
      },
      ...(previewUri
        ? [
            {
              text: 'Remove photo',
              style: 'destructive' as const,
              onPress: onCleared,
            },
          ]
        : []),
      { text: 'Cancel', style: 'cancel' },
    ]);
  }

  return (
    <View className="flex-row items-center gap-3">
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={previewUri ? 'Change customer photo' : 'Add customer photo'}
        className="h-20 w-20 items-center justify-center overflow-hidden rounded-full border border-dashed border-primary/40 bg-primary-tint/40 active:opacity-80"
        onPress={onPress}
      >
        {previewUri ? (
          <Image
            source={{ uri: previewUri }}
            className="h-full w-full"
            resizeMode="cover"
          />
        ) : (
          <Camera color={colors.primary} size={22} strokeWidth={1.8} />
        )}
      </Pressable>
      <View className="min-w-0 flex-1">
        <Text className="text-[13px] font-semibold text-text">
          {previewUri ? 'Photo added' : 'Add photo'}
        </Text>
        <Text className="mt-0.5 text-[12px] leading-4 text-text-muted">
          Optional · helps you recognise them quickly
        </Text>
      </View>
    </View>
  );
}
