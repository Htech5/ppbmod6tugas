import { useEffect, useMemo } from "react";
import { StyleSheet, View, useWindowDimensions } from "react-native";
import { BlurMask, Canvas, Circle, Fill, Group, LinearGradient, vec } from "react-native-skia";
import Animated, {
  Easing,
  FadeIn,
  runOnJS,
  useAnimatedStyle,
  useDerivedValue,
  useSharedValue,
  withDelay,
  withTiming,
} from "react-native-reanimated";

const DISPLAY_MS = 2800;
const FADE_MS = 360;
const BRAND = "LiveTemp";
const LETTER_STAGGER_MS = 55;
const ORBITS = 1; // one full sun -> moon -> sun turn during the splash

const SKY_TOP = ["#020617", "#7c3aed", "#38bdf8"]; // night -> dusk/dawn -> day
const SKY_BOTTOM = ["#0b1220", "#fb923c", "#fde68a"];
const EARTH_NIGHT = "#0f2847";
const EARTH_DAY = "#1d9bd8";

function hexToRgb(hex) {
  "worklet";
  const n = parseInt(hex.slice(1), 16);
  return [(n >> 16) & 255, (n >> 8) & 255, n & 255];
}

function mixHex(a, b, t) {
  "worklet";
  const ca = hexToRgb(a);
  const cb = hexToRgb(b);
  const r = Math.round(ca[0] + (cb[0] - ca[0]) * t);
  const g = Math.round(ca[1] + (cb[1] - ca[1]) * t);
  const bl = Math.round(ca[2] + (cb[2] - ca[2]) * t);
  return `rgb(${r}, ${g}, ${bl})`;
}

function sampleStops(stops, t) {
  "worklet";
  const segments = stops.length - 1;
  const scaled = Math.min(segments, Math.max(0, t * segments));
  const i = Math.min(segments - 1, Math.floor(scaled));
  return mixHex(stops[i], stops[i + 1], scaled - i);
}

// Sun and moon share one orbit, a half turn apart, around the fixed earth at
// the centre — whichever is on the near side (cos > 0) is the one showing,
// so the globe reads as rotating through a day/night turn instead of two
// unrelated props fading in and out.
function bodyState(cycle, phaseOffset) {
  "worklet";
  const th = cycle * Math.PI * 2 * ORBITS + phaseOffset;
  return {
    x: Math.sin(th),
    y: -Math.cos(th),
    opacity: Math.max(0, Math.cos(th)),
  };
}

function dayAmount(cycle) {
  "worklet";
  const th = cycle * Math.PI * 2 * ORBITS;
  return (Math.cos(th) + 1) / 2;
}

const SPIN_ORBITS = 2.6; // continents sweep across the globe a few times per splash

// A continent sliding left-right across the earth's face and fading at the
// limb reads as the sphere spinning, without animating a Skia transform
// (animated Group transforms crash this react-native-skia build).
function continentState(cycle, phase) {
  "worklet";
  const th = cycle * Math.PI * 2 * SPIN_ORBITS + phase;
  return { x: Math.sin(th), opacity: Math.max(0, Math.cos(th)) };
}

export function SplashScreen({ onFinish }) {
  const { width, height } = useWindowDimensions();
  const screenOpacity = useSharedValue(1);
  const cycle = useSharedValue(0);

  const earthCx = width / 2;
  const earthCy = height * 0.36;
  const earthR = Math.min(64, width * 0.17);
  const orbitRx = earthR * 2.2;
  const orbitRy = earthR * 1.3;
  const bodyR = earthR * 0.4;

  useEffect(() => {
    cycle.value = withTiming(1, { duration: DISPLAY_MS, easing: Easing.linear });
    screenOpacity.value = withDelay(
      DISPLAY_MS,
      withTiming(0, { duration: FADE_MS }, (finished) => {
        if (finished) runOnJS(onFinish)();
      }),
    );
  }, [cycle, screenOpacity, onFinish]);

  const screenStyle = useAnimatedStyle(() => ({ opacity: screenOpacity.value }));

  const skyColors = useDerivedValue(() => {
    const mix = dayAmount(cycle.value);
    return [sampleStops(SKY_TOP, mix), sampleStops(SKY_BOTTOM, mix)];
  });
  const starsOpacity = useDerivedValue(() => (1 - dayAmount(cycle.value)) * 0.9);
  const earthColor = useDerivedValue(() => mixHex(EARTH_NIGHT, EARTH_DAY, dayAmount(cycle.value)));

  const continent1X = useDerivedValue(
    () => earthCx + earthR * 0.5 * continentState(cycle.value, 0).x,
  );
  const continent1Opacity = useDerivedValue(
    () => 0.55 * continentState(cycle.value, 0).opacity,
  );
  const continent2X = useDerivedValue(
    () => earthCx + earthR * 0.5 * continentState(cycle.value, Math.PI * 0.7).x,
  );
  const continent2Opacity = useDerivedValue(
    () => 0.5 * continentState(cycle.value, Math.PI * 0.7).opacity,
  );

  const sunCx = useDerivedValue(() => earthCx + orbitRx * bodyState(cycle.value, 0).x);
  const sunCy = useDerivedValue(() => earthCy + orbitRy * bodyState(cycle.value, 0).y);
  const sunOpacity = useDerivedValue(() => bodyState(cycle.value, 0).opacity);

  const moonCx = useDerivedValue(
    () => earthCx + orbitRx * bodyState(cycle.value, Math.PI).x,
  );
  const moonCy = useDerivedValue(
    () => earthCy + orbitRy * bodyState(cycle.value, Math.PI).y,
  );
  const moonOpacity = useDerivedValue(() => bodyState(cycle.value, Math.PI).opacity);

  const stars = useMemo(() => {
    const pts = [];
    for (let i = 0; i < 36; i++) {
      pts.push({
        x: (((i * 53 + 17) % 97) / 97) * width,
        y: ((((i * 31 + 7) % 89) / 89) * 0.5) * height,
        r: 0.6 + ((i * 13) % 5) * 0.15,
      });
    }
    return pts;
  }, [width, height]);

  const letters = useMemo(() => BRAND.split(""), []);

  return (
    <Animated.View style={[styles.screen, screenStyle]}>
      <Canvas style={{ position: "absolute", top: 0, left: 0, width, height }}>
        <Fill>
          <LinearGradient start={vec(0, 0)} end={vec(0, 1)} colors={skyColors} />
        </Fill>

        <Group opacity={starsOpacity}>
          {stars.map((s, i) => (
            <Circle key={i} cx={s.x} cy={s.y} r={s.r} color="#F8FAFC" />
          ))}
        </Group>

        <Circle cx={sunCx} cy={sunCy} r={bodyR * 1.8} color="#FDE68A" opacity={sunOpacity}>
          <BlurMask blur={22} style="normal" />
        </Circle>
        <Circle cx={sunCx} cy={sunCy} r={bodyR} color="#FDE68A" opacity={sunOpacity} />
        <Circle cx={moonCx} cy={moonCy} r={bodyR * 1.5} color="#E2E8F0" opacity={moonOpacity}>
          <BlurMask blur={16} style="normal" />
        </Circle>
        <Circle cx={moonCx} cy={moonCy} r={bodyR * 0.85} color="#F1F5F9" opacity={moonOpacity} />

        <Circle cx={earthCx} cy={earthCy} r={earthR} color={earthColor} />
        <Circle
          cx={continent1X}
          cy={earthCy - earthR * 0.22}
          r={earthR * 0.3}
          color="#22C55E"
          opacity={continent1Opacity}
        />
        <Circle
          cx={continent2X}
          cy={earthCy + earthR * 0.28}
          r={earthR * 0.22}
          color="#22C55E"
          opacity={continent2Opacity}
        />
        <Circle
          cx={earthCx}
          cy={earthCy}
          r={earthR}
          color="#F8FAFC"
          style="stroke"
          strokeWidth={1}
          opacity={0.25}
        />
      </Canvas>

      <View style={styles.wordmarkBlock}>
        <View style={styles.wordmarkRow}>
          {letters.map((ch, i) => (
            <Animated.Text
              key={`${ch}-${i}`}
              entering={FadeIn.delay(600 + i * LETTER_STAGGER_MS).duration(260)}
              style={styles.letter}
            >
              {ch}
            </Animated.Text>
          ))}
        </View>
        <Animated.Text
          entering={FadeIn.delay(600 + letters.length * LETTER_STAGGER_MS + 120).duration(
            320,
          )}
          style={styles.subtitle}
        >
          Real-time temperature monitoring
        </Animated.Text>
      </View>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: "#0B1220",
  },
  wordmarkBlock: {
    flex: 1,
    justifyContent: "flex-end",
    alignItems: "center",
    paddingBottom: "14%",
    gap: 4,
  },
  wordmarkRow: {
    flexDirection: "row",
  },
  letter: {
    fontSize: 30,
    fontWeight: "800",
    color: "#F8FAFC",
    letterSpacing: 0.5,
    fontFamily: "monospace",
  },
  subtitle: {
    fontSize: 13,
    color: "#BFD4F2",
    marginTop: 6,
    textAlign: "center",
  },
});
