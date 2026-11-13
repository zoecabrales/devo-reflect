import { BentoGrid, PageHeader } from "@/src/components";
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
  Platform,
  ScrollView,
  StyleProp,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
  ViewStyle,
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

  // Web: bento grids like the other main tabs (Memory Verses, Reading Plans);
  // BentoGrid drops to one column on phones. The native app stacks the same
  // cards.
  const gridLayout = Platform.OS === "web";
  // Phones and tablets: tighter cards and type
  const compact = !isDesktop;
  const card = [
    styles.card,
    compact && styles.cardCompact,
    { backgroundColor: theme.surface, borderColor: theme.border },
  ];
  const gap = compact ? 10 : 14;

  /** Small uppercase heading above a section, as on the other tabs. */
  const label = (text: string) => (
    <Text
      style={[styles.label, styles.sectionLabel, { color: theme.textSecondary }]}
    >
      {text}
    </Text>
  );

  // ── Top: add + overview ────────────────────────────────────────────────
  const addCard = (
    <View style={[card, desktopPage.tileFill]}>
      <Text style={[styles.label, { color: theme.textSecondary }]}>
        ADD BRETHREN
      </Text>
      <Text style={[styles.body, { color: theme.textSecondary }]}>
        Connect with your Brethren in Christ by email. Once they accept,
        you&apos;ll each see the verses the other shares on Home. Your journal,
        prayers and bookmarks stay private.
      </Text>
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
            compact && styles.inputCompact,
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
            styles.btn,
            compact && styles.btnCompact,
            styles.sendBtn,
            compact && styles.sendBtnCompact,
            { backgroundColor: theme.primary },
            (sending || !email.trim()) && styles.disabled,
          ]}
          activeOpacity={0.85}
        >
          {sending ? (
            <ActivityIndicator color={theme.primaryText} />
          ) : (
            <Text style={[styles.btnText, { color: theme.primaryText }]}>
              Send Request
            </Text>
          )}
        </TouchableOpacity>
      </View>
      {formMessage && (
        <Text
          style={[
            styles.small,
            { color: formMessage.error ? "#e53e3e" : theme.textSecondary },
          ]}
        >
          {formMessage.text}
        </Text>
      )}
    </View>
  );

  const overviewCard = (
    <View style={[card, desktopPage.tileFill]}>
      <Text style={[styles.label, { color: theme.textSecondary }]}>
        OVERVIEW
      </Text>
      <Text
        style={[
          styles.bigNumber,
          compact && styles.bigNumberCompact,
          { color: theme.text },
        ]}
      >
        {connections.length}
      </Text>
      <Text style={[styles.body, { color: theme.textSecondary }]}>
        {connections.length === 1 ? "brother or sister" : "brethren"}
      </Text>
      <View style={styles.grow} />
      <View style={styles.statRow}>
        <Text style={[styles.statText, { color: theme.textSecondary }]}>
          <Text style={[styles.strong, { color: theme.text }]}>
            {incoming.length}
          </Text>{" "}
          {incoming.length === 1 ? "request" : "requests"}
        </Text>
        <Text style={[styles.statText, { color: theme.textSecondary }]}>
          <Text style={[styles.strong, { color: theme.text }]}>
            {myShares.length}
          </Text>{" "}
          shared
        </Text>
      </View>
    </View>
  );

  const emptyCard = (text: string) => (
    <View style={card}>
      <Text style={[styles.body, { color: theme.textSecondary }]}>{text}</Text>
    </View>
  );

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
            <Ionicons name="close" size={22} color={theme.textSecondary} />
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
        {loading ? (
          <ActivityIndicator color={theme.textSecondary} style={styles.loader} />
        ) : loadError ? (
          <TouchableOpacity onPress={load} activeOpacity={0.7}>
            <Text style={[styles.body, styles.loadError, { color: theme.textSecondary }]}>
              Could not load. Tap to try again.
            </Text>
          </TouchableOpacity>
        ) : (
          <View style={compact ? styles.sectionsCompact : styles.sections}>
            {/* Add + overview */}
            {gridLayout ? (
              <BentoGrid
                gap={gap}
                data={["add", "overview"]}
                keyExtractor={(k) => k}
                spanFor={(k) => (k === "add" ? 2 : 1)}
                renderItem={(k) => (k === "add" ? addCard : overviewCard)}
              />
            ) : (
              <View style={styles.stack}>
                {addCard}
                {overviewCard}
              </View>
            )}

            {/* Requests waiting for you */}
            <View style={styles.stack}>
              {label(incoming.length > 0 ? `REQUESTS · ${incoming.length}` : "REQUESTS")}
              {incoming.length === 0 ? (
                emptyCard(
                  "No requests waiting. When someone adds you as Brethren, their request shows up here.",
                )
              ) : (
                <Grid
                  gridLayout={gridLayout}
                  gap={gap}
                  data={incoming}
                  keyOf={(r) => r.id}
                  render={(r) => (
                    <PersonCard
                      theme={theme}
                      card={card}
                      compact={compact}
                      title={r.fromName}
                      subtitle={r.fromEmail}
                      busy={busyId === r.id}
                    >
                      <Btn
                        theme={theme}
                        compact={compact}
                        text="Decline"
                        onPress={() => run(r.id, () => deleteRequest(r))}
                      />
                      <Btn
                        theme={theme}
                        compact={compact}
                        text="Accept"
                        kind="primary"
                        onPress={() => run(r.id, () => acceptRequest(r))}
                      />
                    </PersonCard>
                  )}
                />
              )}
            </View>

            {/* Your Brethren */}
            <View style={styles.stack}>
              {label(
                connections.length > 0
                  ? `YOUR BRETHREN · ${connections.length}`
                  : "YOUR BRETHREN",
              )}
              {connections.length === 0 ? (
                emptyCard("No one yet. Send a request above to get started.")
              ) : (
                <Grid
                  gridLayout={gridLayout}
                  gap={gap}
                  data={connections}
                  keyOf={(c) => c.id}
                  render={(c) => (
                    <PersonCard
                      theme={theme}
                      card={card}
                      compact={compact}
                      title={c.name}
                      subtitle={`Connected ${new Date(c.createdAt).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}`}
                      busy={busyId === c.id}
                    >
                      {confirmRemove === c.id ? (
                        <>
                          <Btn
                            theme={theme}
                            compact={compact}
                            text="Cancel"
                            onPress={() => setConfirmRemove(null)}
                          />
                          <Btn
                            theme={theme}
                            compact={compact}
                            text="Remove"
                            kind="danger"
                            onPress={() => run(c.id, () => removeConnection(c))}
                          />
                        </>
                      ) : (
                        <Btn
                          theme={theme}
                          compact={compact}
                          text="Remove"
                          onPress={() => setConfirmRemove(c.id)}
                        />
                      )}
                    </PersonCard>
                  )}
                />
              )}
              {confirmRemove && (
                <Text style={[styles.small, { color: theme.textSecondary }]}>
                  Removing someone means you&apos;ll both stop seeing each
                  other&apos;s shared verses.
                </Text>
              )}
            </View>

            {/* Sent requests */}
            <View style={styles.stack}>
              {label(sent.length > 0 ? `SENT REQUESTS · ${sent.length}` : "SENT REQUESTS")}
              {sent.length === 0 ? (
                emptyCard(
                  "No requests waiting for a reply.",
                )
              ) : (
                <Grid
                  gridLayout={gridLayout}
                  gap={gap}
                  data={sent}
                  keyOf={(r) => r.id}
                  render={(r) => (
                    <PersonCard
                      theme={theme}
                      card={card}
                      compact={compact}
                      title={r.toEmail}
                      subtitle="Waiting for a reply"
                      busy={busyId === r.id}
                    >
                      <Btn
                        theme={theme}
                        compact={compact}
                        text="Cancel request"
                        onPress={() => run(r.id, () => deleteRequest(r))}
                      />
                    </PersonCard>
                  )}
                />
              )}
            </View>

            {/* Verses you shared */}
            <View style={styles.stack}>
              {label(myShares.length > 0 ? `VERSES YOU SHARED · ${myShares.length}` : "VERSES YOU SHARED")}
              {myShares.length === 0 ? (
                emptyCard(
                  "Nothing shared yet. To share a verse, double-tap it in the Bible and choose Share with Brethren.",
                )
              ) : (
                <Grid
                  gridLayout={gridLayout}
                  gap={gap}
                  data={myShares}
                  keyOf={(v) => v.id}
                  render={(v) => (
                    <View style={[card, desktopPage.tileFill, styles.verseCard]}>
                      <Text
                        style={[styles.ref, compact && styles.refCompact, { color: theme.text }]}
                      >
                        {bookmarkRef(v)}{" "}
                        <Text style={[styles.version, { color: theme.textSecondary }]}>
                          {v.version}
                        </Text>
                      </Text>
                      {!!v.note && (
                        <Text style={[styles.note, { color: theme.text }]}>
                          {v.note}
                        </Text>
                      )}
                      <Text
                        style={[styles.verseText, { color: theme.textSecondary }]}
                        numberOfLines={4}
                      >
                        {v.text}
                      </Text>
                      <View style={styles.grow} />
                      {busyId === v.id ? (
                        <ActivityIndicator color={theme.textSecondary} />
                      ) : (
                        <View style={styles.row}>
                          <Btn
                            theme={theme}
                            compact={compact}
                            text="Delete"
                            onPress={() => run(v.id, () => deleteShare(v.id))}
                          />
                        </View>
                      )}
                    </View>
                  )}
                />
              )}
            </View>

            {myShares.length > 0 && (
              <Text style={[styles.small, { color: theme.textSecondary }]}>
                To share a verse, double-tap it in the Bible and choose Share
                with Brethren.
              </Text>
            )}
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

/** A grid of item cards (web) or a stack (native). */
function Grid<T>({
  data,
  keyOf,
  render,
  span,
  gridLayout,
  gap,
  maxColumns = 4,
  minColumnWidth = 200,
}: {
  data: T[];
  keyOf: (item: T) => string;
  render: (item: T) => ReactNode;
  span?: (item: T) => 1 | 2;
  gridLayout: boolean;
  gap: number;
  /** Small tiles: how many fit across, and how narrow they may get. */
  maxColumns?: number;
  minColumnWidth?: number;
}) {
  if (!gridLayout) {
    return (
      <View style={styles.stack}>
        {data.map((item) => (
          <View key={keyOf(item)}>{render(item)}</View>
        ))}
      </View>
    );
  }
  return (
    <BentoGrid
      gap={gap}
      data={data}
      keyExtractor={keyOf}
      spanFor={span ?? (() => 1)}
      minColumnWidth={minColumnWidth}
      maxColumns={maxColumns}
      // Small tiles keep their size; a lone card stays a small box
      fillRows={false}
      renderItem={(item) => render(item)}
    />
  );
}

/** A person (request, connection, sent request) as its own small card. */
function PersonCard({
  theme,
  card,
  compact,
  title,
  subtitle,
  busy,
  children,
}: {
  theme: Theme;
  card: StyleProp<ViewStyle>;
  compact: boolean;
  title: string;
  subtitle: string;
  busy: boolean;
  children: ReactNode;
}) {
  return (
    <View style={[card, desktopPage.tileFill]}>
      <View style={styles.person}>
        <View style={[styles.avatar, { backgroundColor: theme.primary }]}>
          <Text style={[styles.avatarText, { color: theme.primaryText }]}>
            {title.charAt(0).toUpperCase()}
          </Text>
        </View>
        <View style={styles.flex}>
          <Text
            style={[
              styles.title,
              compact && styles.titleCompact,
              { color: theme.text },
            ]}
            numberOfLines={1}
          >
            {title}
          </Text>
          <Text
            style={[styles.small, { color: theme.textSecondary }]}
            numberOfLines={1}
          >
            {subtitle}
          </Text>
        </View>
      </View>
      <View style={styles.grow} />
      {busy ? (
        <ActivityIndicator color={theme.textSecondary} />
      ) : (
        <View style={styles.row}>{children}</View>
      )}
    </View>
  );
}

function Btn({
  theme,
  compact,
  text,
  onPress,
  kind = "outline",
}: {
  theme: Theme;
  compact: boolean;
  text: string;
  onPress: () => void;
  kind?: "primary" | "outline" | "danger";
}) {
  const bg =
    kind === "primary"
      ? theme.primary
      : kind === "danger"
        ? "#e53e3e"
        : "transparent";
  const fg =
    kind === "primary"
      ? theme.primaryText
      : kind === "danger"
        ? "#fff"
        : theme.text;
  return (
    <TouchableOpacity
      onPress={onPress}
      activeOpacity={0.85}
      style={[
        styles.btn,
        compact && styles.btnCompact,
        styles.btnFlex,
        kind === "outline" && [styles.btnOutline, { borderColor: theme.border }],
        { backgroundColor: bg },
      ]}
    >
      <Text style={[styles.btnText, { color: fg }]}>{text}</Text>
    </TouchableOpacity>
  );
}

// Sizes follow the other main tabs (Memory Verses / Reading Plans)
const styles = StyleSheet.create({
  // Phones and tablets: tighter cards and type
  cardCompact: { padding: 12, gap: 8, borderRadius: 12 },
  sectionsCompact: { gap: 20 },
  bigNumberCompact: { fontSize: 30, lineHeight: 36 },
  titleCompact: { fontSize: 14 },
  refCompact: { fontSize: 14 },
  btnCompact: { paddingVertical: 9 },
  inputCompact: { minHeight: 40, fontSize: 14 },

  container: { flex: 1 },
  content: { paddingBottom: 48 },
  loader: { marginTop: 40 },
  loadError: { paddingVertical: 24 },
  flex: { flex: 1, minWidth: 0 },
  grow: { flexGrow: 1 },
  stack: { gap: 12 },
  sections: { gap: 28 },
  row: { flexDirection: "row", gap: 10, alignSelf: "stretch" },

  card: { borderWidth: 1, borderRadius: 14, padding: 16, gap: 12 },
  label: { fontSize: 11, fontWeight: "700", letterSpacing: 1.2 },
  // Section headings sit slightly in from the cards, as in Settings
  sectionLabel: { paddingHorizontal: 4 },
  title: { fontSize: 15, fontWeight: "700" },
  body: { fontSize: 14, lineHeight: 20 },
  small: { fontSize: 12, lineHeight: 17 },
  strong: { fontWeight: "700" },

  // Add
  form: { flexDirection: "row", flexWrap: "wrap", gap: 10 },
  input: {
    flexGrow: 1,
    flexBasis: 200,
    minWidth: 0,
    minHeight: 42,
    borderWidth: 1,
    borderRadius: 10,
    paddingHorizontal: 12,
    fontSize: 15,
  },
  sendBtn: { minWidth: 150, paddingHorizontal: 20 },
  // Phones / tablets: the button fills its own line when it wraps
  sendBtnCompact: { flexGrow: 1 },
  disabled: { opacity: 0.5 },

  // Overview
  bigNumber: {
    fontSize: 40,
    fontFamily: "Oswald_700Bold",
    letterSpacing: 0.3,
    lineHeight: 48,
  },
  statRow: { flexDirection: "row", gap: 16, flexWrap: "wrap" },
  statText: { fontSize: 13 },

  // People
  person: { flexDirection: "row", alignItems: "center", gap: 10 },
  avatar: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: "center",
    justifyContent: "center",
  },
  avatarText: { fontSize: 13, fontWeight: "700" },

  // Shared verses
  verseCard: { gap: 8 },
  ref: { fontSize: 15, fontWeight: "700" },
  version: { fontSize: 12, fontWeight: "400" },
  note: { fontSize: 13, lineHeight: 19, fontStyle: "italic" },
  verseText: { fontSize: 13, lineHeight: 19 },

  // Buttons
  btn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
    borderRadius: 10,
    paddingVertical: 11,
    paddingHorizontal: 12,
  },
  btnFlex: { flex: 1 },
  btnOutline: { borderWidth: 1 },
  btnText: { fontSize: 14, fontWeight: "700" },
});
