import { AppModal, BentoGrid, PageHeader } from "@/src/components";
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
import {
    FlatList,
    ScrollView,
    Text,
    TouchableOpacity,
    View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { styles } from "@/src/styles/bookmarks.styles";
import { desktopPage } from "@/src/styles/desktopPage.styles";
import { useIsDesktop, useListPaddingH } from "@/src/utils/responsive";

const JOSHUA_1_8 = {
  ref: "Joshua 1:8",
  text: "This book of the law shall not depart out of thy mouth, but thou shalt meditate thereon day and night, that thou mayest observe to do according to all that is written therein: for then thou shalt make thy way prosperous, and then thou shalt have good success.",
};

export default function Bookmarks() {
  const { theme } = useAppTheme();
  const padH = useListPaddingH();
  const router = useRouter();
  const [bookmarks, setBookmarks] = useState<BookmarkedVerse[]>([]);
  const [deleteTargetId, setDeleteTargetId] = useState<string | null>(null);
  const isDesktop = useIsDesktop();

  const uid = auth.currentUser?.uid ?? "";

  // Reload every time the tab comes into focus
  useFocusEffect(
    useCallback(() => {
      if (!uid) return;
      loadBookmarks(uid).then(setBookmarks);
    }, [uid]),
  );

  async function confirmDelete() {
    if (!deleteTargetId) return;
    await removeBookmark(uid, deleteTargetId);
    setBookmarks((prev) => prev.filter((b) => b.id !== deleteTargetId));
    setDeleteTargetId(null);
  }

  /** One bookmark card; `tile` = inside the desktop bento grid. */
  function renderBookmark(
    item: BookmarkedVerse,
    { tile = false, featured = false } = {},
  ) {
    return (
      <TouchableOpacity
        style={[
          styles.row,
          {
            backgroundColor: theme.surface,
            borderColor: theme.border,
          },
          tile && desktopPage.tileFill,
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
          <Text
            style={[
              styles.rowText,
              featured && styles.rowTextFeatured,
              { color: theme.text },
            ]}
          >
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
          onPress={() => setDeleteTargetId(item.id)}
          activeOpacity={0.7}
        >
          <Ionicons
            name="trash-outline"
            size={18}
            color={theme.textSecondary}
          />
        </TouchableOpacity>
      </TouchableOpacity>
    );
  }

  return (
    <SafeAreaView
      edges={["top"]}
      style={[styles.container, { backgroundColor: theme.background }]}
    >
      <PageHeader
        title="Bookmarks"
        subtitle={
          bookmarks.length > 0
            ? `${bookmarks.length} saved verse${bookmarks.length === 1 ? "" : "s"}`
            : "Highlight any verse to bookmark it"
        }
      />

      {bookmarks.length === 0 ? (
        <View style={[styles.empty, { paddingHorizontal: padH }]}>
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
      ) : isDesktop ? (
        /* Desktop: bento grid — newest and long verses get wide tiles */
        <ScrollView contentContainerStyle={desktopPage.content}>
          <BentoGrid
            data={bookmarks}
            keyExtractor={(item) => item.id}
            spanFor={(item, index) =>
              index === 0 || item.text.length > 140 ? 2 : 1
            }
            renderItem={(item, { index }) =>
              renderBookmark(item, { tile: true, featured: index === 0 })
            }
          />
        </ScrollView>
      ) : (
        <FlatList
          data={bookmarks}
          keyExtractor={(item) => item.id}
          contentContainerStyle={[styles.list, { paddingHorizontal: padH }]}
          renderItem={({ item }) => renderBookmark(item)}
        />
      )}

      {/* ── Delete Confirmation Modal ── */}
      <AppModal
        visible={deleteTargetId !== null}
        onClose={() => setDeleteTargetId(null)}
        overlayStyle={styles.deleteModalOverlay}
        cardStyle={[
          styles.deleteModalCard,
          { backgroundColor: theme.surface, borderColor: theme.border },
        ]}
      >
        <Text style={[styles.deleteModalTitle, { color: theme.text }]}>
          Delete Bookmark
        </Text>
        <Text
          style={[
            styles.deleteModalBody,
            { color: theme.textSecondary },
          ]}
        >
          This bookmark will be permanently removed. This cannot be
          undone.
        </Text>
        <View style={styles.deleteModalActions}>
          <TouchableOpacity
            style={[
              styles.deleteModalCancel,
              { borderColor: theme.border },
            ]}
            onPress={() => setDeleteTargetId(null)}
            activeOpacity={0.7}
          >
            <Text
              style={[
                styles.deleteModalCancelText,
                { color: theme.textSecondary },
              ]}
            >
              Cancel
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[
              styles.deleteModalConfirm,
              { backgroundColor: "#e53e3e" },
            ]}
            onPress={confirmDelete}
            activeOpacity={0.85}
          >
            <Text
              style={[styles.deleteModalConfirmText, { color: "#fff" }]}
            >
              Delete
            </Text>
          </TouchableOpacity>
        </View>
      </AppModal>
    </SafeAreaView>
  );
}
