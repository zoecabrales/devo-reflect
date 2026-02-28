export type Theme = {
  background: string;
  surface: string;
  text: string;
  textSecondary: string;
  placeholder: string;
  border: string;
  borderError: string;
  textError: string;
  primary: string;
  primaryText: string;
};

export const lightTheme: Theme = {
  background: "#ffffff",
  surface: "#ffffff",
  text: "#000000",
  textSecondary: "#666666",
  placeholder: "#999999",
  border: "#000000",
  borderError: "#e53e3e",
  textError: "#e53e3e",
  primary: "#111111",
  primaryText: "#ffffff",
};

export const darkTheme: Theme = {
  background: "#121212",
  surface: "#1e1e1e",
  text: "#f5f5f5",
  textSecondary: "#aaaaaa",
  placeholder: "#666666",
  border: "#444444",
  borderError: "#fc8181",
  textError: "#fc8181",
  primary: "#ffffff",
  primaryText: "#111111",
};

