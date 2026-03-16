const API_KEY = process.env.EXPO_PUBLIC_GEMINI_API_KEY ?? "";
const API_URL =
  "https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent";

const SYSTEM_PROMPT =
  "You are a Bible study assistant. When a user shares a passage or asks a question about Scripture, provide clear and insightful responses covering historical context, verse-by-verse meaning, theological significance, and practical application. Ground your responses in the biblical text and established scholarship. Keep answers focused, warm, and accessible to everyday readers. Avoid speculation beyond what Scripture and well-established scholarship support.";

export interface GeminiMessage {
  role: "user" | "model";
  text: string;
}

/**
 * Sends a message to Gemini 1.5 Flash with the full conversation history.
 * Returns the assistant's reply as a plain string.
 */
export async function sendToGemini(
  history: GeminiMessage[],
  userMessage: string,
): Promise<string> {
  if (!API_KEY) {
    throw new Error(
      "Gemini API key is not configured. Add EXPO_PUBLIC_GEMINI_API_KEY to your .env file.",
    );
  }

  const contents = [
    ...history.map((m) => ({
      role: m.role,
      parts: [{ text: m.text }],
    })),
    { role: "user", parts: [{ text: userMessage }] },
  ];

  const body = {
    system_instruction: { parts: [{ text: SYSTEM_PROMPT }] },
    contents,
    generationConfig: {
      temperature: 0.7,
      maxOutputTokens: 1024,
    },
  };

  const response = await fetch(`${API_URL}?key=${API_KEY}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });

  if (!response.ok) {
    const err = await response.text();
    throw new Error(`Gemini API error ${response.status}: ${err}`);
  }

  const data = await response.json();
  const text: string =
    data?.candidates?.[0]?.content?.parts?.[0]?.text ?? "";

  if (!text) throw new Error("Empty response from Gemini.");
  return text.trim();
}

