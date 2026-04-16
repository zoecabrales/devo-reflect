import { useAppTheme } from "@/src/contexts/ThemeContext";
import { Ionicons } from "@expo/vector-icons";
import { useState } from "react";
import { StyleSheet, Text, TouchableOpacity, View } from "react-native";

// ── Data ─────────────────────────────────────────────────────────────────────

interface Verse {
  ref: string;
  text: string;
}
interface Topic {
  id: string;
  label: string;
  icon: keyof typeof Ionicons.glyphMap;
  verses: Verse[];
}

const TOPICS: Topic[] = [
  {
    id: "joyful",
    label: "Joyful?",
    icon: "sunny-outline",
    verses: [
      {
        ref: "Philippians 4:4",
        text: "Rejoice in the Lord always; again I will say, rejoice.",
      },
      {
        ref: "Psalm 16:11",
        text: "In your presence there is fullness of joy; at your right hand are pleasures forevermore.",
      },
      { ref: "Nehemiah 8:10", text: "The joy of the Lord is your strength." },
      {
        ref: "Romans 15:13",
        text: "May the God of hope fill you with all joy and peace in believing, so that by the power of the Holy Spirit you may abound in hope.",
      },
      {
        ref: "Psalm 118:24",
        text: "This is the day that the Lord has made; let us rejoice and be glad in it.",
      },
    ],
  },
  {
    id: "depressed",
    label: "Depressed?",
    icon: "cloudy-night-outline",
    verses: [
      {
        ref: "Psalm 34:18",
        text: "The Lord is near to the brokenhearted and saves the crushed in spirit.",
      },
      {
        ref: "Matthew 11:28",
        text: "Come to me, all who labor and are heavy laden, and I will give you rest.",
      },
      {
        ref: "Isaiah 41:10",
        text: "Fear not, for I am with you; be not dismayed, for I am your God; I will strengthen you, I will help you, I will uphold you with my righteous right hand.",
      },
      {
        ref: "Psalm 23:4",
        text: "Even though I walk through the valley of the shadow of death, I will fear no evil, for you are with me; your rod and your staff, they comfort me.",
      },
      {
        ref: "2 Corinthians 4:17",
        text: "This light momentary affliction is preparing for us an eternal weight of glory beyond all comparison.",
      },
    ],
  },
  {
    id: "anxious",
    label: "Anxious?",
    icon: "pulse-outline",
    verses: [
      {
        ref: "Philippians 4:6–7",
        text: "Do not be anxious about anything, but in everything by prayer and supplication with thanksgiving let your requests be made known to God. And the peace of God, which surpasses all understanding, will guard your hearts and your minds in Christ Jesus.",
      },
      {
        ref: "Matthew 6:34",
        text: "Therefore do not be anxious about tomorrow, for tomorrow will be anxious for itself. Sufficient for the day is its own trouble.",
      },
      {
        ref: "1 Peter 5:7",
        text: "Casting all your anxieties on him, because he cares for you.",
      },
      {
        ref: "Isaiah 26:3",
        text: "You keep him in perfect peace whose mind is stayed on you, because he trusts in you.",
      },
      {
        ref: "John 14:27",
        text: "Peace I leave with you; my peace I give to you. Not as the world gives do I give to you. Let not your hearts be troubled, neither let them be afraid.",
      },
    ],
  },
];

// ── Component ─────────────────────────────────────────────────────────────────

export function TopicsWidget() {
  const { theme } = useAppTheme();
  const [expanded, setExpanded] = useState<string | null>(null);

  function toggleTopic(id: string) {
    setExpanded((prev) => (prev === id ? null : id));
  }

  return (
    <View
      style={[
        styles.card,
        { backgroundColor: theme.surface, borderColor: theme.border },
      ]}
    >
      {/* Widget header */}
      <View style={styles.widgetHeader}>
        <Ionicons name="heart-outline" size={13} color={theme.primary} />
        <Text style={[styles.widgetTitle, { color: theme.text }]}>Topics</Text>
      </View>

      {/* Topic rows */}
      {TOPICS.map((topic, idx) => {
        const isOpen = expanded === topic.id;
        return (
          <View key={topic.id}>
            {idx > 0 && (
              <View
                style={[styles.divider, { backgroundColor: theme.border }]}
              />
            )}

            {/* Row header — tap to toggle */}
            <TouchableOpacity
              style={styles.topicRow}
              onPress={() => toggleTopic(topic.id)}
              activeOpacity={0.7}
            >
              <Ionicons name={topic.icon} size={15} color={theme.primary} />
              <Text style={[styles.topicLabel, { color: theme.text }]}>
                {topic.label}
              </Text>
              <Ionicons
                name={isOpen ? "chevron-up" : "chevron-down"}
                size={13}
                color={theme.textSecondary}
              />
            </TouchableOpacity>

            {/* Expanded verse list */}
            {isOpen && (
              <View style={styles.verseList}>
                {topic.verses.map((v, vi) => (
                  <View
                    key={vi}
                    style={[
                      styles.verseItem,
                      vi < topic.verses.length - 1 && {
                        borderBottomWidth: StyleSheet.hairlineWidth,
                        borderBottomColor: theme.border,
                      },
                    ]}
                  >
                    <Text style={[styles.verseRef, { color: theme.primary }]}>
                      {v.ref}
                    </Text>
                    <Text
                      style={[styles.verseText, { color: theme.textSecondary }]}
                    >
                      {v.text}
                    </Text>
                  </View>
                ))}
              </View>
            )}
          </View>
        );
      })}
    </View>
  );
}

// ── Styles ────────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  card: {
    borderRadius: 12,
    borderWidth: 1,
    padding: 12,
  },
  widgetHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    marginBottom: 10,
  },
  widgetTitle: {
    fontSize: 13,
    fontFamily: "Oswald_700Bold",
    letterSpacing: 0.4,
  },
  divider: {
    height: StyleSheet.hairlineWidth,
    marginVertical: 1,
  },
  topicRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    paddingVertical: 8,
  },
  topicLabel: {
    flex: 1,
    fontSize: 13,
    fontWeight: "600",
    letterSpacing: 0.2,
  },
  verseList: {
    marginBottom: 4,
    marginLeft: 22,
  },
  verseItem: {
    paddingVertical: 7,
    gap: 3,
  },
  verseRef: {
    fontSize: 10,
    fontWeight: "700",
    letterSpacing: 0.8,
    textTransform: "uppercase",
  },
  verseText: {
    fontSize: 12,
    lineHeight: 17,
    letterSpacing: 0.1,
  },
});
