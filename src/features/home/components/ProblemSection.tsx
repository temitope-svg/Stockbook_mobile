import {
  BookX,
  CircleQuestionMark,
  Users,
  type LucideIcon,
} from 'lucide-react-native';
import { Text, View } from 'react-native';
import { colors } from '../../../theme/colors';

type Problem = {
  icon: LucideIcon;
  title: string;
  body: string;
};

const problems: Problem[] = [
  {
    icon: BookX,
    title: 'Notebook gets lost or torn',
    body: 'Years of records, gone in one bad day.',
  },
  {
    icon: CircleQuestionMark,
    title: "No idea what's in stock",
    body: 'You find out only when a customer asks.',
  },
  {
    icon: Users,
    title: 'Debts slip through the cracks',
    body: 'Customers forget, and so do you.',
  },
];

function ProblemRow({ icon: Icon, title, body }: Problem) {
  return (
    <View className="flex-row items-start gap-3.5">
      <View className="h-11 w-11 items-center justify-center rounded-2xl bg-danger-tint">
        <Icon color={colors.danger} size={22} strokeWidth={1.7} />
      </View>
      <View className="flex-1 pt-0.5">
        <Text className="text-[16px] font-semibold tracking-tight text-text">
          {title}
        </Text>
        <Text className="mt-1 text-[14px] leading-relaxed text-text-muted">
          {body}
        </Text>
      </View>
    </View>
  );
}

export function ProblemSection() {
  return (
    <View className="bg-surface px-6 py-12">
      <Text className="text-[13px] font-semibold tracking-wide text-danger">
        The problem with notebooks
      </Text>
      <Text className="mt-2 text-[24px] font-bold leading-snug tracking-tight text-text">
        If it's not written down, it's forgotten
      </Text>

      <View className="mt-8 gap-7">
        {problems.map(item => (
          <ProblemRow key={item.title} {...item} />
        ))}
      </View>
    </View>
  );
}
