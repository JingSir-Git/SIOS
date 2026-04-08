"use client";

import { useEffect } from "react";
import { useAppStore } from "@/lib/store";

const TAB_ORDER = [
  "analyze",     // Ctrl+1
  "profiles",    // Ctrl+2
  "coach",       // Ctrl+3
  "simulate",    // Ctrl+4
  "eq-training", // Ctrl+5
  "strategy",    // Ctrl+6
  "psychology",  // Ctrl+7
  "planning",    // Ctrl+8
  "mbti",        // Ctrl+9
  "settings",    // Ctrl+0
];

export default function KeyboardShortcuts() {
  const { setActiveTab } = useAppStore();

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      // Skip if user is typing in an input/textarea/select
      const tag = (e.target as HTMLElement)?.tagName;
      if (tag === "INPUT" || tag === "TEXTAREA" || tag === "SELECT") return;

      // Ctrl/Cmd + 1-9 → switch tabs 1-9
      if ((e.ctrlKey || e.metaKey) && e.key >= "1" && e.key <= "9") {
        const idx = parseInt(e.key) - 1;
        if (idx < TAB_ORDER.length) {
          e.preventDefault();
          setActiveTab(TAB_ORDER[idx]);
        }
      }

      // Ctrl/Cmd + 0 → switch to last tab (settings)
      if ((e.ctrlKey || e.metaKey) && e.key === "0") {
        e.preventDefault();
        setActiveTab(TAB_ORDER[TAB_ORDER.length - 1]);
      }
    };

    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [setActiveTab]);

  return null;
}
