// Strips shown under the reader's header: "Read in context", bookmarking for
// a calendar day, and the chapter search box.

import { BOOK_GUIDES } from "@/src/constants/bibleGuide";
import { Theme } from "@/src/constants/theme";
import { BibleBook } from "@/src/services/bible";
import { formatVerseNumbers } from "@/src/services/bookmarks";
import { styles } from "@/src/styles/bible-browser.styles";
import { formatDateKey } from "@/src/utils/dateKey";
import { Ionicons } from "@expo/vector-icons";
import { Text, TextInput, TouchableOpacity, View } from "react-native";
import { bookSetting } from "./BookGuideSheet";

/** "John 3:16 in context": where the passage sits, and a link to the book. */
export function ContextBanner({
  theme,
  inset,
  book,
  chapter,
  verses,
  onAbout,
  onClose,
}: {
  theme: Theme;
  inset: number;
  book: BibleBook;
  chapter: number;
  verses: number[];
  onAbout: () => void;
  onClose: () => void;
}) {
  const setting = bookSetting(book.id);
  return (
    <View
      style={[
        styles.contextBanner,
        { marginHorizontal: inset },
        { borderColor: theme.border, backgroundColor: theme.surface },
      ]}
    >
      <Ionicons
        name="reader-outline"
        size={16}
        color={theme.textSecondary}
        style={styles.contextBannerIcon}
      />
      <View style={styles.contextBannerBody}>
        <Text style={[styles.contextBannerTitle, { color: theme.text }]}>
          {book.label} {chapter}:{formatVerseNumbers(verses)} in context
        </Text>
        {setting && (
          <Text style={[styles.contextBannerText, { color: theme.textSecondary }]}>
            {setting}
          </Text>
        )}
        <Text style={[styles.contextBannerText, { color: theme.textSecondary }]}>
          The shaded verses around it are part of the same passage. Read them
          together.
        </Text>
        {BOOK_GUIDES[book.id] && (
          <TouchableOpacity onPress={onAbout} activeOpacity={0.7}>
            <Text style={[styles.contextBannerLink, { color: theme.text }]}>
              About {book.label} →
            </Text>
          </TouchableOpacity>
        )}
      </View>
      <TouchableOpacity
        onPress={onClose}
        hitSlop={8}
        accessibilityRole="button"
        accessibilityLabel="Hide context"
        activeOpacity={0.7}
      >
        <Ionicons name="close" size={16} color={theme.textSecondary} />
      </TouchableOpacity>
    </View>
  );
}

/** "Planning / Bookmarking a verse for {day}", when arriving from Growth. */
export function CalendarDayBanner({
  theme,
  inset,
  date,
  todayKey,
  onCancel,
}: {
  theme: Theme;
  inset: number;
  /** "YYYY-MM-DD" */
  date: string;
  todayKey: string;
  onCancel: () => void;
}) {
  return (
    <View
      style={[
        styles.planBanner,
        { marginHorizontal: inset },
        { borderColor: theme.border, backgroundColor: theme.surface },
      ]}
    >
      <Ionicons name="calendar-outline" size={15} color={theme.textSecondary} />
      <Text style={[styles.planBannerText, { color: theme.text }]}>
        {date > todayKey ? "Planning" : "Bookmarking"} a verse for{" "}
        {formatDateKey(date)}
        <Text style={{ color: theme.textSecondary }}>
          {" "}
          · tap a verse, then Bookmark
        </Text>
      </Text>
      <TouchableOpacity
        onPress={onCancel}
        accessibilityRole="button"
        accessibilityLabel="Cancel"
        activeOpacity={0.7}
      >
        <Ionicons name="close" size={16} color={theme.textSecondary} />
      </TouchableOpacity>
    </View>
  );
}

/** Search box for words in the open chapter. */
export function ChapterSearchBar({
  theme,
  inset,
  query,
  onChange,
  onClear,
}: {
  theme: Theme;
  inset: number;
  query: string;
  onChange: (text: string) => void;
  onClear: () => void;
}) {
  return (
    <View
      style={[
        styles.searchBar,
        { marginHorizontal: inset },
        { borderColor: theme.border, backgroundColor: theme.surface },
      ]}
    >
      <Ionicons name="search" size={15} color={theme.textSecondary} />
      <TextInput
        style={[styles.searchInput, { color: theme.text }]}
        placeholder="Search in chapter…"
        placeholderTextColor={theme.textSecondary}
        value={query}
        onChangeText={onChange}
        autoFocus
        returnKeyType="search"
        clearButtonMode="never"
      />
      {query.length > 0 && (
        <TouchableOpacity onPress={onClear} activeOpacity={0.7}>
          <Ionicons name="close-circle" size={16} color={theme.textSecondary} />
        </TouchableOpacity>
      )}
    </View>
  );
}
