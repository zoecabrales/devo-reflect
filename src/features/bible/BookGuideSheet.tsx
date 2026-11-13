import { AppModal, SheetHandle } from "@/src/components";
import { BOOK_GUIDES } from "@/src/constants/bibleGuide";
import { Theme } from "@/src/constants/theme";
import { BIBLE_COLLECTIONS, BibleBook } from "@/src/services/bible";
import { passageTarget } from "@/src/utils/readerLink";
import { Ionicons } from "@expo/vector-icons";
import {
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";

/** One-line setting for a book, e.g. "Paul · To the church in Philippi…". */
export function bookSetting(bookId: string): string | null {
  const g = BOOK_GUIDES[bookId];
  return g ? `${g.author} · ${g.setting}` : null;
}

/**
 * "About this book" sheet in the Bible reader: who wrote it, when, to whom,
 * what it's about, themes and key passages (from src/constants/bibleGuide).
 */
export function BookGuideSheet({
  book,
  visible,
  theme,
  onClose,
  onOpenPassage,
}: {
  book: BibleBook | null;
  visible: boolean;
  theme: Theme;
  onClose: () => void;
  /** Opens a key passage in the reader. */
  onOpenPassage: (chapter: number, verse?: number) => void;
}) {
  const guide = book ? BOOK_GUIDES[book.id] : undefined;
  const section = book
    ? BIBLE_COLLECTIONS.find((c) => c.bookIds.includes(book.id))
    : undefined;

  return (
    <AppModal
      visible={visible && !!guide}
      onClose={onClose}
      animationType="slide"
      overlayStyle={styles.overlay}
      cardStyle={[
        styles.sheet,
        { backgroundColor: theme.surface, borderColor: theme.border },
      ]}
    >
      <SheetHandle style={styles.handle} />
      {book && guide && (
        <ScrollView
          style={styles.scroll}
          contentContainerStyle={styles.content}
          showsVerticalScrollIndicator={false}
        >
          <View style={styles.header}>
            <View style={styles.flex}>
              <Text style={[styles.kicker, { color: theme.textSecondary }]}>
                ABOUT THIS BOOK
                {section ? ` · ${section.label.toUpperCase()}` : ""}
              </Text>
              <Text style={[styles.title, { color: theme.text }]}>
                {book.label}
              </Text>
            </View>
            <TouchableOpacity
              onPress={onClose}
              hitSlop={10}
              accessibilityRole="button"
              accessibilityLabel="Close"
              activeOpacity={0.7}
            >
              <Ionicons name="close" size={22} color={theme.textSecondary} />
            </TouchableOpacity>
          </View>

          <Text style={[styles.summary, { color: theme.text }]}>
            {guide.summary}
          </Text>

          <Fact theme={theme} label="Written by" value={guide.author} />
          <Fact theme={theme} label="When" value={guide.date} />
          <Fact theme={theme} label="Setting" value={guide.setting} />

          <Text style={[styles.label, { color: theme.textSecondary }]}>
            Key themes
          </Text>
          <View style={styles.chips}>
            {guide.themes.map((t) => (
              <View key={t} style={[styles.chip, { borderColor: theme.border }]}>
                <Text style={[styles.chipText, { color: theme.text }]}>{t}</Text>
              </View>
            ))}
          </View>

          <Text style={[styles.label, { color: theme.textSecondary }]}>
            Key passages
          </Text>
          <View style={styles.chips}>
            {guide.keyPassages.map((p) => {
              const t = passageTarget(p);
              return (
                <TouchableOpacity
                  key={p}
                  onPress={() => onOpenPassage(t.chapter, t.verse)}
                  accessibilityRole="link"
                  accessibilityLabel={`Read ${p}`}
                  activeOpacity={0.7}
                >
                  <Text style={[styles.passage, { color: theme.text }]}>{p}</Text>
                </TouchableOpacity>
              );
            })}
          </View>

          <Text style={[styles.note, { color: theme.textSecondary }]}>
            Dates are approximate. Authors follow the traditional view; where
            scholars widely debate them, that is noted.
          </Text>
        </ScrollView>
      )}
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
      <Text style={[styles.label, { color: theme.textSecondary }]}>{label}</Text>
      <Text style={[styles.factValue, { color: theme.text }]}>{value}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    justifyContent: "flex-end",
    backgroundColor: "rgba(0,0,0,0.45)",
  },
  sheet: {
    maxHeight: "85%",
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
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
    opacity: 0.4,
  },
  scroll: { flexGrow: 0 },
  content: { paddingHorizontal: 22, paddingTop: 6, paddingBottom: 32, gap: 12 },
  header: { flexDirection: "row", alignItems: "flex-start", gap: 12 },
  flex: { flex: 1 },
  kicker: { fontSize: 11, fontWeight: "700", letterSpacing: 1.2 },
  title: {
    fontSize: 24,
    fontFamily: "Oswald_700Bold",
    letterSpacing: 0.3,
    marginTop: 2,
  },
  summary: { fontSize: 15, lineHeight: 23 },
  fact: { gap: 2 },
  label: {
    fontSize: 11,
    fontWeight: "700",
    letterSpacing: 0.8,
    textTransform: "uppercase",
  },
  factValue: { fontSize: 14, lineHeight: 20 },
  chips: { flexDirection: "row", flexWrap: "wrap", gap: 6, marginTop: -4 },
  chip: {
    borderWidth: 1,
    borderRadius: 12,
    paddingHorizontal: 10,
    paddingVertical: 4,
  },
  chipText: { fontSize: 12 },
  passage: {
    fontSize: 13,
    fontWeight: "600",
    textDecorationLine: "underline",
    paddingVertical: 2,
    marginRight: 8,
  },
  note: { fontSize: 11, lineHeight: 16, marginTop: 4 },
});
