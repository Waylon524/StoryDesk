import type { DeckState, DeckVersion } from "../types";
import { ensureDeckState } from "./deckTemplate";

export const VERSION_HISTORY_STORAGE_KEY = "storydeck.versionHistory.v1";
const MAX_VERSIONS = 10;

export function loadDeckVersions(storage = getStorage()): DeckVersion[] {
  if (!storage) {
    return [];
  }

  const raw = storage.getItem(VERSION_HISTORY_STORAGE_KEY);
  if (!raw) {
    return [];
  }

  try {
    const parsed = JSON.parse(raw) as unknown;
    if (!Array.isArray(parsed)) {
      return [];
    }

    return parsed.filter(isDeckVersion).map((version) => ({
      ...version,
      summary: normalizeVersionSummary(version.summary, version.deckState),
      deckState: ensureDeckState(version.deckState)
    }));
  } catch {
    storage.removeItem(VERSION_HISTORY_STORAGE_KEY);
    return [];
  }
}

export function appendDeckVersion(
  deckState: DeckState,
  label = "手动保存",
  storage = getStorage(),
  createdAt = new Date(),
  summary = createVersionSummary(deckState)
): DeckVersion[] {
  const version: DeckVersion = {
    id: `version-${createdAt.getTime()}`,
    label: normalizeVersionLabel(label),
    summary: normalizeVersionSummary(summary, deckState),
    createdAt: createdAt.toISOString(),
    deckState: ensureDeckState(deckState)
  };
  const versions = [version, ...loadDeckVersions(storage)].slice(0, MAX_VERSIONS);
  saveDeckVersions(versions, storage);
  return versions;
}

export function saveDeckVersions(versions: DeckVersion[], storage = getStorage()) {
  storage?.setItem(VERSION_HISTORY_STORAGE_KEY, JSON.stringify(versions.slice(0, MAX_VERSIONS)));
}

export function restoreDeckVersion(versions: DeckVersion[], versionId: string): DeckState | null {
  return versions.find((version) => version.id === versionId)?.deckState ?? null;
}

function isDeckVersion(value: unknown): value is DeckVersion {
  if (!value || typeof value !== "object") {
    return false;
  }

  const version = value as Partial<DeckVersion>;
  return Boolean(
    typeof version.id === "string" &&
      typeof version.label === "string" &&
      typeof version.createdAt === "string" &&
      version.deckState &&
      typeof version.deckState === "object"
  );
}

function normalizeVersionLabel(label: string) {
  const trimmed = label.trim();
  return trimmed || "手动保存";
}

function normalizeVersionSummary(summary: string | undefined, deckState: DeckState) {
  const trimmed = summary?.trim();
  return trimmed || createVersionSummary(deckState);
}

function createVersionSummary(deckState: DeckState) {
  return `${deckState.nodes.length} 个叙事节点 · 当前页：${deckState.nodes.find((node) => node.id === deckState.activeNodeId)?.title ?? deckState.nodes[0]?.title ?? "未命名"}`;
}

function getStorage(): Storage | undefined {
  return typeof window === "undefined" ? undefined : window.localStorage;
}
