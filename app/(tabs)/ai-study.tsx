import { useAppTheme } from "@/src/contexts/ThemeContext";
import { GeminiMessage, sendToGemini } from "@/src/services/gemini";
import { TAB_ACTIVE_COLOR } from "@/src/constants/theme";
import { Ionicons } from "@expo/vector-icons";
import { useRef, useState } from "react";
import {
  FlatList,
  KeyboardAvoidingView,
  Platform,
  SafeAreaView,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { styles } from "./ai-study.styles";

interface Message {
  id: string;
  role: "user" | "ai";
  text: string;
}

const QUICK_PROMPTS = [
  "Explain John 3:16 in context",
  "What is the Sermon on the Mount about?",
  "How does Psalm 23 connect to the New Testament?",
  "What does grace mean in the Bible?",
  "Explain the historical background of the book of Job",
];

export default function AiStudy() {
  const { theme } = useAppTheme();
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const listRef = useRef<FlatList>(null);

  const historyFromMessages = (msgs: Message[]): GeminiMessage[] =>
    msgs.map((m) => ({ role: m.role === "user" ? "user" : "model", text: m.text }));

  async function send(text: string) {
    const trimmed = text.trim();
    if (!trimmed || loading) return;

    const userMsg: Message = { id: Date.now().toString(), role: "user", text: trimmed };
    const next = [...messages, userMsg];
    setMessages(next);
    setInput("");
    setLoading(true);

    setTimeout(() => listRef.current?.scrollToEnd({ animated: true }), 100);

    try {
      const reply = await sendToGemini(historyFromMessages(messages), trimmed);
      setMessages([...next, { id: Date.now().toString() + "_ai", role: "ai", text: reply }]);
    } catch (e: any) {
      setMessages([
        ...next,
        {
          id: Date.now().toString() + "_err",
          role: "ai",
          text: "Something went wrong. Please check your API key or try again.",
        },
      ]);
    } finally {
      setLoading(false);
      setTimeout(() => listRef.current?.scrollToEnd({ animated: true }), 100);
    }
  }

  function renderMessage({ item }: { item: Message }) {
    const isUser = item.role === "user";
    return (
      <View style={[styles.messageRow, isUser ? styles.messageRowUser : styles.messageRowAi]}>
        <View
          style={[
            styles.bubble,
            isUser
              ? [styles.bubbleUser, { backgroundColor: theme.primary }]
              : [styles.bubbleAi, { backgroundColor: theme.surface, borderColor: theme.border }],
          ]}
        >
          <Text style={[styles.bubbleText, { color: isUser ? theme.primaryText : theme.text }]}>
            {item.text}
          </Text>
        </View>
      </View>
    );
  }

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.background }]}>
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        keyboardVerticalOffset={Platform.OS === "ios" ? 0 : 20}
      >
        {/* Header */}
        <View style={styles.header}>
          <Text style={[styles.headerTitle, { color: theme.text }]}>AI Bible Study</Text>
          <Text style={[styles.headerSubtitle, { color: theme.textSecondary }]}>
            Ask about any passage, topic, or biblical theme
          </Text>
        </View>

        {/* Messages or Empty State */}
        {messages.length === 0 && !loading ? (
          <View style={styles.emptyState}>
            <Ionicons name="sparkles" size={40} color={TAB_ACTIVE_COLOR} />
            <Text style={[styles.emptyTitle, { color: theme.text }]}>Start a Bible Study</Text>
            <Text style={[styles.emptySubtitle, { color: theme.textSecondary }]}>
              Ask a question or tap one of the prompts below to get started.
            </Text>
            <View style={styles.promptGrid}>
              {QUICK_PROMPTS.map((p) => (
                <TouchableOpacity
                  key={p}
                  style={[styles.promptChip, { borderColor: theme.border, backgroundColor: theme.surface }]}
                  onPress={() => send(p)}
                  activeOpacity={0.7}
                >
                  <Text style={[styles.promptChipText, { color: theme.textSecondary }]}>{p}</Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>
        ) : (
          <FlatList
            ref={listRef}
            data={messages}
            keyExtractor={(item) => item.id}
            renderItem={renderMessage}
            style={styles.messageList}
            contentContainerStyle={styles.messageListContent}
            onContentSizeChange={() => listRef.current?.scrollToEnd({ animated: false })}
          />
        )}

        {/* Typing indicator */}
        {loading && (
          <View style={styles.typingRow}>
            <View style={[styles.typingBubble, { backgroundColor: theme.surface, borderColor: theme.border }]}>
              <Text style={[styles.typingText, { color: theme.textSecondary }]}>Studying Scripture...</Text>
            </View>
          </View>
        )}

        {/* Input Bar */}
        <View style={[styles.inputBar, { borderTopColor: theme.border, backgroundColor: theme.background }]}>
          <TextInput
            style={[styles.textInput, { backgroundColor: theme.surface, borderColor: theme.border, color: theme.text }]}
            placeholder="Ask about a passage or topic..."
            placeholderTextColor={theme.placeholder}
            value={input}
            onChangeText={setInput}
            multiline
            returnKeyType="default"
          />
          <TouchableOpacity
            style={[styles.sendBtn, { backgroundColor: input.trim() && !loading ? TAB_ACTIVE_COLOR : theme.border }]}
            onPress={() => send(input)}
            activeOpacity={0.8}
            disabled={!input.trim() || loading}
          >
            <Ionicons name="arrow-up" size={20} color="#fff" />
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

