import { motion } from "motion/react";

export interface ThemeWipeOverlayProps {
  /** ltr = black overlay sliding left -> right (going dark). rtl = white overlay sliding right -> left (going light). */
  direction: "ltr" | "rtl";
  durationMs: number;
}

// A full-viewport panel that slides across the screen once, in one direction:
// starts fully off-screen on one side, passes through fully covering the
// viewport at its midpoint, and ends fully off-screen on the other side.
// ThemeProvider swaps the .dark class at that midpoint, so the theme changes
// while the screen is covered rather than visibly in front of the user.
export function ThemeWipeOverlay({ direction, durationMs }: ThemeWipeOverlayProps) {
  const fromX = direction === "ltr" ? "-100%" : "100%";
  const toX = direction === "ltr" ? "100%" : "-100%";
  const color = direction === "ltr" ? "#000000" : "#ffffff";

  return (
    <motion.div
      aria-hidden="true"
      initial={{ x: fromX }}
      animate={{ x: toX }}
      transition={{ duration: durationMs / 1000, ease: "easeInOut" }}
      style={{
        position: "fixed",
        inset: 0,
        // Deliberately far above anything else in the app (shadcn/Radix
        // dialogs and popovers top out around z-50), so the wipe always
        // covers the navbar, modals, and any other fixed element.
        zIndex: 2147483647,
        // Never intercepts clicks, during the animation or after — content
        // underneath is fully covered visually anyway while this is in the
        // way, and it unmounts itself as soon as the animation finishes.
        pointerEvents: "none",
        backgroundColor: color,
      }}
    />
  );
}
