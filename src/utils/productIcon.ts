import {
  Box,
  Cable,
  Gem,
  Headphones,
  Shirt,
  Smartphone,
  type LucideIcon,
} from 'lucide-react-native';
import { colors } from '../theme/colors';

export type ProductIconTone = {
  Icon: LucideIcon;
  iconColor: string;
  bgClass: string;
};

function pickIcon(name: string, category: string | null): LucideIcon {
  const text = `${name} ${category ?? ''}`.toLowerCase();
  if (/jewell?ery|gold|chain|ring|diamond|watch/.test(text)) return Gem;
  if (/cloth|fashion|abaya|shirt|wear|dress|kids/.test(text)) return Shirt;
  if (/charg|cable|plug|adapter|cord/.test(text)) return Cable;
  if (/ear|headphone|airpod|bud|headset/.test(text)) return Headphones;
  if (/phone|iphone|samsung|tecno|infinix|redmi|gadget/.test(text)) {
    return Smartphone;
  }
  return Box;
}

const tones: Array<{ iconColor: string; bgClass: string }> = [
  { iconColor: colors.primary, bgClass: 'bg-primary-tint' },
  { iconColor: colors.accent, bgClass: 'bg-accent-tint' },
  { iconColor: '#0f766e', bgClass: 'bg-teal-tint' },
  { iconColor: colors.danger, bgClass: 'bg-danger-tint' },
];

function hash(value: string) {
  let h = 0;
  for (let i = 0; i < value.length; i++) h = (h * 31 + value.charCodeAt(i)) | 0;
  return h;
}

export function productIconMeta(
  name: string,
  category: string | null,
): ProductIconTone {
  const Icon = pickIcon(name, category);
  const tone = tones[Math.abs(hash(name)) % tones.length];
  return { Icon, iconColor: tone.iconColor, bgClass: tone.bgClass };
}
