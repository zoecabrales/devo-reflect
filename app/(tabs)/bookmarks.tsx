import { darkTheme, lightTheme, Theme } from "@/src/constants/theme";
import {
    BookmarkedVerse,
    loadBookmarks,
    removeBookmark,
} from "@/src/services/bookmarks";
import { Ionicons } from "@expo/vector-icons";
import { useFocusEffect } from "expo-router";
import { useCallback, useState } from "react";
import {
    FlatList,
    Text,
    TouchableOpacity,
    useColorScheme,
    View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { styles } from "./bookmarks.styles";

export default function Bookmarks() {
  const colorScheme = useColorScheme();
  const theme: Theme = colorScheme === "dark" ? darkTheme : lightTheme;
  const [bookmarks, setBookmarks] = useState<BookmarkedVerse[]>([]);

  // Reload every time the tab comes into focus
  useFocusEffect(
    useCallback(() => {
      loadBookmarks().then(setBookmarks);
    }, []),
  );

  async function handleDelete(id: string) {
    await removeBookmark(id);
    setBookmarks((prev) => prev.filter((b) => b.id !== id));
  }

  return (
    <SafeAreaView
      edges={["top", "bottom"]}
      style={[styles.container, { backgroundColor: theme.background }]}
    >
      {/* Header */}
      <View style={styles.header}>
        <Text style={[styles.headerTitle, { color: theme.text }]}>
          Bookmarks
        </Text>
        <Text style={[styles.headerSubtitle, { color: theme.textSecondary }]}>
          {bookmarks.length > 0
            ? `${bookmarks.length} saved verse${bookmarks.length === 1 ? "" : "s"}`
            : "Double-tap any verse to save it"}
        </Text>
      </View>

      {bookmarks.length === 0 ? (
        <View style={styles.empty}>
          <Ionicons
            name="bookmark-outline"
            size={40}
            color={theme.textSecondary}
          />
          <Text style={[styles.emptyTitle, { color: theme.text }]}>
            No bookmarks yet
          </Text>
          <Text style={[styles.emptySubtitle, { color: theme.textSecondary }]}>
            Double-tap any verse while reading to save it here.
          </Text>
        </View>
      ) : (
        <FlatList
          data={bookmarks}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.list}
          renderItem={({ item }) => (
            <View
              style={[
                styles.row,
                {
                  backgroundColor: theme.surface,
                  borderColor: theme.border,
                },
              ]}
            >
              <View style={styles.rowBody}>
                <Text style={[styles.rowRef, { color: theme.text }]}>
                  {item.bookLabel} {item.chapter}:{item.verse}
                </Text>
                <Text style={[styles.rowText, { color: theme.text }]}>
                  {item.text}
                </Text>
                <Text
                  style={[styles.rowVersion, { color: theme.textSecondary }]}
                >
                  {item.version}
                </Text>
              </View>
              <TouchableOpacity
                style={styles.deleteBtn}
                onPress={() => handleDelete(item.id)}
                activeOpacity={0.7}
              >
                <Ionicons
                  name="trash-outline"
                  size={18}
                  color={theme.textSecondary}
                />
              </TouchableOpacity>
            </View>
          )}
        />
      )}
    </SafeAreaView>
  );
}
