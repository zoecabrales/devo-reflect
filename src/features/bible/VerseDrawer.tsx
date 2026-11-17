import { AppModal, SheetHandle } from "@/src/components";
import { BRETHREN_ENABLED } from "@/src/constants/features";
import { Theme } from "@/src/constants/theme";
import { styles } from "@/src/styles/bible-browser.styles";
import { Ionicons } from "@expo/vector-icons";
import { Text, TouchableOpacity, View } from "react-native";
import { ActionButton } from "./ActionButton";
import { HIGHLIGHT_COLORS } from "./readerConstants";

const SPACED = { marginTop: 10 };

/**
 * The panel for one verse (opened by tapping a verse twice): highlight,
 * underline, bookmark, select more, journal, and share.
 */
export function VerseDrawer({
  visible,
  theme,
  title,
  activeColor,
  underlined,
  shareImageLabel,
  onClose,
  onHighlight,
  onToggleUnderline,
  onBookmark,
  onSelectMore,
  onJournal,
  onShareImage,
  onShareBrethren,
  onUseVerse,
}: {
  visible: boolean;
  theme: Theme;
  /** e.g. "John 3:16" */
  title: string;
  /** The verse's highlight colour, if any. */
  activeColor: string | undefined;
  /** Whether the verse is underlined; null hides the underline chip. */
  underlined: boolean | null;
  shareImageLabel: string;
  onClose: () => void;
  onHighlight: (color: string) => void;
  onToggleUnderline: () => void;
  onBookmark: () => void;
  onSelectMore: () => void;
  onJournal: () => void;
  onShareImage: () => void;
  onShareBrethren: () => void;
  /** Picking a verse for Growth's calendar: shows "Use this Verse". */
  onUseVerse?: () => void;
}) {
  return (
    <AppModal
      visible={visible}
      onClose={onClose}
      animationType="slide"
      overlayStyle={styles.drawerOverlay}
      cardStyle={[
        styles.drawerSheet,
        { backgroundColor: theme.surface, borderColor: theme.border },
      ]}
    >
      <SheetHandle style={styles.drawerHandle} />
      <Text style={[styles.drawerTitle, { color: theme.text }]}>{title}</Text>

      <Text style={[styles.drawerLabel, { color: theme.textSecondary }]}>
        Highlight
      </Text>
      <View style={styles.swatchRow}>
        {HIGHLIGHT_COLORS.map((c) => (
          <TouchableOpacity
            key={c}
            style={[
              styles.swatch,
              { backgroundColor: c },
              activeColor === c && styles.swatchActive,
            ]}
            onPress={() => onHighlight(c)}
            activeOpacity={0.8}
          />
        ))}
      </View>

      {/* Underline: a plain mark, separate from the colour */}
      {underlined !== null && (
        <TouchableOpacity
          style={[
            styles.underlineChip,
            styles.underlineChipDrawer,
            { borderColor: underlined ? theme.primary : theme.border },
            underlined && { backgroundColor: theme.primary + "14" },
          ]}
          onPress={onToggleUnderline}
          accessibilityRole="switch"
          accessibilityState={{ checked: underlined }}
          accessibilityLabel="Underline"
          activeOpacity={0.8}
        >
          <Text style={[styles.underlineChipText, { color: theme.text }]}>
            Underline
          </Text>
          {underlined && (
            <Ionicons name="checkmark" size={15} color={theme.primary} />
          )}
        </TouchableOpacity>
      )}

      <ActionButton
        theme={theme}
        variant="primary"
        icon="bookmark-outline"
        label="Add to Bookmarks"
        onPress={onBookmark}
      />
      {/* Select mode: pick more verses to bookmark / highlight as one */}
      <ActionButton
        theme={theme}
        style={SPACED}
        icon="checkmark-done-outline"
        label="Select More Verses"
        onPress={onSelectMore}
      />
      <ActionButton
        theme={theme}
        style={SPACED}
        icon="book-outline"
        label="Add to Journal"
        onPress={onJournal}
      />
      <ActionButton
        theme={theme}
        style={SPACED}
        icon="image-outline"
        label={shareImageLabel}
        onPress={onShareImage}
      />
      {BRETHREN_ENABLED && (
        <ActionButton
          theme={theme}
          style={SPACED}
          icon="people-outline"
          label="Share with Brethren"
          onPress={onShareBrethren}
        />
      )}
      {onUseVerse && (
        <ActionButton
          theme={theme}
          variant="primary"
          style={SPACED}
          icon="checkmark-circle-outline"
          label="Use this Verse"
          onPress={onUseVerse}
        />
      )}
    </AppModal>
  );
}

/** Small popup confirming a bookmark, e.g. "John 3:16 saved to Bookmarks". */
export function BookmarkConfirm({
  label,
  theme,
  onClose,
}: {
  /** The reference saved, or null when hidden. */
  label: string | null;
  theme: Theme;
  onClose: () => void;
}) {
  const several = label?.includes(",") || label?.includes("–");
  return (
    <AppModal
      visible={label !== null}
      onClose={onClose}
      closeOnCardPress
      overlayStyle={styles.confirmOverlay}
      cardStyle={[
        styles.confirmCard,
        { backgroundColor: theme.surface, borderColor: theme.border },
      ]}
    >
      <Ionicons name="bookmark" size={22} color={theme.primary} />
      <View style={styles.confirmTextWrap}>
        <Text style={[styles.confirmTitle, { color: theme.text }]}>
          {several ? "Verses Bookmarked" : "Verse Bookmarked"}
        </Text>
        <Text style={[styles.confirmRef, { color: theme.textSecondary }]}>
          {label} saved to Bookmarks
        </Text>
      </View>
    </AppModal>
  );
}
