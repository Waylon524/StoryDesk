import { fireEvent, render, screen, within } from "@testing-library/react";
import { beforeEach, describe, expect, it } from "vitest";
import App from "./App";
import { initialDeck } from "./data/seedDeck";
import { DECK_STORAGE_KEY } from "./lib/deckPersistence";

describe("StoryDeck application shell", () => {
  beforeEach(() => {
    window.localStorage.clear();
  });

  it("keeps narrative-map generation in global settings instead of the slide intent panel", () => {
    render(<App />);

    expect(screen.queryByText("新建叙事地图")).not.toBeInTheDocument();
    expect(screen.getByRole("heading", { name: "问题引入" })).toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: "设置" }));

    const dialog = screen.getByRole("dialog", { name: "全局设置" });
    expect(within(dialog).getByText("新建叙事地图")).toBeInTheDocument();
    expect(within(dialog).getByLabelText("主题")).toHaveValue("校园二手交易平台");
  });

  it("restores the last saved deck when the app opens", () => {
    window.localStorage.setItem(
      DECK_STORAGE_KEY,
      JSON.stringify({
        ...initialDeck,
        deck: {
          ...initialDeck.deck,
          title: "恢复后的项目",
          goal: "恢复上次编辑状态。"
        },
        activeNodeId: "node-3"
      })
    );

    render(<App />);

    expect(screen.getByRole("heading", { name: "核心矛盾" })).toBeInTheDocument();
    expect(screen.getByText("恢复上次编辑状态。")).toBeInTheDocument();
  });

  it("exposes reset, export, and import controls in global settings", () => {
    render(<App />);

    fireEvent.click(screen.getByRole("button", { name: "设置" }));

    const dialog = screen.getByRole("dialog", { name: "全局设置" });
    expect(within(dialog).getByRole("button", { name: "重置为示例 Deck" })).toBeInTheDocument();
    expect(within(dialog).getByRole("button", { name: "导出项目" })).toBeInTheDocument();
    expect(within(dialog).getByLabelText("导入项目")).toBeInTheDocument();
  });

  it("lets the user save and restore a deck version from global settings", () => {
    render(<App />);

    fireEvent.click(screen.getByRole("button", { name: "设置" }));
    const dialog = screen.getByRole("dialog", { name: "全局设置" });
    fireEvent.click(within(dialog).getByRole("button", { name: "保存当前版本" }));
    fireEvent.click(within(dialog).getByRole("button", { name: "重置为示例 Deck" }));
    fireEvent.click(within(dialog).getByRole("button", { name: "恢复" }));

    expect(screen.getByText("已恢复版本：手动保存。")).toBeInTheDocument();
  });

  it("shows a node-level AI rewrite error when API settings are missing", async () => {
    render(<App />);

    fireEvent.change(screen.getByLabelText("表达目标"), {
      target: { value: "用一个具体失败交易故事开场" }
    });
    fireEvent.click(screen.getByRole("button", { name: "AI 重写" }));

    expect(await screen.findByText("请先在设置中填写 API Key。")).toBeInTheDocument();
  });
});
