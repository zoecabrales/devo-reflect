import { PageHeader } from "@/src/components";
import { BRETHREN_ENABLED } from "@/src/constants/features";
import { Theme } from "@/src/constants/theme";
import { useAppTheme } from "@/src/contexts/ThemeContext";
import { bookmarkRef } from "@/src/services/bookmarks";
import {
  acceptRequest,
  Connection,
  ConnectionRequest,
  deleteRequest,
  deleteShare,
  isValidEmail,
  loadConnections,
  loadIncomingRequests,
  loadMyShares,
  loadSentRequests,
  normaliseEmail,
  removeConnection,
  sendConnectionRequest,
  SharedVerse,
} from "@/src/services/connections";
import { desktopPage } from "@/src/styles/desktopPage.styles";
import {
  pageScrollMarker,
  useIsDesktop,
  useListPaddingH,
  usePageScroll,
} from "@/src/utils/responsive";
import { Ionicons } from "@expo/vector-icons";
import { Redirect, useFocusEffect, useRouter } from "expo-router";
import { ReactNode, useCallback, useState } from "react";
import {
  ActivityIndicator,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

export default function BrethrenScreen() {
  // Hidden until the feature is switched on (see src/constants/features.ts)
  if (!BRETHREN_ENABLED) return <Redirect href="/(tabs)/settings" />;
  return <Brethren />;
}

function Brethren() {
  const router = useRouter();
  const { theme } = useAppTheme();
  const isDesktop = useIsDesktop();
  const pageScroll = usePageScroll();
  const padH = useListPaddingH();

  const [email, setEmail] = useState("");
  const [sending, setSending] = useState(false);
  const [formMessage, setFormMessage] = useState<{
    text: string;
    error: boolean;
  } | null>(null);
  const [incoming, setIncoming] = useState<ConnectionRequest[]>([]);
  const [sent, setSent] = useState<ConnectionRequest[]>([]);
  const [connections, setConnections] = useState<Connection[]>([]);
  const [myShares, setMyShares] = useState<SharedVerse[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState(false);
  // Row waiting for an action (accept / remove …) to finish
  const [busyId, setBusyId] = useState<string | null>(null);
  // Connection whose Remove was tapped once (asks to confirm)
  const [confirmRemove, setConfirmRemove] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoadError(false);
    try {
      const [inc, out, conns, shares] = await Promise.all([
        loadIncomingRequests(),
        loadSentRequests(),
        loadConnections(),
        loadMyShares(),
      ]);
      setIncoming(inc);
      setSent(out);
      setConnections(conns);
      setMyShares(shares);
    } catch {
      setLoadError(true);
    } finally {
      setLoading(false);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      load();
    }, [load]),
  );

  async function handleSend() {
    const to = normaliseEmail(email);
    if (!isValidEmail(to)) {
      setFormMessage({ text: "Enter a valid email address.", error: true });
      return;
    }
    setSending(true);
    setFormMessage(null);
    try {
      await sendConnectionRequest(to);
      setEmail("");
      setFormMessage({
        text: `Request sent. If ${to} has a Devo Reflect account, they'll see it in Settings → Brethren.`,
        error: false,
      });
      setSent(await loadSentRequests());
    } catch (e: any) {
      setFormMessage({
        text:
          e?.message === "self"
            ? "That's your own email address."
            : "Could not send the request. Please check your connection and try again.",
        error: true,
      });
    } finally {
      setSending(false);
    }
  }

  async function run(id: string, action: () => Promise<void>) {
    setBusyId(id);
    try {
      await action();
      await load();
    } catch {
      setFormMessage({
        text: "Something went wrong. Please try again.",
        error: true,
      });
    } finally {
      setBusyId(null);
      setConfirmRemove(null);
    }
  }

  return (
    <SafeAreaView
      {...pageScrollMarker(pageScroll)}
      edges={["top"]}
      style={[styles.container, { backgroundColor: theme.background }]}
    >
      <PageHeader
        title="Brethren"
        subtitle="Share verses with people you know"
        right={
          <TouchableOpacity
            onPress={() => router.navigate("/(tabs)/settings")}
            accessibilityRole="button"
            accessibilityLabel="Back to Settings"
            hitSlop={10}
            activeOpacity={0.7}
          >
            <Ionicons name="close" size={24} color={theme.textSecondary} />
          </TouchableOpacity>
        }
      />
      <ScrollView
        {...pageScrollMarker(pageScroll, "pageScrollList")}
        keyboardShouldPersistTaps="handled"
        contentContainerStyle={[
          styles.content,
          { paddingHorizontal: padH },
          isDesktop && desktopPage.content,
        ]}
      >
        {/* Desktop: a readable column, left-aligned under the page title */}
        <View style={[styles.inner, isDesktop && styles.innerDesktop]}>
        <Text style={[styles.intro, { color: theme.textSecondary }]}>
          Connect with your Brethren in Christ by email. Once they
          accept, you&apos;ll each see the verses the other shares on Home.
          Your journal, prayers and bookmarks stay private.
        </Text>

        {/* Add */}
        <Section theme={theme} title="Add Brethren">
          <View style={styles.form}>
            <TextInput
              value={email}
              onChangeText={(t) => {
                setEmail(t);
                if (formMessage) setFormMessage(null);
              }}
              placeholder="Their email address"
              placeholderTextColor={theme.textSecondary}
              keyboardType="email-address"
              autoCapitalize="none"
              autoCorrect={false}
              autoComplete="email"
              returnKeyType="send"
              onSubmitEditing={handleSend}
              style={[
                styles.input,
                {
                  color: theme.text,
                  borderColor: theme.border,
                  backgroundColor: theme.background,
                },
              ]}
            />
            <TouchableOpacity
              onPress={handleSend}
              disabled={sending || !email.trim()}
              style={[
                styles.primaryBtn,
                { backgroundColor: theme.primary },
                (sending || !email.trim()) && styles.disabled,
              ]}
              activeOpacity={0.85}
            >
              {sending ? (
                <ActivityIndicator color={theme.primaryText} />
              ) : (
                <Text
                  style={[styles.primaryBtnText, { color: theme.primaryText }]}
                >
                  Send Request
                </Text>
              )}
            </TouchableOpacity>
          </View>
          {formMessage && (
            <Text
              style={[
                styles.formMessage,
                { color: formMessage.error ? "#e53e3e" : theme.textSecondary },
              ]}
            >
              {formMessage.text}
            </Text>
          )}
        </Section>

        {loading ? (
          <ActivityIndicator color={theme.textSecondary} style={styles.spinner} />
        ) : loadError ? (
          <TouchableOpacity onPress={load} activeOpacity={0.7}>
            <Text style={[styles.empty, { color: theme.textSecondary }]}>
              Could not load. Tap to try again.
            </Text>
          </TouchableOpacity>
        ) : (
          <>
            {/* Incoming requests */}
            {incoming.length > 0 && (
              <Section theme={theme} title={`Requests (${incoming.length})`}>
                {incoming.map((r, i) => (
                  <Row
                    key={r.id}
                    theme={theme}
                    first={i === 0}
                    title={r.fromName}
                    subtitle={r.fromEmail}
                    busy={busyId === r.id}
                  >
                    <SmallBtn
                      theme={theme}
                      label="Decline"
                      onPress={() => run(r.id, () => deleteRequest(r))}
                    />
                    <SmallBtn
                      theme={theme}
                      label="Accept"
                      primary
                      onPress={() => run(r.id, () => acceptRequest(r))}
                    />
                  </Row>
                ))}
              </Section>
            )}

            {/* Connections */}
            <Section
              theme={theme}
              title={`Your Brethren (${connections.length})`}
            >
              {connections.length === 0 ? (
                <Text style={[styles.empty, { color: theme.textSecondary }]}>
                  No one yet. Send a request above to get started.
                </Text>
              ) : (
                connections.map((c, i) => (
                  <Row
                    key={c.id}
                    theme={theme}
                    first={i === 0}
                    title={c.name}
                    subtitle={`Connected ${new Date(c.createdAt).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}`}
                    busy={busyId === c.id}
                  >
                    {confirmRemove === c.id ? (
                      <>
                        <SmallBtn
                          theme={theme}
                          label="Cancel"
                          onPress={() => setConfirmRemove(null)}
                        />
                        <SmallBtn
                          theme={theme}
                          label="Remove"
                          danger
                          onPress={() => run(c.id, () => removeConnection(c))}
                        />
                      </>
                    ) : (
                      <SmallBtn
                        theme={theme}
                        label="Remove"
                        onPress={() => setConfirmRemove(c.id)}
                      />
                    )}
                  </Row>
                ))
              )}
              {confirmRemove && (
                <Text style={[styles.note, { color: theme.textSecondary }]}>
                  You&apos;ll both stop seeing each other&apos;s shared verses.
                </Text>
              )}
            </Section>

            {/* Sent requests */}
            {sent.length > 0 && (
              <Section theme={theme} title="Sent requests">
                {sent.map((r, i) => (
                  <Row
                    key={r.id}
                    theme={theme}
                    first={i === 0}
                    title={r.toEmail}
                    subtitle="Waiting for a reply"
                    busy={busyId === r.id}
                  >
                    <SmallBtn
                      theme={theme}
                      label="Cancel"
                      onPress={() => run(r.id, () => deleteRequest(r))}
                    />
                  </Row>
                ))}
              </Section>
            )}

            {/* Your shares */}
            {myShares.length > 0 && (
              <Section theme={theme} title="Verses you shared">
                {myShares.map((s, i) => (
                  <Row
                    key={s.id}
                    theme={theme}
                    first={i === 0}
                    title={bookmarkRef(s)}
                    subtitle={s.note || s.text}
                    busy={busyId === s.id}
                  >
                    <SmallBtn
                      theme={theme}
                      label="Delete"
                      onPress={() => run(s.id, () => deleteShare(s.id))}
                    />
                  </Row>
                ))}
              </Section>
            )}
          </>
        )}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

function Section({
  theme,
  title,
  children,
}: {
  theme: Theme;
  title: string;
  children: ReactNode;
}) {
  return (
    <View style={styles.sectionWrap}>
      <Text style={[styles.sectionLabel, { color: theme.textSecondary }]}>
        {title}
      </Text>
      <View
        style={[
          styles.section,
          { backgroundColor: theme.surface, borderColor: theme.border },
        ]}
      >
        {children}
      </View>
    </View>
  );
}

function Row({
  theme,
  first,
  title,
  subtitle,
  busy,
  children,
}: {
  theme: Theme;
  first: boolean;
  title: string;
  subtitle: string;
  busy: boolean;
  children: ReactNode;
}) {
  return (
    <View
      style={[
        styles.row,
        !first && {
          borderTopWidth: StyleSheet.hairlineWidth,
          borderTopColor: theme.border,
        },
      ]}
    >
      <View style={styles.rowText}>
        <Text style={[styles.rowTitle, { color: theme.text }]} numberOfLines={1}>
          {title}
        </Text>
        <Text
          style={[styles.rowSubtitle, { color: theme.textSecondary }]}
          numberOfLines={1}
        >
          {subtitle}
        </Text>
      </View>
      {busy ? (
        <ActivityIndicator color={theme.textSecondary} />
      ) : (
        <View style={styles.rowActions}>{children}</View>
      )}
    </View>
  );
}

function SmallBtn({
  theme,
  label,
  onPress,
  primary,
  danger,
}: {
  theme: Theme;
  label: string;
  onPress: () => void;
  primary?: boolean;
  danger?: boolean;
}) {
  return (
    <TouchableOpacity
      onPress={onPress}
      activeOpacity={0.8}
      style={[
        styles.smallBtn,
        primary
          ? { backgroundColor: theme.primary, borderColor: theme.primary }
          : danger
            ? { backgroundColor: "#e53e3e", borderColor: "#e53e3e" }
            : { borderColor: theme.border },
      ]}
    >
      <Text
        style={[
          styles.smallBtnText,
          {
            color: primary
              ? theme.primaryText
              : danger
                ? "#fff"
                : theme.text,
          },
        ]}
      >
        {label}
      </Text>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  content: {
    paddingBottom: 48,
  },
  inner: {
    gap: 18,
  },
  innerDesktop: {
    maxWidth: 760,
  },
  intro: {
    fontSize: 14,
    lineHeight: 21,
  },
  sectionWrap: { gap: 6 },
  sectionLabel: {
    fontSize: 11,
    fontWeight: "700",
    letterSpacing: 1.2,
    textTransform: "uppercase",
    paddingHorizontal: 4,
  },
  section: {
    borderRadius: 14,
    borderWidth: 1,
    overflow: "hidden",
  },
  form: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 10,
    padding: 14,
  },
  input: {
    flexGrow: 1,
    flexBasis: 220,
    minHeight: 44,
    borderWidth: 1,
    borderRadius: 10,
    paddingHorizontal: 12,
    fontSize: 15,
  },
  primaryBtn: {
    minHeight: 44,
    paddingHorizontal: 18,
    borderRadius: 10,
    alignItems: "center",
    justifyContent: "center",
    flexGrow: 0,
  },
  primaryBtnText: {
    fontSize: 14,
    fontWeight: "700",
  },
  disabled: { opacity: 0.5 },
  formMessage: {
    fontSize: 13,
    lineHeight: 19,
    paddingHorizontal: 14,
    paddingBottom: 14,
    marginTop: -4,
  },
  spinner: { marginTop: 12 },
  empty: {
    fontSize: 13,
    padding: 14,
  },
  note: {
    fontSize: 12,
    paddingHorizontal: 14,
    paddingBottom: 12,
  },
  row: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    paddingHorizontal: 14,
    paddingVertical: 12,
  },
  rowText: { flex: 1, minWidth: 0 },
  rowTitle: {
    fontSize: 15,
    fontWeight: "600",
  },
  rowSubtitle: {
    fontSize: 12,
    marginTop: 2,
  },
  rowActions: {
    flexDirection: "row",
    gap: 8,
  },
  smallBtn: {
    borderWidth: 1,
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 7,
  },
  smallBtnText: {
    fontSize: 13,
    fontWeight: "600",
  },
});
