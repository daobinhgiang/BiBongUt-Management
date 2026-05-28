import { Lightning } from "phosphor-react-native";
import { FlyingOrb } from "./FlyingOrb";

type Point = { x: number; y: number };

type Props = {
  from: Point;
  to: Point;
  count: number;
  onAllArrived: () => void;
};

const ICON = <Lightning size={44} color="#4d7c0f" weight="fill" />;

export function FlyingXpOrb({ from, to, count, onAllArrived }: Props) {
  return (
    <FlyingOrb
      from={from}
      to={to}
      count={count}
      onAllArrived={onAllArrived}
      icon={ICON}
    />
  );
}
