import { Linking, Platform, Share } from 'react-native';
import { SUPPORT_EMAIL, SUPPORT_WHATSAPP } from '../../../config/env';

export type FeedbackKind = 'confused' | 'bug' | 'idea';

export type FeedbackContext = {
  shopName?: string | null;
  role?: string | null;
  message: string;
  kind: FeedbackKind;
};

export function feedbackKindLabel(kind: FeedbackKind) {
  if (kind === 'bug') return 'Something broken';
  if (kind === 'idea') return 'Idea';
  return 'I’m confused';
}

function buildBody(ctx: FeedbackContext) {
  return [
    ctx.message.trim(),
    '',
    '—',
    `Type: ${feedbackKindLabel(ctx.kind)}`,
    `Shop: ${ctx.shopName?.trim() || '—'}`,
    `Role: ${ctx.role || '—'}`,
    `Device: ${Platform.OS}`,
  ].join('\n');
}

export async function sendFeedbackEmail(ctx: FeedbackContext) {
  const subject = encodeURIComponent(
    `StockBook feedback · ${feedbackKindLabel(ctx.kind)}`,
  );
  const body = encodeURIComponent(buildBody(ctx));
  const url = `mailto:${SUPPORT_EMAIL}?subject=${subject}&body=${body}`;
  const can = await Linking.canOpenURL(url);
  if (!can) {
    await Share.share({
      message: `To: ${SUPPORT_EMAIL}\n\n${buildBody(ctx)}`,
    });
    return;
  }
  await Linking.openURL(url);
}

export async function openSupportEmail(shopName?: string | null) {
  const subject = encodeURIComponent('StockBook help');
  const body = encodeURIComponent(
    [
      'Hi StockBook team,',
      '',
      '',
      '—',
      `Shop: ${shopName?.trim() || '—'}`,
      `Device: ${Platform.OS}`,
    ].join('\n'),
  );
  const url = `mailto:${SUPPORT_EMAIL}?subject=${subject}&body=${body}`;
  const can = await Linking.canOpenURL(url);
  if (!can) {
    await Share.share({ message: `Email ${SUPPORT_EMAIL}` });
    return;
  }
  await Linking.openURL(url);
}

export function hasWhatsAppSupport() {
  return SUPPORT_WHATSAPP.trim().length >= 10;
}

export async function openSupportWhatsApp(shopName?: string | null) {
  if (!hasWhatsAppSupport()) return;
  const text = encodeURIComponent(
    `Hi StockBook, I need help with my shop${
      shopName?.trim() ? ` (${shopName.trim()})` : ''
    }.`,
  );
  const url = `https://wa.me/${SUPPORT_WHATSAPP.replace(/\D/g, '')}?text=${text}`;
  const can = await Linking.canOpenURL(url);
  if (!can) {
    throw new Error('Could not open WhatsApp on this device.');
  }
  await Linking.openURL(url);
}
