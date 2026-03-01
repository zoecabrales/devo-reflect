import {
  reloadAndCheckVerified,
  resendVerificationEmail,
} from "@/src/services/auth";
import { useRouter } from "expo-router";
import { useEffect, useState } from "react";
import {
  ActivityIndicator,
  Pressable,
  Text,
  View,
} from "react-native";
import { auth } from "@/src/services/firebase";
import { styles } from "./VerifyEmail.styles";

const RESEND_COOLDOWN = 30;

export default function VerifyEmail() {
  const router = useRouter();
  const email = auth.currentUser?.email ?? "";

  const [checkingVerification, setCheckingVerification] = useState(false);
  const [resending, setResending] = useState(false);
  const [error, setError] = useState("");
  const [successMessage, setSuccessMessage] = useState("");
  const [cooldown, setCooldown] = useState(0);

  useEffect(() => {
    if (cooldown <= 0) return;
    const timer = setTimeout(() => setCooldown((c) => c - 1), 1000);
    return () => clearTimeout(timer);
  }, [cooldown]);

  async function handleCheckVerified() {
    setError("");
    setSuccessMessage("");
    setCheckingVerification(true);
    try {
      const verified = await reloadAndCheckVerified();
      if (verified) {
        router.replace("/(tabs)/home");
      } else {
        setError("Your email hasn't been verified yet. Please check your inbox.");
      }
    } catch {
      setError("Something went wrong. Please try again.");
    } finally {
      setCheckingVerification(false);
    }
  }

  async function handleResend() {
    setError("");
    setSuccessMessage("");
    setResending(true);
    try {
      await resendVerificationEmail();
      setSuccessMessage("Verification email resent! Check your inbox.");
      setCooldown(RESEND_COOLDOWN);
    } catch {
      setError("Could not resend the email. Please try again.");
    } finally {
      setResending(false);
    }
  }

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Verify your email</Text>

      <Text style={styles.subtitle}>
        We sent a verification link to{"\n"}
        <Text style={styles.email}>{email}</Text>
        {"\n\n"}Tap the link in the email, then come back and press the button below.
      </Text>

      {!!error && <Text style={styles.errorText}>{error}</Text>}
      {!!successMessage && <Text style={styles.successText}>{successMessage}</Text>}

      <Pressable onPress={handleCheckVerified} style={styles.button} disabled={checkingVerification}>
        {checkingVerification ? (
          <ActivityIndicator color="#fff" />
        ) : (
          <Text style={styles.buttonText}>I've Verified My Email</Text>
        )}
      </Pressable>

      <Pressable
        onPress={handleResend}
        style={[styles.resendButton, cooldown > 0 && styles.resendButtonDisabled]}
        disabled={resending || cooldown > 0}
      >
        {resending ? (
          <ActivityIndicator color="#111" />
        ) : (
          <Text style={[styles.resendButtonText, cooldown > 0 && styles.resendButtonTextDisabled]}>
            {cooldown > 0 ? `Resend Email (${cooldown}s)` : "Resend Email"}
          </Text>
        )}
      </Pressable>
    </View>
  );
}

