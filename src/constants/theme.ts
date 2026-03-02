/** Sky-blue accent used for the active bottom-tab icon and label. */
export const TAB_ACTIVE_COLOR = "#38BDF8";

export type ColorMode = "system" | "light" | "dark";
export type ThemeName = "default" | "sepia" | "ocean" | "forest";

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

// ── Default (monochrome) ───────────────────────────────────────────────────
export const lightTheme: Theme = {
  background: "#ffffff",
  surface: "#f9f9f9",
  text: "#000000",
  textSecondary: "#666666",
  placeholder: "#999999",
  border: "#d0d0d0",
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

// ── Sepia (warm parchment) ─────────────────────────────────────────────────
export const sepiaLightTheme: Theme = {
  background: "#fdf6e3",
  surface: "#f5eccc",
  text: "#4a3728",
  textSecondary: "#8b6f57",
  placeholder: "#b09278",
  border: "#c9a876",
  borderError: "#c0392b",
  textError: "#c0392b",
  primary: "#7b5e2a",
  primaryText: "#fdf6e3",
};

export const sepiaDarkTheme: Theme = {
  background: "#1c1409",
  surface: "#2a1e0f",
  text: "#e8d5a3",
  textSecondary: "#c4a87a",
  placeholder: "#8b6f57",
  border: "#5c4a1e",
  borderError: "#fc8181",
  textError: "#fc8181",
  primary: "#c4a35a",
  primaryText: "#1c1409",
};

// ── Ocean (blue) ───────────────────────────────────────────────────────────
export const oceanLightTheme: Theme = {
  background: "#f0f8ff",
  surface: "#e2f0fb",
  text: "#1a3a5c",
  textSecondary: "#4a7aa0",
  placeholder: "#7aaac8",
  border: "#90c0e0",
  borderError: "#e53e3e",
  textError: "#e53e3e",
  primary: "#2563eb",
  primaryText: "#ffffff",
};

export const oceanDarkTheme: Theme = {
  background: "#0d1b2e",
  surface: "#1a2d45",
  text: "#b8d4f0",
  textSecondary: "#6a9abf",
  placeholder: "#4a7090",
  border: "#2a4a6a",
  borderError: "#fc8181",
  textError: "#fc8181",
  primary: "#60a5fa",
  primaryText: "#0d1b2e",
};

// ── Forest (green) ─────────────────────────────────────────────────────────
export const forestLightTheme: Theme = {
  background: "#f2faf2",
  surface: "#e4f4e4",
  text: "#1a3d1a",
  textSecondary: "#4a7a4a",
  placeholder: "#7aaa7a",
  border: "#90c890",
  borderError: "#e53e3e",
  textError: "#e53e3e",
  primary: "#2d6a2d",
  primaryText: "#ffffff",
};

export const forestDarkTheme: Theme = {
  background: "#0a1a0a",
  surface: "#142814",
  text: "#a8d4a8",
  textSecondary: "#6aaa6a",
  placeholder: "#4a7a4a",
  border: "#2a5a2a",
  borderError: "#fc8181",
  textError: "#fc8181",
  primary: "#4ade80",
  primaryText: "#0a1a0a",
};

// ── Lookup helpers ─────────────────────────────────────────────────────────
export const THEME_PRESETS: Record<
  ThemeName,
  { label: string; swatch: string; light: Theme; dark: Theme }
> = {
  default: {
    label: "Default",
    swatch: "#111111",
    light: lightTheme,
    dark: darkTheme,
  },
  sepia: {
    label: "Sepia",
    swatch: "#c9a876",
    light: sepiaLightTheme,
    dark: sepiaDarkTheme,
  },
  ocean: {
    label: "Ocean",
    swatch: "#2563eb",
    light: oceanLightTheme,
    dark: oceanDarkTheme,
  },
  forest: {
    label: "Forest",
    swatch: "#2d6a2d",
    light: forestLightTheme,
    dark: forestDarkTheme,
  },
};
