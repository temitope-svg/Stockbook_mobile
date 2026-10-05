import { ChevronDown } from 'lucide-react-native';
import { useMemo, useState } from 'react';
import {
  FlatList,
  Modal,
  Pressable,
  Text,
  TextInput,
  View,
} from 'react-native';
import {
  AFRICAN_COUNTRIES,
  DEFAULT_COUNTRY,
  formatLocalDisplay,
  parsePhone,
  toE164,
  type AfricanCountry,
} from '../../lib/phone';
import { colors } from '../../theme/colors';

type PhoneFieldProps = {
  label?: string;
  value: string;
  onChange: (e164: string) => void;
  error?: string;
};

export function PhoneField({
  label = 'Phone number',
  value,
  onChange,
  error,
}: PhoneFieldProps) {
  const parsed = useMemo(() => parsePhone(value || ''), [value]);
  const [country, setCountry] = useState<AfricanCountry>(
    value ? parsed.country : DEFAULT_COUNTRY,
  );
  const [local, setLocal] = useState(value ? parsed.local : '');
  const [pickerOpen, setPickerOpen] = useState(false);

  function commit(nextCountry: AfricanCountry, nextLocal: string) {
    setCountry(nextCountry);
    setLocal(nextLocal);
    onChange(toE164(nextCountry.dial, nextLocal));
  }

  return (
    <View className="w-full">
      <Text className="mb-2 text-[14px] font-semibold text-text">{label}</Text>
      <View
        className={
          error
            ? 'flex-row items-center rounded-xl border border-danger bg-surface'
            : 'flex-row items-center rounded-xl border border-text/10 bg-surface'
        }
      >
        <Pressable
          accessibilityRole="button"
          className="flex-row items-center gap-1 border-r border-text/10 px-3 py-3.5 active:opacity-70"
          onPress={() => setPickerOpen(true)}
        >
          <Text className="text-[16px]">{country.flag}</Text>
          <Text className="text-[14px] font-medium text-text">
            +{country.dial}
          </Text>
          <ChevronDown color={colors.textSubtle} size={16} strokeWidth={2} />
        </Pressable>
        <TextInput
          value={formatLocalDisplay(local)}
          onChangeText={text => {
            const digits = text.replace(/\D/g, '').replace(/^0+/, '');
            commit(country, digits.slice(0, country.localLength));
          }}
          keyboardType="phone-pad"
          placeholder="801 234 5678"
          placeholderTextColor={colors.textSubtle}
          className="flex-1 px-3 py-3.5 text-[16px] text-text"
        />
      </View>
      {error ? (
        <Text className="mt-1.5 text-[13px] text-danger">{error}</Text>
      ) : null}

      <Modal
        visible={pickerOpen}
        animationType="slide"
        transparent
        onRequestClose={() => setPickerOpen(false)}
      >
        <Pressable
          className="flex-1 justify-end bg-black/40"
          onPress={() => setPickerOpen(false)}
        >
          <Pressable
            className="max-h-[70%] rounded-t-3xl bg-surface px-4 pb-8 pt-4"
            onPress={e => e.stopPropagation()}
          >
            <Text className="mb-3 text-center text-[16px] font-semibold text-text">
              Country code
            </Text>
            <FlatList
              data={AFRICAN_COUNTRIES}
              keyExtractor={item => item.code}
              renderItem={({ item }) => {
                const selected = item.code === country.code;
                return (
                  <Pressable
                    className={
                      selected
                        ? 'flex-row items-center gap-3 rounded-xl bg-primary-tint px-3 py-3'
                        : 'flex-row items-center gap-3 rounded-xl px-3 py-3'
                    }
                    onPress={() => {
                      commit(item, local.slice(0, item.localLength));
                      setPickerOpen(false);
                    }}
                  >
                    <Text className="text-[20px]">{item.flag}</Text>
                    <View className="flex-1">
                      <Text className="text-[15px] font-medium text-text">
                        {item.name}
                      </Text>
                      <Text className="text-[13px] text-text-muted">
                        +{item.dial}
                      </Text>
                    </View>
                  </Pressable>
                );
              }}
            />
          </Pressable>
        </Pressable>
      </Modal>
    </View>
  );
}
