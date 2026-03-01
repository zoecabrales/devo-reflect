import { StyleSheet } from "react-native";

export const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    gap: 12,
  },
  button: {
    backgroundColor: "#111",
    paddingVertical: 14,
    paddingHorizontal: 40,
    borderRadius: 12,
    minWidth: 200,
    alignItems: "center",
  },
  buttonText: {
    color: "#fff",
    fontWeight: "600",
    fontSize: 16,
  },
  outlineButton: {
    borderWidth: 1,
    borderColor: "#111",
    paddingVertical: 14,
    paddingHorizontal: 40,
    borderRadius: 12,
    minWidth: 200,
    alignItems: "center",
  },
  outlineButtonText: {
    color: "#111",
    fontWeight: "600",
    fontSize: 16,
  },
  deleteLink: {
    color: "#c53030",
    fontSize: 14,
    marginTop: 8,
  },
});
