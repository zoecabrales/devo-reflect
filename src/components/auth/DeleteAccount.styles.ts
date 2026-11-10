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
    color: "#c53030",
  },
  warningBox: {
    backgroundColor: "#fff5f5",
    borderWidth: 1,
    borderColor: "#feb2b2",
    borderRadius: 12,
    padding: 16,
    gap: 6,
  },
  warningTitle: {
    fontWeight: "700",
    color: "#c53030",
    fontSize: 14,
  },
  warningText: {
    color: "#742a2a",
    fontSize: 13,
    lineHeight: 20,
  },
  fieldWrapper: {
    gap: 4,
  },
  label: {
    fontSize: 13,
    color: "#555",
    marginBottom: 2,
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
  deleteButton: {
    backgroundColor: "#c53030",
    padding: 16,
    borderRadius: 12,
    alignItems: "center",
    marginTop: 8,
  },
  deleteButtonText: {
    color: "#fff",
    fontWeight: "600",
    fontSize: 15,
  },
  cancelLink: {
    textAlign: "center",
    marginTop: 4,
    color: "#555",
    fontSize: 14,
  },
});

