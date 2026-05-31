import { useCallback, useEffect, useRef, useState } from "react";
import { View, type LayoutChangeEvent } from "react-native";
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  useAnimatedReaction,
  withDelay,
  withTiming,
  withSequence,
  Easing,
  runOnJS,
  type SharedValue,
} from "react-native-reanimated";

type Point = { x: number; y: number };
type Rect = { x: number; y: number; width: number; height: number };

export type FlyingOrbProps = {
  from: Point;
  to: Point;
  count: number;
  onOrbArrive?: (orbIndex: number) => void;
  onAllArrived: () => void;
  icon: React.ReactNode;
  targetPopScale?: SharedValue<number>;
  /** Absolute rect of the target element (for edge-hit detection) */
  targetRect?: Rect;
  /** Live scroll offset of the list; orbs re-aim at the moving target each frame */
  scrollY?: SharedValue<number>;
  /** Scroll offset captured at launch; live target shift = scrollY - launchScrollY */
  launchScrollY?: number;
};

const FLIGHT_DURATION = 1300;
const STAGGER_MS = 160;
const ICON_SIZE = 44;
const ORB_RADIUS = ICON_SIZE / 2;

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
  orbIndex,
  onArrive,
  targetPopScale,
  targetRect,
  liveScroll,
  launchScrollY,
  icon,
}: {
  from: Point;
  to: Point;
  delay: number;
  controlX: number;
  controlY: number;
  orbIndex: number;
  onArrive?: (orbIndex: number) => void;
  targetPopScale?: SharedValue<number>;
  targetRect?: Rect;
  liveScroll: SharedValue<number>;
  launchScrollY: number;
  icon: React.ReactNode;
}) {
  const progress = useSharedValue(0);
  const hasArrived = useSharedValue(false);
  const hasPopped = useSharedValue(false);

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

  useAnimatedReaction(
    () => progress.value,
    (t) => {
      // How far the target has scrolled since launch (down-scroll moves it up → subtract).
      const delta = liveScroll.value - launchScrollY;

      // Pop when orb touches the edge of the (live) target rect
      if (!hasPopped.value && targetPopScale && targetRect && t > 0) {
        const orbX = qBez(from.x, controlX, to.x, t);
        const orbY = qBez(from.y, controlY, to.y, t) - delta * t;

        const rectLeft = targetRect.x - ORB_RADIUS;
        const rectRight = targetRect.x + targetRect.width + ORB_RADIUS;
        const rectTop = targetRect.y - delta - ORB_RADIUS;
        const rectBottom = targetRect.y + targetRect.height - delta + ORB_RADIUS;

        if (
          orbX >= rectLeft &&
          orbX <= rectRight &&
          orbY >= rectTop &&
          orbY <= rectBottom
        ) {
          hasPopped.value = true;
          targetPopScale.value = withSequence(
            withTiming(1.06, { duration: 100 }),
            withTiming(1, { duration: 150 }),
          );
        }
      }

      // onArrive + onAllArrived still fire at t >= 1
      if (t >= 1 && !hasArrived.value) {
        hasArrived.value = true;
        if (onArrive) {
          runOnJS(onArrive)(orbIndex);
        }
      }
    },
  );

  const animStyle = useAnimatedStyle(() => {
    const t = progress.value;
    const delta = liveScroll.value - launchScrollY;

    const x = qBez(from.x, controlX, to.x, t);
    // t-weighted scroll correction: 0 at launch, full at arrival → lands on the live target.
    const y = qBez(from.y, controlY, to.y, t) - delta * t;

    let s: number;
    if (t < 0.1) {
      s = lerp(0.5, 1.2, t / 0.1);
    } else if (t < 0.75) {
      s = lerp(1.2, 1.0, (t - 0.1) / 0.65);
    } else {
      s = 1.0;
    }

    const o = t < 0.85 ? 1 : lerp(1, 0, clamp01((t - 0.85) / 0.15));

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

export function FlyingOrb({ from, to, count, onOrbArrive, onAllArrived, icon, targetPopScale, targetRect, scrollY, launchScrollY }: FlyingOrbProps) {
  const rootRef = useRef<View>(null);
  const arrivedCount = useRef(0);
  const [localCoords, setLocalCoords] = useState<{
    from: Point;
    to: Point;
  } | null>(null);

  // Always hand the worklets a real shared value. Coin orbs pass no scrollY, so
  // liveScroll stays 0 and launch is 0 → delta is always 0 → unchanged behavior.
  const zeroScroll = useSharedValue(0);
  const liveScroll = scrollY ?? zeroScroll;
  const launch = launchScrollY ?? 0;

  const controlPointsRef = useRef<{ cx: number; cy: number }[]>([]);
  if (controlPointsRef.current.length !== count) {
    controlPointsRef.current = Array.from({ length: count }, () => ({
      cx: (Math.random() - 0.5) * 160,
      cy: (Math.random() - 0.5) * 100,
    }));
  }

  // Convert targetRect to local coords
  const [localTargetRect, setLocalTargetRect] = useState<Rect | undefined>();

  const normalizeCoords = useCallback(() => {
    rootRef.current?.measureInWindow((rootX, rootY) => {
      setLocalCoords({
        from: { x: from.x - rootX, y: from.y - rootY },
        to: { x: to.x - rootX, y: to.y - rootY },
      });
      if (targetRect) {
        setLocalTargetRect({
          x: targetRect.x - rootX,
          y: targetRect.y - rootY,
          width: targetRect.width,
          height: targetRect.height,
        });
      }
    });
  }, [from, to, targetRect]);

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
    setLocalTargetRect(undefined);
  }, [from, to, count]);

  const handleSingleArrive = useCallback(
    (orbIndex: number) => {
      arrivedCount.current += 1;
      onOrbArrive?.(orbIndex);
      if (arrivedCount.current >= count) {
        onAllArrived();
      }
    },
    [count, onOrbArrive, onAllArrived],
  );

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
          orbIndex={i}
          onArrive={handleSingleArrive}
          targetPopScale={targetPopScale}
          targetRect={localTargetRect}
          liveScroll={liveScroll}
          launchScrollY={launch}
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
