import { StyleSheet } from "react-native";

export const styles = StyleSheet.create({
  container: {
    flex: 1,
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
  },
  fieldWrapper: {
    gap: 4,
  },
  input: {
    borderWidth: 1,
    borderRadius: 12,
    padding: 14,
    backgroundColor: "#fff",
    color: "#000",
  },
  passwordInputWrapper: {
    position: "relative",
  },
  passwordInput: {
    paddingRight: 48,
  },
  eyeIcon: {
    position: "absolute",
    right: 14,
    top: 0,
    bottom: 0,
    justifyContent: "center",
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
  toggleText: {
    textAlign: "center",
    marginTop: 12,
  },
  strengthList: {
    gap: 6,
    paddingLeft: 2,
  },
  strengthItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  strengthLabel: {
    fontSize: 12,
  },
  strengthLabelMet: {
    color: "#2f855a",
  },
  strengthLabelUnmet: {
    color: "#aaa",
  },
});
