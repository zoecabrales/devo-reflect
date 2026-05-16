import { useAppTheme } from "@/src/contexts/ThemeContext";
import { CalendarWidget } from "@/src/features/growth/CalendarWidget";
import { PrayersWidget } from "@/src/features/growth/PrayersWidget";
import { TopicsWidget } from "@/src/features/growth/TopicsWidget";
import { LIST_PADDING_H } from "@/src/utils/responsive";
import { ScrollView, StyleSheet, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

export default function Growth() {
  const { theme } = useAppTheme();

  return (
    <SafeAreaView
      edges={["top"]}
      style={[styles.container, { backgroundColor: theme.background }]}
    >
      {/* ── Header ── */}
      <View style={styles.header}>
        <Text style={[styles.headerTitle, { color: theme.text }]}>Growth</Text>
        <Text style={[styles.headerSubtitle, { color: theme.textSecondary }]}>
          Track your spiritual journey
        </Text>
      </View>

      {/* ── Widgets ── */}
      <ScrollView
        contentContainerStyle={styles.scroll}
        showsVerticalScrollIndicator={false}
      >
        <PrayersWidget />
        <CalendarWidget />
        <TopicsWidget />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    paddingHorizontal: LIST_PADDING_H,
    paddingTop: 12,
    paddingBottom: 16,
  },
  headerTitle: {
    fontSize: 26,
    fontFamily: "Oswald_700Bold",
    letterSpacing: 0.4,
  },
  headerSubtitle: {
    fontSize: 11,
    opacity: 0.5,
    letterSpacing: 0.3,
    marginTop: 2,
  },
  scroll: {
    paddingHorizontal: LIST_PADDING_H,
    paddingBottom: 48,
    gap: 16,
  },
});
