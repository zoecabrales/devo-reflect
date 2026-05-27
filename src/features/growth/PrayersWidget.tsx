import { PrayerListSkeleton } from "@/src/components";
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
    Modal,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    TouchableWithoutFeedback,
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

  const unanswered = prayers.filter((p) => !p.answeredAt);
  const answered = prayers.filter((p) => p.answeredAt);

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
          <Ionicons name="hand-left-outline" size={16} color={theme.primary} />
          <View style={{ flex: 1 }}>
            <Text style={[styles.widgetTitle, { color: theme.text }]}>
              Prayers
            </Text>
          </View>
          {prayers.length > 0 && (
            <Text style={[styles.widgetCount, { color: theme.textSecondary }]}>
              {unanswered.length} active · {answered.length} answered
            </Text>
          )}
        </View>

        {/* Add input */}
        <View style={styles.inputRow}>
          <TextInput
            ref={inputRef}
            style={[
              styles.textInput,
              {
                color: theme.text,
                borderColor: theme.border,
                backgroundColor: theme.background,
              },
            ]}
            placeholder="Add a prayer request…"
            placeholderTextColor={theme.textSecondary}
            value={inputText}
            onChangeText={setInputText}
            multiline
            returnKeyType="done"
            blurOnSubmit
            onSubmitEditing={handleAdd}
          />
          <TouchableOpacity
            style={[styles.addBtn, { backgroundColor: theme.primary }]}
            onPress={handleAdd}
            activeOpacity={0.8}
            disabled={adding || !inputText.trim()}
          >
            {adding ? (
              <ActivityIndicator size="small" color={theme.primaryText} />
            ) : (
              <Ionicons name="add" size={24} color={theme.primaryText} />
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
          <View style={styles.list}>
            {prayers.map((item) => {
              const isAnswered = !!item.answeredAt;
              const date = new Date(item.createdAt).toLocaleDateString(
                "en-US",
                { month: "short", day: "numeric", year: "numeric" },
              );
              return (
                <View
                  key={item.id}
                  style={[
                    styles.row,
                    {
                      backgroundColor: theme.background,
                      borderColor: theme.border,
                    },
                    isAnswered && {
                      borderLeftColor: "#4CAF50",
                      borderLeftWidth: 3,
                    },
                  ]}
                >
                  <TouchableOpacity
                    style={[
                      styles.checkBtn,
                      {
                        borderColor: isAnswered ? "#4CAF50" : theme.border,
                        backgroundColor: isAnswered
                          ? "#4CAF5022"
                          : "transparent",
                      },
                    ]}
                    onPress={() => handleToggle(item)}
                    activeOpacity={0.7}
                  >
                    {isAnswered && (
                      <Ionicons name="checkmark" size={16} color="#4CAF50" />
                    )}
                  </TouchableOpacity>
                  <View style={styles.rowBody}>
                    <Text
                      style={[
                        styles.rowText,
                        { color: theme.text },
                        isAnswered && styles.rowTextAnswered,
                      ]}
                    >
                      {item.text}
                    </Text>
                    {isAnswered ? (
                      <Text style={styles.answeredBadge}>✓ Answered</Text>
                    ) : (
                      <Text
                        style={[styles.rowDate, { color: theme.textSecondary }]}
                      >
                        {date}
                      </Text>
                    )}
                  </View>
                  <TouchableOpacity
                    style={styles.iconBtn}
                    onPress={() => openEdit(item)}
                    activeOpacity={0.7}
                  >
                    <Ionicons
                      name="pencil-outline"
                      size={16}
                      color={theme.textSecondary}
                    />
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={styles.iconBtn}
                    onPress={() => setDeleteTargetId(item.id)}
                    activeOpacity={0.7}
                  >
                    <Ionicons
                      name="trash-outline"
                      size={17}
                      color={theme.textSecondary}
                    />
                  </TouchableOpacity>
                </View>
              );
            })}
          </View>
        )}
      </View>

      {/* ── Delete confirmation modal ───────────────────────────────────────── */}
      <Modal
        visible={deleteTargetId !== null}
        transparent
        animationType="fade"
        onRequestClose={() => setDeleteTargetId(null)}
      >
        <TouchableWithoutFeedback onPress={() => setDeleteTargetId(null)}>
          <View style={styles.overlay}>
            <TouchableWithoutFeedback>
              <View
                style={[
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
              </View>
            </TouchableWithoutFeedback>
          </View>
        </TouchableWithoutFeedback>
      </Modal>

      {/* ── Edit prayer modal ───────────────────────────────────────────────── */}
      <Modal
        visible={!!editingPrayer}
        transparent
        animationType="fade"
        onRequestClose={() => setEditingPrayer(null)}
      >
        <TouchableWithoutFeedback onPress={() => setEditingPrayer(null)}>
          <View style={styles.overlay}>
            <TouchableWithoutFeedback>
              <View
                style={[
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
              </View>
            </TouchableWithoutFeedback>
          </View>
        </TouchableWithoutFeedback>
      </Modal>

      {/* ── Encouragement modal (shown after delete) ────────────────────────── */}
      <Modal
        visible={showVerseModal}
        transparent
        animationType="fade"
        onRequestClose={() => setShowVerseModal(false)}
      >
        <TouchableWithoutFeedback onPress={() => setShowVerseModal(false)}>
          <View style={styles.overlay}>
            <TouchableWithoutFeedback>
              <View
                style={[
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
              </View>
            </TouchableWithoutFeedback>
          </View>
        </TouchableWithoutFeedback>
      </Modal>
    </>
  );
}

// ── Styles ────────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  card: { borderRadius: 14, borderWidth: 1, padding: 16 },
  widgetHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 7,
    marginBottom: 14,
  },
  widgetTitle: {
    fontSize: 16,
    fontFamily: "Oswald_700Bold",
    letterSpacing: 0.4,
  },
  widgetCount: {
    fontSize: 11,
    fontWeight: "700",
    letterSpacing: 0.5,
    opacity: 0.6,
  },
  inputRow: {
    flexDirection: "row",
    alignItems: "stretch",
    gap: 8,
    marginBottom: 12,
  },
  textInput: {
    flex: 1,
    borderWidth: 1,
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 9,
    fontSize: 15,
    maxHeight: 90,
  },
  addBtn: {
    width: 44,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
  },
  list: { gap: 8 },
  row: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 10,
    borderRadius: 12,
    padding: 12,
    borderWidth: 1,
  },
  checkBtn: {
    width: 22,
    height: 22,
    borderRadius: 11,
    borderWidth: 1.5,
    alignItems: "center",
    justifyContent: "center",
    marginTop: 1,
    flexShrink: 0,
  },
  rowBody: { flex: 1, gap: 2 },
  rowText: { fontSize: 14, lineHeight: 20, letterSpacing: 0.1 },
  rowTextAnswered: { opacity: 0.4, textDecorationLine: "line-through" },
  rowDate: {
    fontSize: 11,
    fontWeight: "700",
    letterSpacing: 1,
    opacity: 0.35,
    textTransform: "uppercase",
    marginTop: 1,
  },
  answeredBadge: {
    fontSize: 11,
    fontWeight: "700",
    letterSpacing: 0.8,
    textTransform: "uppercase",
    color: "#4CAF50",
    marginTop: 1,
  },
  iconBtn: { padding: 4, marginTop: 1 },
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
