import { TAB_ACTIVE_COLOR, Theme } from "@/src/constants/theme";
import { BIBLE_BOOKS } from "@/src/services/bible";
import { JournalEntry } from "@/src/services/journal";
import { dateKeyOf, formatDateKey } from "@/src/utils/dateKey";
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { Pressable, ScrollView, StyleSheet, Text, View } from "react-native";

const PHT = "Asia/Manila";

type Props = {
  entry: JournalEntry;
  theme: Theme;
  onEdit: () => void;
  onDelete: () => void;
};

const SECTIONS: {
  key: "observation" | "application" | "prayer";
  letter: string;
  label: string;
}[] = [
  { key: "observation", letter: "O", label: "Observation" },
  { key: "application", letter: "A", label: "Application" },
  { key: "prayer", letter: "P", label: "Prayer" },
];

function fmtDate(ts: number, short = false) {
  return new Date(ts).toLocaleDateString(
    "en-US",
    short
      ? { month: "long", day: "numeric", timeZone: PHT }
      : {
          weekday: "long",
          year: "numeric",
          month: "long",
          day: "numeric",
          timeZone: PHT,
        },
  );
}

/**
 * Desktop Journal reading pane: the selected entry in full (all SOAP sections,
 * verse text, tags), read-only, with Edit and Delete actions.
 */
export function JournalReader({ entry, theme, onEdit, onDelete }: Props) {
  const router = useRouter();
  const title =
    entry.title || entry.observation.split("\n")[0] || "Untitled entry";
  const book = entry.bookId
    ? BIBLE_BOOKS.find((b) => b.id === entry.bookId)
    : undefined;
  const edited = entry.updatedAt - entry.createdAt > 60_000;
  // Added from a calendar day other than the day it was written
  const forOtherDay =
    !!entry.forDate && entry.forDate !== dateKeyOf(entry.createdAt);

  return (
    <View
      style={[
        styles.pane,
        { backgroundColor: theme.surface, borderColor: theme.border },
      ]}
    >
      {/* ── Header: date, title, actions ── */}
      <View style={[styles.header, { borderBottomColor: theme.border }]}>
        <View style={styles.headerText}>
          <Text style={[styles.date, { color: theme.textSecondary }]}>
            {forOtherDay
              ? `For ${formatDateKey(entry.forDate!, {
                  weekday: "long",
                  month: "long",
                  day: "numeric",
                  year: "numeric",
                })} · Written ${fmtDate(entry.createdAt, true)}`
              : fmtDate(entry.createdAt)}
          </Text>
          <Text style={[styles.title, { color: theme.text }]}>{title}</Text>
        </View>
        <View style={styles.actions}>
          <Pressable
            onPress={onDelete}
            accessibilityRole="button"
            accessibilityLabel="Delete entry"
            style={({ hovered }: { hovered?: boolean }) => [
              styles.iconBtn,
              {
                borderColor: theme.border,
                backgroundColor: hovered ? theme.background : "transparent",
              },
            ]}
          >
            <Ionicons
              name="trash-outline"
              size={16}
              color={theme.textSecondary}
            />
          </Pressable>
          <Pressable
            onPress={onEdit}
            accessibilityRole="button"
            accessibilityLabel="Edit entry"
            style={[styles.editBtn, { backgroundColor: theme.primary }]}
          >
            <Ionicons
              name="create-outline"
              size={15}
              color={theme.primaryText}
            />
            <Text style={[styles.editText, { color: theme.primaryText }]}>
              Edit
            </Text>
          </Pressable>
        </View>
      </View>

      <ScrollView contentContainerStyle={styles.body}>
        {/* ── S — Scripture ── */}
        <SectionLabel theme={theme} letter="S" label="Scripture" />
        {entry.scripture.length === 0 ? (
          <Empty theme={theme} text="No verse attached." />
        ) : (
          entry.scripture.map((s) => (
            <View
              key={s.ref}
              style={[styles.verse, { borderLeftColor: theme.primary }]}
            >
              <Text style={[styles.verseRef, { color: theme.textSecondary }]}>
                {s.ref}
              </Text>
              {!!s.text && (
                <Text style={[styles.verseText, { color: theme.text }]}>
                  {s.text}
                </Text>
              )}
            </View>
          ))
        )}
        {book && entry.chapter ? (
          <Pressable
            onPress={() =>
              router.push(
                `/(tabs)/bible-browser?bookId=${book.id}&chapter=${entry.chapter}`,
              )
            }
            accessibilityRole="link"
            style={styles.link}
          >
            <Text style={styles.linkText}>
              Read {book.label} {entry.chapter} →
            </Text>
          </Pressable>
        ) : null}

        {/* ── O / A / P ── */}
        {SECTIONS.map((sec) => (
          <View key={sec.key} style={styles.section}>
            <SectionLabel theme={theme} letter={sec.letter} label={sec.label} />
            {entry[sec.key].trim() ? (
              <Text style={[styles.paragraph, { color: theme.text }]}>
                {entry[sec.key]}
              </Text>
            ) : (
              <Empty theme={theme} text="Not written yet." />
            )}
          </View>
        ))}

        {/* ── Tags ── */}
        {entry.tags.length > 0 && (
          <View style={styles.tagRow}>
            {entry.tags.map((t) => (
              <View
                key={t}
                style={[
                  styles.tag,
                  {
                    borderColor: theme.border,
                    backgroundColor: theme.background,
                  },
                ]}
              >
                <Text style={[styles.tagText, { color: theme.textSecondary }]}>
                  #{t}
                </Text>
              </View>
            ))}
          </View>
        )}

        {edited && (
          <Text style={[styles.footnote, { color: theme.textSecondary }]}>
            Last edited {fmtDate(entry.updatedAt)}
          </Text>
        )}
      </ScrollView>
    </View>
  );
}

function SectionLabel({
  theme,
  letter,
  label,
}: {
  theme: Theme;
  letter: string;
  label: string;
}) {
  return (
    <Text style={[styles.sectionLabel, { color: theme.textSecondary }]}>
      {letter} — {label.toUpperCase()}
    </Text>
  );
}

function Empty({ theme, text }: { theme: Theme; text: string }) {
  return (
    <Text style={[styles.empty, { color: theme.textSecondary }]}>{text}</Text>
  );
}

const styles = StyleSheet.create({
  pane: {
    flex: 1,
    borderWidth: 1,
    borderRadius: 14,
    overflow: "hidden",
  },
  header: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 16,
    paddingHorizontal: 28,
    paddingTop: 24,
    paddingBottom: 18,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  headerText: {
    flex: 1,
    gap: 6,
  },
  date: {
    fontSize: 12,
    fontWeight: "600",
    letterSpacing: 0.8,
    textTransform: "uppercase",
  },
  title: {
    fontSize: 26,
    fontFamily: "Oswald_700Bold",
    letterSpacing: 0.3,
    lineHeight: 34,
  },
  actions: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  iconBtn: {
    width: 34,
    height: 34,
    borderRadius: 17,
    borderWidth: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  editBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingHorizontal: 14,
    height: 34,
    borderRadius: 17,
  },
  editText: {
    fontSize: 13,
    fontWeight: "700",
    letterSpacing: 0.4,
  },
  body: {
    paddingHorizontal: 28,
    paddingTop: 22,
    paddingBottom: 32,
  },
  section: {
    marginTop: 26,
  },
  sectionLabel: {
    fontSize: 11,
    fontWeight: "700",
    letterSpacing: 1.6,
    marginBottom: 10,
  },
  verse: {
    borderLeftWidth: 3,
    paddingLeft: 14,
    paddingVertical: 2,
    marginBottom: 12,
    gap: 4,
  },
  verseRef: {
    fontSize: 12,
    fontWeight: "700",
    letterSpacing: 0.6,
  },
  verseText: {
    fontSize: 17,
    lineHeight: 27,
    fontFamily: 'Georgia, "Iowan Old Style", "Times New Roman", serif',
  },
  link: {
    alignSelf: "flex-start",
  },
  linkText: {
    fontSize: 14,
    color: TAB_ACTIVE_COLOR,
  },
  paragraph: {
    fontSize: 16,
    lineHeight: 26,
  },
  empty: {
    fontSize: 14,
    fontStyle: "italic",
    opacity: 0.7,
  },
  tagRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
    marginTop: 28,
  },
  tag: {
    borderWidth: 1,
    borderRadius: 999,
    paddingHorizontal: 10,
    paddingVertical: 4,
  },
  tagText: {
    fontSize: 12,
    fontWeight: "600",
  },
  footnote: {
    marginTop: 24,
    fontSize: 12,
    opacity: 0.7,
  },
});
