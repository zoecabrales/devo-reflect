import { Theme } from "@/src/constants/theme";
import { styles } from "@/src/styles/bible-browser.styles";
import { useIsTablet } from "@/src/utils/responsive";
import { Ionicons } from "@expo/vector-icons";
import { Text, TouchableOpacity, View } from "react-native";

/**
 * The reader's top bar: back, title, and (when they apply) "About this book",
 * chapter search, and the version picker.
 */
export function ReaderHeader({
  theme,
  inset,
  title,
  subtitle,
  onBack,
  aboutLabel,
  onAbout,
  searchOpen,
  onToggleSearch,
  versionLabel,
  onOpenVersions,
}: {
  theme: Theme;
  /** Left/right padding, lining the bar up with the content below. */
  inset: number;
  title: string;
  subtitle: string | null;
  onBack: () => void;
  /** Book name for "About {book}"; null hides the button. */
  aboutLabel: string | null;
  onAbout: () => void;
  /** Whether chapter search is open; null hides the button. */
  searchOpen: boolean | null;
  onToggleSearch: () => void;
  versionLabel: string;
  onOpenVersions: () => void;
}) {
  const isTablet = useIsTablet();
  const roundBtn = isTablet && styles.headerBtnTablet;
  return (
    <View style={[styles.header, { paddingHorizontal: inset }]}>
      <TouchableOpacity
        onPress={onBack}
        style={[styles.backBtn, roundBtn, { borderColor: theme.border }]}
        activeOpacity={0.7}
      >
        <Ionicons name="chevron-back" size={20} color={theme.text} />
      </TouchableOpacity>
      <View style={styles.headerCenter}>
        <Text style={[styles.headerTitle, { color: theme.text }]}>{title}</Text>
        {subtitle && (
          <Text style={[styles.headerSubtitle, { color: theme.textSecondary }]}>
            {subtitle}
          </Text>
        )}
      </View>
      {aboutLabel && (
        <TouchableOpacity
          style={[styles.searchIconBtn, roundBtn, { borderColor: theme.border }]}
          onPress={onAbout}
          accessibilityRole="button"
          accessibilityLabel={`About ${aboutLabel}`}
          activeOpacity={0.7}
        >
          <Ionicons
            name="information-circle-outline"
            size={19}
            color={theme.text}
          />
        </TouchableOpacity>
      )}
      {searchOpen !== null && (
        <TouchableOpacity
          style={[styles.searchIconBtn, roundBtn, { borderColor: theme.border }]}
          onPress={onToggleSearch}
          activeOpacity={0.7}
        >
          <Ionicons
            name={searchOpen ? "close" : "search"}
            size={18}
            color={theme.text}
          />
        </TouchableOpacity>
      )}
      <TouchableOpacity
        style={[
          styles.versionPill,
          isTablet && styles.versionPillTablet,
          { borderColor: theme.border, backgroundColor: theme.surface },
        ]}
        onPress={onOpenVersions}
        activeOpacity={0.7}
      >
        <Text style={[styles.versionPillText, { color: theme.text }]}>
          {versionLabel}
        </Text>
        <Ionicons name="chevron-down" size={11} color={theme.textSecondary} />
      </TouchableOpacity>
    </View>
  );
}
