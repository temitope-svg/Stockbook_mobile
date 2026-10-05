import { decode } from 'base64-arraybuffer';
import { supabase } from './supabase';
import type { ProductImageUpload } from './uploadProductImage';

function extensionFor(image: ProductImageUpload): string {
  const fromName = image.fileName?.split('.').pop()?.toLowerCase();
  if (
    fromName &&
    /^[a-z0-9]+$/.test(fromName) &&
    fromName !== 'heic' &&
    fromName !== 'heif'
  ) {
    return fromName === 'jpeg' ? 'jpg' : fromName;
  }
  if (image.contentType.includes('png')) return 'png';
  if (image.contentType.includes('webp')) return 'webp';
  return 'jpg';
}

function contentTypeFor(image: ProductImageUpload, ext: string): string {
  if (ext === 'png') return 'image/png';
  if (ext === 'webp') return 'image/webp';
  if (
    image.contentType.startsWith('image/') &&
    !image.contentType.includes('heic') &&
    !image.contentType.includes('heif')
  ) {
    return image.contentType;
  }
  return 'image/jpeg';
}

function newId(): string {
  const cryptoApi = globalThis as typeof globalThis & {
    crypto?: { randomUUID?: () => string };
  };
  if (typeof cryptoApi.crypto?.randomUUID === 'function') {
    return cryptoApi.crypto.randomUUID();
  }
  return `${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;
}

/** Upload to `customer-photos` bucket (optional on create/edit). */
export async function uploadCustomerPhoto(
  shopId: string,
  image: ProductImageUpload,
): Promise<string | null> {
  const ext = extensionFor(image);
  const path = `${shopId}/${newId()}.${ext}`;
  const contentType = contentTypeFor(image, ext);

  const { error } = await supabase.storage
    .from('customer-photos')
    .upload(path, decode(image.base64), {
      upsert: false,
      contentType,
    });

  if (error) {
    console.warn('Customer photo upload failed:', error.message);
    return null;
  }

  const { data } = supabase.storage.from('customer-photos').getPublicUrl(path);
  return `${data.publicUrl}?t=${Date.now()}`;
}
