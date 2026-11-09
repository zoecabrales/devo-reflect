import { Theme } from "@/src/constants/theme";
import { BibleBook } from "@/src/services/bible";
import { styles as bibleStyles } from "@/src/styles/bible-browser.styles";
import { Fragment } from "react";
import { Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import { BookSpine, bookFrame } from "./BookSpread";

type Section = { title: string; data: BibleBook[] };

type Props = {
  sections: Section[];
  theme: Theme;
  onSelect: (book: BibleBook) => void;
};

/**
 * Desktop "table of contents" for the Bible: Old and New Testament side by
 * side on the same open-book frame as the reader, each book listed with a
 * dotted leader to its chapter count. Uses the mobile list's text styles so
 * font sizes match.
 */
export function BookContents({ sections, theme, onSelect }: Props) {
  return (
    <ScrollView contentContainerStyle={styles.scroll}>
      <View style={bookFrame.outer}>
        <View
          style={[
            bookFrame.book,
            styles.book,
            { backgroundColor: theme.surface, borderColor: theme.border },
          ]}
        >
          {sections.map((section, i) => (
            <Fragment key={section.title}>
              {i > 0 && <BookSpine theme={theme} />}
              <View style={styles.column}>
                <View style={styles.columnHeader}>
                  <Text
                    style={[
                      bibleStyles.sectionHeaderText,
                      { color: theme.text },
                    ]}
                  >
                    {section.title}
                  </Text>
                  <Text
                    style={[
                      bibleStyles.sectionHeaderText,
                      { color: theme.text },
                    ]}
                  >
                    Chapters
                  </Text>
                </View>
                {section.data.map((b) => (
                  <Pressable
                    key={b.id}
                    onPress={() => onSelect(b)}
                    accessibilityRole="link"
                    accessibilityLabel={`${b.label}, ${b.chapters} chapters`}
                    style={({ hovered }: { hovered?: boolean }) => [
                      styles.row,
                      hovered && { backgroundColor: theme.background },
                    ]}
                  >
                    <Text
                      style={[bibleStyles.bookLabel, { color: theme.text }]}
                    >
                      {b.label}
                    </Text>
                    {/* Dotted leader, as on a printed contents page */}
                    <View
                      style={[
                        styles.leader,
                        { borderColor: theme.textSecondary },
                      ]}
                    />
                    <Text
                      style={[
                        bibleStyles.bookLabel,
                        styles.count,
                        { color: theme.textSecondary },
                      ]}
                    >
                      {b.chapters}
                    </Text>
                  </Pressable>
                ))}
              </View>
            </Fragment>
          ))}
          {/* One testament only (e.g. a collection): keep the open-book
              spread with a blank facing page */}
          {sections.length === 1 && (
            <>
              <BookSpine theme={theme} />
              <View style={styles.column} />
            </>
          )}
        </View>
      </View>
    </ScrollView>
  );
}

/**
 * Desktop chapter picker for one book, on the same book frame as the table
 * of contents: compact chapter numbers in left-aligned rows.
 */
export function ChapterContents({
  book,
  theme,
  onSelect,
}: {
  book: BibleBook;
  theme: Theme;
  onSelect: (chapter: number) => void;
}) {
  const chapters = Array.from({ length: book.chapters }, (_, i) => i + 1);
  return (
    <ScrollView contentContainerStyle={styles.scroll}>
      <View style={bookFrame.outer}>
        <View
          style={[
            bookFrame.book,
            styles.book,
            styles.chapterPage,
            { backgroundColor: theme.surface, borderColor: theme.border },
          ]}
        >
          <View style={[styles.columnHeader, styles.chapterHeader]}>
            <Text
              style={[bibleStyles.sectionHeaderText, { color: theme.text }]}
            >
              Chapters
            </Text>
            <Text
              style={[bibleStyles.sectionHeaderText, { color: theme.text }]}
            >
              {book.chapters}
            </Text>
          </View>
          <View style={styles.chapterGrid}>
            {chapters.map((ch) => (
              <Pressable
                key={ch}
                onPress={() => onSelect(ch)}
                accessibilityRole="link"
                accessibilityLabel={`${book.label} chapter ${ch}`}
                style={({ hovered }: { hovered?: boolean }) => [
                  styles.chapterBtn,
                  {
                    borderColor: hovered ? theme.textSecondary : theme.border,
                    backgroundColor: hovered
                      ? theme.background
                      : "transparent",
                  },
                ]}
              >
                <Text style={[styles.chapterNum, { color: theme.text }]}>
                  {ch}
                </Text>
              </Pressable>
            ))}
          </View>
        </View>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  scroll: {
    flexGrow: 1,
  },
  // The reader's book fills the screen; the contents page sizes to its rows
  book: {
    flexGrow: 0,
    flexShrink: 0,
    flexBasis: "auto",
  },
  column: {
    flex: 1,
    paddingHorizontal: 44,
    paddingTop: 32,
    paddingBottom: 28,
  },
  columnHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    paddingHorizontal: 8,
    paddingBottom: 12,
  },
  row: {
    flexDirection: "row",
    alignItems: "flex-end",
    paddingHorizontal: 8,
    paddingVertical: 9,
    borderRadius: 6,
  },
  leader: {
    flex: 1,
    marginHorizontal: 10,
    marginBottom: 5,
    borderBottomWidth: 1,
    borderStyle: "dotted",
    opacity: 0.5,
  },
  // ── Chapter picker ──
  chapterPage: {
    flexDirection: "column",
    paddingHorizontal: 44,
    paddingTop: 32,
    paddingBottom: 36,
  },
  chapterHeader: {
    paddingHorizontal: 0,
  },
  chapterGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
  },
  chapterBtn: {
    width: 40,
    height: 40,
    borderRadius: 9,
    borderWidth: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  chapterNum: {
    fontSize: 13,
    fontWeight: "600",
    fontVariant: ["tabular-nums"],
  },
  count: {
    fontVariant: ["tabular-nums"],
    minWidth: 24,
    textAlign: "right",
  },
});
