import { Theme } from "@/src/constants/theme";
import { styles } from "@/src/styles/bible-browser.styles";
import { Ionicons } from "@expo/vector-icons";
import { ComponentProps } from "react";
import { StyleProp, Text, TouchableOpacity, ViewStyle } from "react-native";

/**
 * A full-width action in the verse panel or the select-mode bar, e.g.
 * "Add to Bookmarks". "primary" is filled with the theme colour; "secondary"
 * is outlined.
 */
export function ActionButton({
  icon,
  label,
  onPress,
  theme,
  variant = "secondary",
  iconSize = 18,
  style,
}: {
  icon: ComponentProps<typeof Ionicons>["name"];
  label: string;
  onPress: () => void;
  theme: Theme;
  variant?: "primary" | "secondary";
  iconSize?: number;
  style?: StyleProp<ViewStyle>;
}) {
  const primary = variant === "primary";
  const color = primary ? theme.primaryText : theme.text;
  return (
    <TouchableOpacity
      style={[
        styles.drawerBookmarkBtn,
        style,
        primary
          ? { backgroundColor: theme.primary }
          : {
              backgroundColor: theme.surface,
              borderWidth: 1,
              borderColor: theme.border,
            },
      ]}
      onPress={onPress}
      activeOpacity={0.85}
    >
      <Ionicons name={icon} size={iconSize} color={color} />
      <Text style={[styles.drawerBookmarkBtnText, { color }]}>{label}</Text>
    </TouchableOpacity>
  );
}
