import { AppModal, PrayerListSkeleton } from "@/src/components";
import { useAppTheme } from "@/src/contexts/ThemeContext";
import { auth } from "@/src/services/firebase";
import {
    addPrayer,
    deletePrayer,
    loadPrayers,
    PrayerRequest,
    toggleAnswered,
    updatePrayer,
} from "@/src/services/prayers";
import { MODAL_MAX_WIDTH } from "@/src/utils/responsive";
import { Ionicons } from "@expo/vector-icons";
import { useFocusEffect } from "expo-router";
import { useCallback, useEffect, useRef, useState } from "react";
import {
    ActivityIndicator,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    View,
} from "react-native";

// ── Static verse data ─────────────────────────────────────────────────────────

const PHIL_4_6_7: { verse: number; text: string }[] = [
  {
    verse: 6,
    text: "In nothing be anxious; but in everything by prayer and supplication with thanksgiving let your requests be made known unto God.",
  },
  {
    verse: 7,
    text: "And the peace of God, which passeth all understanding, shall guard your hearts and your thoughts in Christ Jesus.",
  },
];

const LORDS_PRAYER: { verse: number; text: string }[] = [
  {
    verse: 9,
    text: "After this manner therefore pray ye. Our Father who art in heaven, Hallowed be thy name.",
  },
  {
    verse: 10,
    text: "Thy kingdom come. Thy will be done, as in heaven, so on earth.",
  },
  { verse: 11, text: "Give us this day our daily bread." },
  {
    verse: 12,
    text: "And forgive us our debts, as we also have forgiven our debtors.",
  },
  {
    verse: 13,
    text: "And bring us not into temptation, but deliver us from the evil one.",
  },
];

/** Colour for answered prayers (check, label, counts). */
const ANSWERED = "#4CAF50";

/** "today", "yesterday", "Nov 11", or "Nov 11, 2025" for other years. */
function friendlyDate(ts: number): string {
  const d = new Date(ts);
  const today = new Date();
  const startOf = (x: Date) =>
    new Date(x.getFullYear(), x.getMonth(), x.getDate()).getTime();
  const days = Math.round((startOf(today) - startOf(d)) / 86_400_000);
  if (days === 0) return "today";
  if (days === 1) return "yesterday";
  return d.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    ...(d.getFullYear() !== today.getFullYear() && { year: "numeric" }),
  });
}

// ── Component ─────────────────────────────────────────────────────────────────

export function PrayersWidget() {
  const { theme } = useAppTheme();
  const uid = auth.currentUser?.uid ?? "";

  const [prayers, setPrayers] = useState<PrayerRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [inputText, setInputText] = useState("");
  const [adding, setAdding] = useState(false);
  const [deleteTargetId, setDeleteTargetId] = useState<string | null>(null);
  const [showVerseModal, setShowVerseModal] = useState(false);
  const [editingPrayer, setEditingPrayer] = useState<PrayerRequest | null>(
    null,
  );
  const [editText, setEditText] = useState("");
  const [saving, setSaving] = useState(false);
  const inputRef = useRef<TextInput>(null);
  // Which list is shown: still praying, or answered
  const [filter, setFilter] = useState<"active" | "answered">("active");

  const unanswered = prayers.filter((p) => !p.answeredAt);
  // Most recently answered first
  const answered = prayers
    .filter((p) => p.answeredAt)
    .sort((a, b) => (b.answeredAt ?? 0) - (a.answeredAt ?? 0));
  const shown = filter === "active" ? unanswered : answered;
  const canAdd = !adding && !!inputText.trim();

  // Auto-close encouragement modal after 4 s
  useEffect(() => {
    if (!showVerseModal) return;
    const t = setTimeout(() => setShowVerseModal(false), 4000);
    return () => clearTimeout(t);
  }, [showVerseModal]);

  useFocusEffect(
    useCallback(() => {
      if (!uid) return;
      setLoading(true);
      loadPrayers(uid)
        .then(setPrayers)
        .finally(() => setLoading(false));
    }, [uid]),
  );

  async function handleAdd() {
    const text = inputText.trim();
    if (!text || !uid) return;
    setAdding(true);
    try {
      const newPrayer = await addPrayer(uid, text);
      setPrayers((prev) => [newPrayer, ...prev]);
      setFilter("active"); // show the new request
      setInputText("");
      inputRef.current?.blur();
    } finally {
      setAdding(false);
    }
  }

  async function handleToggle(prayer: PrayerRequest) {
    const newAnsweredAt = await toggleAnswered(
      uid,
      prayer.id,
      prayer.answeredAt,
    );
    setPrayers((prev) =>
      prev.map((p) =>
        p.id === prayer.id ? { ...p, answeredAt: newAnsweredAt } : p,
      ),
    );
  }

  function openEdit(prayer: PrayerRequest) {
    setEditText(prayer.text);
    setEditingPrayer(prayer);
  }

  async function handleSaveEdit() {
    const trimmed = editText.trim();
    if (!trimmed || !editingPrayer || !uid) return;
    setSaving(true);
    try {
      await updatePrayer(uid, editingPrayer.id, trimmed);
      setPrayers((prev) =>
        prev.map((p) =>
          p.id === editingPrayer.id ? { ...p, text: trimmed } : p,
        ),
      );
      setEditingPrayer(null);
    } finally {
      setSaving(false);
    }
  }

  async function confirmDelete() {
    if (!deleteTargetId) return;
    await deletePrayer(uid, deleteTargetId);
    setPrayers((prev) => prev.filter((p) => p.id !== deleteTargetId));
    setDeleteTargetId(null);
    setShowVerseModal(true);
  }

  return (
    <>
      {/* ── Widget card ────────────────────────────────────────────────────── */}
      <View
        style={[
          styles.card,
          { backgroundColor: theme.surface, borderColor: theme.border },
        ]}
      >
        {/* Widget header */}
        <View style={styles.widgetHeader}>
          <View
            style={[styles.headerIcon, { backgroundColor: theme.background }]}
          >
            <Ionicons name="hand-left-outline" size={15} color={theme.text} />
          </View>
          <Text style={[styles.widgetTitle, { color: theme.text }]}>
            Prayers
          </Text>
        </View>

        {/* Composer: input with the add button inside it */}
        <View
          style={[
            styles.composer,
            { borderColor: theme.border, backgroundColor: theme.background },
          ]}
        >
          <TextInput
            ref={inputRef}
            style={[styles.textInput, { color: theme.text }]}
            placeholder="What would you like to pray for?"
            placeholderTextColor={theme.textSecondary}
            value={inputText}
            onChangeText={setInputText}
            multiline
            // One line until the text wraps (web textareas default to 2 rows)
            numberOfLines={1}
            returnKeyType="done"
            blurOnSubmit
            onSubmitEditing={handleAdd}
          />
          <TouchableOpacity
            style={[
              styles.addBtn,
              { backgroundColor: theme.primary },
              !canAdd && !adding && styles.addBtnDisabled,
            ]}
            onPress={handleAdd}
            activeOpacity={0.8}
            disabled={!canAdd}
            accessibilityRole="button"
            accessibilityLabel="Add prayer request"
          >
            {adding ? (
              <ActivityIndicator size="small" color={theme.primaryText} />
            ) : (
              <Ionicons name="add" size={20} color={theme.primaryText} />
            )}
          </TouchableOpacity>
        </View>

        {/* Content */}
        {loading ? (
          <PrayerListSkeleton />
        ) : prayers.length === 0 ? (
          <View style={styles.empty}>
            <Text style={[styles.emptyPrompt, { color: theme.textSecondary }]}>
              Not sure what to pray? Here's how Jesus taught us:
            </Text>
            <View
              style={[
                styles.lordsPrayerCard,
                {
                  backgroundColor: theme.background,
                  borderColor: theme.border,
                },
              ]}
            >
              <Text
                style={[styles.lordsPrayerRef, { color: theme.textSecondary }]}
              >
                Matthew 6:9–13
              </Text>
              {LORDS_PRAYER.map((v) => (
                <View key={v.verse} style={styles.lordsPrayerRow}>
                  <Text
                    style={[styles.verseNum, { color: theme.textSecondary }]}
                  >
                    {v.verse}
                  </Text>
                  <Text style={[styles.verseText, { color: theme.text }]}>
                    {v.text}
                  </Text>
                </View>
              ))}
            </View>
          </View>
        ) : (
          <>
            {/* Active / Answered switch */}
            <View
              style={[styles.segments, { backgroundColor: theme.background }]}
            >
              {(
                [
                  ["active", "Praying", unanswered.length],
                  ["answered", "Answered", answered.length],
                ] as const
              ).map(([key, label, count]) => {
                const on = filter === key;
                return (
                  <TouchableOpacity
                    key={key}
                    style={[
                      styles.segment,
                      on && [
                        styles.segmentOn,
                        {
                          backgroundColor: theme.surface,
                          borderColor: theme.border,
                        },
                      ],
                    ]}
                    onPress={() => setFilter(key)}
                    activeOpacity={0.7}
                    accessibilityRole="tab"
                    accessibilityState={{ selected: on }}
                  >
                    <Text
                      style={[
                        styles.segmentText,
                        { color: on ? theme.text : theme.textSecondary },
                        on && styles.segmentTextOn,
                      ]}
                    >
                      {label}
                    </Text>
                    <Text
                      style={[
                        styles.segmentCount,
                        {
                          color:
                            key === "answered" && count > 0
                              ? ANSWERED
                              : theme.textSecondary,
                        },
                      ]}
                    >
                      {count}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>

            {shown.length === 0 ? (
              <Text
                style={[styles.listEmpty, { color: theme.textSecondary }]}
              >
                {filter === "active"
                  ? "All your requests are answered. Add a new one above."
                  : "Answered prayers will appear here. Tap the circle on a request when God answers it."}
              </Text>
            ) : (
              <View style={[styles.list, { borderColor: theme.border }]}>
                {shown.map((item, i) => {
                  const isAnswered = !!item.answeredAt;
                  return (
                    <View
                      key={item.id}
                      style={[
                        styles.row,
                        i > 0 && {
                          borderTopWidth: StyleSheet.hairlineWidth,
                          borderTopColor: theme.border,
                        },
                      ]}
                    >
                      <TouchableOpacity
                        style={[
                          styles.checkBtn,
                          {
                            borderColor: isAnswered
                              ? ANSWERED
                              : theme.textSecondary,
                            backgroundColor: isAnswered
                              ? ANSWERED
                              : "transparent",
                          },
                        ]}
                        onPress={() => handleToggle(item)}
                        activeOpacity={0.7}
                        hitSlop={8}
                        accessibilityRole="checkbox"
                        accessibilityState={{ checked: isAnswered }}
                        accessibilityLabel={
                          isAnswered ? "Mark as still praying" : "Mark as answered"
                        }
                      >
                        {isAnswered && (
                          <Ionicons name="checkmark" size={13} color="#fff" />
                        )}
                      </TouchableOpacity>
                      <View style={styles.rowBody}>
                        <Text style={[styles.rowText, { color: theme.text }]}>
                          {item.text}
                        </Text>
                        <Text
                          style={[
                            styles.rowMeta,
                            {
                              color: isAnswered
                                ? ANSWERED
                                : theme.textSecondary,
                            },
                          ]}
                        >
                          {isAnswered
                            ? `Answered ${friendlyDate(item.answeredAt!)}`
                            : `Added ${friendlyDate(item.createdAt)}`}
                        </Text>
                      </View>
                      <TouchableOpacity
                        style={styles.iconBtn}
                        onPress={() => openEdit(item)}
                        activeOpacity={0.6}
                        accessibilityRole="button"
                        accessibilityLabel="Edit prayer"
                      >
                        <Ionicons
                          name="create-outline"
                          size={16}
                          color={theme.textSecondary}
                        />
                      </TouchableOpacity>
                      <TouchableOpacity
                        style={styles.iconBtn}
                        onPress={() => setDeleteTargetId(item.id)}
                        activeOpacity={0.6}
                        accessibilityRole="button"
                        accessibilityLabel="Delete prayer"
                      >
                        <Ionicons
                          name="trash-outline"
                          size={16}
                          color={theme.textSecondary}
                        />
                      </TouchableOpacity>
                    </View>
                  );
                })}
              </View>
            )}
          </>
        )}
      </View>

      {/* ── Delete confirmation modal ───────────────────────────────────────── */}
      <AppModal
        visible={deleteTargetId !== null}
        onClose={() => setDeleteTargetId(null)}
        overlayStyle={styles.overlay}
        cardStyle={[
          styles.modalCard,
          { backgroundColor: theme.surface, borderColor: theme.border },
        ]}
      >
        <Text style={[styles.modalTitle, { color: theme.text }]}>
          Delete Prayer
        </Text>
        <Text
          style={[styles.modalBody, { color: theme.textSecondary }]}
        >
          This prayer request will be permanently removed. This cannot
          be undone.
        </Text>
        <View style={styles.modalActions}>
          <TouchableOpacity
            style={[styles.cancelBtn, { borderColor: theme.border }]}
            onPress={() => setDeleteTargetId(null)}
            activeOpacity={0.7}
          >
            <Text
              style={[
                styles.cancelText,
                { color: theme.textSecondary },
              ]}
            >
              Cancel
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.confirmBtn, { backgroundColor: "#e53e3e" }]}
            onPress={confirmDelete}
            activeOpacity={0.85}
          >
            <Text style={[styles.confirmText, { color: "#fff" }]}>
              Delete
            </Text>
          </TouchableOpacity>
        </View>
      </AppModal>

      {/* ── Edit prayer modal ───────────────────────────────────────────────── */}
      <AppModal
        visible={!!editingPrayer}
        onClose={() => setEditingPrayer(null)}
        overlayStyle={styles.overlay}
        cardStyle={[
          styles.modalCard,
          { backgroundColor: theme.surface, borderColor: theme.border },
        ]}
      >
        <Text
          style={[styles.modalLabel, { color: theme.textSecondary }]}
        >
          Edit Prayer
        </Text>
        <TextInput
          style={[
            styles.editInput,
            {
              color: theme.text,
              borderColor: theme.border,
              backgroundColor: theme.background,
            },
          ]}
          value={editText}
          onChangeText={setEditText}
          multiline
          autoFocus
          placeholderTextColor={theme.textSecondary}
          placeholder="Update your prayer…"
        />
        <View style={styles.modalActions}>
          <TouchableOpacity
            style={[styles.cancelBtn, { borderColor: theme.border }]}
            onPress={() => setEditingPrayer(null)}
            activeOpacity={0.7}
          >
            <Text
              style={[
                styles.cancelText,
                { color: theme.textSecondary },
              ]}
            >
              Cancel
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.saveBtn, { backgroundColor: theme.primary }]}
            onPress={handleSaveEdit}
            activeOpacity={0.8}
            disabled={saving || !editText.trim()}
          >
            {saving ? (
              <ActivityIndicator
                size="small"
                color={theme.primaryText}
              />
            ) : (
              <Text
                style={[styles.saveText, { color: theme.primaryText }]}
              >
                Save
              </Text>
            )}
          </TouchableOpacity>
        </View>
      </AppModal>

      {/* ── Encouragement modal (shown after delete) ────────────────────────── */}
      <AppModal
        visible={showVerseModal}
        onClose={() => setShowVerseModal(false)}
        overlayStyle={styles.overlay}
        cardStyle={[
          styles.modalCard,
          { backgroundColor: theme.surface, borderColor: theme.border },
        ]}
      >
        <Text
          style={[styles.modalLabel, { color: theme.textSecondary }]}
        >
          Philippians 4:6–7
        </Text>
        {PHIL_4_6_7.map((v) => (
          <View key={v.verse} style={styles.lordsPrayerRow}>
            <Text
              style={[styles.verseNum, { color: theme.textSecondary }]}
            >
              {v.verse}
            </Text>
            <Text style={[styles.verseText, { color: theme.text }]}>
              {v.text}
            </Text>
          </View>
        ))}
      </AppModal>
    </>
  );
}

// ── Styles ────────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  card: { borderRadius: 14, borderWidth: 1, padding: 16, gap: 14 },
  widgetHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },
  headerIcon: {
    width: 30,
    height: 30,
    borderRadius: 9,
    alignItems: "center",
    justifyContent: "center",
  },
  widgetTitle: {
    fontSize: 17,
    fontFamily: "Oswald_700Bold",
    letterSpacing: 0.4,
  },
  // Rounded field with the add button inside it
  composer: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    borderWidth: 1,
    borderRadius: 14,
    paddingLeft: 14,
    padding: 6,
  },
  textInput: {
    flex: 1,
    fontSize: 15,
    lineHeight: 20,
    paddingVertical: 8,
    minHeight: 36,
    maxHeight: 96,
  },
  addBtn: {
    width: 36,
    height: 36,
    borderRadius: 10,
    alignItems: "center",
    justifyContent: "center",
  },
  addBtnDisabled: { opacity: 0.3 },
  // Praying / Answered switch
  segments: {
    flexDirection: "row",
    borderRadius: 10,
    padding: 3,
    gap: 3,
  },
  segment: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
    paddingVertical: 7,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "transparent",
  },
  segmentOn: {
    shadowColor: "#000",
    shadowOpacity: 0.08,
    shadowRadius: 3,
    shadowOffset: { width: 0, height: 1 },
    elevation: 1,
  },
  segmentText: { fontSize: 13, fontWeight: "500" },
  segmentTextOn: { fontWeight: "700" },
  segmentCount: { fontSize: 12, fontWeight: "700" },
  listEmpty: {
    fontSize: 13,
    lineHeight: 19,
    textAlign: "center",
    paddingVertical: 12,
    paddingHorizontal: 8,
  },
  // One grouped list, rows split by hairlines
  list: {
    borderWidth: 1,
    borderRadius: 12,
    overflow: "hidden",
  },
  row: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 12,
    paddingVertical: 12,
    paddingLeft: 14,
    paddingRight: 6,
  },
  checkBtn: {
    width: 20,
    height: 20,
    borderRadius: 10,
    borderWidth: 1.5,
    alignItems: "center",
    justifyContent: "center",
    marginTop: 1,
    flexShrink: 0,
  },
  rowBody: { flex: 1, gap: 3 },
  rowText: { fontSize: 15, lineHeight: 21 },
  rowMeta: { fontSize: 12 },
  iconBtn: { padding: 6, opacity: 0.7 },
  empty: { alignItems: "center", gap: 10, paddingVertical: 6 },
  emptyPrompt: {
    fontSize: 14,
    textAlign: "center",
    lineHeight: 20,
    opacity: 0.6,
  },
  lordsPrayerCard: {
    width: "100%",
    borderRadius: 12,
    borderWidth: 1,
    padding: 14,
    gap: 8,
  },
  lordsPrayerRef: {
    fontSize: 11,
    fontWeight: "700",
    letterSpacing: 2,
    textTransform: "uppercase",
    opacity: 0.5,
    marginBottom: 2,
  },
  lordsPrayerRow: { flexDirection: "row", gap: 8, alignItems: "flex-start" },
  verseNum: {
    fontSize: 11,
    fontWeight: "700",
    opacity: 0.45,
    marginTop: 2,
    minWidth: 14,
    textAlign: "right",
  },
  verseText: {
    flex: 1,
    fontSize: 14,
    lineHeight: 21,
    fontStyle: "italic",
    letterSpacing: 0.1,
  },
  overlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.5)",
    alignItems: "center",
    justifyContent: "center",
    padding: 24,
  },
  modalCard: {
    width: "100%",
    maxWidth: MODAL_MAX_WIDTH,
    borderRadius: 16,
    borderWidth: 1,
    padding: 20,
    gap: 12,
  },
  modalTitle: {
    fontSize: 16,
    fontFamily: "Oswald_700Bold",
    letterSpacing: 0.4,
  },
  modalLabel: {
    fontSize: 10,
    fontWeight: "700",
    letterSpacing: 2,
    textTransform: "uppercase",
    opacity: 0.5,
  },
  modalBody: { fontSize: 13, lineHeight: 20, opacity: 0.6, marginBottom: 4 },
  modalActions: { flexDirection: "row", gap: 10, marginTop: 4 },
  cancelBtn: {
    flex: 1,
    borderWidth: 1,
    borderRadius: 12,
    paddingVertical: 12,
    alignItems: "center",
  },
  cancelText: { fontSize: 13, fontWeight: "700", letterSpacing: 0.4 },
  confirmBtn: {
    flex: 1,
    borderRadius: 12,
    paddingVertical: 12,
    alignItems: "center",
  },
  confirmText: { fontSize: 13, fontWeight: "700", letterSpacing: 0.4 },
  editInput: {
    borderWidth: 1,
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 10,
    fontSize: 15,
    lineHeight: 22,
    minHeight: 80,
    maxHeight: 160,
  },
  saveBtn: {
    flex: 1,
    borderRadius: 12,
    paddingVertical: 12,
    alignItems: "center",
  },
  saveText: { fontSize: 15, fontWeight: "700", letterSpacing: 0.3 },
});
