import { showAlert } from "@/src/components";
import { useAppTheme } from "@/src/contexts/ThemeContext";
import { auth } from "@/src/services/firebase";
import {
  addEntry,
  JournalEntry,
  JournalEntryDraft,
  loadEntry,
  ScriptureRef,
  updateEntry,
} from "@/src/services/journal";
import { formatDateKey } from "@/src/utils/dateKey";
import { useListPaddingH } from "@/src/utils/responsive";
import { Ionicons } from "@expo/vector-icons";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useEffect, useState } from "react";
import {
  ActivityIndicator,
  ScrollView,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

type Params = {
  id?: string;
  ref?: string;
  text?: string;
  /** "YYYY-MM-DD" when started from a day in Growth's calendar */
  forDate?: string;
};

export default function JournalCompose() {
  const { theme } = useAppTheme();
  const padH = useListPaddingH();
  const router = useRouter();
  const { id, ref, text, forDate } = useLocalSearchParams<Params>();

  const uid = auth.currentUser?.uid ?? "";

  const [draft, setDraft] = useState<JournalEntryDraft>({
    title: "",
    scripture: [],
    observation: "",
    application: "",
    prayer: "",
    tags: [],
    bookId: null,
    chapter: null,
    forDate: null,
  });
  const [loading, setLoading] = useState(!!id);
  const [saving, setSaving] = useState(false);

  // Runs every time the screen is visited (id changes between new/edit mode).
  // Always resets the draft first so stale data from a previous session never
  // bleeds into a new entry. Then loads the existing entry only in edit mode.
  useEffect(() => {
    const empty: JournalEntryDraft = {
      title: "",
      scripture: [],
      observation: "",
      application: "",
      prayer: "",
      tags: [],
      bookId: null,
      chapter: null,
      forDate: null,
    };

    if (!id || !uid) {
      // New entry — clear everything (keeping the calendar day, if any)
      setDraft({ ...empty, forDate: forDate ?? null });
      setLoading(false);
      return;
    }

    // Edit mode — reset first, then populate from Firestore
    setDraft(empty);
    setLoading(true);
    loadEntry(uid, id)
      .then((entry) => {
        if (!entry) return;
        setDraft({
          title: entry.title ?? "",
          scripture: entry.scripture,
          observation: entry.observation,
          application: entry.application,
          prayer: entry.prayer,
          tags: entry.tags,
          bookId: entry.bookId,
          chapter: entry.chapter,
          forDate: entry.forDate,
        });
      })
      .finally(() => setLoading(false));
  }, [id, uid, forDate]);

  // Prefill scripture from a verse passed via route params (e.g. from bible-browser)
  useEffect(() => {
    if (!ref || !text) return;
    const incoming: ScriptureRef = { ref: String(ref), text: String(text) };
    setDraft((prev) => {
      const alreadyAdded = prev.scripture.some((s) => s.ref === incoming.ref);
      if (alreadyAdded) return prev;
      return { ...prev, scripture: [...prev.scripture, incoming] };
    });
  }, [ref, text]);

  function updateField<K extends keyof JournalEntryDraft>(
    key: K,
    value: JournalEntryDraft[K],
  ) {
    setDraft((prev) => ({ ...prev, [key]: value }));
  }

  async function handleSave() {
    if (!uid) return;
    const hasContent =
      draft.title?.trim() ||
      draft.observation.trim() ||
      draft.application.trim() ||
      draft.prayer.trim();

    if (!hasContent) {
      showAlert(
        "Nothing to save",
        "Write at least one SOAP field before saving.",
      );
      return;
    }

    try {
      setSaving(true);
      if (id) {
        // Edit existing entry
        const changes: Partial<JournalEntry> = {
          title: draft.title ?? null,
          observation: draft.observation,
          application: draft.application,
          prayer: draft.prayer,
          tags: draft.tags,
          bookId: draft.bookId,
          chapter: draft.chapter,
          scripture: draft.scripture,
        };
        await updateEntry(uid, id, changes);
      } else {
        await addEntry(uid, draft);
      }
      router.replace("/(tabs)/journal");
    } catch (err) {
      console.error(err);
      showAlert("Unable to save", "Please try again in a moment.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <SafeAreaView
      edges={["top", "bottom"]}
      style={{ flex: 1, backgroundColor: theme.background }}
    >
      {/* Header */}
      <View
        style={{
          flexDirection: "row",
          alignItems: "center",
          justifyContent: "space-between",
          paddingHorizontal: padH,
          paddingVertical: 12,
          borderBottomWidth: 1,
          borderBottomColor: theme.border,
          backgroundColor: theme.surface,
        }}
      >
        <TouchableOpacity
          onPress={() => router.replace("/(tabs)/journal")}
          activeOpacity={0.7}
        >
          <Ionicons name="chevron-back" size={22} color={theme.textSecondary} />
        </TouchableOpacity>
        <Text
          style={{
            fontSize: 16,
            fontFamily: "Oswald_700Bold",
            letterSpacing: 0.5,
            color: theme.text,
          }}
        >
          {id ? "Edit SOAP Entry" : "New SOAP Entry"}
        </Text>
        <TouchableOpacity
          onPress={handleSave}
          disabled={saving}
          activeOpacity={0.8}
          style={{
            paddingHorizontal: 12,
            paddingVertical: 6,
            borderRadius: 999,
            backgroundColor: saving ? theme.border : theme.primary,
          }}
        >
          {saving ? (
            <ActivityIndicator size="small" color={theme.primaryText} />
          ) : (
            <Text
              style={{
                color: theme.primaryText,
                fontSize: 12,
                fontWeight: "700",
                letterSpacing: 0.5,
              }}
            >
              Save
            </Text>
          )}
        </TouchableOpacity>
      </View>

      {/* Started from a calendar day: show which day this entry is for */}
      {!!draft.forDate && (
        <View
          style={{
            flexDirection: "row",
            alignItems: "center",
            gap: 8,
            paddingHorizontal: padH,
            paddingVertical: 10,
            borderBottomWidth: 1,
            borderBottomColor: theme.border,
          }}
        >
          <Ionicons
            name="calendar-outline"
            size={14}
            color={theme.textSecondary}
          />
          <Text style={{ fontSize: 13, color: theme.textSecondary }}>
            For {formatDateKey(draft.forDate)}
          </Text>
        </View>
      )}

      {/* Loading spinner while prefilling edit mode */}
      {loading && (
        <View
          style={{ flex: 1, alignItems: "center", justifyContent: "center" }}
        >
          <ActivityIndicator size="large" color={theme.textSecondary} />
        </View>
      )}

      {/* Body */}
      {!loading && (
        <ScrollView
          contentContainerStyle={{
            paddingHorizontal: padH,
            paddingVertical: 16,
            gap: 16,
          }}
        >
          {/* S — Scripture */}
          <View style={{ gap: 6 }}>
            <Text
              style={{
                fontSize: 12,
                color: theme.textSecondary,
                letterSpacing: 0.6,
                textTransform: "uppercase",
              }}
            >
              S — Scripture
            </Text>

            {/* Render each attached verse */}
            {draft.scripture.map((s) => (
              <View
                key={s.ref}
                style={{
                  borderWidth: 1,
                  borderLeftWidth: 3,
                  borderColor: theme.border,
                  borderLeftColor: theme.primary,
                  backgroundColor: theme.surface,
                  borderRadius: 10,
                  paddingHorizontal: 12,
                  paddingVertical: 10,
                  gap: 4,
                  flexDirection: "row",
                  alignItems: "flex-start",
                }}
              >
                <View style={{ flex: 1, gap: 4 }}>
                  <Text
                    style={{
                      fontSize: 11,
                      fontWeight: "700",
                      letterSpacing: 1.2,
                      textTransform: "uppercase",
                      color: theme.textSecondary,
                    }}
                  >
                    {s.ref}
                  </Text>
                  <Text
                    style={{
                      fontSize: 14,
                      lineHeight: 20,
                      fontStyle: "italic",
                      color: theme.text,
                    }}
                  >
                    {s.text}
                  </Text>
                </View>
                {/* Remove verse */}
                <TouchableOpacity
                  onPress={() =>
                    setDraft((prev) => ({
                      ...prev,
                      scripture: prev.scripture.filter((v) => v.ref !== s.ref),
                    }))
                  }
                  activeOpacity={0.7}
                  style={{ padding: 4 }}
                >
                  <Ionicons
                    name="close-circle"
                    size={18}
                    color={theme.textSecondary}
                  />
                </TouchableOpacity>
              </View>
            ))}

            {/* Add verse button — always visible so more can be attached */}
            <TouchableOpacity
              activeOpacity={0.8}
              onPress={() => router.push("/(tabs)/bible-browser")}
              style={{
                borderWidth: 1,
                borderStyle: "dashed",
                borderColor: theme.border,
                borderRadius: 10,
                paddingHorizontal: 12,
                paddingVertical: 10,
                flexDirection: "row",
                alignItems: "center",
                gap: 8,
              }}
            >
              <Ionicons
                name="add-circle-outline"
                size={16}
                color={theme.textSecondary}
              />
              <Text style={{ fontSize: 13, color: theme.textSecondary }}>
                {draft.scripture.length > 0
                  ? "Attach another verse"
                  : "Attach a verse from the Bible"}
              </Text>
            </TouchableOpacity>
          </View>

          <View style={{ gap: 6 }}>
            <Text
              style={{
                fontSize: 12,
                color: theme.textSecondary,
                letterSpacing: 0.6,
                textTransform: "uppercase",
              }}
            >
              O — Observation
            </Text>
            <TextInput
              style={{
                borderWidth: 1,
                borderColor: theme.border,
                backgroundColor: theme.surface,
                borderRadius: 10,
                paddingHorizontal: 12,
                paddingVertical: 10,
                color: theme.text,
                fontSize: 14,
                minHeight: 80,
                textAlignVertical: "top",
              }}
              multiline
              placeholder="What does the text say?"
              placeholderTextColor={theme.textSecondary}
              value={draft.observation}
              onChangeText={(text) => updateField("observation", text)}
            />
          </View>

          <View style={{ gap: 6 }}>
            <Text
              style={{
                fontSize: 12,
                color: theme.textSecondary,
                letterSpacing: 0.6,
                textTransform: "uppercase",
              }}
            >
              A — Application
            </Text>
            <TextInput
              style={{
                borderWidth: 1,
                borderColor: theme.border,
                backgroundColor: theme.surface,
                borderRadius: 10,
                paddingHorizontal: 12,
                paddingVertical: 10,
                color: theme.text,
                fontSize: 14,
                minHeight: 80,
                textAlignVertical: "top",
              }}
              multiline
              placeholder="How does this apply to your life today?"
              placeholderTextColor={theme.textSecondary}
              value={draft.application}
              onChangeText={(text) => updateField("application", text)}
            />
          </View>

          <View style={{ gap: 6 }}>
            <Text
              style={{
                fontSize: 12,
                color: theme.textSecondary,
                letterSpacing: 0.6,
                textTransform: "uppercase",
              }}
            >
              P — Prayer
            </Text>
            <TextInput
              style={{
                borderWidth: 1,
                borderColor: theme.border,
                backgroundColor: theme.surface,
                borderRadius: 10,
                paddingHorizontal: 12,
                paddingVertical: 10,
                color: theme.text,
                fontSize: 14,
                minHeight: 80,
                textAlignVertical: "top",
              }}
              multiline
              placeholder="Write your response to God…"
              placeholderTextColor={theme.textSecondary}
              value={draft.prayer}
              onChangeText={(text) => updateField("prayer", text)}
            />
          </View>

          <View style={{ gap: 6 }}>
            <Text
              style={{
                fontSize: 12,
                color: theme.textSecondary,
                letterSpacing: 0.6,
                textTransform: "uppercase",
              }}
            >
              Title
            </Text>
            <TextInput
              style={{
                borderWidth: 1,
                borderColor: theme.border,
                backgroundColor: theme.surface,
                borderRadius: 10,
                paddingHorizontal: 12,
                paddingVertical: 8,
                color: theme.text,
                fontSize: 14,
              }}
              placeholder="Give this entry a short title…"
              placeholderTextColor={theme.textSecondary}
              value={draft.title ?? ""}
              onChangeText={(text) => updateField("title", text)}
            />
          </View>
        </ScrollView>
      )}
    </SafeAreaView>
  );
}
