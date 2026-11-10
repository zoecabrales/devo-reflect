import { useAppTheme } from "@/src/contexts/ThemeContext";
import { useEffect, useState } from "react";
import {
  Alert,
  Platform,
  StyleSheet,
  Text,
  TouchableOpacity,
} from "react-native";
import { AppModal } from "./AppModal";

type AlertContent = { title: string; message?: string };

let showOnHost: ((content: AlertContent) => void) | null = null;

/**
 * Simple OK-only alert that works everywhere. Alert.alert is a no-op in
 * react-native-web, so on web this shows an in-app modal (via <AppAlertHost />)
 * and on iOS / Android it uses the native alert.
 */
export function showAlert(title: string, message?: string) {
  if (Platform.OS !== "web") {
    Alert.alert(title, message);
  } else if (showOnHost) {
    showOnHost({ title, message });
  } else {
    window.alert(message ? `${title}\n\n${message}` : title);
  }
}

/** Mount once near the app root (inside ThemeProvider). */
export function AppAlertHost() {
  const { theme } = useAppTheme();
  const [content, setContent] = useState<AlertContent | null>(null);

  useEffect(() => {
    showOnHost = setContent;
    return () => {
      showOnHost = null;
    };
  }, []);

  const close = () => setContent(null);

  return (
    <AppModal
      visible={content !== null}
      onClose={close}
      overlayStyle={styles.overlay}
      cardStyle={[
        styles.card,
        { backgroundColor: theme.surface, borderColor: theme.border },
      ]}
    >
      <Text style={[styles.title, { color: theme.text }]}>
        {content?.title}
      </Text>
      {!!content?.message && (
        <Text style={[styles.message, { color: theme.textSecondary }]}>
          {content.message}
        </Text>
      )}
      <TouchableOpacity
        onPress={close}
        style={[styles.button, { backgroundColor: theme.primary }]}
        activeOpacity={0.85}
        accessibilityRole="button"
      >
        <Text style={[styles.buttonText, { color: theme.primaryText }]}>OK</Text>
      </TouchableOpacity>
    </AppModal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    padding: 24,
    backgroundColor: "rgba(0,0,0,0.45)",
  },
  card: {
    width: "100%",
    maxWidth: 400,
    borderRadius: 16,
    borderWidth: 1,
    padding: 22,
    gap: 10,
  },
  title: {
    fontSize: 17,
    fontWeight: "700",
  },
  message: {
    fontSize: 14,
    lineHeight: 20,
  },
  button: {
    marginTop: 8,
    paddingVertical: 12,
    borderRadius: 10,
    alignItems: "center",
  },
  buttonText: {
    fontWeight: "600",
  },
});
