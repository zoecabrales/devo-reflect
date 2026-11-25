import {
  highlightShades,
  highlightTextShadow,
} from "@/src/utils/highlightStyle";
import { Platform, Text, TextStyle } from "react-native";

/** The highlight on the letters themselves (see utils/highlightStyle). */
function letterHighlight(color: string, darkPage: boolean): TextStyle {
  if (Platform.OS === "web") {
    // `textShadow` with several shadows is web-only, so it isn't in TextStyle
    return { textShadow: highlightTextShadow(color, darkPage) } as object;
  }
  // The phone apps allow one text shadow: show the coloured side only
  return {
    textShadowColor: highlightShades(color, darkPage).edge,
    textShadowOffset: { width: 0, height: 1.5 },
    textShadowRadius: 1,
  };
}

/**
 * A verse's text with its highlight colour and underline, and any matches
 * of the chapter search marked in bold.
 */
export function HighlightedVerseText({
  text,
  query,
  bookmarkColor,
  darkPage,
  underline,
  textStyle,
}: {
  text: string;
  query: string;
  bookmarkColor?: string;
  /** The reader's background is dark, which changes the highlight shades. */
  darkPage: boolean;
  underline?: boolean;
  textStyle: object;
}) {
  const trimmed = query.trim();
  const highlight = bookmarkColor
    ? letterHighlight(bookmarkColor, darkPage)
    : {};
  const underlineStyle = underline
    ? { textDecorationLine: "underline" as const }
    : {};

  if (!trimmed) {
    return (
      <Text style={textStyle}>
        {bookmarkColor || underline ? (
          <Text style={[highlight, underlineStyle]}>{text}</Text>
        ) : (
          text
        )}
      </Text>
    );
  }

  // Split text into alternating [non-match, match, non-match, …] segments
  const escaped = trimmed.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  const parts = text.split(new RegExp(`(${escaped})`, "gi"));

  return (
    <Text style={textStyle}>
      {parts.map((part, i) =>
        part.toLowerCase() === trimmed.toLowerCase() ? (
          <Text
            key={i}
            style={[
              highlight,
              underlineStyle,
              { backgroundColor: "#FFD966CC", fontWeight: "700" },
            ]}
          >
            {part}
          </Text>
        ) : (
          <Text key={i} style={[highlight, underlineStyle]}>
            {part}
          </Text>
        ),
      )}
    </Text>
  );
}
