import { CoinVertical } from "phosphor-react-native";
import { FlyingOrb } from "./FlyingOrb";

type Point = { x: number; y: number };

type Props = {
  from: Point;
  to: Point;
  count: number;
  onCoinArrive?: () => void;
  onAllArrived: () => void;
};

const ICON = <CoinVertical size={44} color="#d97706" weight="fill" />;

export function FlyingCoinOrb({ from, to, count, onCoinArrive, onAllArrived }: Props) {
  return (
    <FlyingOrb
      from={from}
      to={to}
      count={count}
      onOrbArrive={onCoinArrive}
      onAllArrived={onAllArrived}
      icon={ICON}
    />
  );
}
