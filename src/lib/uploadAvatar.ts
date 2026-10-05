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

/** Upload to `avatars` bucket. Path must use auth user id (storage RLS). */
export async function uploadAvatar(
  userId: string,
  image: ProductImageUpload,
): Promise<string | null> {
  const ext = extensionFor(image);
  const path = `${userId}/avatar.${ext}`;
  const contentType = contentTypeFor(image, ext);

  const { error } = await supabase.storage
    .from('avatars')
    .upload(path, decode(image.base64), {
      upsert: true,
      contentType,
    });

  if (error) {
    console.warn('Avatar upload failed:', error.message);
    return null;
  }

  const { data } = supabase.storage.from('avatars').getPublicUrl(path);
  return `${data.publicUrl}?t=${Date.now()}`;
}
