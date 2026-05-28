import type { DeckState } from "../types";
import { ensureDeckState } from "./deckTemplate";

export const DECK_STORAGE_KEY = "storydeck.deckState.v1";

interface StoryDeckDocument {
  schema: "storydeck.document";
  version: 1;
  exportedAt: string;
  deckState: DeckState;
}

export function loadSavedDeck(storage = getStorage()): DeckState | null {
  if (!storage) {
    return null;
  }

  const raw = storage.getItem(DECK_STORAGE_KEY);
  if (!raw) {
    return null;
  }

  try {
    return parseDeckJson(raw);
  } catch {
    storage.removeItem(DECK_STORAGE_KEY);
    return null;
  }
}

export function saveDeckState(deckState: DeckState, storage = getStorage()) {
  if (!storage) {
    return;
  }

  storage.setItem(DECK_STORAGE_KEY, JSON.stringify(deckState));
}

export function clearSavedDeck(storage = getStorage()) {
  storage?.removeItem(DECK_STORAGE_KEY);
}

export function serializeDeckState(deckState: DeckState) {
  const document: StoryDeckDocument = {
    schema: "storydeck.document",
    version: 1,
    exportedAt: new Date().toISOString(),
    deckState
  };

  return JSON.stringify(document, null, 2);
}

export function parseDeckJson(json: string): DeckState {
  const parsed = JSON.parse(json) as unknown;
  const maybeDocument = parsed as Partial<StoryDeckDocument>;
  const deckState = maybeDocument.schema === "storydeck.document" ? maybeDocument.deckState : parsed;

  if (!isDeckState(deckState)) {
    throw new Error("不是有效的 StoryDeck 项目文件。");
  }

  return ensureDeckState(deckState);
}

function isDeckState(value: unknown): value is DeckState {
  if (!value || typeof value !== "object") {
    return false;
  }

  const state = value as Partial<DeckState>;
  return Boolean(
    state.deck &&
      typeof state.deck.title === "string" &&
      Array.isArray(state.nodes) &&
      state.nodes.length > 0 &&
      Array.isArray(state.slides) &&
      state.slides.length > 0 &&
      typeof state.activeNodeId === "string" &&
      state.slides.some((slide) => slide.nodeId === state.activeNodeId)
  );
}

function getStorage(): Storage | undefined {
  return typeof window === "undefined" ? undefined : window.localStorage;
}
