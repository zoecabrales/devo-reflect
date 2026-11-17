import { AppModal, SheetHandle } from "@/src/components";
import { Theme } from "@/src/constants/theme";
import { BIBLE_VERSIONS, BibleVersion } from "@/src/services/bible";
import { styles } from "@/src/styles/bible-browser.styles";
import { Ionicons } from "@expo/vector-icons";
import { Text, TouchableOpacity } from "react-native";

/** Bottom sheet listing the Bible versions, with the current one ticked. */
export function VersionPicker({
  visible,
  current,
  theme,
  onPick,
  onClose,
}: {
  visible: boolean;
  current: BibleVersion;
  theme: Theme;
  onPick: (version: BibleVersion) => void;
  onClose: () => void;
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
      <Text style={[styles.drawerTitle, { color: theme.text }]}>
        Bible Version
      </Text>
      {BIBLE_VERSIONS.map((v) => {
        const active = v.id === current.id;
        return (
          <TouchableOpacity
            key={v.id}
            style={styles.versionOption}
            activeOpacity={0.7}
            onPress={() => onPick(v)}
          >
            <Text
              style={[
                styles.versionOptionLabel,
                { color: active ? theme.primary : theme.text },
              ]}
            >
              {v.label}
            </Text>
            <Text
              style={[styles.versionOptionDesc, { color: theme.textSecondary }]}
            >
              {v.description}
            </Text>
            {active && (
              <Ionicons name="checkmark" size={16} color={theme.primary} />
            )}
          </TouchableOpacity>
        );
      })}
    </AppModal>
  );
}
