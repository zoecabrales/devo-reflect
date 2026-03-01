import { StyleSheet } from "react-native";

export const styles = StyleSheet.create({
  container: {
    flexGrow: 1,
    padding: 24,
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
  fieldWrapper: {
    gap: 4,
  },
  input: {
    borderWidth: 1,
    borderColor: "#ddd",
    borderRadius: 12,
    padding: 14,
    backgroundColor: "#fff",
    color: "#000",
  },
  inputError: {
    borderColor: "#e53e3e",
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
    marginTop: 24,
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
  successEmail: {
    fontWeight: "700",
    opacity: 1,
  },
  backLink: {
    textAlign: "center",
    marginTop: 8,
  },
});

