import { Theme } from "@/src/constants/theme";
import { bookmarkRef } from "@/src/services/bookmarks";
import {
  loadConnections,
  loadSharedWithMe,
  SharedVerse,
} from "@/src/services/connections";
import { Ionicons } from "@expo/vector-icons";
import { useFocusEffect, useRouter } from "expo-router";
import { useCallback, useState } from "react";
import {
  ActivityIndicator,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";

/** How many shared verses Home shows. */
const FEED_SIZE = 5;

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

/**
 * Home: recent verses shared by your Brethren. Reloads each time
 * Home comes into view.
 */
export function SharedVersesCard({
  theme,
  style,
}: {
  theme: Theme;
  style?: object;
}) {
  const router = useRouter();
  const [shares, setShares] = useState<SharedVerse[] | null>(null);
  const [hasConnections, setHasConnections] = useState(true);
  const [error, setError] = useState(false);

  const load = useCallback(async () => {
    setError(false);
    try {
      const connections = await loadConnections();
      setHasConnections(connections.length > 0);
      setShares(
        connections.length > 0
          ? await loadSharedWithMe(FEED_SIZE, connections)
          : [],
      );
    } catch {
      setError(true);
      setShares([]);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      load();
    }, [load]),
  );

  return (
    <View
      style={[
        styles.card,
        { backgroundColor: theme.surface, borderColor: theme.border },
        style,
      ]}
    >
      <View style={styles.header}>
        <Text style={[styles.label, { color: theme.text }]}>
          From your Brethren
        </Text>
        <TouchableOpacity
          onPress={() => router.push("/(tabs)/brethren")}
          hitSlop={8}
          accessibilityRole="button"
          accessibilityLabel="Manage Brethren"
          activeOpacity={0.7}
        >
          <Ionicons name="people-outline" size={18} color={theme.textSecondary} />
        </TouchableOpacity>
      </View>

      {shares === null ? (
        <ActivityIndicator color={theme.textSecondary} style={styles.spinner} />
      ) : error ? (
        <TouchableOpacity onPress={load} activeOpacity={0.7}>
          <Text style={[styles.empty, { color: theme.textSecondary }]}>
            Could not load shared verses. Tap to try again.
          </Text>
        </TouchableOpacity>
      ) : !hasConnections ? (
        <View style={styles.emptyWrap}>
          <Text style={[styles.empty, { color: theme.textSecondary }]}>
            Connect with your Brethren to see the verses they share.
          </Text>
          <TouchableOpacity
            onPress={() => router.push("/(tabs)/brethren")}
            activeOpacity={0.7}
          >
            <Text style={[styles.link, { color: theme.text }]}>
              Add Brethren →
            </Text>
          </TouchableOpacity>
        </View>
      ) : shares.length === 0 ? (
        <Text style={[styles.empty, { color: theme.textSecondary }]}>
          When your Brethren share a verse, it will show up here.
        </Text>
      ) : (
        shares.map((s, i) => (
          <TouchableOpacity
            key={s.id}
            onPress={() =>
              router.push(
                `/(tabs)/bible-browser?bookId=${s.bookId}&chapter=${s.chapter}&verse=${s.verse}`,
              )
            }
            activeOpacity={0.75}
            style={[
              styles.item,
              i > 0 && {
                borderTopWidth: StyleSheet.hairlineWidth,
                borderTopColor: theme.border,
              },
            ]}
          >
            <Text style={[styles.meta, { color: theme.textSecondary }]}>
              <Text style={[styles.author, { color: theme.text }]}>
                {s.authorName}
              </Text>
              {"  ·  "}
              {timeAgo(s.createdAt)}
            </Text>
            {!!s.note && (
              <Text style={[styles.note, { color: theme.text }]}>
                {s.note}
              </Text>
            )}
            <Text style={[styles.ref, { color: theme.text }]}>
              {bookmarkRef(s)}{" "}
              <Text style={{ color: theme.textSecondary, fontWeight: "400" }}>
                {s.version}
              </Text>
            </Text>
            <Text
              style={[styles.text, { color: theme.textSecondary }]}
              numberOfLines={3}
            >
              {s.text}
            </Text>
          </TouchableOpacity>
        ))
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    borderWidth: 1,
    borderRadius: 14,
    paddingHorizontal: 16,
    paddingTop: 14,
    paddingBottom: 6,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 6,
  },
  label: {
    fontSize: 11,
    fontWeight: "700",
    letterSpacing: 1.4,
    textTransform: "uppercase",
    opacity: 0.6,
  },
  spinner: { marginVertical: 14 },
  emptyWrap: { gap: 6, paddingBottom: 10 },
  empty: {
    fontSize: 13,
    lineHeight: 19,
    paddingVertical: 8,
  },
  link: {
    fontSize: 13,
    fontWeight: "700",
  },
  item: {
    paddingVertical: 10,
    gap: 3,
  },
  meta: {
    fontSize: 12,
  },
  author: {
    fontWeight: "700",
  },
  note: {
    fontSize: 14,
    lineHeight: 20,
    fontStyle: "italic",
  },
  ref: {
    fontSize: 13,
    fontWeight: "700",
    marginTop: 2,
  },
  text: {
    fontSize: 13,
    lineHeight: 19,
  },
});
