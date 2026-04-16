import { useAppTheme } from "@/src/contexts/ThemeContext";
import { Text, View, StyleSheet } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

export default function Growth() {
  const { theme } = useAppTheme();

  return (
    <SafeAreaView
      edges={["top"]}
      style={[styles.container, { backgroundColor: theme.background }]}
    >
      <View style={styles.header}>
        <Text style={[styles.headerTitle, { color: theme.text }]}>Growth</Text>
        <Text style={[styles.headerSubtitle, { color: theme.textSecondary }]}>
          Coming soon
        </Text>
      </View>

      <View style={styles.centered}>
        <Text style={[styles.placeholder, { color: theme.textSecondary }]}>
          🌱
        </Text>
        <Text style={[styles.placeholderText, { color: theme.textSecondary }]}>
          This section is under construction.
        </Text>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    paddingHorizontal: 20,
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
  centered: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    gap: 12,
  },
  placeholder: {
    fontSize: 48,
  },
  placeholderText: {
    fontSize: 14,
    opacity: 0.6,
    letterSpacing: 0.2,
  },
});
