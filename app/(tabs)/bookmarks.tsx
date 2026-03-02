import { useAppTheme } from "@/src/contexts/ThemeContext";
import {
    BookmarkedVerse,
    loadBookmarks,
    removeBookmark,
} from "@/src/services/bookmarks";
import { auth } from "@/src/services/firebase";
import { Ionicons } from "@expo/vector-icons";
import { useFocusEffect, useRouter } from "expo-router";
import { useCallback, useState } from "react";
import { FlatList, Text, TouchableOpacity, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { styles } from "./bookmarks.styles";

const JOSHUA_1_8 = {
  ref: "Joshua 1:8",
  text: "This book of the law shall not depart out of thy mouth, but thou shalt meditate thereon day and night, that thou mayest observe to do according to all that is written therein: for then thou shalt make thy way prosperous, and then thou shalt have good success.",
};

export default function Bookmarks() {
  const { theme } = useAppTheme();
  const router = useRouter();
  const [bookmarks, setBookmarks] = useState<BookmarkedVerse[]>([]);

  const uid = auth.currentUser?.uid ?? "";

  // Reload every time the tab comes into focus
  useFocusEffect(
    useCallback(() => {
      if (!uid) return;
      loadBookmarks(uid).then(setBookmarks);
    }, [uid]),
  );

  async function handleDelete(id: string) {
    await removeBookmark(uid, id);
    setBookmarks((prev) => prev.filter((b) => b.id !== id));
  }

  return (
    <SafeAreaView
      edges={["top"]}
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
            : "Highlight any verse to bookmark it"}
        </Text>
      </View>

      {bookmarks.length === 0 ? (
        <View style={styles.empty}>
          <Text style={[styles.emptyPrompt, { color: theme.textSecondary }]}>
            No bookmarks yet. Meditate on His Word:
          </Text>
          <View
            style={[
              styles.verseCard,
              { backgroundColor: theme.surface, borderColor: theme.border },
            ]}
          >
            <Text style={[styles.verseRef, { color: theme.textSecondary }]}>
              {JOSHUA_1_8.ref}
            </Text>
            <Text style={[styles.verseText, { color: theme.text }]}>
              {JOSHUA_1_8.text}
            </Text>
          </View>
        </View>
      ) : (
        <FlatList
          data={bookmarks}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.list}
          renderItem={({ item }) => (
            <TouchableOpacity
              style={[
                styles.row,
                {
                  backgroundColor: theme.surface,
                  borderColor: theme.border,
                },
              ]}
              onPress={() =>
                router.push(
                  `/(tabs)/bible-browser?bookId=${item.bookId}&chapter=${item.chapter}&verse=${item.verse}&highlight=true`,
                )
              }
              activeOpacity={0.75}
            >
              <View style={styles.rowBody}>
                <Text style={[styles.rowRef, { color: theme.primary }]}>
                  {item.bookLabel} {item.chapter}:{item.verse}
                </Text>
                <Text style={[styles.rowText, { color: theme.text }]}>
                  {item.text}
                </Text>
                <Text
                  style={[styles.rowVersion, { color: theme.textSecondary }]}
                >
                  {item.version} · Saved{" "}
                  {new Date(item.createdAt).toLocaleDateString("en-US", {
                    month: "short",
                    day: "numeric",
                  })}
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
            </TouchableOpacity>
          )}
        />
      )}
    </SafeAreaView>
  );
}
