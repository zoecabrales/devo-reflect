import { AppModal, SheetHandle } from "@/src/components";
import { Theme } from "@/src/constants/theme";
import { SHARE_NOTE_MAX, shareVerse } from "@/src/services/connections";
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { useState } from "react";
import {
  ActivityIndicator,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";

export interface ShareTarget {
  bookId: string;
  bookLabel: string;
  chapter: number;
  verses: number[];
  /** Reference shown to the user, e.g. "John 3:16–18". */
  ref: string;
  text: string;
  version: string;
}

type Status =
  | { kind: "idle" }
  | { kind: "sending" }
  | { kind: "done"; count: number }
  | { kind: "none" }
  | { kind: "error" };

/** Sheet for sharing a verse / passage with all of your Brethren. */
export function ShareWithConnectionsModal({
  target,
  theme,
  onClose,
}: {
  target: ShareTarget | null;
  theme: Theme;
  onClose: () => void;
}) {
  const router = useRouter();
  const [note, setNote] = useState("");
  const [status, setStatus] = useState<Status>({ kind: "idle" });

  function close() {
    setNote("");
    setStatus({ kind: "idle" });
    onClose();
  }

  async function handleShare() {
    if (!target) return;
    setStatus({ kind: "sending" });
    try {
      const count = await shareVerse({
        bookId: target.bookId,
        bookLabel: target.bookLabel,
        chapter: target.chapter,
        verse: target.verses[0],
        verses: target.verses.length > 1 ? target.verses : null,
        text: target.text,
        version: target.version,
        note,
      });
      setStatus(count > 0 ? { kind: "done", count } : { kind: "none" });
    } catch {
      setStatus({ kind: "error" });
    }
  }

  return (
    <AppModal
      visible={target !== null}
      onClose={close}
      animationType="slide"
      overlayStyle={styles.overlay}
      cardStyle={[
        styles.sheet,
        { backgroundColor: theme.surface, borderColor: theme.border },
      ]}
    >
      <SheetHandle style={styles.handle} />
      <Text style={[styles.title, { color: theme.text }]}>
        Share with Brethren
      </Text>
      <Text style={[styles.ref, { color: theme.text }]}>{target?.ref}</Text>
      <Text
        style={[styles.preview, { color: theme.textSecondary }]}
        numberOfLines={4}
      >
        {target?.text}
      </Text>

      {status.kind === "done" ? (
        <View style={styles.result}>
          <Ionicons name="checkmark-circle" size={22} color={theme.primary} />
          <Text style={[styles.resultText, { color: theme.text }]}>
            Shared with {status.count}{" "}
            {status.count === 1 ? "of your Brethren" : "Brethren"}.
          </Text>
        </View>
      ) : status.kind === "none" ? (
        <View style={styles.resultCol}>
          <Text style={[styles.resultText, { color: theme.text }]}>
            You haven&apos;t added any Brethren yet.
          </Text>
          <TouchableOpacity
            onPress={() => {
              close();
              router.push("/(tabs)/brethren");
            }}
            style={[styles.btn, { backgroundColor: theme.primary }]}
            activeOpacity={0.85}
          >
            <Text style={[styles.btnText, { color: theme.primaryText }]}>
              Add Brethren
            </Text>
          </TouchableOpacity>
        </View>
      ) : (
        <>
          <TextInput
            value={note}
            onChangeText={setNote}
            placeholder="Add a note (optional)"
            placeholderTextColor={theme.textSecondary}
            maxLength={SHARE_NOTE_MAX}
            multiline
            style={[
              styles.input,
              {
                color: theme.text,
                borderColor: theme.border,
                backgroundColor: theme.background,
              },
            ]}
          />
          {status.kind === "error" && (
            <Text style={styles.error}>
              Could not share. Please check your connection and try again.
            </Text>
          )}
          <TouchableOpacity
            onPress={handleShare}
            disabled={status.kind === "sending"}
            style={[styles.btn, { backgroundColor: theme.primary }]}
            activeOpacity={0.85}
          >
            {status.kind === "sending" ? (
              <ActivityIndicator color={theme.primaryText} />
            ) : (
              <>
                <Ionicons
                  name="people-outline"
                  size={17}
                  color={theme.primaryText}
                />
                <Text style={[styles.btnText, { color: theme.primaryText }]}>
                  Share
                </Text>
              </>
            )}
          </TouchableOpacity>
          <Text style={[styles.hint, { color: theme.textSecondary }]}>
            Everyone you&apos;re connected with will see it on their Home.
          </Text>
        </>
      )}
    </AppModal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    justifyContent: "flex-end",
  },
  sheet: {
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    borderTopWidth: 1,
    borderLeftWidth: 1,
    borderRightWidth: 1,
    paddingHorizontal: 24,
    paddingBottom: 36,
    paddingTop: 12,
  },
  handle: {
    width: 40,
    height: 4,
    borderRadius: 2,
    backgroundColor: "#888",
    alignSelf: "center",
    marginBottom: 16,
    opacity: 0.4,
  },
  title: {
    fontSize: 16,
    fontWeight: "700",
    textAlign: "center",
    marginBottom: 14,
  },
  ref: {
    fontSize: 14,
    fontWeight: "700",
    marginBottom: 4,
  },
  preview: {
    fontSize: 13,
    lineHeight: 19,
    marginBottom: 14,
  },
  input: {
    minHeight: 72,
    borderWidth: 1,
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 14,
    textAlignVertical: "top",
    marginBottom: 12,
  },
  btn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    paddingVertical: 14,
    borderRadius: 14,
  },
  btnText: {
    fontWeight: "700",
    fontSize: 15,
  },
  hint: {
    fontSize: 12,
    textAlign: "center",
    marginTop: 10,
  },
  error: {
    color: "#e53e3e",
    fontSize: 13,
    marginBottom: 10,
  },
  result: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    paddingVertical: 8,
  },
  resultCol: {
    gap: 12,
    paddingVertical: 4,
  },
  resultText: {
    fontSize: 14,
    flexShrink: 1,
  },
});
