import { ChevronDown, ChevronUp } from 'lucide-react-native';
import { useState } from 'react';
import { Pressable, Text, View } from 'react-native';
import { colors } from '../../../theme/colors';
import type { FaqItem, FaqSection } from '../help/faqContent';

type FaqAccordionProps = {
  sections: FaqSection[];
};

export function FaqAccordion({ sections }: FaqAccordionProps) {
  const [openId, setOpenId] = useState<string | null>(sections[0]?.items[0]?.id ?? null);

  function toggle(id: string) {
    setOpenId(current => (current === id ? null : id));
  }

  return (
    <View className="gap-5">
      {sections.map(section => (
        <View key={section.id}>
          <Text className="mb-1 text-[11px] font-semibold uppercase tracking-[0.14em] text-text-subtle">
            {section.title}
          </Text>
          <Text className="mb-2 text-[12px] text-text-muted">{section.subtitle}</Text>
          <View className="overflow-hidden rounded-[22px] bg-surface">
            {section.items.map((item, index) => (
              <FaqRow
                key={item.id}
                item={item}
                open={openId === item.id}
                showDivider={index < section.items.length - 1}
                onPress={() => toggle(item.id)}
              />
            ))}
          </View>
        </View>
      ))}
    </View>
  );
}

function FaqRow({
  item,
  open,
  showDivider,
  onPress,
}: {
  item: FaqItem;
  open: boolean;
  showDivider: boolean;
  onPress: () => void;
}) {
  return (
    <View className={showDivider ? 'border-b border-text/5' : undefined}>
      <Pressable
        onPress={onPress}
        className="flex-row items-start gap-3 px-4 py-3.5 active:bg-background"
      >
        <Text className="min-w-0 flex-1 text-[15px] font-semibold text-text">
          {item.question}
        </Text>
        {open ? (
          <ChevronUp color={colors.textSubtle} size={18} strokeWidth={1.8} />
        ) : (
          <ChevronDown color={colors.textSubtle} size={18} strokeWidth={1.8} />
        )}
      </Pressable>
      {open ? (
        <Text className="px-4 pb-4 text-[13px] leading-5 text-text-muted">
          {item.answer}
        </Text>
      ) : null}
    </View>
  );
}
