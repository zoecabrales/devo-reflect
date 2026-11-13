import {
    ColorMode,
    Theme,
    THEME_PICKER_ENABLED,
    THEME_PRESETS,
    ThemeName,
} from "@/src/constants/theme";
import { PageHeader, showAlert } from "@/src/components";
import { BRETHREN_ENABLED } from "@/src/constants/features";
import { loadIncomingRequests } from "@/src/services/connections";
import { useAppTheme } from "@/src/contexts/ThemeContext";
import { signOutUser } from "@/src/services/auth";
import { Ionicons } from "@expo/vector-icons";
import Constants from "expo-constants";
import { useFocusEffect, useRouter } from "expo-router";
import { useCallback, useState } from "react";
import {
    Linking,
    ScrollView,
    Text,
    TouchableOpacity,
    View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import {
    AccountCard,
    SettingsAside,
} from "@/src/features/settings/SettingsAside";
import { desktopPage } from "@/src/styles/desktopPage.styles";
import { styles } from "@/src/styles/settings.styles";
import {
  pageScrollMarker,
  useIsDesktop,
  useListPaddingH,
  usePageScroll,
} from "@/src/utils/responsive";

const SUPPORT_EMAIL = "jirehzoe@gmail.com";

async function openMailTo(subject: string) {
  const url = `mailto:${SUPPORT_EMAIL}?subject=${subject}`;
  const supported = await Linking.canOpenURL(url);
  if (supported) {
    await Linking.openURL(url);
  } else {
    showAlert(
      "No Mail App Found",
      `Please email us directly at:\n\n${SUPPORT_EMAIL}`,
    );
  }
}

function SettingRow({
  icon,
  label,
  onPress,
  danger = false,
  theme,
  hideDivider = false,
  badge = 0,
}: {
  icon: keyof typeof Ionicons.glyphMap;
  label: string;
  onPress: () => void;
  danger?: boolean;
  theme: Theme;
  hideDivider?: boolean;
  /** Count shown beside the label, e.g. waiting requests (0 = none). */
  badge?: number;
}) {
  const color = danger ? "#e53e3e" : theme.text;
  return (
    <>
      <TouchableOpacity
        style={styles.row}
        onPress={onPress}
        activeOpacity={0.6}
      >
        <View
          style={[
            styles.iconWrap,
            {
              backgroundColor: danger ? "#fde8e8" : theme.surface,
              borderColor: danger ? "#f9c6c6" : theme.border,
            },
          ]}
        >
          <Ionicons name={icon} size={18} color={color} />
        </View>
        <Text style={[styles.rowLabel, { color }]}>{label}</Text>
        {badge > 0 && (
          <View style={[styles.badge, { backgroundColor: theme.primary }]}>
            <Text style={[styles.badgeText, { color: theme.primaryText }]}>
              {badge}
            </Text>
          </View>
        )}
        <Ionicons
          name="chevron-forward"
          size={16}
          color={theme.textSecondary}
        />
      </TouchableOpacity>
      {!hideDivider && (
        <View style={[styles.divider, { backgroundColor: theme.border }]} />
      )}
    </>
  );
}

export default function Settings() {
  const router = useRouter();
  const { theme, themeName, colorMode, setThemeName, setColorMode } =
    useAppTheme();
  const isDesktop = useIsDesktop();
  // Phone / tablet web: the page scrolls, not an inner box (responsive.ts)
  const pageScroll = usePageScroll();
  const padH = useListPaddingH();
  // Brethren requests waiting for a reply
  const [requestCount, setRequestCount] = useState(0);

  useFocusEffect(
    useCallback(() => {
      if (!BRETHREN_ENABLED) return;
      loadIncomingRequests()
        .then((r) => setRequestCount(r.length))
        .catch(() => setRequestCount(0));
    }, []),
  );

  async function handleSignOut() {
    try {
      await signOutUser();
      router.replace("/(auth)/sign-in");
    } catch (error: any) {
      showAlert("Error", error?.message ?? "Could not sign out.");
    }
  }

  return (
    <SafeAreaView
      {...pageScrollMarker(pageScroll)}
      edges={["top"]}
      style={[styles.container, { backgroundColor: theme.background }]}
    >
      {/* Header — the account card below shows the email */}
      <PageHeader title="Settings" />

      <ScrollView
        {...pageScrollMarker(pageScroll, "pageScrollList")}
        contentContainerStyle={[
          styles.content,
          { paddingHorizontal: padH },
          // Desktop: settings on the left, account / preview / about on the right
          isDesktop && [desktopPage.content, styles.desktopRow],
        ]}
      >
        <View style={[styles.contentInner, isDesktop && styles.desktopMain]}>
          {/* Phone / tablet: profile summary up top (desktop has it in the side column) */}
          {!isDesktop && <AccountCard />}

          {BRETHREN_ENABLED && (
            <>
              <Text
                style={[styles.sectionLabel, { color: theme.textSecondary }]}
              >
                Community
              </Text>
              <View
                style={[
                  styles.section,
                  { backgroundColor: theme.surface, borderColor: theme.border },
                ]}
              >
                <SettingRow
                  icon="people-outline"
                  label="Brethren"
                  onPress={() => router.push("/(tabs)/brethren")}
                  theme={theme}
                  badge={requestCount}
                  hideDivider
                />
              </View>
            </>
          )}

          {/* Appearance section */}
          <Text style={[styles.sectionLabel, { color: theme.textSecondary }]}>
            Appearance
          </Text>
          <View
            style={[
              styles.section,
              { backgroundColor: theme.surface, borderColor: theme.border },
            ]}
          >
            {/* Color mode toggle */}
            <View style={styles.pickerBlock}>
              <Text style={[styles.pickerLabel, { color: theme.textSecondary }]}>
                Mode
              </Text>
              <View style={styles.modeRow}>
                {(["system", "light", "dark"] as ColorMode[]).map((m) => {
                  const active = colorMode === m;
                  const icons: Record<ColorMode, keyof typeof Ionicons.glyphMap> =
                    {
                      system: "phone-portrait-outline",
                      light: "sunny-outline",
                      dark: "moon-outline",
                    };
                  const labels: Record<ColorMode, string> = {
                    system: "System",
                    light: "Light",
                    dark: "Dark",
                  };
                  return (
                    <TouchableOpacity
                      key={m}
                      style={[
                        styles.modeBtn,
                        {
                          backgroundColor: active
                            ? theme.primary
                            : theme.background,
                          borderColor: active ? theme.primary : theme.border,
                        },
                      ]}
                      onPress={() => setColorMode(m)}
                      activeOpacity={0.7}
                    >
                      <Ionicons
                        name={icons[m]}
                        size={16}
                        color={active ? theme.primaryText : theme.textSecondary}
                      />
                      <Text
                        style={[
                          styles.modeBtnText,
                          {
                            color: active
                              ? theme.primaryText
                              : theme.textSecondary,
                          },
                        ]}
                      >
                        {labels[m]}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </View>
            </View>

            {THEME_PICKER_ENABLED && (
              <>
                <View style={[styles.divider, { backgroundColor: theme.border }]} />

                {/* Theme swatches */}
                <View style={styles.pickerBlock}>
                  <Text style={[styles.pickerLabel, { color: theme.textSecondary }]}>
                    Theme
                  </Text>
                  <View style={styles.swatchRow}>
                    {(Object.keys(THEME_PRESETS) as ThemeName[]).map((name) => {
                      const preset = THEME_PRESETS[name];
                      const active = themeName === name;
                      return (
                        <TouchableOpacity
                          key={name}
                          style={[
                            styles.swatchBtn,
                            {
                              borderColor: active ? theme.primary : theme.border,
                              backgroundColor: active
                                ? theme.surface
                                : theme.background,
                            },
                          ]}
                          onPress={() => setThemeName(name)}
                          activeOpacity={0.7}
                        >
                          <View
                            style={[
                              styles.swatch,
                              { backgroundColor: preset.swatch },
                            ]}
                          />
                          <Text
                            style={[
                              styles.swatchLabel,
                              {
                                color: active ? theme.text : theme.textSecondary,
                                fontWeight: active ? "700" : "400",
                              },
                            ]}
                          >
                            {preset.label}
                          </Text>
                          {active && (
                            <Ionicons
                              name="checkmark"
                              size={13}
                              color={theme.primary}
                            />
                          )}
                        </TouchableOpacity>
                      );
                    })}
                  </View>
                </View>
              </>
            )}
          </View>

          {/* Feedback section */}
          <Text style={[styles.sectionLabel, { color: theme.textSecondary }]}>
            Feedback
          </Text>
          <View
            style={[
              styles.section,
              { backgroundColor: theme.surface, borderColor: theme.border },
            ]}
          >
            <SettingRow
              icon="mail-outline"
              label="Send Feedback"
              onPress={() => openMailTo("App%20Feedback")}
              theme={theme}
            />
            {/* <SettingRow
              icon="star-outline"
              label="Rate the App"
              onPress={() =>
                Linking.openURL("https://apps.apple.com/app/idYOUR_APP_ID")
              }
              theme={theme}
            /> */}
            <SettingRow
              icon="bug-outline"
              label="Report a Bug"
              onPress={() => openMailTo("Bug%20Report")}
              theme={theme}
              hideDivider
            />
          </View>

          {/* Account section */}
          <Text style={[styles.sectionLabel, { color: theme.textSecondary }]}>
            Account
          </Text>
          <View
            style={[
              styles.section,
              { backgroundColor: theme.surface, borderColor: theme.border },
            ]}
          >
            <SettingRow
              icon="lock-closed-outline"
              label="Change Password"
              onPress={() => router.push("/(auth)/change-password")}
              theme={theme}
            />
            <SettingRow
              icon="log-out-outline"
              label="Sign Out"
              onPress={handleSignOut}
              theme={theme}
              hideDivider
            />
          </View>

          {/* About section — desktop shows this in the side column */}
          {!isDesktop && (
            <>
              <Text
                style={[styles.sectionLabel, { color: theme.textSecondary }]}
              >
                About
              </Text>
              <View
                style={[
                  styles.section,
                  { backgroundColor: theme.surface, borderColor: theme.border },
                ]}
              >
                <SettingRow
                  icon="document-text-outline"
                  label="Terms & Conditions"
                  onPress={() => router.push("/(auth)/terms-and-conditions")}
                  theme={theme}
                />
                <SettingRow
                  icon="shield-checkmark-outline"
                  label="Privacy Policy"
                  onPress={() => router.push("/(auth)/privacy-policy")}
                  theme={theme}
                  hideDivider
                />
              </View>
            </>
          )}

          {/* Danger section */}
          <Text style={[styles.sectionLabel, { color: theme.textSecondary }]}>
            Danger Zone
          </Text>
          <View
            style={[
              styles.section,
              { backgroundColor: theme.surface, borderColor: theme.border },
            ]}
          >
            <SettingRow
              icon="trash-outline"
              label="Delete Account"
              onPress={() => router.push("/(auth)/delete-account")}
              danger
              theme={theme}
              hideDivider
            />
          </View>

          {!isDesktop && (
            <Text style={[styles.versionText, { color: theme.textSecondary }]}>
              Devo Reflect · Version {Constants.expoConfig?.version ?? ""}
            </Text>
          )}
        </View>
        {isDesktop && (
          <View style={styles.desktopAside}>
            <SettingsAside />
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}
