import AsyncStorage from "@react-native-async-storage/async-storage";
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
} from "react";
import { useColorScheme } from "react-native";
import {
  ColorMode,
  Theme,
  ThemeName,
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

  const preset = THEME_PRESETS[themeName];
  const theme: Theme =
    effectiveScheme === "dark" ? preset.dark : preset.light;

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

