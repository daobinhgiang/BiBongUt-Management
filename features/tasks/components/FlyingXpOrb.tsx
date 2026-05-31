import { Lightning } from "phosphor-react-native";
import { type SharedValue } from "react-native-reanimated";
import { FlyingOrb } from "./FlyingOrb";

type Point = { x: number; y: number };
type Rect = { x: number; y: number; width: number; height: number };

type Props = {
  from: Point;
  to: Point;
  count: number;
  onOrbArrive?: (orbIndex: number) => void;
  onAllArrived: () => void;
  targetPopScale?: SharedValue<number>;
  targetRect?: Rect;
  /** Live scroll offset of the list, so orbs track the progress bar as it scrolls */
  scrollY?: SharedValue<number>;
  /** Scroll offset captured at launch; orbs correct toward the live target by the delta */
  launchScrollY?: number;
};

const ICON = <Lightning size={44} color="#4d7c0f" weight="fill" />;

export function FlyingXpOrb({ from, to, count, onOrbArrive, onAllArrived, targetPopScale, targetRect, scrollY, launchScrollY }: Props) {
  return (
    <FlyingOrb
      from={from}
      to={to}
      count={count}
      onOrbArrive={onOrbArrive}
      onAllArrived={onAllArrived}
      targetPopScale={targetPopScale}
      targetRect={targetRect}
      scrollY={scrollY}
      launchScrollY={launchScrollY}
      icon={ICON}
    />
  );
}
