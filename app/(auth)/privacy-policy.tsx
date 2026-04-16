import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import {
    ScrollView,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

const EFFECTIVE_DATE = "April 16, 2026";
const CONTACT_EMAIL = "support@devoreflect.app";

function Section({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <View style={styles.section}>
      <Text style={styles.sectionTitle}>{title}</Text>
      {children}
    </View>
  );
}

function Body({ children }: { children: string }) {
  return <Text style={styles.body}>{children}</Text>;
}

function Bullet({ children }: { children: string }) {
  return (
    <View style={styles.bulletRow}>
      <Text style={styles.bulletDot}>•</Text>
      <Text style={styles.bulletText}>{children}</Text>
    </View>
  );
}

export default function PrivacyPolicy() {
  const router = useRouter();

  return (
    <SafeAreaView style={styles.container} edges={["top"]}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backBtn}
          onPress={() => router.back()}
          activeOpacity={0.7}
        >
          <Ionicons name="chevron-back" size={20} color="#111" />
        </TouchableOpacity>
        <View style={styles.headerText}>
          <Text style={styles.headerTitle}>Privacy Policy</Text>
          <Text style={styles.headerSub}>Effective {EFFECTIVE_DATE}</Text>
        </View>
      </View>

      <ScrollView
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        <Body>
          Welcome to Devo Reflect. We are committed to protecting your personal
          information and your right to privacy. This Privacy Policy explains
          what information we collect, how we use it, and what rights you have
          regarding your data.
        </Body>

        <Section title="1. Information We Collect">
          <Body>
            We collect the following information when you use Devo Reflect:
          </Body>
          <Bullet>
            Account information — your email address and display name when you
            register.
          </Bullet>
          <Bullet>
            User-generated content — journal entries, prayer requests, Bible
            bookmarks, verse highlights, and growth calendar entries that you
            create within the app.
          </Bullet>
          <Bullet>
            Reading position — the last Bible book, chapter, and verse you were
            reading, saved automatically to restore your place.
          </Bullet>
          <Body>
            We do not collect payment information, location data, or device
            identifiers beyond what is required for Firebase Authentication to
            function.
          </Body>
        </Section>

        <Section title="2. How We Use Your Information">
          <Body>
            Your information is used solely to provide and improve the Devo
            Reflect experience:
          </Body>
          <Bullet>
            To authenticate your identity and secure your account.
          </Bullet>
          <Bullet>
            To store and sync your devotional content (journals, prayers,
            bookmarks, highlights, growth calendar) across sessions.
          </Bullet>
          <Bullet>
            To restore your Bible reading position when you reopen the app.
          </Bullet>
          <Body>
            We do not use your data for advertising, profiling, or any purpose
            unrelated to the operation of this app.
          </Body>
        </Section>

        <Section title="3. Data Storage and Security">
          <Body>
            All user data is stored securely in Google Firebase (Firestore and
            Firebase Authentication), which provides industry-standard
            encryption in transit (TLS) and at rest. Your data is associated
            with your account and is not accessible to other users.
          </Body>
          <Body>
            While we take reasonable measures to protect your data, no method of
            transmission over the internet is 100% secure. We encourage you to
            use a strong, unique password for your account.
          </Body>
        </Section>

        <Section title="4. Data Sharing">
          <Body>
            We do not sell, trade, or rent your personal information to any
            third party. Your data is shared only with the following service
            provider solely to operate the app:
          </Body>
          <Bullet>
            Google Firebase — for authentication, database, and cloud storage
            services. Google's privacy policy applies to data processed by
            Firebase.
          </Bullet>
        </Section>

        <Section title="5. Your Rights">
          <Body>You have the right to:</Body>
          <Bullet>Access the personal data we hold about you.</Bullet>
          <Bullet>Correct inaccurate information in your profile.</Bullet>
          <Bullet>
            Delete your account and all associated data at any time from the
            Settings screen.
          </Bullet>
          <Bullet>Export your content before deleting your account.</Bullet>
        </Section>

        <Section title="6. Account Deletion">
          <Body>
            You can permanently delete your account and all associated data from
            Settings → Delete Account. This action is irreversible. All journal
            entries, prayer requests, bookmarks, highlights, and growth calendar
            data will be permanently removed from our servers.
          </Body>
        </Section>

        <Section title="7. Children's Privacy">
          <Body>
            Devo Reflect is not directed to children under the age of 13. We do
            not knowingly collect personal information from children. If you
            believe a child has provided us with personal information, please
            contact us and we will promptly delete it.
          </Body>
        </Section>

        <Section title="8. Changes to This Policy">
          <Body>
            We may update this Privacy Policy from time to time. When we do, we
            will revise the effective date at the top of this page. We encourage
            you to review this policy periodically. Continued use of the app
            after changes constitutes your acceptance of the updated policy.
          </Body>
        </Section>

        <Section title="9. Contact Us">
          <Body>
            If you have any questions or concerns about this Privacy Policy or
            how we handle your data, please contact us at:
          </Body>
          <Text style={styles.email}>{CONTACT_EMAIL}</Text>
        </Section>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#fff" },
  header: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingTop: 12,
    paddingBottom: 16,
    gap: 12,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: "#e5e5e5",
  },
  backBtn: {
    width: 36,
    height: 36,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: "#e5e5e5",
    alignItems: "center",
    justifyContent: "center",
  },
  headerText: { flex: 1 },
  headerTitle: {
    fontSize: 17,
    fontFamily: "Oswald_700Bold",
    color: "#111",
    letterSpacing: 0.4,
  },
  headerSub: { fontSize: 11, color: "#888", marginTop: 1 },
  content: { padding: 20, paddingBottom: 48, gap: 4 },
  section: { marginTop: 20, gap: 8 },
  sectionTitle: {
    fontSize: 14,
    fontWeight: "700",
    color: "#111",
    letterSpacing: 0.2,
    marginBottom: 2,
  },
  body: { fontSize: 14, lineHeight: 22, color: "#333" },
  bulletRow: { flexDirection: "row", gap: 8, paddingLeft: 4 },
  bulletDot: { fontSize: 14, color: "#555", marginTop: 1 },
  bulletText: { flex: 1, fontSize: 14, lineHeight: 22, color: "#333" },
  email: { fontSize: 14, color: "#2563eb", fontWeight: "600", marginTop: 4 },
});
