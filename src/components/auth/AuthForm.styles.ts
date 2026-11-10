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
  legalText: {
    textAlign: "center",
    fontSize: 11,
    color: "#888",
    lineHeight: 18,
    paddingVertical: 16,
    paddingHorizontal: 24,
    marginBottom: 24,
  },
  legalLink: {
    fontSize: 11,
    color: "#2563eb",
    fontWeight: "600",
  },
  toggleRow: {
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    marginTop: 12,
  },
  toggleText: {
    textAlign: "center",
  },
  toggleLink: {
    fontWeight: "700",
  },
  forgotText: {
    textAlign: "right",
    fontSize: 12,
    color: "#555",
  },

  // ── Wide web layout (brand panel | divider | form) ───────────────────────
  wideRoot: {
    flex: 1,
    backgroundColor: "#fff",
  },
  wideRootContent: {
    flexGrow: 1,
    alignItems: "center",
    justifyContent: "center",
    padding: 32,
  },
  // Sized to its content so both halves sit close to the centre divider
  wideInner: {
    flexDirection: "row",
    alignItems: "center",
    gap: 56,
  },
  brandPanel: {
    width: 340,
    alignItems: "center",
    justifyContent: "center",
  },
  brandTile: {
    width: 116,
    height: 116,
    borderRadius: 28,
    backgroundColor: "#fff",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 24,
    shadowColor: "#000",
    shadowOpacity: 0.08,
    shadowRadius: 16,
    shadowOffset: { width: 0, height: 4 },
  },
  brandTitle: {
    fontSize: 40,
    fontFamily: "Oswald_700Bold",
    color: "#111",
    letterSpacing: 0.4,
  },
  brandTagline: {
    fontSize: 18,
    color: "#555",
    marginTop: 8,
  },
  // Short centre line, roughly the height of the brand group
  wideDivider: {
    width: StyleSheet.hairlineWidth,
    height: 300,
    backgroundColor: "#c8c8c8",
  },
  formColumn: {
    width: 360,
    gap: 16,
  },
  wideHeading: {
    fontSize: 30,
    fontFamily: "Oswald_700Bold",
    color: "#111",
    marginBottom: 8,
  },
  label: {
    fontSize: 13,
    fontWeight: "700",
    color: "#333",
    marginBottom: 2,
  },
  wideButton: {
    marginTop: 8,
  },
  wideLinksRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  wideLink: {
    fontSize: 14,
    fontWeight: "700",
    color: "#111",
    textDecorationLine: "underline",
  },
  wideLegalText: {
    textAlign: "left",
    paddingHorizontal: 0,
    marginBottom: 0,
    marginTop: 8,
  },
});
