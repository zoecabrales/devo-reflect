import { BRETHREN_ENABLED } from "@/src/constants/features";
import { Theme } from "@/src/constants/theme";
import { useAppTheme } from "@/src/contexts/ThemeContext";
import {
  acceptRequest,
  ConnectionRequest,
  deleteRequest,
  subscribeIncomingRequests,
} from "@/src/services/connections";
import { auth } from "@/src/services/firebase";
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { onAuthStateChanged } from "firebase/auth";
import { useEffect, useState } from "react";
import {
  ActivityIndicator,
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
  ViewStyle,
} from "react-native";

/** "just now", "5m ago", "3h ago", "2d ago", then the date. */
function timeAgo(ms: number): string {
  const s = Math.max(0, (Date.now() - ms) / 1000);
  if (s < 60) return "just now";
  if (s < 3600) return `${Math.floor(s / 60)}m ago`;
  if (s < 86400) return `${Math.floor(s / 3600)}h ago`;
  if (s < 7 * 86400) return `${Math.floor(s / 86400)}d ago`;
  return new Date(ms).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
  });
}

/** Live list of Brethren requests sent to the signed-in user. */
function useIncomingRequests(): ConnectionRequest[] {
  const [requests, setRequests] = useState<ConnectionRequest[]>([]);

  useEffect(() => {
    if (!BRETHREN_ENABLED) return;
    let stop: (() => void) | null = null;
    const unsubAuth = onAuthStateChanged(auth, (user) => {
      stop?.();
      stop = null;
      setRequests([]);
      if (user?.email && user.emailVerified) {
        stop = subscribeIncomingRequests(user.email, setRequests, () =>
          setRequests([]),
        );
      }
    });
    return () => {
      stop?.();
      unsubAuth();
    };
  }, []);

  return requests;
}

/**
 * Bell in the top bar. Shows how many Brethren requests are waiting; tapping
 * it opens a panel to Allow or Reject each one. Hidden while the Brethren
 * feature is switched off.
 */
export function NotificationBell({
  buttonStyle,
  panelTop,
}: {
  /** Matches the other top-bar buttons. */
  buttonStyle?: ViewStyle | ViewStyle[];
  /** Distance from the top of the screen to just below the top bar. */
  panelTop: number;
}) {
  const { theme } = useAppTheme();
  const requests = useIncomingRequests();
  const [open, setOpen] = useState(false);

  if (!BRETHREN_ENABLED) return null;
  const count = requests.length;

  return (
    <>
      <Pressable
        onPress={() => setOpen(true)}
        style={buttonStyle}
        accessibilityRole="button"
        accessibilityLabel={
          count > 0
            ? `Notifications, ${count} new`
            : "Notifications, none new"
        }
      >
        <Ionicons
          name={count > 0 ? "notifications" : "notifications-outline"}
          size={20}
          color={theme.text}
        />
        {count > 0 && (
          <View
            style={[
              styles.badge,
              { backgroundColor: "#e53e3e", borderColor: theme.background },
            ]}
          >
            <Text style={styles.badgeText}>{count > 9 ? "9+" : count}</Text>
          </View>
        )}
      </Pressable>

      <Modal
        visible={open}
        transparent
        animationType="fade"
        onRequestClose={() => setOpen(false)}
      >
        <Pressable
          style={styles.backdrop}
          onPress={() => setOpen(false)}
          accessibilityLabel="Close notifications"
        >
          <Pressable
            // Swallow taps inside the panel so they don't close it
            onPress={() => {}}
            style={[
              styles.panel,
              {
                top: panelTop + 6,
                backgroundColor: theme.surface,
                borderColor: theme.border,
              },
            ]}
          >
            <NotificationPanel
              theme={theme}
              requests={requests}
              onClose={() => setOpen(false)}
            />
          </Pressable>
        </Pressable>
      </Modal>
    </>
  );
}

function NotificationPanel({
  theme,
  requests,
  onClose,
}: {
  theme: Theme;
  requests: ConnectionRequest[];
  onClose: () => void;
}) {
  const router = useRouter();
  // Request being answered, and the last answer (shown briefly)
  const [busyId, setBusyId] = useState<string | null>(null);
  const [message, setMessage] = useState<{
    text: string;
    error: boolean;
  } | null>(null);

  async function answer(req: ConnectionRequest, allow: boolean) {
    setBusyId(req.id);
    setMessage(null);
    try {
      if (allow) {
        await acceptRequest(req);
        setMessage({
          text: `You and ${req.fromName} are now Brethren.`,
          error: false,
        });
      } else {
        await deleteRequest(req);
        setMessage({ text: `Request from ${req.fromName} removed.`, error: false });
      }
    } catch {
      setMessage({
        text: "Something went wrong. Please try again.",
        error: true,
      });
    } finally {
      setBusyId(null);
    }
  }

  return (
    <>
      <View style={[styles.header, { borderBottomColor: theme.border }]}>
        <Text style={[styles.title, { color: theme.text }]}>Notifications</Text>
        <Pressable
          onPress={onClose}
          hitSlop={10}
          accessibilityRole="button"
          accessibilityLabel="Close notifications"
        >
          <Ionicons name="close" size={20} color={theme.textSecondary} />
        </Pressable>
      </View>

      <ScrollView style={styles.list}>
        {message && (
          <Text
            style={[
              styles.message,
              { color: message.error ? "#e53e3e" : theme.textSecondary },
            ]}
          >
            {message.text}
          </Text>
        )}

        {requests.length === 0 ? (
          <View style={styles.empty}>
            <Ionicons
              name="notifications-off-outline"
              size={22}
              color={theme.textSecondary}
            />
            <Text style={[styles.emptyText, { color: theme.textSecondary }]}>
              No new notifications
            </Text>
          </View>
        ) : (
          requests.map((r, i) => (
            <View
              key={r.id}
              style={[
                styles.item,
                i > 0 && {
                  borderTopWidth: StyleSheet.hairlineWidth,
                  borderTopColor: theme.border,
                },
              ]}
            >
              <View
                style={[styles.avatar, { backgroundColor: theme.primary }]}
              >
                <Text style={[styles.avatarText, { color: theme.primaryText }]}>
                  {r.fromName.charAt(0).toUpperCase()}
                </Text>
              </View>
              <View style={styles.itemBody}>
                <Text style={[styles.itemText, { color: theme.text }]}>
                  <Text style={styles.itemName}>{r.fromName}</Text> sent you a
                  Brethren request
                </Text>
                <Text
                  style={[styles.itemMeta, { color: theme.textSecondary }]}
                  numberOfLines={1}
                >
                  {r.fromEmail} · {timeAgo(r.createdAt)}
                </Text>

                {busyId === r.id ? (
                  <ActivityIndicator
                    color={theme.textSecondary}
                    style={styles.busy}
                  />
                ) : (
                  <View style={styles.actions}>
                    <Pressable
                      onPress={() => answer(r, false)}
                      style={[styles.btn, { borderColor: theme.border }]}
                      accessibilityRole="button"
                      accessibilityLabel={`Reject request from ${r.fromName}`}
                    >
                      <Text style={[styles.btnText, { color: theme.text }]}>
                        Reject
                      </Text>
                    </Pressable>
                    <Pressable
                      onPress={() => answer(r, true)}
                      style={[
                        styles.btn,
                        {
                          backgroundColor: theme.primary,
                          borderColor: theme.primary,
                        },
                      ]}
                      accessibilityRole="button"
                      accessibilityLabel={`Allow request from ${r.fromName}`}
                    >
                      <Text
                        style={[styles.btnText, { color: theme.primaryText }]}
                      >
                        Allow
                      </Text>
                    </Pressable>
                  </View>
                )}
              </View>
            </View>
          ))
        )}
      </ScrollView>

      <Pressable
        onPress={() => {
          onClose();
          router.push("/(tabs)/brethren");
        }}
        style={[styles.footer, { borderTopColor: theme.border }]}
        accessibilityRole="link"
      >
        <Text style={[styles.footerText, { color: theme.text }]}>
          Manage Brethren →
        </Text>
      </Pressable>
    </>
  );
}

const styles = StyleSheet.create({
  badge: {
    position: "absolute",
    top: 0,
    right: 0,
    minWidth: 17,
    height: 17,
    borderRadius: 9,
    borderWidth: 2,
    paddingHorizontal: 3,
    alignItems: "center",
    justifyContent: "center",
  },
  badgeText: {
    color: "#fff",
    fontSize: 9,
    fontWeight: "800",
  },
  backdrop: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.25)",
  },
  panel: {
    position: "absolute",
    right: 12,
    left: 12,
    marginLeft: "auto",
    maxWidth: 380,
    maxHeight: "75%",
    borderWidth: 1,
    borderRadius: 14,
    overflow: "hidden",
    shadowColor: "#000",
    shadowOpacity: 0.2,
    shadowRadius: 16,
    shadowOffset: { width: 0, height: 6 },
    elevation: 8,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  title: {
    fontSize: 15,
    fontWeight: "700",
  },
  list: {
    flexGrow: 0,
  },
  message: {
    fontSize: 13,
    paddingHorizontal: 16,
    paddingTop: 12,
  },
  empty: {
    alignItems: "center",
    gap: 8,
    paddingVertical: 28,
  },
  emptyText: {
    fontSize: 13,
  },
  item: {
    flexDirection: "row",
    gap: 12,
    paddingHorizontal: 16,
    paddingVertical: 14,
  },
  avatar: {
    width: 34,
    height: 34,
    borderRadius: 17,
    alignItems: "center",
    justifyContent: "center",
  },
  avatarText: {
    fontSize: 14,
    fontWeight: "700",
  },
  itemBody: {
    flex: 1,
    minWidth: 0,
    gap: 3,
  },
  itemText: {
    fontSize: 14,
    lineHeight: 20,
  },
  itemName: {
    fontWeight: "700",
  },
  itemMeta: {
    fontSize: 12,
  },
  actions: {
    flexDirection: "row",
    gap: 8,
    marginTop: 8,
  },
  btn: {
    flex: 1,
    alignItems: "center",
    borderWidth: 1,
    borderRadius: 8,
    paddingVertical: 8,
  },
  btnText: {
    fontSize: 13,
    fontWeight: "700",
  },
  busy: {
    alignSelf: "flex-start",
    marginTop: 10,
  },
  footer: {
    borderTopWidth: StyleSheet.hairlineWidth,
    paddingVertical: 12,
    alignItems: "center",
  },
  footerText: {
    fontSize: 13,
    fontWeight: "700",
  },
});
