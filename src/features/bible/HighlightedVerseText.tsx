import { Text } from "react-native";

/**
 * A verse's text with its highlight colour and underline, and any matches
 * of the chapter search marked in bold.
 */
export function HighlightedVerseText({
  text,
  query,
  bookmarkColor,
  underline,
  textStyle,
}: {
  text: string;
  query: string;
  bookmarkColor?: string;
  underline?: boolean;
  textStyle: object;
}) {
  const trimmed = query.trim();
  const bookmarkBg = bookmarkColor
    ? { backgroundColor: bookmarkColor + "99" }
    : {};
  const underlineStyle = underline
    ? { textDecorationLine: "underline" as const }
    : {};

  if (!trimmed) {
    return (
      <Text style={textStyle}>
        {bookmarkColor || underline ? (
          <Text style={[bookmarkBg, underlineStyle]}>{text}</Text>
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
              bookmarkBg,
              underlineStyle,
              { backgroundColor: "#FFD966CC", fontWeight: "700" },
            ]}
          >
            {part}
          </Text>
        ) : (
          <Text key={i} style={[bookmarkBg, underlineStyle]}>
            {part}
          </Text>
        ),
      )}
    </Text>
  );
}
