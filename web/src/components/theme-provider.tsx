import { createContext, useCallback, useContext, useEffect, useRef, useState } from "react";
import { ThemeWipeOverlay } from "@/components/theme-transition-overlay";

type Theme = "light" | "dark" | "system";
type Resolved = "light" | "dark";

interface ThemeProviderState {
  theme: Theme;
  setTheme: (theme: Theme) => void;
  /** True while the wipe animation is running — used to disable the toggle. */
  transitioning: boolean;
}

const STORAGE_KEY = "library-theme";
// Total wipe duration; within the requested 600-900ms window.
const TRANSITION_MS = 700;

const ThemeProviderContext = createContext<ThemeProviderState | undefined>(undefined);

function resolveTheme(theme: Theme): Resolved {
  if (theme === "system") {
    return window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light";
  }
  return theme;
}

function applyTheme(theme: Theme) {
  const root = document.documentElement;
  root.classList.toggle("dark", resolveTheme(theme) === "dark");
}

function prefersReducedMotion() {
  return window.matchMedia("(prefers-reduced-motion: reduce)").matches;
}

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [theme, setThemeState] = useState<Theme>(
    () => (localStorage.getItem(STORAGE_KEY) as Theme | null) ?? "system",
  );
  const [wipe, setWipe] = useState<{ direction: "ltr" | "rtl" } | null>(null);
  const pendingTimeouts = useRef<number[]>([]);

  useEffect(() => {
    applyTheme(theme);
    if (theme !== "system") return;
    // Keep in sync with OS changes while on "system". This bypasses the
    // animated setTheme below on purpose — a passive OS-level change
    // shouldn't trigger a wipe the user didn't ask for.
    const mq = window.matchMedia("(prefers-color-scheme: dark)");
    const onChange = () => applyTheme("system");
    mq.addEventListener("change", onChange);
    return () => mq.removeEventListener("change", onChange);
  }, [theme]);

  // Clear any in-flight timeouts if the provider ever unmounts mid-transition.
  useEffect(() => {
    return () => {
      pendingTimeouts.current.forEach(clearTimeout);
    };
  }, []);

  const commitTheme = useCallback((next: Theme) => {
    localStorage.setItem(STORAGE_KEY, next);
    setThemeState(next);
  }, []);

  const setTheme = useCallback(
    (next: Theme) => {
      // Guards against rapid re-clicks landing before the disabled toggle
      // re-renders, and against any other caller mid-transition.
      if (wipe !== null) return;

      const goingDark = resolveTheme(next) === "dark";
      const isCurrentlyDark = resolveTheme(theme) === "dark";

      if (goingDark === isCurrentlyDark || prefersReducedMotion()) {
        commitTheme(next);
        return;
      }

      setWipe({ direction: goingDark ? "ltr" : "rtl" });

      // Swap the theme once the overlay has fully covered the screen (the
      // midpoint of the slide), then let it continue off-screen before
      // clearing it. easeInOut is time-symmetric, so the overlay is exactly
      // covering the viewport at duration / 2.
      pendingTimeouts.current.push(
        window.setTimeout(() => commitTheme(next), TRANSITION_MS / 2),
      );
      pendingTimeouts.current.push(
        window.setTimeout(() => setWipe(null), TRANSITION_MS),
      );
    },
    [theme, wipe, commitTheme],
  );

  return (
    <ThemeProviderContext.Provider value={{ theme, setTheme, transitioning: wipe !== null }}>
      {children}
      {wipe && <ThemeWipeOverlay direction={wipe.direction} durationMs={TRANSITION_MS} />}
    </ThemeProviderContext.Provider>
  );
}

export function useTheme() {
  const ctx = useContext(ThemeProviderContext);
  if (!ctx) throw new Error("useTheme must be used within a ThemeProvider");
  return ctx;
}
