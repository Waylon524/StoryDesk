import { describe, expect, it, vi } from "vitest";
import { loadAiSettings, saveAiSettings, defaultAiSettings } from "./aiSettings";

describe("ai settings persistence", () => {
  it("keeps the API key out of defaults and persists user-saved settings locally", () => {
    const storage = new Map<string, string>();
    const localStorageLike = {
      getItem: vi.fn((key: string) => storage.get(key) ?? null),
      setItem: vi.fn((key: string, value: string) => storage.set(key, value))
    } as unknown as Storage;

    expect(defaultAiSettings.apiKey).toBe("");

    saveAiSettings(
      {
        apiKey: "sk-test",
        baseUrl: "https://api.deepseek.com",
        model: "deepseek-v4-flash"
      },
      localStorageLike
    );

    expect(loadAiSettings(localStorageLike)).toEqual({
      apiKey: "sk-test",
      baseUrl: "https://api.deepseek.com",
      model: "deepseek-v4-flash"
    });
  });
});
