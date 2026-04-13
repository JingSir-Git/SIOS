// ============================================================
// i18n — Internationalization Hook & Utilities
// ============================================================

import zh from "./zh";
import en from "./en";
import type { TranslationKeys } from "./zh";
import { useAppStore } from "@/lib/store";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const translations: Record<"zh" | "en", TranslationKeys> = { zh, en } as any;

/**
 * Hook to access the current translation object.
 * Usage: `const t = useT();` then `t.nav.dashboard`
 */
export function useT(): TranslationKeys {
  const language = useAppStore((s) => s.language);
  return translations[language] ?? zh;
}

/**
 * Get translation object without React hook (for non-component code).
 */
export function getT(lang?: "zh" | "en"): TranslationKeys {
  const l = lang ?? useAppStore.getState().language;
  return translations[l] ?? zh;
}

/**
 * Get the AI language instruction to append to system prompts.
 * Returns empty string for Chinese (default), instruction for English.
 */
export function getAILanguageInstruction(lang?: "zh" | "en"): string {
  const l = lang ?? useAppStore.getState().language;
  if (l === "en") {
    return "\n\n【IMPORTANT: The user has selected English. You MUST respond entirely in English. All analysis, insights, advice, and labels must be in English.】\n";
  }
  return "";
}

export type { TranslationKeys };
export { zh, en };
