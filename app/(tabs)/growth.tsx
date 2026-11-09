import { PageHeader } from "@/src/components";
import { useAppTheme } from "@/src/contexts/ThemeContext";
import { CalendarWidget } from "@/src/features/growth/CalendarWidget";
import { PrayersWidget } from "@/src/features/growth/PrayersWidget";
import { TopicsWidget } from "@/src/features/growth/TopicsWidget";
import { desktopPage } from "@/src/styles/desktopPage.styles";
import { LIST_PADDING_H, useIsDesktop } from "@/src/utils/responsive";
import { ScrollView, StyleSheet, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

export default function Growth() {
  const { theme } = useAppTheme();
  const isDesktop = useIsDesktop();

  return (
    <SafeAreaView
      edges={["top"]}
      style={[styles.container, { backgroundColor: theme.background }]}
    >
      <PageHeader title="Growth" subtitle="Track your spiritual journey" />

      {/* ── Widgets ── */}
      <ScrollView
        contentContainerStyle={[styles.scroll, isDesktop && desktopPage.content]}
        showsVerticalScrollIndicator={false}
      >
        <View style={[styles.widgets, isDesktop && desktopPage.narrow]}>
          <PrayersWidget />
          <CalendarWidget />
          <TopicsWidget />
        </View>
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
});
