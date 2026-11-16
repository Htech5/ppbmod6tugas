import { useMemo, useState } from "react";
import { ScrollView, Text, View, StyleSheet } from "react-native";
import Ionicons from "@expo/vector-icons/Ionicons";
import { Canvas, Fill, LinearGradient, vec } from "react-native-skia";
import Animated, { FadeInDown } from "react-native-reanimated";
import { tokens } from "../theme/tokens.js";

const { color, space, radius, shadow } = tokens;

const GROUP = {
  number: "23",
  course: "Pemrograman Perangkat Bergerak",
};

// Each member gets one accent drawn from the app's own palette — no new
// colors introduced, just reused as an identity tag instead of status.
const MEMBERS = [
  {
    nim: "21120124130081",
    name: "Habib Mukhlis Triatmojo",
    accent: color.primary,
  },
  {
    nim: "21120124130052",
    name: "Ahmad Dika Styansah",
    accent: color.successText,
  },
  {
    nim: "21120124120012",
    name: "Citra Marta Fatmala",
    accent: color.warnText,
  },
  {
    nim: "21120124120019",
    name: "Aurelia Putri Cahyani",
    accent: color.dangerText,
  },
];

function initials(name) {
  return name
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((w) => w[0])
    .join("")
    .toUpperCase();
}

function MemberCard({ member, index }) {
  return (
    <Animated.View
      entering={FadeInDown.delay(index * 90).duration(280)}
      style={styles.memberCard}
      accessible
      accessibilityLabel={`${member.name}, NIM ${member.nim}`}
    >
      <View style={[styles.accentBar, { backgroundColor: member.accent }]} />
      <View style={[styles.avatar, { borderColor: member.accent }]}>
        <Text style={[styles.avatarText, { color: member.accent }]}>
          {initials(member.name)}
        </Text>
      </View>
      <View style={styles.memberTextWrap}>
        <Text style={styles.memberName}>{member.name}</Text>
        <Text style={styles.memberNim}>{member.nim}</Text>
      </View>
      <View style={[styles.indexBadge, { backgroundColor: member.accent }]}>
        <Text style={styles.indexBadgeText}>{index + 1}</Text>
      </View>
    </Animated.View>
  );
}

export function ProfileScreen() {
  const memberAccents = useMemo(() => MEMBERS.map((m) => m.accent), []);
  // react-native-skia's Canvas can end up with no size (and render nothing)
  // when it fills a parent sized by its own content instead of flex, so the
  // hero card measures itself and hands Canvas an explicit pixel size.
  const [heroSize, setHeroSize] = useState({ width: 0, height: 0 });

  return (
    <View style={styles.safe}>
      <ScrollView
        contentContainerStyle={styles.container}
        contentInsetAdjustmentBehavior="automatic"
      >
        <View
          style={styles.hero}
          onLayout={(e) => setHeroSize(e.nativeEvent.layout)}
        >
          <Canvas
            style={{
              position: "absolute",
              top: 0,
              left: 0,
              width: heroSize.width,
              height: heroSize.height,
            }}
          >
            <Fill>
              <LinearGradient
                start={vec(0, 0)}
                end={vec(1, 1)}
                colors={["#0B1220", "#152A4A", color.primary]}
              />
            </Fill>
          </Canvas>
          <View style={styles.heroBadge}>
            <Ionicons name="people" size={22} color="#F8FAFC" />
          </View>
          <Text style={styles.heroKicker}>KELOMPOK</Text>
          <Text style={styles.heroNumber}>{GROUP.number}</Text>
          <Text style={styles.heroCourse}>{GROUP.course}</Text>
          <View style={styles.heroDotsRow}>
            {memberAccents.map((c, i) => (
              <View key={i} style={[styles.heroDot, { backgroundColor: c }]} />
            ))}
          </View>
        </View>

        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Anggota</Text>
          <View style={styles.countPill}>
            <Text style={styles.countText}>{MEMBERS.length} orang</Text>
          </View>
        </View>

        <View style={styles.membersList}>
          {MEMBERS.map((member, index) => (
            <MemberCard key={member.nim} member={member} index={index} />
          ))}
        </View>

        <View style={styles.appInfo}>
          <Ionicons name="thermometer-outline" size={15} color={color.text3} />
          <Text style={styles.appInfoText}>LiveTemp v1.0.0</Text>
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: color.bg,
  },
  container: {
    padding: space.lg,
    paddingBottom: space.xxl,
    gap: space.lg,
    backgroundColor: color.bg,
  },
  hero: {
    borderRadius: radius.card,
    borderCurve: "continuous",
    overflow: "hidden",
    paddingVertical: space.xxl,
    paddingHorizontal: space.xl,
    alignItems: "center",
    gap: 4,
    boxShadow: shadow.card,
  },
  heroBadge: {
    width: 48,
    height: 48,
    borderRadius: 16,
    borderCurve: "continuous",
    backgroundColor: "rgba(255,255,255,0.12)",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 6,
  },
  heroKicker: {
    fontSize: 12,
    fontWeight: "700",
    letterSpacing: 2,
    color: "rgba(248,250,252,0.7)",
  },
  heroNumber: {
    fontSize: 44,
    fontWeight: "800",
    color: "#F8FAFC",
    letterSpacing: -1,
    fontFamily: "monospace",
  },
  heroCourse: {
    fontSize: 14,
    fontWeight: "600",
    color: "#DCEAFE",
    textAlign: "center",
    marginTop: 2,
  },
  heroDotsRow: {
    flexDirection: "row",
    gap: 6,
    marginTop: space.md,
  },
  heroDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  sectionHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginTop: space.md,
    marginBottom: -space.sm,
  },
  sectionTitle: {
    fontSize: tokens.type.section,
    fontWeight: "700",
    color: color.text,
  },
  countPill: {
    backgroundColor: color.surface2,
    borderRadius: radius.pill,
    borderCurve: "continuous",
    paddingVertical: 4,
    paddingHorizontal: 8,
  },
  countText: {
    fontSize: 12,
    fontWeight: "600",
    color: color.text2,
  },
  membersList: {
    gap: space.sm,
  },
  memberCard: {
    flexDirection: "row",
    alignItems: "center",
    gap: space.md,
    backgroundColor: color.surface,
    borderWidth: 1,
    borderColor: color.border,
    borderRadius: radius.card,
    borderCurve: "continuous",
    paddingVertical: space.md,
    paddingHorizontal: space.md,
    overflow: "hidden",
    boxShadow: shadow.card,
  },
  accentBar: {
    position: "absolute",
    left: 0,
    top: 0,
    bottom: 0,
    width: 4,
  },
  avatar: {
    width: 42,
    height: 42,
    borderRadius: 21,
    backgroundColor: color.surface2,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1.5,
    marginLeft: space.sm,
  },
  avatarText: {
    fontSize: 14,
    fontWeight: "700",
  },
  memberTextWrap: {
    flex: 1,
    gap: 2,
  },
  memberName: {
    fontSize: 14,
    fontWeight: "600",
    color: color.text,
  },
  memberNim: {
    fontSize: 12,
    color: color.text3,
    fontVariant: ["tabular-nums"],
  },
  indexBadge: {
    width: 22,
    height: 22,
    borderRadius: 11,
    alignItems: "center",
    justifyContent: "center",
  },
  indexBadgeText: {
    fontSize: 11,
    fontWeight: "700",
    color: "#FFFFFF",
  },
  appInfo: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
    marginTop: space.sm,
  },
  appInfoText: {
    fontSize: 12,
    color: color.text3,
  },
});
