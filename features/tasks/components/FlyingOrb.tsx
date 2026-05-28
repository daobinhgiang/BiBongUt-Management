import { useCallback, useEffect, useRef, useState } from "react";
import { View, type LayoutChangeEvent } from "react-native";
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withDelay,
  withTiming,
  Easing,
  runOnJS,
} from "react-native-reanimated";

type Point = { x: number; y: number };

export type FlyingOrbProps = {
  from: Point;
  to: Point;
  count: number;
  onOrbArrive?: () => void;
  onAllArrived: () => void;
  icon: React.ReactNode;
};

const FLIGHT_DURATION = 1300;
const STAGGER_MS = 160;
const ICON_SIZE = 44;

/** Quadratic bezier: (1-t)^2*p0 + 2*(1-t)*t*p1 + t^2*p2 */
function qBez(p0: number, p1: number, p2: number, t: number): number {
  "worklet";
  const u = 1 - t;
  return u * u * p0 + 2 * u * t * p1 + t * t * p2;
}

function lerp(a: number, b: number, t: number): number {
  "worklet";
  return a + (b - a) * t;
}

function clamp01(v: number): number {
  "worklet";
  return v < 0 ? 0 : v > 1 ? 1 : v;
}

function SingleOrb({
  from,
  to,
  delay,
  controlX,
  controlY,
  onArrive,
  icon,
}: {
  from: Point;
  to: Point;
  delay: number;
  controlX: number;
  controlY: number;
  onArrive?: () => void;
  icon: React.ReactNode;
}) {
  const progress = useSharedValue(0);

  useEffect(() => {
    progress.value = withDelay(
      delay,
      withTiming(1, {
        duration: FLIGHT_DURATION,
        easing: Easing.inOut(Easing.cubic),
      }),
    );
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const animStyle = useAnimatedStyle(() => {
    const t = progress.value;

    const x = qBez(from.x, controlX, to.x, t);
    const y = qBez(from.y, controlY, to.y, t);

    let s: number;
    if (t < 0.1) {
      s = lerp(0.5, 1.2, t / 0.1);
    } else if (t < 0.75) {
      s = lerp(1.2, 1.0, (t - 0.1) / 0.65);
    } else {
      s = lerp(1.0, 0.0, (t - 0.75) / 0.25);
    }

    const o = 1;

    if (t >= 1 && onArrive) {
      runOnJS(onArrive)();
    }

    return {
      opacity: o,
      transform: [
        { translateX: x - from.x },
        { translateY: y - from.y },
        { scale: s },
      ],
    };
  });

  return (
    <Animated.View
      style={[
        {
          position: "absolute",
          left: from.x - ICON_SIZE / 2,
          top: from.y - ICON_SIZE / 2,
        },
        animStyle,
      ]}
    >
      {icon}
    </Animated.View>
  );
}

export function FlyingOrb({ from, to, count, onOrbArrive, onAllArrived, icon }: FlyingOrbProps) {
  const rootRef = useRef<View>(null);
  const arrivedCount = useRef(0);
  const [localCoords, setLocalCoords] = useState<{
    from: Point;
    to: Point;
  } | null>(null);

  const controlPointsRef = useRef<{ cx: number; cy: number }[]>([]);
  if (controlPointsRef.current.length !== count) {
    controlPointsRef.current = Array.from({ length: count }, () => ({
      cx: (Math.random() - 0.5) * 160,
      cy: (Math.random() - 0.5) * 100,
    }));
  }

  const normalizeCoords = useCallback(() => {
    rootRef.current?.measureInWindow((rootX, rootY) => {
      setLocalCoords({
        from: { x: from.x - rootX, y: from.y - rootY },
        to: { x: to.x - rootX, y: to.y - rootY },
      });
    });
  }, [from, to]);

  const onRootLayout = useCallback(
    (_e: LayoutChangeEvent) => {
      normalizeCoords();
    },
    [normalizeCoords],
  );

  useEffect(() => {
    arrivedCount.current = 0;
    controlPointsRef.current = Array.from({ length: count }, () => ({
      cx: (Math.random() - 0.5) * 160,
      cy: (Math.random() - 0.5) * 100,
    }));
    setLocalCoords(null);
  }, [from, to, count]);

  const handleSingleArrive = useCallback(() => {
    arrivedCount.current += 1;
    onOrbArrive?.();
    if (arrivedCount.current >= count) {
      onAllArrived();
    }
  }, [count, onOrbArrive, onAllArrived]);

  const orbs =
    localCoords &&
    Array.from({ length: count }, (_, i) => {
      const angle = (i / count) * Math.PI * 2;
      const spread = 14;
      const offsetX = Math.cos(angle) * spread;
      const offsetY = Math.sin(angle) * spread;

      const orbFrom = {
        x: localCoords.from.x + offsetX,
        y: localCoords.from.y + offsetY,
      };

      const midX = (orbFrom.x + localCoords.to.x) / 2;
      const midY = (orbFrom.y + localCoords.to.y) / 2;
      const cp = controlPointsRef.current[i];

      return (
        <SingleOrb
          key={i}
          from={orbFrom}
          to={localCoords.to}
          delay={i * STAGGER_MS}
          controlX={midX + cp.cx}
          controlY={midY + cp.cy}
          onArrive={handleSingleArrive}
          icon={icon}
        />
      );
    });

  return (
    <View
      ref={rootRef}
      onLayout={onRootLayout}
      style={{
        flex: 1,
        zIndex: 999,
        elevation: 999,
      }}
      pointerEvents="none"
    >
      {orbs}
    </View>
  );
}
