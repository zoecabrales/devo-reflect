import { BRETHREN_ENABLED } from "@/src/constants/features";
import { Theme } from "@/src/constants/theme";
import { styles } from "@/src/styles/bible-browser.styles";
import { Ionicons } from "@expo/vector-icons";
import { Text, TouchableOpacity, View } from "react-native";
import { ActionButton } from "./ActionButton";
import { HIGHLIGHT_COLORS } from "./readerConstants";

/**
 * Select mode: actions for several verses at once (highlight, underline,
 * bookmark as one, journal, share), shown at the bottom of the reader.
 */
export function SelectionBar({
  theme,
  desktopInset,
  title,
  count,
  isColorActive,
  underlined,
  onCancel,
  onHighlight,
  onToggleUnderline,
  onBookmark,
  onJournal,
  onShareImage,
  onShareBrethren,
  onUse,
}: {
  theme: Theme;
  /** Desktop: left/right margin lining the bar up with the open book. */
  desktopInset: number | null;
  /** e.g. "John 3:16–18" */
  title: string;
  count: number;
  /** Whether every selected verse has this highlight colour. */
  isColorActive: (color: string) => boolean;
  /** Whether every selected verse is underlined. */
  underlined: boolean;
  onCancel: () => void;
  onHighlight: (color: string) => void;
  onToggleUnderline: () => void;
  onBookmark: () => void;
  onJournal: () => void;
  onShareImage: () => void;
  onShareBrethren: () => void;
  /** Picking verses for Growth's calendar: shows "Use this Verse". */
  onUse?: () => void;
}) {
  return (
    <View
      style={[
        styles.selectionBar,
        { backgroundColor: theme.surface, borderColor: theme.border },
        desktopInset !== null && {
          marginHorizontal: desktopInset,
          borderLeftWidth: 1,
          borderRightWidth: 1,
        },
      ]}
    >
      <View style={styles.selectionHeader}>
        <View style={{ flex: 1 }}>
          <Text style={[styles.selectionTitle, { color: theme.text }]}>
            {title}
          </Text>
          <Text style={[styles.selectionHint, { color: theme.textSecondary }]}>
            {count} {count === 1 ? "verse" : "verses"} selected · tap verses to
            add or remove
          </Text>
        </View>
        <TouchableOpacity
          onPress={onCancel}
          accessibilityRole="button"
          accessibilityLabel="Cancel selection"
          hitSlop={8}
          activeOpacity={0.7}
        >
          <Ionicons name="close" size={20} color={theme.textSecondary} />
        </TouchableOpacity>
      </View>

      <View style={[styles.swatchRow, styles.selectionSwatches]}>
        {HIGHLIGHT_COLORS.map((c) => (
          <TouchableOpacity
            key={c}
            style={[
              styles.swatch,
              styles.selectionSwatch,
              { backgroundColor: c },
              isColorActive(c) && styles.swatchActive,
            ]}
            onPress={() => onHighlight(c)}
            accessibilityLabel="Highlight selected verses"
            activeOpacity={0.8}
          />
        ))}
        <TouchableOpacity
          style={[
            styles.underlineChip,
            { borderColor: underlined ? theme.primary : theme.border },
            underlined && { backgroundColor: theme.primary + "14" },
          ]}
          onPress={onToggleUnderline}
          accessibilityRole="switch"
          accessibilityState={{ checked: underlined }}
          accessibilityLabel="Underline selected verses"
          activeOpacity={0.8}
        >
          <Text style={[styles.underlineChipText, { color: theme.text }]}>
            Underline
          </Text>
          {underlined && (
            <Ionicons name="checkmark" size={14} color={theme.primary} />
          )}
        </TouchableOpacity>
      </View>

      <View style={styles.selectionActions}>
        <ActionButton
          theme={theme}
          variant="primary"
          iconSize={17}
          style={styles.selectionBtn}
          icon="bookmark-outline"
          label={count > 1 ? "Bookmark as One" : "Bookmark"}
          onPress={onBookmark}
        />
        <ActionButton
          theme={theme}
          iconSize={17}
          style={styles.selectionBtn}
          icon="book-outline"
          label="Journal"
          onPress={onJournal}
        />
      </View>

      <ActionButton
        theme={theme}
        iconSize={17}
        style={styles.selectionShareBtn}
        icon="image-outline"
        label="Share as Image"
        onPress={onShareImage}
      />
      {BRETHREN_ENABLED && (
        <ActionButton
          theme={theme}
          iconSize={17}
          style={styles.selectionShareBtn}
          icon="people-outline"
          label="Share with Brethren"
          onPress={onShareBrethren}
        />
      )}
      {onUse && (
        <ActionButton
          theme={theme}
          variant="primary"
          iconSize={17}
          style={{ marginTop: 10 }}
          icon="checkmark-circle-outline"
          label={count > 1 ? "Use these Verses" : "Use this Verse"}
          onPress={onUse}
        />
      )}
    </View>
  );
}
