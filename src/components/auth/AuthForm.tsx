import { signInEmail, signUpEmail } from "@/src/services/auth";
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
import { styles } from "./AuthForm.styles";

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

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
      case "auth/too-many-requests":
        setErrors((e) => ({
          ...e,
          password:
            "Too many failed attempts. Please wait a moment and try again.",
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
    <KeyboardAvoidingView style={{ flex: 1 }} behavior="padding">
      <ScrollView
        style={{ flex: 1 }}
        contentContainerStyle={styles.container}
        keyboardShouldPersistTaps="handled"
      >
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
              autoComplete="name"
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
            autoComplete="email"
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
              autoComplete={isLogin ? "current-password" : "new-password"}
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

        {isLogin && (
          <Pressable onPress={() => router.push("/(auth)/forgot-password")}>
            <Text style={styles.forgotText}>Forgot Password?</Text>
          </Pressable>
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
                autoComplete="new-password"
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
      </ScrollView>
    </KeyboardAvoidingView>
  );
}
