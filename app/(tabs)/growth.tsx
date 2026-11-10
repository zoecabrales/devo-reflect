import { PageHeader } from "@/src/components";
import { useAppTheme } from "@/src/contexts/ThemeContext";
import { CalendarWidget } from "@/src/features/growth/CalendarWidget";
import { GrowthStats } from "@/src/features/growth/GrowthStats";
import { PrayersWidget } from "@/src/features/growth/PrayersWidget";
import { TopicsWidget } from "@/src/features/growth/TopicsWidget";
import { desktopPage } from "@/src/styles/desktopPage.styles";
import { LIST_PADDING_H, useIsDesktop, useListPaddingH } from "@/src/utils/responsive";
import { ScrollView, StyleSheet, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

export default function Growth() {
  const { theme } = useAppTheme();
  const isDesktop = useIsDesktop();
  const padH = useListPaddingH();

  return (
    <SafeAreaView
      edges={["top"]}
      style={[styles.container, { backgroundColor: theme.background }]}
    >
      <PageHeader title="Growth" subtitle="Track your spiritual journey" />

      {/* ── Widgets ── */}
      <ScrollView
        contentContainerStyle={[
          styles.scroll,
          { paddingHorizontal: padH },
          isDesktop && desktopPage.content,
        ]}
        showsVerticalScrollIndicator={false}
      >
        {isDesktop ? (
          /* Desktop dashboard: stats, then prayers + topics beside the
             calendar, whose selected day's details show below it */
          <View style={styles.widgets}>
            <GrowthStats />
            <View style={styles.columns}>
              <View style={[styles.widgets, styles.mainColumn]}>
                <PrayersWidget />
                <TopicsWidget />
              </View>
              <View style={[styles.widgets, styles.sideColumn]}>
                <CalendarWidget inline />
              </View>
            </View>
          </View>
        ) : (
          <View style={styles.widgets}>
            <PrayersWidget />
            <CalendarWidget />
            <TopicsWidget />
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scroll: {
    paddingHorizontal: LIST_PADDING_H,
    paddingBottom: 48,
  },
  widgets: {
    gap: 16,
  },
  columns: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 16,
  },
  mainColumn: {
    flex: 3,
  },
  sideColumn: {
    flex: 2,
  },
});
