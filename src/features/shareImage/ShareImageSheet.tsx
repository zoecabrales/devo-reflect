import { AppModal, SheetHandle } from "@/src/components";
import { Theme } from "@/src/constants/theme";
import { Ionicons } from "@expo/vector-icons";
import { useEffect, useRef, useState } from "react";
import {
  ActivityIndicator,
  Image,
  ScrollView,
  Share,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  useWindowDimensions,
  View,
} from "react-native";
import {
  CAN_MAKE_IMAGES,
  downloadImage,
  IMAGE_SIZES,
  IMAGE_STYLES,
  imageFileName,
  ImageFormat,
  prefersShareSheet,
  ImageStyle,
  renderVerseImage,
  shareOrDownload,
  watermarkSite,
} from "./verseImage";

export interface ShareImageTarget {
  text: string;
  /** e.g. "John 3:16–18" */
  reference: string;
  /** e.g. "ASV" */
  version: string;
  /** Each verse when several are shared (shown with verse numbers). */
  verses?: { verse: number; text: string }[];
}

const NOTE_MAX = 120;

/** Caption that goes with the image (and the text-only share). */
const SUPERSCRIPT = "⁰¹²³⁴⁵⁶⁷⁸⁹";
const sup = (n: number) =>
  String(n)
    .split("")
    .map((d) => SUPERSCRIPT[Number(d)])
    .join("");

/** The passage as text, with verse numbers when there are several verses. */
function passageText(t: ShareImageTarget) {
  if (!t.verses || t.verses.length < 2) return t.text;
  return t.verses.map((v) => `${sup(v.verse)} ${v.text.trim()}`).join(" ");
}

function captionFor(t: ShareImageTarget) {
  const site = watermarkSite();
  return `${t.reference} (${t.version}) · shared from Devo Reflect${site ? ` · ${site}` : ""}`;
}

/**
 * Sheet to share a verse as an image (with a Devo Reflect watermark) or as
 * text. Preview, square / story size, three styles and an optional line.
 */
export function ShareImageSheet({
  target,
  theme,
  onClose,
}: {
  target: ShareImageTarget | null;
  theme: Theme;
  onClose: () => void;
}) {
  const [format, setFormat] = useState<ImageFormat>("square");
  const [style, setStyle] = useState<ImageStyle>("dark");
  const [note, setNote] = useState("");
  const [preview, setPreview] = useState<{
    url: string;
    blob: Blob;
    truncated: boolean;
  } | null>(null);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const { height: windowHeight } = useWindowDimensions();
  const renderId = useRef(0);

  // Redraw the preview when anything changes (the note after a short pause)
  useEffect(() => {
    if (!target || !CAN_MAKE_IMAGES) return;
    const id = ++renderId.current;
    const t = setTimeout(async () => {
      try {
        const { blob, truncated } = await renderVerseImage({
          text: target.text,
          verses: target.verses,
          reference: target.reference,
          version: target.version,
          note,
          format,
          style,
        });
        if (id !== renderId.current) return;
        const url = URL.createObjectURL(blob);
        setPreview((prev) => {
          if (prev) URL.revokeObjectURL(prev.url);
          return { url, blob, truncated };
        });
      } catch {
        if (id === renderId.current) setMessage("Could not create the image.");
      }
    }, 250);
    return () => clearTimeout(t);
  }, [target, format, style, note]);

  function close() {
    if (preview) URL.revokeObjectURL(preview.url);
    setPreview(null);
    setNote("");
    setMessage(null);
    onClose();
  }

  async function handleShare() {
    if (!target || !preview) return;
    setBusy(true);
    setMessage(null);
    try {
      const result = await shareOrDownload(
        preview.blob,
        imageFileName(target.reference),
        captionFor(target),
      );
      if (result === "downloaded") {
        setMessage(
          "Image saved to your downloads. Upload it to Facebook, Instagram or TikTok from there, or open Devo Reflect on your phone to share it directly.",
        );
      } else if (result === "shared") {
        close();
      }
    } finally {
      setBusy(false);
    }
  }

  function handleDownload() {
    if (!target || !preview) return;
    downloadImage(preview.blob, imageFileName(target.reference));
    setMessage("Image saved to your downloads.");
  }

  async function handleShareText() {
    if (!target) return;
    await Share.share({
      message: `"${passageText(target)}"\n\n— ${captionFor(target)}`,
    });
  }

  // Phones / tablets share; computers download (see prefersShareSheet)
  const shareSheet = prefersShareSheet();
  const size = IMAGE_SIZES[format];
  // Keep the preview within the sheet on short screens
  const previewH = Math.min(format === "story" ? 360 : 280, windowHeight * 0.38);
  const previewW = (previewH * size.w) / size.h;

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
      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.content}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.header}>
          <Text style={[styles.title, { color: theme.text }]}>
            Share {target?.reference}
          </Text>
          <TouchableOpacity
            onPress={close}
            hitSlop={10}
            accessibilityRole="button"
            accessibilityLabel="Close"
            activeOpacity={0.7}
          >
            <Ionicons name="close" size={22} color={theme.textSecondary} />
          </TouchableOpacity>
        </View>

        {CAN_MAKE_IMAGES ? (
          <>
            {/* Preview */}
            <View style={[styles.previewWrap, { height: previewH }]}>
              {preview ? (
                <Image
                  source={{ uri: preview.url }}
                  style={[
                    styles.preview,
                    { width: previewW, height: previewH, borderColor: theme.border },
                  ]}
                  accessibilityLabel="Preview of the image to share"
                />
              ) : (
                <ActivityIndicator color={theme.textSecondary} />
              )}
            </View>
            {preview?.truncated && (
              <Text style={[styles.hint, { color: theme.textSecondary }]}>
                {format === "square"
                  ? "This passage is too long to fit, so it ends with “…”. Try Story for more room, or select fewer verses."
                  : "This passage is too long to fit, so it ends with “…”. Select fewer verses to show it all."}
              </Text>
            )}

            {/* Size */}
            <View style={styles.row}>
              {(["square", "story"] as ImageFormat[]).map((f) => {
                const on = format === f;
                return (
                  <TouchableOpacity
                    key={f}
                    onPress={() => setFormat(f)}
                    style={[
                      styles.choice,
                      {
                        borderColor: on ? theme.primary : theme.border,
                        backgroundColor: on ? theme.primary : "transparent",
                      },
                    ]}
                    accessibilityRole="button"
                    accessibilityState={{ selected: on }}
                    activeOpacity={0.8}
                  >
                    <Ionicons
                      name={f === "square" ? "square-outline" : "phone-portrait-outline"}
                      size={15}
                      color={on ? theme.primaryText : theme.text}
                    />
                    <Text
                      style={[
                        styles.choiceText,
                        { color: on ? theme.primaryText : theme.text },
                      ]}
                    >
                      {f === "square" ? "Post" : "Story"}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>

            {/* Style */}
            <View style={styles.row}>
              {(Object.keys(IMAGE_STYLES) as ImageStyle[]).map((k) => {
                const st = IMAGE_STYLES[k];
                const on = style === k;
                return (
                  <TouchableOpacity
                    key={k}
                    onPress={() => setStyle(k)}
                    style={[
                      styles.choice,
                      { borderColor: on ? theme.primary : theme.border },
                    ]}
                    accessibilityRole="button"
                    accessibilityState={{ selected: on }}
                    activeOpacity={0.8}
                  >
                    <View
                      style={[
                        styles.swatch,
                        { backgroundColor: st.bg[0], borderColor: theme.border },
                      ]}
                    />
                    <Text style={[styles.choiceText, { color: theme.text }]}>
                      {st.label}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>

            {/* Personal line */}
            <TextInput
              value={note}
              onChangeText={setNote}
              placeholder="Add a line (optional), e.g. This carried me today"
              placeholderTextColor={theme.textSecondary}
              maxLength={NOTE_MAX}
              style={[
                styles.input,
                {
                  color: theme.text,
                  borderColor: theme.border,
                  backgroundColor: theme.background,
                },
              ]}
            />

            {message && (
              <Text style={[styles.message, { color: theme.textSecondary }]}>
                {message}
              </Text>
            )}

            <TouchableOpacity
              onPress={handleShare}
              disabled={!preview || busy}
              style={[
                styles.btn,
                { backgroundColor: theme.primary },
                (!preview || busy) && styles.disabled,
              ]}
              activeOpacity={0.85}
            >
              {busy ? (
                <ActivityIndicator color={theme.primaryText} />
              ) : (
                <>
                  <Ionicons
                    name={shareSheet ? "share-social-outline" : "download-outline"}
                    size={18}
                    color={theme.primaryText}
                  />
                  <Text style={[styles.btnText, { color: theme.primaryText }]}>
                    {shareSheet ? "Share Image" : "Download Image"}
                  </Text>
                </>
              )}
            </TouchableOpacity>
            <View style={styles.row}>
              {shareSheet && (
              <TouchableOpacity
                onPress={handleDownload}
                disabled={!preview}
                style={[
                  styles.btn,
                  styles.btnFlex,
                  styles.btnOutline,
                  { borderColor: theme.border },
                ]}
                activeOpacity={0.85}
              >
                <Ionicons name="download-outline" size={17} color={theme.text} />
                <Text style={[styles.btnText, { color: theme.text }]}>
                  Download
                </Text>
              </TouchableOpacity>
              )}
              <TouchableOpacity
                onPress={handleShareText}
                style={[
                  styles.btn,
                  styles.btnFlex,
                  styles.btnOutline,
                  { borderColor: theme.border },
                ]}
                activeOpacity={0.85}
              >
                <Ionicons name="text-outline" size={17} color={theme.text} />
                <Text style={[styles.btnText, { color: theme.text }]}>
                  Share as Text
                </Text>
              </TouchableOpacity>
            </View>
            <Text style={[styles.hint, { color: theme.textSecondary }]}>
              {shareSheet
                ? "Pick Facebook, Instagram, TikTok or any app to post it."
                : "The image downloads so you can upload it to Facebook, Instagram or TikTok."}
            </Text>
          </>
        ) : (
          // Native app: images come later; text sharing works everywhere
          <TouchableOpacity
            onPress={handleShareText}
            style={[styles.btn, { backgroundColor: theme.primary }]}
            activeOpacity={0.85}
          >
            <Ionicons name="share-outline" size={18} color={theme.primaryText} />
            <Text style={[styles.btnText, { color: theme.primaryText }]}>
              Share Verse
            </Text>
          </TouchableOpacity>
        )}
      </ScrollView>
    </AppModal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    justifyContent: "flex-end",
    backgroundColor: "rgba(0,0,0,0.45)",
  },
  sheet: {
    maxHeight: "92%",
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    borderTopWidth: 1,
    borderLeftWidth: 1,
    borderRightWidth: 1,
    paddingTop: 12,
  },
  handle: {
    width: 40,
    height: 4,
    borderRadius: 2,
    backgroundColor: "#888",
    alignSelf: "center",
    marginBottom: 8,
    opacity: 0.4,
  },
  scroll: { flexGrow: 0 },
  content: { paddingHorizontal: 22, paddingTop: 4, paddingBottom: 28, gap: 12 },
  header: { flexDirection: "row", alignItems: "center", gap: 12 },
  title: { flex: 1, fontSize: 16, fontWeight: "700" },
  previewWrap: { alignItems: "center", justifyContent: "center" },
  preview: { borderRadius: 10, borderWidth: 1 },
  row: { flexDirection: "row", gap: 8 },
  choice: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
    borderWidth: 1,
    borderRadius: 10,
    paddingVertical: 9,
  },
  choiceText: { fontSize: 13, fontWeight: "600" },
  swatch: { width: 14, height: 14, borderRadius: 7, borderWidth: 1 },
  input: {
    minHeight: 42,
    borderWidth: 1,
    borderRadius: 10,
    paddingHorizontal: 12,
    fontSize: 14,
  },
  message: { fontSize: 12, lineHeight: 17 },
  btn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    borderRadius: 12,
    paddingVertical: 13,
  },
  btnFlex: { flex: 1 },
  btnOutline: { borderWidth: 1 },
  btnText: { fontSize: 14, fontWeight: "700" },
  disabled: { opacity: 0.5 },
  hint: { fontSize: 11, lineHeight: 16, textAlign: "center" },
});
