import { signInEmail, signUpEmail } from "@/src/services/auth";
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { useRef, useState } from "react";
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

const PASSWORD_RULES = [
  { label: "At least 8 characters", test: (p: string) => p.length >= 8 },
  { label: "One uppercase letter", test: (p: string) => /[A-Z]/.test(p) },
  { label: "One number", test: (p: string) => /[0-9]/.test(p) },
  {
    label: "One special character",
    test: (p: string) => /[^A-Za-z0-9]/.test(p),
  },
];

type FieldErrors = {
  fullName: string;
  email: string;
  password: string;
  confirmPassword: string;
};

export default function AuthForm() {
  const router = useRouter();
  const emailRef = useRef<import("react-native").TextInput>(null);
  const [isLogin, setIsLogin] = useState(true);
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [errors, setErrors] = useState<FieldErrors>({
    fullName: "",
    email: "",
    password: "",
    confirmPassword: "",
  });

  function clearErrors() {
    setErrors({ fullName: "", email: "", password: "", confirmPassword: "" });
  }

  function validate(): boolean {
    const newErrors: FieldErrors = {
      fullName: "",
      email: "",
      password: "",
      confirmPassword: "",
    };
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
    } else if (!isLogin) {
      const failedRule = PASSWORD_RULES.find((r) => !r.test(password));
      if (failedRule) {
        newErrors.password = "Password does not meet all requirements.";
        valid = false;
      }
    } else if (password.length < 6) {
      newErrors.password = "Password must be at least 6 characters.";
      valid = false;
    }

    if (!isLogin) {
      if (!confirmPassword) {
        newErrors.confirmPassword = "Please confirm your password.";
        valid = false;
      } else if (confirmPassword !== password) {
        newErrors.confirmPassword = "Passwords do not match.";
        valid = false;
      }
    }

    setErrors(newErrors);
    return valid;
  }

  function handleFirebaseError(code: string) {
    switch (code) {
      case "auth/user-not-found":
      case "auth/invalid-email":
      case "auth/invalid-credential":
        setErrors((e) => ({
          ...e,
          email: "Email not registered or password is incorrect.",
        }));
        break;
      case "auth/wrong-password":
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
        const result = await signInEmail(email.trim(), password);
        if (!result.user.emailVerified) {
          router.replace("/(auth)/verify-email");
        } else {
          router.replace("/(tabs)/home");
        }
      } else {
        await signUpEmail(email.trim(), password, fullName);
        router.replace("/(auth)/verify-email");
      }
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
            ref={emailRef}
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

        {!isLogin && password.length > 0 && (
          <View style={styles.strengthList}>
            {PASSWORD_RULES.map((rule) => {
              const met = rule.test(password);
              return (
                <View key={rule.label} style={styles.strengthItem}>
                  <Ionicons
                    name={met ? "checkmark-circle" : "ellipse-outline"}
                    size={14}
                    color={met ? "#2f855a" : "#aaa"}
                  />
                  <Text
                    style={[
                      styles.strengthLabel,
                      met ? styles.strengthLabelMet : styles.strengthLabelUnmet,
                    ]}
                  >
                    {rule.label}
                  </Text>
                </View>
              );
            })}
          </View>
        )}

        {!isLogin && (
          <View style={styles.fieldWrapper}>
            {!!errors.confirmPassword && (
              <Text style={styles.errorText}>{errors.confirmPassword}</Text>
            )}
            <View style={styles.passwordInputWrapper}>
              <TextInput
                placeholder="Confirm Password"
                placeholderTextColor="#999"
                secureTextEntry={!showConfirmPassword}
                value={confirmPassword}
                onChangeText={setConfirmPassword}
                style={[
                  styles.input,
                  styles.passwordInput,
                  !!errors.confirmPassword && styles.inputError,
                ]}
              />
              <Pressable
                onPress={() => setShowConfirmPassword((prev) => !prev)}
                style={styles.eyeIcon}
              >
                <Ionicons
                  name={showConfirmPassword ? "eye-off-outline" : "eye-outline"}
                  size={22}
                  color="#888"
                />
              </Pressable>
            </View>
          </View>
        )}

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
            setFullName("");
            setEmail("");
            setPassword("");
            setConfirmPassword("");
            setShowPassword(false);
            setShowConfirmPassword(false);
            clearErrors();
            setTimeout(() => emailRef.current?.focus(), 50);
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
