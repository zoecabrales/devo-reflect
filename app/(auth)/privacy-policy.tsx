import { BRETHREN_ENABLED } from "@/src/constants/features";
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

// Update when the policy's wording changes. The Brethren parts only show
// while that feature is switched on, so update the date again on the day
// Brethren is switched on in production.
const EFFECTIVE_DATE = "November 13, 2026";
const CONTACT_EMAIL = "jirehzoe@gmail.com";

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

function Body({ children }: { children: React.ReactNode }) {
  return <Text style={styles.body}>{children}</Text>;
}

function Bullet({ children }: { children: React.ReactNode }) {
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
            Content you create — journal entries, prayer requests, Bible
            bookmarks, growth calendar entries, reading plan progress, and
            memory verses. These are stored in your account so they are
            available whenever you sign in.
          </Bullet>
          <Bullet>
            Information kept only on your device — verse highlights,
            underlines, and your last reading position (book and chapter).
            These are saved in your browser or phone and are not uploaded to
            our servers.
          </Bullet>
          {BRETHREN_ENABLED && (
            <Bullet>
              Brethren — if you use this feature, the email addresses you send
              Brethren requests to, the people you connect with, and the verses
              and notes you choose to share with them.
            </Bullet>
          )}
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
            To store your devotional content (journals, prayers, bookmarks,
            growth calendar, reading plans, memory verses) so it is there each
            time you sign in.
          </Bullet>
          <Bullet>
            To restore your Bible reading position when you reopen the app.
          </Bullet>
          {BRETHREN_ENABLED && (
            <Bullet>
              To deliver Brethren requests to the email address you enter, and
              to show the verses you share to the people you are connected
              with.
            </Bullet>
          )}
          <Body>
            We do not use your data for advertising, profiling, or any purpose
            unrelated to the operation of this app.
          </Body>
        </Section>

        <Section title="3. Data Storage and Security">
          <Body>
            Account data and the content you create are stored securely in
            Google Firebase (Firestore and Firebase Authentication), which
            provides industry-standard encryption in transit (TLS) and at rest.
            Your data is associated with your account and is not accessible to
            other users
            {BRETHREN_ENABLED
              ? ", except what you choose to share through Brethren (see section 4)."
              : "."}
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
            services. Google&apos;s privacy policy applies to data processed by
            Firebase.
          </Bullet>
          {BRETHREN_ENABLED && (
            <>
              <Body>
                Sharing with other users happens only through Brethren, and
                only when you choose to:
              </Body>
              <Bullet>
                When you send a Brethren request, the person who owns that
                email address sees your display name and email address. They
                can accept or decline it. We do not tell you whether an email
                address has a Devo Reflect account.
              </Bullet>
              <Bullet>
                Once a request is accepted, you and that person see each
                other&apos;s display names and the verses and notes each of you
                shares with Brethren.
              </Bullet>
              <Bullet>
                A shared verse is visible to the people you are connected with
                at the time you share it. You can delete a shared verse at any
                time, and removing a connection stops you both from seeing each
                other&apos;s shared verses.
              </Bullet>
              <Bullet>
                Your journal entries, prayer requests, bookmarks, highlights,
                reading plans, and memory verses are never visible to your
                Brethren.
              </Bullet>
            </>
          )}
        </Section>

        <Section title="5. Your Rights">
          <Body>You have the right to:</Body>
          <Bullet>Access the personal data we hold about you.</Bullet>
          <Bullet>Correct inaccurate information in your profile.</Bullet>
          <Bullet>
            Delete your account and all associated data at any time from the
            Settings screen.
          </Bullet>
          <Bullet>
            Request a copy of your data by contacting us at the address below.
          </Bullet>
        </Section>

        <Section title="6. Account Deletion">
          <Body>
            You can permanently delete your account and all associated data from
            Settings → Delete Account. This action is irreversible. Your journal
            entries, prayer requests, bookmarks, growth calendar, reading plan
            progress, and memory verses are permanently removed from our
            servers, and the highlights, underlines, and reading position saved
            on that device are cleared.
          </Body>
          {BRETHREN_ENABLED && (
            <Body>
              Your Brethren requests, connections, and shared verses are also
              deleted, and you are removed from verses others have shared with
              you.
            </Body>
          )}
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
