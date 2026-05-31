import { CoinVertical } from "phosphor-react-native";
import { type SharedValue } from "react-native-reanimated";
import { FlyingOrb } from "./FlyingOrb";

type Point = { x: number; y: number };
type Rect = { x: number; y: number; width: number; height: number };

type Props = {
  from: Point;
  to: Point;
  count: number;
  onCoinArrive?: (orbIndex: number) => void;
  onAllArrived: () => void;
  targetPopScale?: SharedValue<number>;
  targetRect?: Rect;
};

// Coins icon lives in the fixed StatsHeader (outside the scroll view), so coin
// orbs don't need scroll tracking — the target never moves on scroll.

const ICON = <CoinVertical size={44} color="#d97706" weight="fill" />;

export function FlyingCoinOrb({ from, to, count, onCoinArrive, onAllArrived, targetPopScale, targetRect }: Props) {
  return (
    <FlyingOrb
      from={from}
      to={to}
      count={count}
      onOrbArrive={onCoinArrive}
      onAllArrived={onAllArrived}
      targetPopScale={targetPopScale}
      targetRect={targetRect}
      icon={ICON}
    />
  );
}
