import { signInEmail, signUpEmail } from "@/src/services/auth";
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { useRef, useState } from "react";
import {
    ActivityIndicator,
    KeyboardAvoidingView,
    Platform,
    Pressable,
    ScrollView,
    Text,
    TextInput,
    useWindowDimensions,
    View,
} from "react-native";
import { styles } from "./AuthForm.styles";

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

/** Web screens at least this wide get the two-column (brand | form) layout. */
const WIDE_BREAKPOINT = 900;

type FieldErrors = {
  fullName: string;
  email: string;
  password: string;
  confirmPassword: string;
};

export default function AuthForm() {
  const router = useRouter();
  const { width } = useWindowDimensions();
  const isWide = Platform.OS === "web" && width >= WIDE_BREAKPOINT;
  const fullNameRef = useRef<import("react-native").TextInput>(null);
  const emailRef = useRef<import("react-native").TextInput>(null);
  const passwordRef = useRef<import("react-native").TextInput>(null);
  const confirmPasswordRef = useRef<import("react-native").TextInput>(null);
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
      case "auth/network-request-failed":
        setErrors((e) => ({
          ...e,
          password: "Network error. Please check your connection.",
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

  function toggleMode() {
    setIsLogin(!isLogin);
    setFullName("");
    setEmail("");
    setPassword("");
    setConfirmPassword("");
    setShowPassword(false);
    setShowConfirmPassword(false);
    clearErrors();
    setTimeout(() => emailRef.current?.focus(), 50);
  }

  const forgotPasswordLink = (
    <Pressable
      onPress={() => router.push("/(auth)/forgot-password")}
      accessibilityRole="button"
      accessibilityLabel="Forgot password"
    >
      <Text style={isWide ? styles.wideLink : styles.forgotText}>
        {isWide ? "Forgot Password" : "Forgot Password?"}
      </Text>
    </Pressable>
  );

  const legalFooter = (
    <Text style={[styles.legalText, isWide && styles.wideLegalText]}>
      By continuing, you agree to our{" "}
      <Text
        style={styles.legalLink}
        onPress={() => router.push("/(auth)/terms-and-conditions")}
      >
        Terms & Conditions
      </Text>{" "}
      and{" "}
      <Text
        style={styles.legalLink}
        onPress={() => router.push("/(auth)/privacy-policy")}
      >
        Privacy Policy
      </Text>
      .
    </Text>
  );

  const form = (
    <>
      {!isWide && <Text style={styles.title}>Devo Reflect</Text>}

      <Text style={isWide ? styles.wideHeading : styles.subtitle}>
        {isLogin ? "Welcome back" : "Create your account"}
      </Text>

      {!isLogin && (
        <View style={styles.fieldWrapper}>
          {isWide && <Text style={styles.label}>Full Name</Text>}
          {!!errors.fullName && (
            <Text style={styles.errorText}>{errors.fullName}</Text>
          )}
          <TextInput
            ref={fullNameRef}
            placeholder={isWide ? "Juan Dela Cruz" : "Full Name"}
            placeholderTextColor="#999"
            autoCapitalize="words"
            autoComplete="name"
            returnKeyType="next"
            onSubmitEditing={() => emailRef.current?.focus()}
            value={fullName}
            onChangeText={setFullName}
            style={[styles.input, !!errors.fullName && styles.inputError]}
          />
        </View>
      )}

      <View style={styles.fieldWrapper}>
        {isWide && <Text style={styles.label}>Email</Text>}
        {!!errors.email && <Text style={styles.errorText}>{errors.email}</Text>}
        <TextInput
          ref={emailRef}
          placeholder={isWide ? "you@example.com" : "Email"}
          placeholderTextColor="#999"
          autoCapitalize="none"
          keyboardType="email-address"
          autoComplete="email"
          returnKeyType="next"
          onSubmitEditing={() => passwordRef.current?.focus()}
          value={email}
          onChangeText={setEmail}
          style={[styles.input, !!errors.email && styles.inputError]}
        />
      </View>

      <View style={styles.fieldWrapper}>
        {isWide && <Text style={styles.label}>Password</Text>}
        {!!errors.password && (
          <Text style={styles.errorText}>{errors.password}</Text>
        )}
        <View style={styles.passwordInputWrapper}>
          <TextInput
            ref={passwordRef}
            placeholder="Password"
            placeholderTextColor="#999"
            secureTextEntry={!showPassword}
            autoComplete={isLogin ? "current-password" : "new-password"}
            returnKeyType={isLogin ? "done" : "next"}
            onSubmitEditing={
              isLogin ? handleSubmit : () => confirmPasswordRef.current?.focus()
            }
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
            accessibilityRole="button"
            accessibilityLabel={showPassword ? "Hide password" : "Show password"}
          >
            <Ionicons
              name={showPassword ? "eye-off-outline" : "eye-outline"}
              size={22}
              color="#888"
            />
          </Pressable>
        </View>
      </View>

      {isLogin && !isWide && forgotPasswordLink}

      {!isLogin && (
        <View style={styles.fieldWrapper}>
          {isWide && <Text style={styles.label}>Confirm Password</Text>}
          {!!errors.confirmPassword && (
            <Text style={styles.errorText}>{errors.confirmPassword}</Text>
          )}
          <View style={styles.passwordInputWrapper}>
            <TextInput
              ref={confirmPasswordRef}
              placeholder="Confirm Password"
              placeholderTextColor="#999"
              secureTextEntry={!showConfirmPassword}
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
              onPress={() => setShowConfirmPassword((prev) => !prev)}
              style={styles.eyeIcon}
              accessibilityRole="button"
              accessibilityLabel={
                showConfirmPassword
                  ? "Hide confirm password"
                  : "Show confirm password"
              }
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

      <Pressable
        onPress={handleSubmit}
        style={[styles.button, isWide && styles.wideButton]}
        accessibilityRole="button"
        accessibilityLabel={isLogin ? "Login" : "Sign Up"}
      >
        {loading ? (
          <ActivityIndicator color="#fff" />
        ) : (
          <Text style={styles.buttonText}>{isLogin ? "Login" : "Sign Up"}</Text>
        )}
      </Pressable>

      {isWide ? (
        // Wide layout: account switch on the left, forgot password on the right
        <View style={styles.wideLinksRow}>
          <Pressable
            onPress={toggleMode}
            accessibilityRole="button"
            accessibilityLabel={isLogin ? "Switch to Sign Up" : "Switch to Login"}
          >
            <Text style={styles.wideLink}>
              {isLogin ? "Not yet registered?" : "Already have an account?"}
            </Text>
          </Pressable>
          {isLogin && forgotPasswordLink}
        </View>
      ) : (
        <View style={styles.toggleRow}>
          <Text style={styles.toggleText}>
            {isLogin ? "Don't have an account? " : "Already have an account? "}
          </Text>
          <Pressable
            onPress={toggleMode}
            accessibilityRole="button"
            accessibilityLabel={isLogin ? "Switch to Sign Up" : "Switch to Login"}
          >
            <Text style={styles.toggleLink}>{isLogin ? "Sign Up" : "Login"}</Text>
          </Pressable>
        </View>
      )}
    </>
  );

  if (isWide) {
    return (
      <ScrollView
        style={styles.wideRoot}
        contentContainerStyle={styles.wideRootContent}
        keyboardShouldPersistTaps="handled"
      >
        {/* Compact group centred on the page: brand | short divider | form */}
        <View style={styles.wideInner}>
          <View style={styles.brandPanel}>
            <View style={styles.brandTile}>
              <Ionicons name="book" size={56} color="#111" />
            </View>
            <Text style={styles.brandTitle}>Devo Reflect</Text>
            <Text style={styles.brandTagline}>Read. Reflect. Pray.</Text>
          </View>

          <View style={styles.wideDivider} />

          <View style={styles.formColumn}>
            {form}
            {legalFooter}
          </View>
        </View>
      </ScrollView>
    );
  }

  return (
    <KeyboardAvoidingView style={{ flex: 1 }} behavior="padding">
      <ScrollView
        style={{ flex: 1 }}
        contentContainerStyle={styles.container}
        keyboardShouldPersistTaps="handled"
      >
        {form}
      </ScrollView>

      {/* Legal footer — pinned to bottom, outside the scroll area */}
      {legalFooter}
    </KeyboardAvoidingView>
  );
}
