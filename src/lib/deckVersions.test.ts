import { describe, expect, it, vi } from "vitest";
import { initialDeck } from "../data/seedDeck";
import { appendDeckVersion, loadDeckVersions, restoreDeckVersion } from "./deckVersions";

function createStorage() {
  const storage = new Map<string, string>();
  return {
    getItem: vi.fn((key: string) => storage.get(key) ?? null),
    setItem: vi.fn((key: string, value: string) => storage.set(key, value)),
    removeItem: vi.fn((key: string) => storage.delete(key))
  } as unknown as Storage;
}

describe("deck version history", () => {
  it("saves a restorable deck snapshot without API settings", () => {
    const storage = createStorage();
    const versions = appendDeckVersion(initialDeck, "初版结构", storage, new Date("2026-05-26T08:00:00.000Z"));

    expect(versions).toHaveLength(1);
    expect(versions[0]).toMatchObject({
      label: "初版结构",
      summary: "8 个叙事节点 · 当前页：问题引入",
      deckState: {
        deck: {
          title: initialDeck.deck.title
        }
      }
    });
    expect(JSON.stringify(versions)).not.toContain("apiKey");
    expect(restoreDeckVersion(versions, versions[0].id)?.deck.title).toBe(initialDeck.deck.title);
    expect(loadDeckVersions(storage)).toHaveLength(1);
  });

  it("saves custom version summaries and migrates legacy versions without summaries", () => {
    const storage = createStorage();
    appendDeckVersion(
      initialDeck,
      "AI 改写前",
      storage,
      new Date("2026-05-26T08:00:00.000Z"),
      "保留原始叙事结构，准备测试 AI 模板。"
    );

    const versions = loadDeckVersions(storage);

    expect(versions[0]).toMatchObject({
      label: "AI 改写前",
      summary: "保留原始叙事结构，准备测试 AI 模板。"
    });

    storage.setItem(
      "storydeck.versionHistory.v1",
      JSON.stringify([
        {
          id: "legacy-version",
          label: "旧版本",
          createdAt: "2026-05-26T08:00:00.000Z",
          deckState: initialDeck
        }
      ])
    );

    expect(loadDeckVersions(storage)[0].summary).toBe("8 个叙事节点 · 当前页：问题引入");
  });

  it("keeps the newest ten versions", () => {
    const storage = createStorage();

    for (let index = 0; index < 12; index += 1) {
      appendDeckVersion(initialDeck, `版本 ${index + 1}`, storage, new Date(Date.UTC(2026, 4, 26, 8, index)));
    }

    const versions = loadDeckVersions(storage);
    expect(versions).toHaveLength(10);
    expect(versions[0].label).toBe("版本 12");
    expect(versions.at(-1)?.label).toBe("版本 3");
  });
});
