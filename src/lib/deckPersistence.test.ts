import { describe, expect, it, vi } from "vitest";
import { initialDeck } from "../data/seedDeck";
import {
  clearSavedDeck,
  loadSavedDeck,
  parseDeckJson,
  saveDeckState,
  serializeDeckState
} from "./deckPersistence";

function createStorage() {
  const storage = new Map<string, string>();
  return {
    getItem: vi.fn((key: string) => storage.get(key) ?? null),
    setItem: vi.fn((key: string, value: string) => storage.set(key, value)),
    removeItem: vi.fn((key: string) => storage.delete(key))
  } as unknown as Storage;
}

describe("deck persistence", () => {
  it("saves and restores the current deck state", () => {
    const storage = createStorage();
    const editedDeck = {
      ...initialDeck,
      deck: {
        ...initialDeck.deck,
        title: "已保存的项目"
      },
      activeNodeId: "node-3"
    };

    saveDeckState(editedDeck, storage);

    expect(loadSavedDeck(storage)).toMatchObject({
      deck: { title: "已保存的项目" },
      activeNodeId: "node-3"
    });
  });

  it("returns null for invalid saved JSON and clears the broken record", () => {
    const storage = createStorage();
    storage.setItem("storydeck.deckState.v1", "{bad json");

    expect(loadSavedDeck(storage)).toBeNull();
    expect(storage.removeItem).toHaveBeenCalledWith("storydeck.deckState.v1");
  });

  it("exports a portable storydeck JSON file without API settings", () => {
    const json = serializeDeckState(initialDeck);
    const parsed = JSON.parse(json);

    expect(parsed.schema).toBe("storydeck.document");
    expect(parsed.deckState.deck.title).toBe(initialDeck.deck.title);
    expect(json).not.toContain("apiKey");
    expect(parseDeckJson(json).deck.title).toBe(initialDeck.deck.title);
  });

  it("migrates imported decks that do not have slide layout metadata", () => {
    const legacyDeck = {
      ...initialDeck,
      slides: initialDeck.slides.map(({ layout: _layout, ...slide }) => slide)
    };

    const parsed = parseDeckJson(JSON.stringify(legacyDeck));

    expect(parsed.slides[0].layout).toBe("statement");
    expect(parsed.slides[2].layout).toBe("three-point");
    expect(parsed.slides[3].layout).toBe("process");
    expect(parsed.slides[6].layout).toBe("closing");
  });

  it("clears saved deck state when resetting to the example deck", () => {
    const storage = createStorage();

    saveDeckState(initialDeck, storage);
    clearSavedDeck(storage);

    expect(storage.removeItem).toHaveBeenCalledWith("storydeck.deckState.v1");
  });
});
