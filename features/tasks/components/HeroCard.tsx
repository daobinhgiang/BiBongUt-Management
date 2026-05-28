import { Pressable, Text, useWindowDimensions, View } from "react-native";

type Props = {
  tasksLeft: number;
  totalToday: number;
  onGoPress?: () => void;
};

export function HeroCard({ tasksLeft, totalToday, onGoPress }: Props) {
  const { height } = useWindowDimensions();
  const allDone = totalToday > 0 && tasksLeft === 0;
  const noTasks = totalToday === 0;

  const label = noTasks
    ? "No tasks today"
    : allDone
      ? "All done for today!"
      : "Complete all tasks for today";

  return (
    <View
      className="mb-4 items-center justify-center px-6"
      style={{ minHeight: height * 0.4 }}
    >
      <Text className="text-center text-4xl font-extrabold leading-tight text-jungle-700">
        {label}
      </Text>

      {!noTasks && !allDone && (
        <>
          <Text className="mt-3 text-base text-gray-400">
            {tasksLeft} of {totalToday} remaining
          </Text>
          <Pressable
            className="mt-5 rounded-full bg-jungle-500 px-10 py-3"
            onPress={onGoPress}
          >
            <Text className="text-lg font-bold text-white">Go</Text>
          </Pressable>
        </>
      )}
    </View>
  );
}
