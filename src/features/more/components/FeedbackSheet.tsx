import { MessageSquarePlus, X } from 'lucide-react-native';
import { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Modal,
  Pressable,
  Text,
  TextInput,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { colors } from '../../../theme/colors';
import {
  feedbackKindLabel,
  sendFeedbackEmail,
  type FeedbackKind,
} from '../help/contact';

type FeedbackSheetProps = {
  open: boolean;
  shopName?: string | null;
  role?: string | null;
  onClose: () => void;
};

const KINDS: FeedbackKind[] = ['confused', 'bug', 'idea'];

export function FeedbackSheet({
  open,
  shopName,
  role,
  onClose,
}: FeedbackSheetProps) {
  const insets = useSafeAreaInsets();
  const [kind, setKind] = useState<FeedbackKind>('confused');
  const [message, setMessage] = useState('');
  const [sending, setSending] = useState(false);

  useEffect(() => {
    if (!open) return;
    setKind('confused');
    setMessage('');
  }, [open]);

  async function onSend() {
    const trimmed = message.trim();
    if (trimmed.length < 8) {
      Alert.alert('Say a bit more', 'Tell us what happened in a short sentence.');
      return;
    }
    setSending(true);
    try {
      await sendFeedbackEmail({
        kind,
        message: trimmed,
        shopName,
        role,
      });
      onClose();
      Alert.alert(
        'Thanks',
        'Your mail app should open with the message ready. Send it when you’re done.',
      );
    } catch (e) {
      Alert.alert(
        "Couldn't open mail",
        e instanceof Error ? e.message : 'Try again, or email us from your mail app.',
      );
    } finally {
      setSending(false);
    }
  }

  return (
    <Modal visible={open} animationType="slide" transparent onRequestClose={onClose}>
      <Pressable className="flex-1 justify-end bg-black/40" onPress={onClose}>
        <Pressable
          className="rounded-t-[28px] bg-background"
          style={{ paddingBottom: Math.max(insets.bottom, 16) }}
          onPress={e => e.stopPropagation()}
        >
          <View className="items-center pt-3">
            <View className="h-1.5 w-10 rounded-full bg-text/15" />
          </View>

          <View className="flex-row items-start justify-between px-5 pb-2 pt-4">
            <View className="min-w-0 flex-1 pr-3">
              <View className="flex-row items-center gap-2">
                <MessageSquarePlus
                  color={colors.primary}
                  size={20}
                  strokeWidth={1.8}
                />
                <Text className="text-[20px] font-bold text-text">
                  Send feedback
                </Text>
              </View>
              <Text className="mt-1 text-[13px] text-text-muted">
                Bugs, confusion, or ideas — we read every note.
              </Text>
            </View>
            <Pressable
              className="h-9 w-9 items-center justify-center rounded-full bg-surface active:opacity-80"
              onPress={onClose}
            >
              <X color={colors.text} size={18} strokeWidth={1.8} />
            </Pressable>
          </View>

          <View className="gap-4 px-5 pt-2">
            <View>
              <Text className="mb-1.5 text-[12px] font-medium text-text-muted">
                What’s this about?
              </Text>
              <View className="flex-row flex-wrap gap-2">
                {KINDS.map(option => {
                  const selected = kind === option;
                  return (
                    <Pressable
                      key={option}
                      onPress={() => setKind(option)}
                      className={
                        selected
                          ? 'rounded-full bg-primary px-3.5 py-2'
                          : 'rounded-full border border-text/10 bg-surface px-3.5 py-2'
                      }
                    >
                      <Text
                        className={
                          selected
                            ? 'text-[13px] font-semibold text-white'
                            : 'text-[13px] font-medium text-text'
                        }
                      >
                        {feedbackKindLabel(option)}
                      </Text>
                    </Pressable>
                  );
                })}
              </View>
            </View>

            <View>
              <Text className="mb-1.5 text-[12px] font-medium text-text-muted">
                Your message
              </Text>
              <TextInput
                value={message}
                onChangeText={setMessage}
                placeholder="What went wrong, or what would help?"
                placeholderTextColor={colors.textSubtle}
                multiline
                textAlignVertical="top"
                className="min-h-[120px] rounded-2xl border border-text/10 bg-surface px-4 py-3.5 text-[15px] text-text"
              />
              <Text className="mt-2 text-[11px] text-text-subtle">
                We’ll include your shop name, role, and phone type automatically.
              </Text>
            </View>

            <Pressable
              className="h-12 items-center justify-center rounded-2xl bg-primary active:opacity-90"
              onPress={() => void onSend()}
              disabled={sending}
            >
              {sending ? (
                <ActivityIndicator color={colors.white} />
              ) : (
                <Text className="text-[15px] font-semibold text-white">
                  Continue
                </Text>
              )}
            </Pressable>
          </View>
        </Pressable>
      </Pressable>
    </Modal>
  );
}
