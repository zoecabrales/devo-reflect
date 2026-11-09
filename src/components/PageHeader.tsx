import { useAppTheme } from "@/src/contexts/ThemeContext";
import { desktopPage } from "@/src/styles/desktopPage.styles";
import { LIST_PADDING_H, useIsDesktop } from "@/src/utils/responsive";
import { ReactNode } from "react";
import { StyleSheet, Text, View } from "react-native";

type Props = {
  title: string;
  subtitle?: string;
  /** Optional actions shown on the right (e.g. Journal's New button). */
  right?: ReactNode;
};

/**
 * The one header used by every main tab, so titles share the same size,
 * spacing and left edge. On desktop it sits in the shared page frame
 * (desktopPage) that the tab content below also uses.
 */
export function PageHeader({ title, subtitle, right }: Props) {
  const { theme } = useAppTheme();
  const isDesktop = useIsDesktop();

  return (
    <View
      style={[
        styles.header,
        isDesktop && [desktopPage.header, styles.headerDesktop],
      ]}
    >
      <View style={styles.row}>
        <View style={styles.text}>
          <Text
            style={[
              styles.title,
              isDesktop && styles.titleDesktop,
              { color: theme.text },
            ]}
          >
            {title}
          </Text>
          {!!subtitle && (
            <Text
              style={[
                styles.subtitle,
                isDesktop && styles.subtitleDesktop,
                { color: theme.textSecondary },
              ]}
            >
              {subtitle}
            </Text>
          )}
        </View>
        {right}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  header: {
    paddingHorizontal: LIST_PADDING_H,
    paddingTop: 12,
    paddingBottom: 16,
  },
  // Desktop tabs render at DESKTOP_CONTENT_ZOOM (85%), so these sizes land
  // at roughly 26px / 13px on screen, matching the phone header.
  headerDesktop: {
    paddingTop: 28,
    paddingBottom: 20,
  },
  row: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 12,
  },
  text: {
    flexShrink: 1,
  },
  title: {
    fontSize: 26,
    fontFamily: "Oswald_700Bold",
    letterSpacing: 0.4,
  },
  titleDesktop: {
    fontSize: 30,
  },
  subtitle: {
    fontSize: 13,
    opacity: 0.6,
    letterSpacing: 0.3,
    marginTop: 2,
  },
  subtitleDesktop: {
    fontSize: 15,
  },
});
