import { deleteAccount } from "@/src/services/auth";
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { useState } from "react";
import {
  ActivityIndicator,
  KeyboardAvoidingView,
  Pressable,
  ScrollView,
  Text,
  TextInput,
  View,
} from "react-native";
import { styles } from "./DeleteAccount.styles";

export default function DeleteAccount() {
  const router = useRouter();
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [passwordError, setPasswordError] = useState("");
  const [loading, setLoading] = useState(false);

  function validate(): boolean {
    if (!password) {
      setPasswordError("Password is required to confirm deletion.");
      return false;
    }
    setPasswordError("");
    return true;
  }

  async function handleDelete() {
    if (!validate()) return;
    setLoading(true);
    try {
      await deleteAccount(password);
      // Firebase deletes the user — session is cleared automatically.
      // Replace to sign-in so there's no back stack to return to.
      router.replace("/(auth)/sign-in");
    } catch (error: any) {
      const code = error?.code ?? "";
      if (
        code === "auth/wrong-password" ||
        code === "auth/invalid-credential"
      ) {
        setPasswordError("Incorrect password. Please try again.");
      } else if (code === "auth/too-many-requests") {
        setPasswordError(
          "Too many failed attempts. Please wait a moment and try again."
        );
      } else {
        setPasswordError("Something went wrong. Please try again.");
      }
    } finally {
      setLoading(false);
    }
  }

  return (
    <KeyboardAvoidingView style={{ flex: 1 }} behavior="padding">
      <ScrollView
        style={{ flex: 1 }}
        contentContainerStyle={styles.container}
        keyboardShouldPersistTaps="handled"
      >
        <Text style={styles.title}>Delete Account</Text>

        <View style={styles.warningBox}>
          <Text style={styles.warningTitle}>⚠ This action is irreversible</Text>
          <Text style={styles.warningText}>
            Deleting your account will permanently remove your credentials from
            our system. You will not be able to recover your account after this.
          </Text>
        </View>

        <View style={styles.fieldWrapper}>
          <Text style={styles.label}>
            Enter your password to confirm deletion
          </Text>
          {!!passwordError && (
            <Text style={styles.errorText}>{passwordError}</Text>
          )}
          <View style={styles.passwordInputWrapper}>
            <TextInput
              placeholder="Password"
              placeholderTextColor="#999"
              secureTextEntry={!showPassword}
              autoComplete="current-password"
              value={password}
              onChangeText={(text) => {
                setPassword(text);
                if (passwordError) setPasswordError("");
              }}
              style={[styles.input, !!passwordError && styles.inputError]}
            />
            <Pressable
              onPress={() => setShowPassword((p) => !p)}
              style={styles.eyeIcon}
            >
              <Ionicons
                name={showPassword ? "eye-off-outline" : "eye-outline"}
                size={22}
                color="#888"
              />
            </Pressable>
          </View>
        </View>

        <Pressable
          onPress={handleDelete}
          style={styles.deleteButton}
          disabled={loading}
        >
          {loading ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <Text style={styles.deleteButtonText}>Delete My Account</Text>
          )}
        </Pressable>

        <Pressable onPress={() => router.back()}>
          <Text style={styles.cancelLink}>Cancel</Text>
        </Pressable>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

