import { signInEmail, signUpEmail } from "@/src/services/auth";
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { useState } from "react";
import {
    ActivityIndicator,
    KeyboardAvoidingView,
    Platform,
    Pressable,
    Text,
    TextInput,
    View,
} from "react-native";
import { styles } from "./AuthForm.styles";

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

type FieldErrors = {
  fullName: string;
  email: string;
  password: string;
};

export default function AuthForm() {
  const router = useRouter();
  const [isLogin, setIsLogin] = useState(true);
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [errors, setErrors] = useState<FieldErrors>({
    fullName: "",
    email: "",
    password: "",
  });

  function clearErrors() {
    setErrors({ fullName: "", email: "", password: "" });
  }

  function validate(): boolean {
    const newErrors: FieldErrors = { fullName: "", email: "", password: "" };
    let valid = true;

    if (!isLogin && !fullName.trim()) {
      newErrors.fullName = "Full name is required.";
      valid = false;
    }

    if (!email.trim()) {
      newErrors.email = "Email is required.";
      valid = false;
    } else if (!EMAIL_REGEX.test(email.trim())) {
      newErrors.email = "Please enter a valid email address.";
      valid = false;
    }

    if (!password) {
      newErrors.password = "Password is required.";
      valid = false;
    } else if (password.length < 6) {
      newErrors.password = "Password must be at least 6 characters.";
      valid = false;
    }

    setErrors(newErrors);
    return valid;
  }

  function handleFirebaseError(code: string) {
    switch (code) {
      case "auth/user-not-found":
      case "auth/invalid-email":
        setErrors((e) => ({
          ...e,
          email: "No account found with this email.",
        }));
        break;
      case "auth/wrong-password":
      case "auth/invalid-credential":
        setErrors((e) => ({
          ...e,
          password: "Incorrect password. Please try again.",
        }));
        break;
      case "auth/email-already-in-use":
        setErrors((e) => ({
          ...e,
          email: "This email is already registered.",
        }));
        break;
      default:
        setErrors((e) => ({
          ...e,
          password: "Something went wrong. Please try again.",
        }));
    }
  }

  async function handleSubmit() {
    clearErrors();
    if (!validate()) return;

    try {
      setLoading(true);
      if (isLogin) {
        await signInEmail(email.trim(), password);
      } else {
        await signUpEmail(email.trim(), password, fullName);
      }
      router.replace("/(tabs)/home");
    } catch (error: any) {
      handleFirebaseError(error?.code ?? "");
    } finally {
      setLoading(false);
    }
  }

  return (
    <KeyboardAvoidingView
      style={{ flex: 1 }}
      behavior={Platform.OS === "ios" ? "padding" : undefined}
    >
      <View style={styles.container}>
        <Text style={styles.title}>Devo Reflect</Text>

        <Text style={styles.subtitle}>
          {isLogin ? "Welcome back" : "Create your account"}
        </Text>

        {!isLogin && (
          <View style={styles.fieldWrapper}>
            {!!errors.fullName && (
              <Text style={styles.errorText}>{errors.fullName}</Text>
            )}
            <TextInput
              placeholder="Full Name"
              placeholderTextColor="#999"
              autoCapitalize="words"
              value={fullName}
              onChangeText={setFullName}
              style={[styles.input, !!errors.fullName && styles.inputError]}
            />
          </View>
        )}

        <View style={styles.fieldWrapper}>
          {!!errors.email && (
            <Text style={styles.errorText}>{errors.email}</Text>
          )}
          <TextInput
            placeholder="Email"
            placeholderTextColor="#999"
            autoCapitalize="none"
            keyboardType="email-address"
            value={email}
            onChangeText={setEmail}
            style={[styles.input, !!errors.email && styles.inputError]}
          />
        </View>

        <View style={styles.fieldWrapper}>
          {!!errors.password && (
            <Text style={styles.errorText}>{errors.password}</Text>
          )}
          <View style={styles.passwordInputWrapper}>
            <TextInput
              placeholder="Password"
              placeholderTextColor="#999"
              secureTextEntry={!showPassword}
              value={password}
              onChangeText={setPassword}
              style={[
                styles.input,
                styles.passwordInput,
                !!errors.password && styles.inputError,
              ]}
            />
            <Pressable
              onPress={() => setShowPassword((prev) => !prev)}
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

        <Pressable onPress={handleSubmit} style={styles.button}>
          {loading ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <Text style={styles.buttonText}>
              {isLogin ? "Login" : "Sign Up"}
            </Text>
          )}
        </Pressable>

        <Pressable
          onPress={() => {
            setIsLogin(!isLogin);
            clearErrors();
          }}
        >
          <Text style={styles.toggleText}>
            {isLogin
              ? "Don't have an account? Sign Up"
              : "Already have an account? Login"}
          </Text>
        </Pressable>
      </View>
    </KeyboardAvoidingView>
  );
}
