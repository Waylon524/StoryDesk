import type { AiSettings } from "../types";

const AI_SETTINGS_KEY = "storydeck.aiSettings.v1";

export const defaultAiSettings: AiSettings = {
  apiKey: "",
  baseUrl: "https://api.deepseek.com",
  model: "deepseek-v4-flash"
};

export function loadAiSettings(storage = getStorage()): AiSettings {
  if (!storage) {
    return defaultAiSettings;
  }

  const raw = storage.getItem(AI_SETTINGS_KEY);
  if (!raw) {
    return defaultAiSettings;
  }

  try {
    const parsed = JSON.parse(raw) as Partial<AiSettings>;
    return {
      apiKey: parsed.apiKey ?? "",
      baseUrl: parsed.baseUrl?.trim() || defaultAiSettings.baseUrl,
      model: parsed.model?.trim() || defaultAiSettings.model
    };
  } catch {
    return defaultAiSettings;
  }
}

export function saveAiSettings(settings: AiSettings, storage = getStorage()) {
  if (!storage) {
    return;
  }

  storage.setItem(
    AI_SETTINGS_KEY,
    JSON.stringify({
      apiKey: settings.apiKey.trim(),
      baseUrl: normalizeBaseUrl(settings.baseUrl),
      model: settings.model.trim() || defaultAiSettings.model
    })
  );
}

export function normalizeBaseUrl(baseUrl: string) {
  return (baseUrl.trim() || defaultAiSettings.baseUrl).replace(/\/+$/, "");
}

function getStorage(): Storage | undefined {
  return typeof window === "undefined" ? undefined : window.localStorage;
}
