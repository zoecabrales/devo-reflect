import { useAppTheme } from "@/src/contexts/ThemeContext";
import { auth } from "@/src/services/firebase";
import {
  addEntry,
  JournalEntry,
  JournalEntryDraft,
  updateEntry,
} from "@/src/services/journal";
import { Ionicons } from "@expo/vector-icons";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useEffect, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  ScrollView,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

type Params = { id?: string; ref?: string; text?: string };

export default function JournalCompose() {
  const { theme } = useAppTheme();
  const router = useRouter();
  const { id, ref, text } = useLocalSearchParams<Params>();

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
  });
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);

  // In the future we can prefill for edit using a loader service.
  useEffect(() => {
    if (!id) return;
    // For now, the list passes only id; full prefill could be added later.
  }, [id]);

  // Prefill scripture from a tapped verse
  useEffect(() => {
    if (!ref || !text) return;
    setDraft((prev) => ({
      ...prev,
      scripture:
        prev.scripture.length > 0
          ? prev.scripture
          : [
              {
                ref: String(ref),
                text: String(text),
              },
            ],
    }));
  }, [ref, text]);

  function updateField<K extends keyof JournalEntryDraft>(key: K, value: JournalEntryDraft[K]) {
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
      Alert.alert("Nothing to save", "Write at least one SOAP field before saving.");
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
      router.back();
    } catch (err) {
      console.error(err);
      Alert.alert("Unable to save", "Please try again in a moment.");
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
          paddingHorizontal: 20,
          paddingVertical: 12,
          borderBottomWidth: 1,
          borderBottomColor: theme.border,
          backgroundColor: theme.surface,
        }}
      >
        <TouchableOpacity onPress={() => router.back()} activeOpacity={0.7}>
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

      {/* Body */}
      <ScrollView
        contentContainerStyle={{
          paddingHorizontal: 20,
          paddingVertical: 16,
          gap: 16,
        }}
      >
        {/* Scripture reference selection */}
        <View style={{ gap: 6 }}>
          <Text
            style={{
              fontSize: 12,
              color: theme.textSecondary,
              letterSpacing: 0.6,
              textTransform: "uppercase",
            }}
          >
            Scripture
          </Text>
          {ref && text ? (
            <View
              style={{
                borderWidth: 1,
                borderColor: theme.border,
                backgroundColor: theme.surface,
                borderRadius: 10,
                paddingHorizontal: 12,
                paddingVertical: 10,
                gap: 4,
              }}
            >
              <Text
                style={{
                  fontSize: 11,
                  fontWeight: "700",
                  letterSpacing: 1.2,
                  textTransform: "uppercase",
                  color: theme.textSecondary,
                }}
              >
                {String(ref)}
              </Text>
              <Text
                style={{
                  fontSize: 14,
                  lineHeight: 20,
                  fontStyle: "italic",
                  color: theme.text,
                }}
              >
                {String(text)}
              </Text>
            </View>
          ) : (
            <TouchableOpacity
              activeOpacity={0.8}
              onPress={() => router.push("/(tabs)/bible-browser")}
              style={{
                borderWidth: 1,
                borderColor: theme.border,
                backgroundColor: theme.surface,
                borderRadius: 10,
                paddingHorizontal: 12,
                paddingVertical: 12,
                flexDirection: "row",
                alignItems: "center",
                justifyContent: "space-between",
                gap: 8,
              }}
            >
              <Text
                style={{
                  fontSize: 13,
                  color: theme.textSecondary,
                }}
              >
                Tap to choose a verse from the Bible
              </Text>
              <Ionicons
                name="book-outline"
                size={18}
                color={theme.textSecondary}
              />
            </TouchableOpacity>
          )}
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

        <View style={{ gap: 6 }}>
          <Text
            style={{
              fontSize: 12,
              color: theme.textSecondary,
              letterSpacing: 0.6,
              textTransform: "uppercase",
            }}
          >
            Observation
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
            Application
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
            Prayer
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
      </ScrollView>
    </SafeAreaView>
  );
}

