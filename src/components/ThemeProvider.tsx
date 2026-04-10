"use client";

import { useEffect } from "react";
import { useAppStore, type ThemeKey } from "@/lib/store";

// ============================================================
// Theme Definitions — CSS variable overrides
// ============================================================

interface ThemeVars {
  "--bg-primary": string;
  "--bg-secondary": string;
  "--bg-tertiary": string;
  "--bg-card": string;
  "--border-primary": string;
  "--border-secondary": string;
  "--text-primary": string;
  "--text-secondary": string;
  "--text-tertiary": string;
  "--text-muted": string;
  "--accent": string;
  "--accent-muted": string;
}

const THEMES: Record<ThemeKey, ThemeVars> = {
  dark: {
    "--bg-primary": "#09090b",
    "--bg-secondary": "#18181b",
    "--bg-tertiary": "#27272a",
    "--bg-card": "rgba(24, 24, 27, 0.5)",
    "--border-primary": "#3f3f46",
    "--border-secondary": "#27272a",
    "--text-primary": "#f4f4f5",
    "--text-secondary": "#a1a1aa",
    "--text-tertiary": "#71717a",
    "--text-muted": "#52525b",
    "--accent": "#8b5cf6",
    "--accent-muted": "rgba(139, 92, 246, 0.15)",
  },
  "violet-dark": {
    "--bg-primary": "#110e1a",
    "--bg-secondary": "#1a1525",
    "--bg-tertiary": "#251e33",
    "--bg-card": "rgba(26, 21, 37, 0.6)",
    "--border-primary": "#3a2e50",
    "--border-secondary": "#251e33",
    "--text-primary": "#e0dae8",
    "--text-secondary": "#a898c0",
    "--text-tertiary": "#7a6a9a",
    "--text-muted": "#554878",
    "--accent": "#a78bfa",
    "--accent-muted": "rgba(167, 139, 250, 0.15)",
  },
  "green-eye": {
    "--bg-primary": "#1a2e1a",
    "--bg-secondary": "#223322",
    "--bg-tertiary": "#2d4a2d",
    "--bg-card": "rgba(34, 51, 34, 0.6)",
    "--border-primary": "#3d5c3d",
    "--border-secondary": "#2d4a2d",
    "--text-primary": "#d4e8d4",
    "--text-secondary": "#9cbc9c",
    "--text-tertiary": "#6d9a6d",
    "--text-muted": "#4d7a4d",
    "--accent": "#66bb6a",
    "--accent-muted": "rgba(102, 187, 106, 0.15)",
  },
  sepia: {
    "--bg-primary": "#2c2416",
    "--bg-secondary": "#3a301e",
    "--bg-tertiary": "#4a3e2a",
    "--bg-card": "rgba(58, 48, 30, 0.6)",
    "--border-primary": "#6b5b3e",
    "--border-secondary": "#4a3e2a",
    "--text-primary": "#e8dcc8",
    "--text-secondary": "#c4b08a",
    "--text-tertiary": "#9a8660",
    "--text-muted": "#7a6a48",
    "--accent": "#d4a44a",
    "--accent-muted": "rgba(212, 164, 74, 0.15)",
  },
  "blue-night": {
    "--bg-primary": "#0d1b2a",
    "--bg-secondary": "#1b2838",
    "--bg-tertiary": "#243447",
    "--bg-card": "rgba(27, 40, 56, 0.6)",
    "--border-primary": "#345070",
    "--border-secondary": "#243447",
    "--text-primary": "#d0dae8",
    "--text-secondary": "#8fa8c8",
    "--text-tertiary": "#5f7fa0",
    "--text-muted": "#406080",
    "--accent": "#60a5fa",
    "--accent-muted": "rgba(96, 165, 250, 0.15)",
  },
};

export const THEME_LABELS: Record<ThemeKey, { label: string; preview: string }> = {
  dark: { label: "深色模式", preview: "#09090b" },
  "violet-dark": { label: "深紫护眼", preview: "#110e1a" },
  "green-eye": { label: "护眼绿", preview: "#1a2e1a" },
  sepia: { label: "暖色护眼", preview: "#2c2416" },
  "blue-night": { label: "深蓝夜", preview: "#0d1b2a" },
};

export default function ThemeProvider({ children }: { children: React.ReactNode }) {
  const fontSize = useAppStore((s) => s.fontSize);
  const theme = useAppStore((s) => s.theme);

  useEffect(() => {
    const root = document.documentElement;

    // Apply global zoom scaling based on discrete font size levels
    // This scales ALL elements (including hardcoded px values) uniformly
    const SCALE_MAP: Record<number, number> = {
      12: 0.85,
      13: 0.92,
      14: 1.0,
      16: 1.1,
      18: 1.2,
    };
    const scale = SCALE_MAP[fontSize] ?? 1.0;
    root.style.fontSize = `${Math.round(16 * scale)}px`;

    // Apply zoom for pixel-based elements (text-[10px], etc.)
    const mainEl = document.getElementById("app-main");
    if (mainEl) {
      mainEl.style.zoom = `${scale}`;
    }

    // Apply theme variables
    const vars = THEMES[theme] || THEMES.dark;
    Object.entries(vars).forEach(([key, value]) => {
      root.style.setProperty(key, value);
    });

    // Set data-theme attribute for conditional CSS
    root.setAttribute("data-theme", theme);

    // Set color-scheme for native elements (scrollbar, inputs, etc.)
    root.style.colorScheme = "dark";
  }, [fontSize, theme]);

  return <>{children}</>;
}
