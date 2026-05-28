import { fireEvent, render, screen, waitFor, within } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import App from "./App";
import { initialDeck } from "./data/seedDeck";
import { DECK_STORAGE_KEY } from "./lib/deckPersistence";

describe("StoryDeck application shell", () => {
  beforeEach(() => {
    window.localStorage.clear();
  });

  afterEach(() => {
    vi.unstubAllGlobals();
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
    expect(screen.getByText("三点论证")).toBeInTheDocument();
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
    fireEvent.change(within(dialog).getByLabelText("版本名称"), {
      target: { value: "初版结构" }
    });
    fireEvent.change(within(dialog).getByLabelText("变更摘要"), {
      target: { value: "恢复前的基准版本。" }
    });
    fireEvent.click(within(dialog).getByRole("button", { name: "保存当前版本" }));
    expect(within(dialog).getByText("初版结构")).toBeInTheDocument();
    expect(within(dialog).getByText("恢复前的基准版本。")).toBeInTheDocument();

    fireEvent.click(within(dialog).getByRole("button", { name: "重置为示例 Deck" }));
    fireEvent.click(within(dialog).getByRole("button", { name: "恢复" }));

    expect(screen.getByText("已恢复版本：初版结构。")).toBeInTheDocument();
    expect(within(dialog).getByText("恢复前自动保存")).toBeInTheDocument();
  });

  it("shows a node-level AI rewrite error when API settings are missing", async () => {
    render(<App />);

    fireEvent.change(screen.getByLabelText("表达目标"), {
      target: { value: "用一个具体失败交易故事开场" }
    });
    fireEvent.click(screen.getByRole("button", { name: "AI 重写" }));

    expect(await screen.findByText("请先在设置中填写 API Key。")).toBeInTheDocument();
  });

  it("shows an AI rewrite comparison before applying the suggested slide", async () => {
    window.localStorage.setItem(
      "storydeck.aiSettings.v1",
      JSON.stringify({
        apiKey: "sk-test",
        baseUrl: "https://api.deepseek.com",
        model: "deepseek-v4-flash"
      })
    );
    vi.stubGlobal(
      "fetch",
      vi.fn(async () =>
        new Response(
          JSON.stringify({
            choices: [
              {
                message: {
                  content: JSON.stringify({
                    title: "一副耳机暴露了校园交易的阻塞点",
                    body: "同一个学生连续三次约交易失败，让信任、定价和履约成本变得可感知。",
                    bullets: ["状态难确认", "价格没参照", "见面反复延期"],
                    note: "用连续受阻的小故事承接当前意图。"
                  })
                }
              }
            ]
          }),
          { status: 200, headers: { "content-type": "application/json" } }
        )
      )
    );
    render(<App />);

    fireEvent.change(screen.getByLabelText("表达目标"), {
      target: { value: "用连续失败的小故事呈现交易成本" }
    });
    fireEvent.click(screen.getByRole("button", { name: "AI 重写" }));

    expect(await screen.findByText("AI 建议稿")).toBeInTheDocument();
    expect(screen.getByText("原稿")).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: "校园二手交易存在的问题" })).toBeInTheDocument();
    expect(screen.queryByRole("heading", { name: "一副耳机暴露了校园交易的阻塞点" })).not.toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: "应用 AI 建议" }));

    await waitFor(() => {
      expect(screen.getByRole("heading", { name: "一副耳机暴露了校园交易的阻塞点" })).toBeInTheDocument();
    });
    expect(screen.queryByText("AI 建议稿")).not.toBeInTheDocument();
  });
});
