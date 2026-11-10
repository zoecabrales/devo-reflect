import AsyncStorage from "@react-native-async-storage/async-storage";
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
} from "react";
import { Platform, useColorScheme } from "react-native";
import {
  ColorMode,
  Theme,
  ThemeName,
  THEME_PICKER_ENABLED,
  THEME_PRESETS,
} from "@/src/constants/theme";

const STORAGE_KEY_NAME = "@theme/name";
const STORAGE_KEY_MODE = "@theme/colorMode";

type ThemeContextValue = {
  theme: Theme;
  themeName: ThemeName;
  colorMode: ColorMode;
  setThemeName: (name: ThemeName) => void;
  setColorMode: (mode: ColorMode) => void;
};

const ThemeContext = createContext<ThemeContextValue>({
  theme: THEME_PRESETS.default.light,
  themeName: "default",
  colorMode: "system",
  setThemeName: () => {},
  setColorMode: () => {},
});

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const systemScheme = useColorScheme();
  const [themeName, setThemeNameState] = useState<ThemeName>("default");
  const [colorMode, setColorModeState] = useState<ColorMode>("system");
  const [ready, setReady] = useState(false);

  // Load persisted preferences on mount
  useEffect(() => {
    async function load() {
      try {
        const [name, mode] = await Promise.all([
          AsyncStorage.getItem(STORAGE_KEY_NAME),
          AsyncStorage.getItem(STORAGE_KEY_MODE),
        ]);
        if (name && name in THEME_PRESETS) {
          setThemeNameState(name as ThemeName);
        }
        if (mode === "light" || mode === "dark" || mode === "system") {
          setColorModeState(mode);
        }
      } finally {
        setReady(true);
      }
    }
    load();
  }, []);

  const setThemeName = useCallback((name: ThemeName) => {
    setThemeNameState(name);
    AsyncStorage.setItem(STORAGE_KEY_NAME, name);
  }, []);

  const setColorMode = useCallback((mode: ColorMode) => {
    setColorModeState(mode);
    AsyncStorage.setItem(STORAGE_KEY_MODE, mode);
  }, []);

  // Resolve the effective color scheme
  const effectiveScheme =
    colorMode === "system" ? (systemScheme ?? "light") : colorMode;

  const preset = THEME_PRESETS[THEME_PICKER_ENABLED ? themeName : "default"];
  const theme: Theme =
    effectiveScheme === "dark" ? preset.dark : preset.light;

  // Web: match the page background and browser toolbar colour to the app,
  // so mobile Safari / Chrome don't frame it with white bars
  useEffect(() => {
    if (Platform.OS !== "web" || typeof document === "undefined") return;
    const color = theme.background;
    document.documentElement.style.backgroundColor = color;
    document.body.style.backgroundColor = color;
    document.documentElement.style.colorScheme = effectiveScheme;
    // One unconditional theme-color tag replaces the media-query defaults
    document
      .querySelectorAll('meta[name="theme-color"]')
      .forEach((m) => m.remove());
    const meta = document.createElement("meta");
    meta.name = "theme-color";
    meta.content = color;
    document.head.appendChild(meta);
  }, [theme.background, effectiveScheme]);

  if (!ready) return null;

  return (
    <ThemeContext.Provider
      value={{ theme, themeName, colorMode, setThemeName, setColorMode }}
    >
      {children}
    </ThemeContext.Provider>
  );
}

export function useAppTheme() {
  return useContext(ThemeContext);
}

