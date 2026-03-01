import { changePassword, signOutUser } from "@/src/services/auth";
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { useRef, useState } from "react";
import {
    ActivityIndicator,
    KeyboardAvoidingView,
    Pressable,
    ScrollView,
    Text,
    TextInput,
    View,
} from "react-native";
import { styles } from "./ChangePassword.styles";

type FieldErrors = {
  currentPassword: string;
  newPassword: string;
  confirmPassword: string;
};

const emptyErrors = (): FieldErrors => ({
  currentPassword: "",
  newPassword: "",
  confirmPassword: "",
});

export default function ChangePassword() {
  const router = useRouter();
  const newPasswordRef = useRef<import("react-native").TextInput>(null);
  const confirmPasswordRef = useRef<import("react-native").TextInput>(null);
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showCurrent, setShowCurrent] = useState(false);
  const [showNew, setShowNew] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<FieldErrors>(emptyErrors());
  const [succeeded, setSucceeded] = useState(false);

  function validate(): boolean {
    const newErrors = emptyErrors();
    let valid = true;

    if (!currentPassword) {
      newErrors.currentPassword = "Current password is required.";
      valid = false;
    }
    if (!newPassword) {
      newErrors.newPassword = "New password is required.";
      valid = false;
    } else if (newPassword.length < 6) {
      newErrors.newPassword = "Password must be at least 6 characters.";
      valid = false;
    }
    if (!confirmPassword) {
      newErrors.confirmPassword = "Please confirm your new password.";
      valid = false;
    } else if (newPassword !== confirmPassword) {
      newErrors.confirmPassword = "Passwords do not match.";
      valid = false;
    }

    setErrors(newErrors);
    return valid;
  }

  async function handleSubmit() {
    if (!validate()) return;
    setLoading(true);
    try {
      await changePassword(currentPassword, newPassword);
      setSucceeded(true);
    } catch (error: any) {
      const code = error?.code ?? "";
      if (
        code === "auth/wrong-password" ||
        code === "auth/invalid-credential"
      ) {
        setErrors((e) => ({
          ...e,
          currentPassword: "Incorrect password. Please try again.",
        }));
      } else if (code === "auth/too-many-requests") {
        setErrors((e) => ({
          ...e,
          currentPassword:
            "Too many failed attempts. Please wait a moment and try again.",
        }));
      } else if (code === "auth/weak-password") {
        setErrors((e) => ({
          ...e,
          newPassword: "Password is too weak. Please choose a stronger one.",
        }));
      } else if (code === "auth/network-request-failed") {
        setErrors((e) => ({
          ...e,
          currentPassword: "Network error. Please check your connection.",
        }));
      } else if (code === "auth/requires-recent-login") {
        await signOutUser();
        router.replace("/(auth)/sign-in");
      } else {
        setErrors((e) => ({
          ...e,
          currentPassword: "Something went wrong. Please try again.",
        }));
      }
    } finally {
      setLoading(false);
    }
  }

  if (succeeded) {
    return (
      <KeyboardAvoidingView style={{ flex: 1 }} behavior="padding">
        <ScrollView
          style={{ flex: 1 }}
          contentContainerStyle={styles.container}
          keyboardShouldPersistTaps="handled"
        >
          <View style={styles.successContainer}>
            <Text style={styles.successTitle}>Password Updated</Text>
            <Text style={styles.successText}>
              Your password has been changed successfully.
            </Text>
            <Pressable
              onPress={() => router.back()}
              accessibilityRole="button"
              accessibilityLabel="Back to settings"
            >
              <Text style={styles.backLink}>Back to Settings</Text>
            </Pressable>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    );
  }

  return (
    <KeyboardAvoidingView style={{ flex: 1 }} behavior="padding">
      <ScrollView
        style={{ flex: 1 }}
        contentContainerStyle={styles.container}
        keyboardShouldPersistTaps="handled"
      >
        <Text style={styles.title}>Change Password</Text>
        <Text style={styles.subtitle}>
          Enter your current password, then choose a new one.
        </Text>

        {/* Current Password */}
        <View style={styles.fieldWrapper}>
          {!!errors.currentPassword && (
            <Text style={styles.errorText}>{errors.currentPassword}</Text>
          )}
          <View style={styles.passwordInputWrapper}>
            <TextInput
              placeholder="Current Password"
              placeholderTextColor="#999"
              secureTextEntry={!showCurrent}
              autoComplete="current-password"
              returnKeyType="next"
              onSubmitEditing={() => newPasswordRef.current?.focus()}
              value={currentPassword}
              onChangeText={setCurrentPassword}
              style={[
                styles.input,
                styles.passwordInput,
                !!errors.currentPassword && styles.inputError,
              ]}
            />
            <Pressable
              onPress={() => setShowCurrent((p) => !p)}
              style={styles.eyeIcon}
              accessibilityRole="button"
              accessibilityLabel={
                showCurrent ? "Hide current password" : "Show current password"
              }
            >
              <Ionicons
                name={showCurrent ? "eye-off-outline" : "eye-outline"}
                size={22}
                color="#888"
              />
            </Pressable>
          </View>
        </View>

        {/* New Password */}
        <View style={styles.fieldWrapper}>
          {!!errors.newPassword && (
            <Text style={styles.errorText}>{errors.newPassword}</Text>
          )}
          <View style={styles.passwordInputWrapper}>
            <TextInput
              ref={newPasswordRef}
              placeholder="New Password"
              placeholderTextColor="#999"
              secureTextEntry={!showNew}
              autoComplete="new-password"
              returnKeyType="next"
              onSubmitEditing={() => confirmPasswordRef.current?.focus()}
              value={newPassword}
              onChangeText={setNewPassword}
              style={[
                styles.input,
                styles.passwordInput,
                !!errors.newPassword && styles.inputError,
              ]}
            />
            <Pressable
              onPress={() => setShowNew((p) => !p)}
              style={styles.eyeIcon}
              accessibilityRole="button"
              accessibilityLabel={
                showNew ? "Hide new password" : "Show new password"
              }
            >
              <Ionicons
                name={showNew ? "eye-off-outline" : "eye-outline"}
                size={22}
                color="#888"
              />
            </Pressable>
          </View>
        </View>

        {/* Confirm New Password */}
        <View style={styles.fieldWrapper}>
          {!!errors.confirmPassword && (
            <Text style={styles.errorText}>{errors.confirmPassword}</Text>
          )}
          <View style={styles.passwordInputWrapper}>
            <TextInput
              ref={confirmPasswordRef}
              placeholder="Confirm New Password"
              placeholderTextColor="#999"
              secureTextEntry={!showConfirm}
              autoComplete="new-password"
              returnKeyType="done"
              onSubmitEditing={handleSubmit}
              value={confirmPassword}
              onChangeText={setConfirmPassword}
              style={[
                styles.input,
                styles.passwordInput,
                !!errors.confirmPassword && styles.inputError,
              ]}
            />
            <Pressable
              onPress={() => setShowConfirm((p) => !p)}
              style={styles.eyeIcon}
              accessibilityRole="button"
              accessibilityLabel={
                showConfirm ? "Hide confirm password" : "Show confirm password"
              }
            >
              <Ionicons
                name={showConfirm ? "eye-off-outline" : "eye-outline"}
                size={22}
                color="#888"
              />
            </Pressable>
          </View>
        </View>

        <Pressable
          onPress={handleSubmit}
          style={styles.button}
          disabled={loading}
          accessibilityRole="button"
          accessibilityLabel="Update password"
        >
          {loading ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <Text style={styles.buttonText}>Update Password</Text>
          )}
        </Pressable>

        <Pressable
          onPress={() => router.back()}
          accessibilityRole="button"
          accessibilityLabel="Cancel"
        >
          <Text style={styles.backLink}>Cancel</Text>
        </Pressable>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}
