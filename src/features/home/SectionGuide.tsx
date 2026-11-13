import { AppModal, SheetHandle } from "@/src/components";
import { BOOK_GUIDES, SECTION_GUIDES } from "@/src/constants/bibleGuide";
import { Theme } from "@/src/constants/theme";
import { BIBLE_BOOKS, BibleCollection } from "@/src/services/bible";
import { contextHref, passageTarget } from "@/src/utils/readerLink";
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { useState } from "react";
import {
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";

/** The "?" on a Browse-by-section card. Opens that section's guide. */
export function SectionGuideButton({
  theme,
  label,
  onPress,
  style,
}: {
  theme: Theme;
  label: string;
  onPress: () => void;
  style?: object;
}) {
  return (
    <TouchableOpacity
      onPress={onPress}
      hitSlop={10}
      accessibilityRole="button"
      accessibilityLabel={`About ${label}`}
      activeOpacity={0.7}
      style={[
        styles.helpBtn,
        { borderColor: theme.border, backgroundColor: theme.surface },
        style,
      ]}
    >
      <Ionicons name="help" size={14} color={theme.textSecondary} />
    </TouchableOpacity>
  );
}

/** Scrollable guide to one Bible section and each of its books. */
export function SectionGuideModal({
  collection,
  theme,
  onClose,
}: {
  collection: BibleCollection | null;
  theme: Theme;
  onClose: () => void;
}) {
  const router = useRouter();
  const [openBook, setOpenBook] = useState<string | null>(null);
  const guide = collection ? SECTION_GUIDES[collection.id] : undefined;

  function close() {
    setOpenBook(null);
    onClose();
  }

  function openReader(bookId: string, chapter: number, verse?: number) {
    close();
    router.push(
      verse
        ? contextHref({ bookId, chapter, verse })
        : `/(tabs)/bible-browser?bookId=${bookId}&chapter=${chapter}`,
    );
  }

  const blocks: { title: string; body: string }[] = guide
    ? [
        { title: "What the name means", body: guide.meaning },
        { title: "Overview", body: guide.overview },
        { title: "Who wrote it & when", body: guide.written },
        { title: "Background", body: guide.background },
        { title: "Tips for reading", body: guide.readingTips },
      ]
    : [];

  return (
    <AppModal
      visible={collection !== null}
      onClose={close}
      animationType="slide"
      overlayStyle={styles.overlay}
      cardStyle={[
        styles.sheet,
        { backgroundColor: theme.surface, borderColor: theme.border },
      ]}
    >
      <SheetHandle style={styles.handle} />
      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.header}>
          <View
            style={[styles.headerIcon, { backgroundColor: theme.primary }]}
          >
            <Ionicons
              name={(collection?.icon ?? "book-outline") as any}
              size={20}
              color={theme.primaryText}
            />
          </View>
          <View style={{ flex: 1 }}>
            <Text style={[styles.title, { color: theme.text }]}>
              {collection?.label}
            </Text>
            <Text style={[styles.subtitle, { color: theme.textSecondary }]}>
              {collection?.subtitle}
            </Text>
          </View>
          <TouchableOpacity
            onPress={close}
            hitSlop={10}
            accessibilityRole="button"
            accessibilityLabel="Close"
            activeOpacity={0.7}
          >
            <Ionicons name="close" size={22} color={theme.textSecondary} />
          </TouchableOpacity>
        </View>

        {blocks.map((b) => (
          <View key={b.title} style={styles.block}>
            <Text style={[styles.blockTitle, { color: theme.textSecondary }]}>
              {b.title}
            </Text>
            <Text style={[styles.blockBody, { color: theme.text }]}>
              {b.body}
            </Text>
          </View>
        ))}

        <Text
          style={[
            styles.blockTitle,
            styles.booksTitle,
            { color: theme.textSecondary },
          ]}
        >
          Books in this section
        </Text>
        {collection?.bookIds.map((id) => {
          const book = BIBLE_BOOKS.find((b) => b.id === id);
          const info = BOOK_GUIDES[id];
          if (!book || !info) return null;
          const open = openBook === id;
          return (
            <View
              key={id}
              style={[styles.bookRow, { borderColor: theme.border }]}
            >
              <Pressable
                onPress={() => setOpenBook(open ? null : id)}
                accessibilityRole="button"
                accessibilityState={{ expanded: open }}
                style={styles.bookHead}
              >
                <View style={{ flex: 1 }}>
                  <Text style={[styles.bookName, { color: theme.text }]}>
                    {book.label}
                  </Text>
                  {!open && (
                    <Text
                      style={[styles.bookPeek, { color: theme.textSecondary }]}
                      numberOfLines={1}
                    >
                      {info.author}
                    </Text>
                  )}
                </View>
                <Ionicons
                  name={open ? "chevron-up" : "chevron-down"}
                  size={16}
                  color={theme.textSecondary}
                />
              </Pressable>

              {open && (
                <View style={styles.bookBody}>
                  <Fact theme={theme} label="Written by" value={info.author} />
                  <Fact theme={theme} label="When" value={info.date} />
                  <Fact theme={theme} label="Setting" value={info.setting} />
                  <Text style={[styles.bookSummary, { color: theme.text }]}>
                    {info.summary}
                  </Text>

                  <View style={styles.chips}>
                    {info.themes.map((t) => (
                      <View
                        key={t}
                        style={[styles.chip, { borderColor: theme.border }]}
                      >
                        <Text
                          style={[styles.chipText, { color: theme.text }]}
                        >
                          {t}
                        </Text>
                      </View>
                    ))}
                  </View>

                  <Text
                    style={[styles.factLabel, { color: theme.textSecondary }]}
                  >
                    Key passages
                  </Text>
                  <View style={styles.chips}>
                    {info.keyPassages.map((p) => {
                      const t = passageTarget(p);
                      return (
                        <TouchableOpacity
                          key={p}
                          onPress={() => openReader(id, t.chapter, t.verse)}
                          accessibilityRole="link"
                          accessibilityLabel={`Read ${p}`}
                          activeOpacity={0.7}
                        >
                          <Text
                            style={[styles.passage, { color: theme.text }]}
                          >
                            {p}
                          </Text>
                        </TouchableOpacity>
                      );
                    })}
                  </View>

                  <TouchableOpacity
                    onPress={() => openReader(id, 1)}
                    activeOpacity={0.85}
                    style={[
                      styles.readBtn,
                      { backgroundColor: theme.primary },
                    ]}
                  >
                    <Ionicons
                      name="book-outline"
                      size={15}
                      color={theme.primaryText}
                    />
                    <Text
                      style={[styles.readBtnText, { color: theme.primaryText }]}
                    >
                      Start reading {book.label}
                    </Text>
                  </TouchableOpacity>
                </View>
              )}
            </View>
          );
        })}

        <Text style={[styles.note, { color: theme.textSecondary }]}>
          Dates are approximate. Authors follow the traditional view; where
          scholars widely debate them, that is noted.
        </Text>
      </ScrollView>
    </AppModal>
  );
}

function Fact({
  theme,
  label,
  value,
}: {
  theme: Theme;
  label: string;
  value: string;
}) {
  return (
    <View style={styles.fact}>
      <Text style={[styles.factLabel, { color: theme.textSecondary }]}>
        {label}
      </Text>
      <Text style={[styles.factValue, { color: theme.text }]}>{value}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  helpBtn: {
    width: 24,
    height: 24,
    borderRadius: 12,
    borderWidth: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  overlay: {
    flex: 1,
    justifyContent: "flex-end",
    backgroundColor: "rgba(0,0,0,0.45)",
  },
  sheet: {
    maxHeight: "88%",
    borderTopLeftRadius: 22,
    borderTopRightRadius: 22,
    borderTopWidth: 1,
    borderLeftWidth: 1,
    borderRightWidth: 1,
    paddingTop: 12,
  },
  handle: {
    width: 40,
    height: 4,
    borderRadius: 2,
    backgroundColor: "#888",
    alignSelf: "center",
    marginBottom: 8,
    opacity: 0.35,
  },
  scroll: { flexGrow: 0 },
  scrollContent: {
    paddingHorizontal: 22,
    paddingTop: 8,
    paddingBottom: 36,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    marginBottom: 18,
  },
  headerIcon: {
    width: 42,
    height: 42,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
  },
  title: {
    fontSize: 21,
    fontFamily: "Oswald_700Bold",
    letterSpacing: 0.4,
  },
  subtitle: {
    fontSize: 12,
    marginTop: 1,
  },
  block: {
    marginBottom: 16,
  },
  blockTitle: {
    fontSize: 11,
    fontWeight: "700",
    letterSpacing: 0.9,
    textTransform: "uppercase",
    marginBottom: 5,
  },
  blockBody: {
    fontSize: 14,
    lineHeight: 21,
  },
  booksTitle: {
    marginTop: 6,
    marginBottom: 8,
  },
  bookRow: {
    borderTopWidth: 1,
  },
  bookHead: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    paddingVertical: 12,
  },
  bookName: {
    fontSize: 15,
    fontWeight: "700",
  },
  bookPeek: {
    fontSize: 12,
    marginTop: 2,
  },
  bookBody: {
    paddingBottom: 16,
    gap: 8,
  },
  fact: {
    gap: 1,
  },
  factLabel: {
    fontSize: 11,
    fontWeight: "700",
    letterSpacing: 0.6,
    textTransform: "uppercase",
  },
  factValue: {
    fontSize: 13,
    lineHeight: 19,
  },
  bookSummary: {
    fontSize: 14,
    lineHeight: 21,
    marginTop: 2,
  },
  chips: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 6,
  },
  chip: {
    borderWidth: 1,
    borderRadius: 12,
    paddingHorizontal: 10,
    paddingVertical: 4,
  },
  chipText: {
    fontSize: 12,
  },
  passage: {
    fontSize: 13,
    fontWeight: "600",
    textDecorationLine: "underline",
    paddingVertical: 2,
    marginRight: 6,
  },
  readBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    borderRadius: 12,
    paddingVertical: 11,
    marginTop: 6,
  },
  readBtnText: {
    fontSize: 14,
    fontWeight: "700",
  },
  note: {
    fontSize: 11,
    lineHeight: 16,
    marginTop: 16,
    opacity: 0.8,
  },
});
