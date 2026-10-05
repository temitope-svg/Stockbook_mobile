import { ArrowLeft, Camera, Shirt, Smartphone } from 'lucide-react-native';
import { useEffect, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Image,
  Pressable,
  ScrollView,
  Text,
  TextInput,
  View,
} from 'react-native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import {
  launchCamera,
  launchImageLibrary,
  type Asset,
  type ImagePickerResponse,
} from 'react-native-image-picker';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useAuth } from '../../auth/AuthContext';
import { supabase } from '../../lib/supabase';
import {
  uploadProductImage,
  type ProductImageUpload,
} from '../../lib/uploadProductImage';
import { colors } from '../../theme/colors';
import type {
  CustomFieldValues,
  ProductCondition,
} from '../../types/domain';
import {
  enabledCustomFields,
  normalizeCustomProductFields,
} from '../../utils/customProductFields';
import { formatNaira } from '../../utils/money';
import {
  categoriesForProductForm,
  estimatedProfit,
  nicheFieldsFor,
} from './utils/productForm';
import type { ProductsStackParamList } from './ProductsStack';
import {
  goBackInStack,
  resetToDetail,
} from '../../navigation/pushInTab';
import { TAB_BAR_STYLE } from '../app/tabBarTheme';


const PICKER_OPTIONS = {
  mediaType: 'photo' as const,
  includeBase64: true,
  maxWidth: 1600,
  maxHeight: 1600,
  quality: 0.8 as const,
};

type Props = NativeStackScreenProps<ProductsStackParamList, 'ProductForm'>;

const CONDITION_OPTIONS: { value: ProductCondition; label: string }[] = [
  { value: 'new', label: 'New' },
  { value: 'uk_used', label: 'UK Used' },
  { value: 'nigerian_used', label: 'Nigerian Used' },
];

export function ProductFormScreen({ navigation, route }: Props) {
  const insets = useSafeAreaInsets();
  const { profile, shopId } = useAuth();
  const productId = route.params?.productId;
  const isEdit = Boolean(productId);

  const businessType = profile?.business_type ?? 'general';
  const niche = nicheFieldsFor(businessType, profile?.field_overrides);
  const customFieldDefs = useMemo(
    () =>
      enabledCustomFields(
        normalizeCustomProductFields(profile?.custom_product_fields),
      ),
    [profile?.custom_product_fields],
  );
  const showNicheBlock =
    niche.variant || niche.condition || niche.imei || Boolean(niche.title);

  const [loading, setLoading] = useState(isEdit);
  const [saving, setSaving] = useState(false);
  const [name, setName] = useState('');
  const [category, setCategory] = useState('');
  const [categoryOpen, setCategoryOpen] = useState(false);
  const [costText, setCostText] = useState('');
  const [sellingText, setSellingText] = useState('');
  const [qtyText, setQtyText] = useState(isEdit ? '' : '0');
  const [variant, setVariant] = useState('');
  const [imei, setImei] = useState('');
  const [condition, setCondition] = useState<ProductCondition | null>(
    niche.condition ? 'new' : null,
  );
  const [customValues, setCustomValues] = useState<CustomFieldValues>({});
  const [existingImageUrl, setExistingImageUrl] = useState<string | null>(null);
  const [pendingImage, setPendingImage] = useState<ProductImageUpload | null>(
    null,
  );
  const [previewUri, setPreviewUri] = useState<string | null>(null);

  const categories = useMemo(
    () =>
      categoriesForProductForm(
        businessType,
        category,
        profile?.category_settings,
      ),
    [businessType, category, profile?.category_settings],
  );

  useEffect(() => {
    const parent = navigation.getParent();
    parent?.setOptions({ tabBarStyle: { display: 'none' } });
    return () => {
      parent?.setOptions({ tabBarStyle: TAB_BAR_STYLE });
    };
  }, [navigation]);

  useEffect(() => {
    if (!category && categories[0]) setCategory(categories[0]);
  }, [categories, category]);

  useEffect(() => {
    if (!isEdit || !productId || !shopId) return;

    let cancelled = false;
    (async () => {
      setLoading(true);
      const { data, error } = await supabase
        .from('products')
        .select('*')
        .eq('id', productId)
        .eq('user_id', shopId)
        .maybeSingle();

      if (cancelled) return;
      if (error || !data) {
        setLoading(false);
        Alert.alert('Not found', 'This product could not be loaded.');
        goBackInStack(navigation, 'ProductsList');
        return;
      }

      setName(data.name);
      setCategory(data.category || categories[0] || '');
      setCostText(String(Math.round(Number(data.cost_price))));
      setSellingText(String(Math.round(Number(data.selling_price))));
      setQtyText(String(data.quantity));
      setVariant(data.variant ?? '');
      setImei(data.imei ?? '');
      setCondition(data.condition);
      setCustomValues(
        (data.custom_fields as CustomFieldValues | null) ?? {},
      );
      setExistingImageUrl(data.image_url ?? null);
      setPendingImage(null);
      setPreviewUri(data.image_url ?? null);
      setLoading(false);
    })();

    return () => {
      cancelled = true;
    };
  }, [isEdit, productId, shopId, navigation, categories]);

  const cost = Number(costText) || 0;
  const selling = Number(sellingText) || 0;
  const quantity = Number(qtyText) || 0;
  const { profit, margin } = estimatedProfit(cost, selling);

  function applyPickedAsset(asset: Asset | undefined) {
    if (!asset?.uri || !asset.base64) {
      Alert.alert('Photo failed', 'Could not read that image. Try another one.');
      return;
    }
    setPendingImage({
      base64: asset.base64,
      contentType: asset.type || 'image/jpeg',
      fileName: asset.fileName,
    });
    setPreviewUri(asset.uri);
  }

  function handlePickerResult(result: ImagePickerResponse) {
    if (result.didCancel) return;
    if (result.errorCode) {
      Alert.alert(
        'Photo unavailable',
        result.errorMessage ?? 'Check camera or photo permissions and try again.',
      );
      return;
    }
    applyPickedAsset(result.assets?.[0]);
  }

  function onAddPhoto() {
    Alert.alert('Add photo', 'Choose a source', [
      {
        text: 'Camera',
        onPress: () => {
          void launchCamera(PICKER_OPTIONS).then(handlePickerResult);
        },
      },
      {
        text: 'Photo library',
        onPress: () => {
          void launchImageLibrary(PICKER_OPTIONS).then(handlePickerResult);
        },
      },
      ...(previewUri
        ? [
            {
              text: 'Remove photo',
              style: 'destructive' as const,
              onPress: () => {
                setPendingImage(null);
                setExistingImageUrl(null);
                setPreviewUri(null);
              },
            },
          ]
        : []),
      { text: 'Cancel', style: 'cancel' },
    ]);
  }

  async function onSave() {
    if (!shopId) return;
    if (!name.trim()) {
      Alert.alert('Name required', 'Enter a product name.');
      return;
    }
    if (!category) {
      Alert.alert('Category required', 'Choose a category.');
      return;
    }

    setSaving(true);

    let imageUrl = existingImageUrl;
    if (pendingImage) {
      const uploaded = await uploadProductImage(shopId, pendingImage);
      if (!uploaded) {
        setSaving(false);
        Alert.alert(
          'Image upload failed',
          'Create the product-images storage bucket (run stockbook-product-images-migration.sql), then try again.',
        );
        return;
      }
      imageUrl = uploaded;
    }

    const custom_fields: CustomFieldValues = {};
    for (const field of customFieldDefs) {
      const value = customValues[field.id]?.trim();
      if (value) custom_fields[field.id] = value;
    }

    const payload = {
      name: name.trim(),
      category,
      cost_price: cost,
      selling_price: selling,
      condition: niche.condition ? condition : null,
      variant: niche.variant ? variant.trim() || null : null,
      imei: niche.imei ? imei.trim() || null : null,
      custom_fields,
      image_url: imageUrl,
    };

    if (isEdit && productId) {
      const { error } = await supabase
        .from('products')
        .update(payload)
        .eq('id', productId)
        .eq('user_id', shopId);
      setSaving(false);
      if (error) {
        Alert.alert("Couldn't save", error.message);
        return;
      }
      resetToDetail(navigation, 'ProductsList', 'ProductDetail', {
        productId,
      });
      return;
    }

    const { data: created, error } = await supabase
      .from('products')
      .insert({
        ...payload,
        quantity,
        user_id: shopId,
      })
      .select('id')
      .single();

    if (error || !created) {
      setSaving(false);
      Alert.alert("Couldn't save", error?.message ?? 'Try again.');
      return;
    }

    if (quantity > 0) {
      await supabase.from('stock_movements').insert({
        user_id: shopId,
        product_id: created.id,
        kind: 'in',
        quantity,
        reason: 'opening',
      });
    }

    setSaving(false);
    resetToDetail(navigation, 'ProductsList', 'ProductDetail', {
      productId: created.id,
    });
  }

  if (loading) {
    return (
      <View
        className="flex-1 items-center justify-center bg-background"
        style={{ paddingTop: insets.top }}
      >
        <ActivityIndicator color={colors.primary} size="large" />
      </View>
    );
  }

  const NicheIcon = businessType === 'phones_gadgets' ? Smartphone : Shirt;

  return (
    <View className="flex-1 bg-background" style={{ paddingTop: insets.top }}>
      <View className="flex-row items-center gap-3 px-4 py-2">
        <Pressable
          className="h-11 w-11 items-center justify-center rounded-full bg-surface active:opacity-80"
          onPress={() => goBackInStack(navigation, 'ProductsList')}
        >
          <ArrowLeft color={colors.text} size={20} strokeWidth={1.8} />
        </Pressable>
        <Text className="text-[18px] font-bold text-text">
          {isEdit ? 'Edit product' : 'Add product'}
        </Text>
      </View>

      <ScrollView
        keyboardShouldPersistTaps="handled"
        contentContainerStyle={{
          paddingHorizontal: 20,
          paddingBottom: 24 + Math.max(insets.bottom, 8),
        }}
      >
        <View className="mt-3 flex-row items-center gap-3">
          <Pressable
            className="h-24 w-24 items-center justify-center overflow-hidden rounded-2xl border border-dashed border-primary/40 bg-primary-tint/40 active:opacity-80"
            onPress={onAddPhoto}
          >
            {previewUri ? (
              <Image
                source={{ uri: previewUri }}
                className="h-full w-full"
                resizeMode="cover"
              />
            ) : (
              <>
                <Camera color={colors.primary} size={22} strokeWidth={1.8} />
                <Text className="mt-1 text-[11px] font-semibold text-primary">
                  Add photo
                </Text>
              </>
            )}
          </Pressable>
          <Text className="min-w-0 flex-1 text-[13px] leading-5 text-text-muted">
            A clear photo makes it faster to find the item when you&apos;re
            recording a sale.
          </Text>
        </View>

        <View className="mt-5">
          <Text className="mb-1.5 text-[12px] font-medium text-text-muted">
            Product name
          </Text>
          <TextInput
            value={name}
            onChangeText={setName}
            placeholder="e.g. Abaya"
            placeholderTextColor={colors.textSubtle}
            className="rounded-2xl border border-text/10 bg-surface px-4 py-3.5 text-[15px] text-text"
          />
        </View>

        <View className="mt-4">
          <Text className="mb-1.5 text-[12px] font-medium text-text-muted">
            Category
          </Text>
          <Pressable
            className="rounded-2xl border border-text/10 bg-surface px-4 py-3.5 active:opacity-90"
            onPress={() => setCategoryOpen(open => !open)}
          >
            <Text className="text-[15px] font-medium text-text">
              {category || 'Choose category'}
            </Text>
          </Pressable>
          {categoryOpen ? (
            <View className="mt-2 overflow-hidden rounded-2xl bg-surface">
              {categories.map(item => (
                <Pressable
                  key={item}
                  className="border-b border-text/5 px-4 py-3 active:bg-background"
                  onPress={() => {
                    setCategory(item);
                    setCategoryOpen(false);
                  }}
                >
                  <Text
                    className={
                      item === category
                        ? 'text-[14px] font-semibold text-primary'
                        : 'text-[14px] font-medium text-text'
                    }
                  >
                    {item}
                  </Text>
                </Pressable>
              ))}
            </View>
          ) : null}
        </View>

        <View className="mt-4 flex-row gap-3">
          <View className="flex-1">
            <Text className="mb-1.5 text-[12px] font-medium text-text-muted">
              Cost price
            </Text>
            <View className="flex-row items-center rounded-2xl border border-text/10 bg-surface px-3 py-3">
              <Text className="text-[15px] font-semibold text-text">₦</Text>
              <TextInput
                value={costText}
                onChangeText={text => setCostText(text.replace(/[^0-9]/g, ''))}
                keyboardType="number-pad"
                className="ml-1 flex-1 text-[15px] font-semibold text-text"
              />
            </View>
          </View>
          <View className="flex-1">
            <Text className="mb-1.5 text-[12px] font-medium text-text-muted">
              Selling price
            </Text>
            <View className="flex-row items-center rounded-2xl border border-text/10 bg-surface px-3 py-3">
              <Text className="text-[15px] font-semibold text-text">₦</Text>
              <TextInput
                value={sellingText}
                onChangeText={text =>
                  setSellingText(text.replace(/[^0-9]/g, ''))
                }
                keyboardType="number-pad"
                className="ml-1 flex-1 text-[15px] font-semibold text-text"
              />
            </View>
          </View>
        </View>

        {selling > 0 ? (
          <View className="mt-3 rounded-2xl bg-primary-tint px-4 py-3">
            <Text className="text-[13px] font-semibold text-primary">
              Estimated profit per unit {formatNaira(profit)} · {margin}%
            </Text>
          </View>
        ) : null}

        {!isEdit ? (
          <View className="mt-4">
            <Text className="mb-1.5 text-[12px] font-medium text-text-muted">
              Quantity in stock
            </Text>
            <TextInput
              value={qtyText}
              onChangeText={text => setQtyText(text.replace(/[^0-9]/g, ''))}
              keyboardType="number-pad"
              className="rounded-2xl border border-text/10 bg-surface px-4 py-3.5 text-[15px] font-semibold text-text"
            />
          </View>
        ) : null}

        {showNicheBlock ? (
          <View className="mt-5 rounded-2xl bg-surface px-4 py-4">
            <View className="mb-3 flex-row items-center gap-2">
              <NicheIcon color={colors.primary} size={16} strokeWidth={1.8} />
              <Text className="text-[13px] font-semibold text-text">
                {niche.title ?? 'Extra details'} · on for your shop
              </Text>
            </View>

            {niche.variant ? (
              <View className="mb-3">
                <Text className="mb-1.5 text-[12px] font-medium text-text-muted">
                  {niche.variantLabel}
                </Text>
                <TextInput
                  value={variant}
                  onChangeText={setVariant}
                  placeholder={
                    businessType === 'fashion' ? 'Black, M' : '128GB'
                  }
                  placeholderTextColor={colors.textSubtle}
                  className="rounded-2xl border border-text/10 bg-background px-4 py-3.5 text-[15px] text-text"
                />
              </View>
            ) : null}

            {niche.condition ? (
              <View className="mb-3">
                <Text className="mb-2 text-[12px] font-medium text-text-muted">
                  Condition
                </Text>
                <View className="flex-row flex-wrap gap-2">
                  {CONDITION_OPTIONS.map(option => {
                    const active = condition === option.value;
                    return (
                      <Pressable
                        key={option.value}
                        onPress={() => setCondition(option.value)}
                        className={
                          active
                            ? 'rounded-full bg-primary px-3.5 py-2'
                            : 'rounded-full border border-text/10 bg-background px-3.5 py-2'
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
              </View>
            ) : null}

            {niche.imei ? (
              <View>
                <Text className="mb-1.5 text-[12px] font-medium text-text-muted">
                  IMEI / serial
                </Text>
                <TextInput
                  value={imei}
                  onChangeText={setImei}
                  placeholder="Optional"
                  placeholderTextColor={colors.textSubtle}
                  className="rounded-2xl border border-text/10 bg-background px-4 py-3.5 text-[15px] text-text"
                />
              </View>
            ) : null}
          </View>
        ) : null}

        {customFieldDefs.length > 0 ? (
          <View className="mt-5 rounded-2xl bg-surface px-4 py-4">
            <Text className="mb-3 text-[13px] font-semibold text-text">
              Custom fields
            </Text>
            {customFieldDefs.map((field, index) => (
              <View
                key={field.id}
                className={index < customFieldDefs.length - 1 ? 'mb-3' : undefined}
              >
                <Text className="mb-1.5 text-[12px] font-medium text-text-muted">
                  {field.label}
                </Text>
                <TextInput
                  value={customValues[field.id] ?? ''}
                  onChangeText={text =>
                    setCustomValues(prev => ({ ...prev, [field.id]: text }))
                  }
                  placeholder="Optional"
                  placeholderTextColor={colors.textSubtle}
                  className="rounded-2xl border border-text/10 bg-background px-4 py-3.5 text-[15px] text-text"
                />
              </View>
            ))}
          </View>
        ) : null}

        <Pressable
          disabled={saving}
          className="mt-6 h-14 items-center justify-center rounded-2xl bg-primary active:opacity-90"
          onPress={() => void onSave()}
        >
          {saving ? (
            <ActivityIndicator color={colors.white} />
          ) : (
            <Text className="text-[16px] font-semibold text-white">
              Save product
            </Text>
          )}
        </Pressable>
      </ScrollView>
    </View>
  );
}
