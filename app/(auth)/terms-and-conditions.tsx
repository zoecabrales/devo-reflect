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

export default function TermsAndConditions() {
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
          <Text style={styles.headerTitle}>Terms & Conditions</Text>
          <Text style={styles.headerSub}>Effective {EFFECTIVE_DATE}</Text>
        </View>
      </View>

      <ScrollView
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        <Body>
          Please read these Terms and Conditions carefully before using Devo
          Reflect. By creating an account or using the app, you agree to be
          bound by these terms. If you do not agree, please do not use the app.
        </Body>

        <Section title="1. Acceptance of Terms">
          <Body>
            By accessing or using Devo Reflect, you confirm that you are at
            least 13 years of age and agree to these Terms and Conditions and
            our Privacy Policy. If you are using the app on behalf of an
            organization, you represent that you have authority to bind that
            organization to these terms.
          </Body>
        </Section>

        <Section title="2. Description of Service">
          <Body>
            Devo Reflect is a personal devotional application that provides
            access to the Bible (American Standard Version), journaling, prayer
            tracking, bookmarks, verse highlights, and a growth calendar. The
            app is intended for personal spiritual growth and reflection.
          </Body>
        </Section>

        <Section title="3. User Accounts">
          <Body>You are responsible for:</Body>
          <Bullet>
            Maintaining the confidentiality of your account credentials.
          </Bullet>
          <Bullet>All activity that occurs under your account.</Bullet>
          <Bullet>
            Notifying us immediately of any unauthorized use of your account.
          </Bullet>
          <Body>
            We reserve the right to suspend or terminate accounts that violate
            these terms or that have been compromised.
          </Body>
        </Section>

        <Section title="4. User Content">
          <Body>
            You retain ownership of all content you create within Devo Reflect,
            including journal entries, prayer requests, and notes. By using the
            app, you grant us a limited license to store and display your
            content solely for the purpose of providing the service to you.
          </Body>
          <Body>
            You are solely responsible for the content you create. You agree not
            to enter content that is unlawful, harmful, or violates the rights
            of others.
          </Body>
        </Section>

        <Section title="5. Prohibited Uses">
          <Body>You agree not to:</Body>
          <Bullet>
            Use the app for any unlawful purpose or in violation of any laws.
          </Bullet>
          <Bullet>
            Attempt to gain unauthorized access to any part of the app or its
            systems.
          </Bullet>
          <Bullet>
            Reverse engineer, decompile, or disassemble any part of the app.
          </Bullet>
          <Bullet>
            Use the app to transmit spam, malware, or harmful content.
          </Bullet>
          <Bullet>Impersonate any person or entity.</Bullet>
        </Section>

        <Section title="6. Bible Content">
          <Body>
            The Bible text provided in Devo Reflect is the American Standard
            Version (ASV), which is in the public domain. All scripture
            references and verse data are provided for personal, non-commercial
            devotional use only.
          </Body>
        </Section>

        <Section title="7. Intellectual Property">
          <Body>
            All original content, design, graphics, and code within Devo Reflect
            — excluding the ASV Bible text and user-generated content — are
            owned by or licensed to us and are protected by applicable
            intellectual property laws. You may not copy, modify, or distribute
            any part of the app without our express written permission.
          </Body>
        </Section>

        <Section title="8. Disclaimer of Warranties">
          <Body>
            Devo Reflect is provided "as is" and "as available" without
            warranties of any kind, either express or implied. We do not warrant
            that the app will be uninterrupted, error-free, or free of viruses
            or other harmful components. Your use of the app is at your sole
            risk.
          </Body>
        </Section>

        <Section title="9. Limitation of Liability">
          <Body>
            To the fullest extent permitted by law, we shall not be liable for
            any indirect, incidental, special, consequential, or punitive
            damages arising from your use of or inability to use Devo Reflect,
            even if we have been advised of the possibility of such damages.
          </Body>
        </Section>

        <Section title="10. Termination">
          <Body>
            You may stop using the app and delete your account at any time from
            the Settings screen. We reserve the right to suspend or terminate
            your access to the app at our discretion, without notice, if we
            believe you have violated these terms.
          </Body>
        </Section>

        <Section title="11. Changes to These Terms">
          <Body>
            We may revise these Terms and Conditions at any time. When we do, we
            will update the effective date above. Your continued use of the app
            after any changes constitutes your acceptance of the new terms. We
            encourage you to review these terms periodically.
          </Body>
        </Section>

        <Section title="12. Contact Us">
          <Body>
            If you have any questions about these Terms and Conditions, please
            contact us at:
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
