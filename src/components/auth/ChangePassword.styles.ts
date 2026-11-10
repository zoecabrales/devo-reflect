import { StyleSheet } from "react-native";

export const styles = StyleSheet.create({
  container: {
    flexGrow: 1,
    padding: 24,
    // Keep the form a readable width on tablets; phones are narrower anyway
    width: "100%",
    maxWidth: 520,
    alignSelf: "center",
    justifyContent: "center",
    gap: 16,
  },
  title: {
    fontSize: 32,
    fontFamily: "Oswald_700Bold",
    textAlign: "center",
  },
  subtitle: {
    textAlign: "center",
    opacity: 0.7,
    marginBottom: 8,
    lineHeight: 22,
  },
  fieldWrapper: {
    gap: 4,
  },
  passwordInputWrapper: {
    flexDirection: "row",
    alignItems: "center",
  },
  input: {
    borderWidth: 1,
    borderColor: "#ddd",
    borderRadius: 12,
    padding: 14,
    backgroundColor: "#fff",
    color: "#000",
  },
  passwordInput: {
    flex: 1,
  },
  inputError: {
    borderColor: "#e53e3e",
  },
  eyeIcon: {
    position: "absolute",
    right: 14,
  },
  errorText: {
    color: "#e53e3e",
    fontSize: 12,
  },
  button: {
    backgroundColor: "#111",
    padding: 16,
    borderRadius: 12,
    alignItems: "center",
    marginTop: 8,
  },
  buttonText: {
    color: "#fff",
    fontWeight: "600",
  },
  successContainer: {
    alignItems: "center",
    gap: 12,
  },
  successTitle: {
    fontSize: 32,
    fontFamily: "Oswald_700Bold",
    textAlign: "center",
  },
  successText: {
    textAlign: "center",
    opacity: 0.7,
    lineHeight: 22,
  },
  backLink: {
    textAlign: "center",
    marginTop: 8,
    color: "#555",
    fontSize: 14,
  },
});

