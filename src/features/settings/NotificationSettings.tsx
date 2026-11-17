import { showAlert } from "@/src/components";
import { BRETHREN_ENABLED } from "@/src/constants/features";
import { Theme } from "@/src/constants/theme";
import { auth } from "@/src/services/firebase";
import {
  DEFAULT_NOTIFICATION_SETTINGS,
  describeTestResult,
  isThisDeviceOn,
  loadNotificationSettings,
  NotificationSettings as Settings,
  NotificationsError,
  pushSupport,
  PushSupport,
  saveNotificationSettings,
  sendTestNotification,
  turnOnThisDevice,
} from "@/src/services/notifications";
import { styles } from "@/src/styles/settings.styles";
import {
  formatReminderTime,
  minutesOf,
  REMINDER_STEP_MINUTES,
  timeOf,
} from "@/src/utils/reminderTime";
import { Ionicons } from "@expo/vector-icons";
import { useFocusEffect } from "expo-router";
import { ComponentProps, useCallback, useState } from "react";
import {
  ActivityIndicator,
  StyleSheet,
  Switch,
  Text,
  TouchableOpacity,
  View,
} from "react-native";

const BLOCKED_MESSAGE =
  "Notifications are blocked for Devo Reflect in this browser. To turn them on, allow notifications in your browser's site settings, then try again.";

/** Settings → Notifications: daily reminder and Brethren activity. */
export function NotificationSettings({ theme }: { theme: Theme }) {
  const uid = auth.currentUser?.uid ?? "";
  const [settings, setSettings] = useState<Settings>(DEFAULT_NOTIFICATION_SETTINGS);
  const [support, setSupport] = useState<PushSupport>("unsupported");
  const [deviceOn, setDeviceOn] = useState(false);
  const [busy, setBusy] = useState(false);
  const [testing, setTesting] = useState(false);

  useFocusEffect(
    useCallback(() => {
      if (!uid) return;
      setSupport(pushSupport());
      loadNotificationSettings(uid).then(setSettings).catch(() => {});
      isThisDeviceOn(uid).then(setDeviceOn).catch(() => setDeviceOn(false));
    }, [uid]),
  );

  /** Registers this device; false (after explaining) if it can't. */
  async function ensureDeviceOn(): Promise<boolean> {
    if (deviceOn) return true;
    try {
      await turnOnThisDevice(uid);
      setDeviceOn(true);
      return true;
    } catch (e) {
      setSupport(pushSupport());
      showAlert(
        "Notifications Are Off",
        e instanceof NotificationsError && e.reason === "denied"
          ? BLOCKED_MESSAGE
          : "This browser can't show notifications from Devo Reflect.",
      );
      return false;
    }
  }

  async function update(next: Settings, turningOn: boolean) {
    if (busy) return;
    setBusy(true);
    try {
      if (turningOn && !(await ensureDeviceOn())) return;
      setSettings(next);
      await saveNotificationSettings(uid, next);
    } catch {
      showAlert("Couldn't Save", "Please check your connection and try again.");
    } finally {
      setBusy(false);
    }
  }

  async function sendTest() {
    setTesting(true);
    try {
      showAlert("Test Notification", describeTestResult(await sendTestNotification()));
    } catch (e) {
      showAlert(
        "Test Notification",
        `Couldn't send the test: ${(e as Error).message}`,
      );
    } finally {
      setTesting(false);
    }
  }

  function stepTime(dir: 1 | -1) {
    const time = timeOf(minutesOf(settings.reminderTime) + dir * REMINDER_STEP_MINUTES);
    update({ ...settings, reminderTime: time }, false);
  }

  const anyOn = settings.reminderEnabled || settings.brethrenEnabled;

  return (
    <>
      <Text style={[styles.sectionLabel, { color: theme.textSecondary }]}>
        Notifications
      </Text>
      <View
        style={[
          styles.section,
          { backgroundColor: theme.surface, borderColor: theme.border },
        ]}
      >
        {support === "unsupported" || support === "needs-home-screen" ? (
          <Note theme={theme}>
            {support === "needs-home-screen"
              ? "To get notifications on iPhone or iPad, add Devo Reflect to your Home Screen: tap Share, then “Add to Home Screen”, and open it from there."
              : "Notifications aren't available here yet. Open Devo Reflect in Chrome, Edge, Firefox or Safari to turn them on."}
          </Note>
        ) : (
          <>
            <SwitchRow
              theme={theme}
              icon="alarm-outline"
              label="Daily reminder"
              hint="Today's verse, at a time you choose"
              value={settings.reminderEnabled}
              disabled={busy}
              onChange={(v) => update({ ...settings, reminderEnabled: v }, v)}
            />
            {settings.reminderEnabled && (
              <View style={local.timeRow}>
                <Text style={[local.timeLabel, { color: theme.textSecondary }]}>
                  Remind me at
                </Text>
                <StepButton theme={theme} icon="chevron-back" label="Earlier" onPress={() => stepTime(-1)} />
                <Text style={[local.time, { color: theme.text }]}>
                  {formatReminderTime(settings.reminderTime)}
                </Text>
                <StepButton theme={theme} icon="chevron-forward" label="Later" onPress={() => stepTime(1)} />
              </View>
            )}
            {BRETHREN_ENABLED && (
              <>
                <View style={[styles.divider, { backgroundColor: theme.border }]} />
                <SwitchRow
                  theme={theme}
                  icon="people-outline"
                  label="Brethren activity"
                  hint="Requests, and verses shared with you"
                  value={settings.brethrenEnabled}
                  disabled={busy}
                  onChange={(v) => update({ ...settings, brethrenEnabled: v }, v)}
                />
              </>
            )}
            {support === "denied" ? (
              <Note theme={theme}>{BLOCKED_MESSAGE}</Note>
            ) : (
              anyOn &&
              !deviceOn && (
                <TouchableOpacity
                  style={[local.deviceBtn, { borderColor: theme.border }]}
                  onPress={() => ensureDeviceOn()}
                  activeOpacity={0.7}
                >
                  {busy ? (
                    <ActivityIndicator size="small" color={theme.text} />
                  ) : (
                    <Text style={[local.deviceBtnText, { color: theme.text }]}>
                      Get notifications on this device too
                    </Text>
                  )}
                </TouchableOpacity>
              )
            )}
            {(anyOn || deviceOn) && (
              <TouchableOpacity
                style={[local.deviceBtn, { borderColor: theme.border }]}
                onPress={sendTest}
                disabled={testing}
                accessibilityRole="button"
                activeOpacity={0.7}
              >
                {testing ? (
                  <ActivityIndicator size="small" color={theme.text} />
                ) : (
                  <Text style={[local.deviceBtnText, { color: theme.text }]}>
                    Send a test notification
                  </Text>
                )}
              </TouchableOpacity>
            )}
          </>
        )}
      </View>
    </>
  );
}

function SwitchRow({
  theme,
  icon,
  label,
  hint,
  value,
  disabled,
  onChange,
}: {
  theme: Theme;
  icon: ComponentProps<typeof Ionicons>["name"];
  label: string;
  hint: string;
  value: boolean;
  disabled: boolean;
  onChange: (value: boolean) => void;
}) {
  return (
    <View style={styles.row}>
      <View
        style={[
          styles.iconWrap,
          { backgroundColor: theme.surface, borderColor: theme.border },
        ]}
      >
        <Ionicons name={icon} size={18} color={theme.text} />
      </View>
      <View style={local.labelWrap}>
        <Text style={[styles.rowLabel, { color: theme.text }]}>{label}</Text>
        <Text style={[local.hint, { color: theme.textSecondary }]}>{hint}</Text>
      </View>
      <Switch
        value={value}
        onValueChange={onChange}
        disabled={disabled}
        trackColor={{ true: theme.primary, false: theme.border }}
        accessibilityLabel={label}
      />
    </View>
  );
}

function StepButton({
  theme,
  icon,
  label,
  onPress,
}: {
  theme: Theme;
  icon: ComponentProps<typeof Ionicons>["name"];
  label: string;
  onPress: () => void;
}) {
  return (
    <TouchableOpacity
      style={[local.stepBtn, { borderColor: theme.border }]}
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={label}
      activeOpacity={0.7}
    >
      <Ionicons name={icon} size={16} color={theme.text} />
    </TouchableOpacity>
  );
}

function Note({ theme, children }: { theme: Theme; children: string }) {
  return (
    <Text style={[local.note, { color: theme.textSecondary }]}>{children}</Text>
  );
}

const local = StyleSheet.create({
  labelWrap: { flex: 1 },
  hint: { fontSize: 12, marginTop: 2 },
  timeRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    paddingHorizontal: 14,
    paddingBottom: 14,
  },
  timeLabel: { fontSize: 13, flex: 1 },
  time: { fontSize: 15, fontWeight: "700", minWidth: 76, textAlign: "center" },
  stepBtn: {
    width: 32,
    height: 32,
    borderRadius: 16,
    borderWidth: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  deviceBtn: {
    margin: 14,
    marginTop: 4,
    borderWidth: 1,
    borderRadius: 10,
    paddingVertical: 11,
    alignItems: "center",
  },
  deviceBtnText: { fontSize: 14, fontWeight: "600" },
  note: { fontSize: 13, lineHeight: 19, padding: 14 },
});
