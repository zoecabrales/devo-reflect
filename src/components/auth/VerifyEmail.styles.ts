import { StyleSheet } from "react-native";

export const styles = StyleSheet.create({
  container: {
    flex: 1,
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
    marginBottom: 24,
    lineHeight: 22,
  },
  email: {
    fontWeight: "700",
    opacity: 1,
  },
  button: {
    backgroundColor: "#111",
    padding: 16,
    borderRadius: 12,
    alignItems: "center",
  },
  buttonText: {
    color: "#fff",
    fontWeight: "600",
  },
  resendButton: {
    padding: 16,
    borderRadius: 12,
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#111",
  },
  resendButtonText: {
    fontWeight: "600",
    color: "#111",
  },
  resendButtonDisabled: {
    borderColor: "#ccc",
  },
  resendButtonTextDisabled: {
    color: "#ccc",
  },
  errorText: {
    color: "#e53e3e",
    fontSize: 12,
    textAlign: "center",
  },
  successText: {
    color: "#2f855a",
    fontSize: 12,
    textAlign: "center",
  },
});

