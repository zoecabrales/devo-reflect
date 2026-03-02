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
import { Ionicons } from "@expo/vector-icons";
import { useFocusEffect } from "expo-router";
import { useCallback, useEffect, useRef, useState } from "react";
import {
    ActivityIndicator,
    FlatList,
    Modal,
    Text,
    TextInput,
    TouchableOpacity,
    TouchableWithoutFeedback,
    View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { styles } from "./prayers.styles";

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

export default function Prayers() {
  const { theme } = useAppTheme();

  const [prayers, setPrayers] = useState<PrayerRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [inputText, setInputText] = useState("");
  const [adding, setAdding] = useState(false);
  const [showVerseModal, setShowVerseModal] = useState(false);
  const [editingPrayer, setEditingPrayer] = useState<PrayerRequest | null>(
    null,
  );
  const [editText, setEditText] = useState("");
  const [saving, setSaving] = useState(false);
  const inputRef = useRef<TextInput>(null);

  const uid = auth.currentUser?.uid ?? "";

  // Auto-close the encouragement modal after 4 seconds
  useEffect(() => {
    if (!showVerseModal) return;
    const timer = setTimeout(() => setShowVerseModal(false), 4000);
    return () => clearTimeout(timer);
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

  async function handleDelete(id: string) {
    await deletePrayer(uid, id);
    setPrayers((prev) => prev.filter((p) => p.id !== id));
    setShowVerseModal(true);
  }

  const unanswered = prayers.filter((p) => !p.answeredAt);
  const answered = prayers.filter((p) => p.answeredAt);

  return (
    <SafeAreaView
      edges={["top"]}
      style={[styles.container, { backgroundColor: theme.background }]}
    >
      {/* Header */}
      <View style={styles.header}>
        <Text style={[styles.headerTitle, { color: theme.text }]}>
          Prayer Requests
        </Text>
        <Text style={[styles.headerSubtitle, { color: theme.textSecondary }]}>
          {prayers.length > 0
            ? `${unanswered.length} active · ${answered.length} answered`
            : "Write down what's on your heart"}
        </Text>
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
              backgroundColor: theme.surface,
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

      {loading ? (
        <View style={styles.centered}>
          <ActivityIndicator size="large" color={theme.textSecondary} />
        </View>
      ) : prayers.length === 0 ? (
        <View style={styles.empty}>
          <Text style={[styles.emptyPrompt, { color: theme.textSecondary }]}>
            Not sure what to pray? Here's how Jesus taught us:
          </Text>
          <View
            style={[
              styles.lordsPrayerCard,
              { backgroundColor: theme.surface, borderColor: theme.border },
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
                  style={[
                    styles.lordsPrayerVerseNum,
                    { color: theme.textSecondary },
                  ]}
                >
                  {v.verse}
                </Text>
                <Text style={[styles.lordsPrayerText, { color: theme.text }]}>
                  {v.text}
                </Text>
              </View>
            ))}
          </View>
        </View>
      ) : (
        <FlatList
          data={prayers}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.list}
          renderItem={({ item }) => {
            const isAnswered = !!item.answeredAt;
            const date = new Date(item.createdAt).toLocaleDateString("en-US", {
              month: "short",
              day: "numeric",
              year: "numeric",
            });
            return (
              <View
                style={[
                  styles.row,
                  { backgroundColor: theme.surface, borderColor: theme.border },
                ]}
              >
                {/* Answered toggle */}
                <TouchableOpacity
                  style={[
                    styles.checkBtn,
                    {
                      borderColor: isAnswered ? "#4CAF50" : theme.border,
                      backgroundColor: isAnswered ? "#4CAF5022" : "transparent",
                    },
                  ]}
                  onPress={() => handleToggle(item)}
                  activeOpacity={0.7}
                >
                  {isAnswered && (
                    <Ionicons name="checkmark" size={14} color="#4CAF50" />
                  )}
                </TouchableOpacity>

                {/* Content */}
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

                {/* Edit */}
                <TouchableOpacity
                  style={styles.editBtn}
                  onPress={() => openEdit(item)}
                  activeOpacity={0.7}
                >
                  <Ionicons
                    name="pencil-outline"
                    size={17}
                    color={theme.textSecondary}
                  />
                </TouchableOpacity>

                {/* Delete */}
                <TouchableOpacity
                  style={styles.deleteBtn}
                  onPress={() => handleDelete(item.id)}
                  activeOpacity={0.7}
                >
                  <Ionicons
                    name="trash-outline"
                    size={18}
                    color={theme.textSecondary}
                  />
                </TouchableOpacity>
              </View>
            );
          }}
        />
      )}
      {/* Edit prayer modal */}
      <Modal
        visible={!!editingPrayer}
        transparent
        animationType="fade"
        onRequestClose={() => setEditingPrayer(null)}
      >
        <TouchableWithoutFeedback onPress={() => setEditingPrayer(null)}>
          <View style={styles.modalOverlay}>
            <TouchableWithoutFeedback>
              <View
                style={[
                  styles.modalCard,
                  { backgroundColor: theme.surface, borderColor: theme.border },
                ]}
              >
                <Text style={[styles.modalRef, { color: theme.textSecondary }]}>
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
                <View style={styles.editActions}>
                  <TouchableOpacity
                    style={[
                      styles.editCancelBtn,
                      { borderColor: theme.border },
                    ]}
                    onPress={() => setEditingPrayer(null)}
                    activeOpacity={0.7}
                  >
                    <Text
                      style={[
                        styles.editCancelText,
                        { color: theme.textSecondary },
                      ]}
                    >
                      Cancel
                    </Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={[
                      styles.editSaveBtn,
                      { backgroundColor: theme.primary },
                    ]}
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
                        style={[
                          styles.editSaveText,
                          { color: theme.primaryText },
                        ]}
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

      {/* Delete encouragement modal */}
      <Modal
        visible={showVerseModal}
        transparent
        animationType="fade"
        onRequestClose={() => setShowVerseModal(false)}
      >
        <TouchableWithoutFeedback onPress={() => setShowVerseModal(false)}>
          <View style={styles.modalOverlay}>
            <TouchableWithoutFeedback>
              <View
                style={[
                  styles.modalCard,
                  { backgroundColor: theme.surface, borderColor: theme.border },
                ]}
              >
                <Text style={[styles.modalRef, { color: theme.textSecondary }]}>
                  Philippians 4:6–7
                </Text>
                {PHIL_4_6_7.map((v) => (
                  <View key={v.verse} style={styles.lordsPrayerRow}>
                    <Text
                      style={[
                        styles.lordsPrayerVerseNum,
                        { color: theme.textSecondary },
                      ]}
                    >
                      {v.verse}
                    </Text>
                    <Text
                      style={[styles.lordsPrayerText, { color: theme.text }]}
                    >
                      {v.text}
                    </Text>
                  </View>
                ))}
              </View>
            </TouchableWithoutFeedback>
          </View>
        </TouchableWithoutFeedback>
      </Modal>
    </SafeAreaView>
  );
}
