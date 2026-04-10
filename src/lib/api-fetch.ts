// ============================================================
// API Fetch Wrapper — injects user API settings as headers
// ============================================================
// All frontend API calls should use this instead of raw fetch()
// so that user-configured API key/model/baseURL are sent to the server.
// ============================================================

import { useAppStore } from "./store";

/** Build headers with user API settings injected */
export function getApiHeaders(extra?: Record<string, string>): Record<string, string> {
  const { apiSettings } = useAppStore.getState();
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    ...extra,
  };

  if (apiSettings.baseURL) {
    headers["x-llm-base-url"] = apiSettings.baseURL;
  }
  if (apiSettings.apiKey) {
    headers["x-llm-api-key"] = apiSettings.apiKey;
  }
  if (apiSettings.model) {
    headers["x-llm-model"] = apiSettings.model;
  }

  return headers;
}

/** Fetch wrapper that automatically includes API settings headers */
export function apiFetch(url: string, init?: RequestInit): Promise<Response> {
  const apiHeaders = getApiHeaders();
  return fetch(url, {
    ...init,
    headers: {
      ...apiHeaders,
      ...(init?.headers || {}),
    },
  });
}
