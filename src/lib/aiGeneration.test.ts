import { describe, expect, it, vi } from "vitest";
import { generateDeckFromBrief, rewriteSlideFromIntent, resolveChatCompletionsEndpoint } from "./aiGeneration";
import { initialDeck } from "../data/seedDeck";
import type { AiSettings, DeckBrief } from "../types";

const settings: AiSettings = {
  apiKey: "sk-test",
  baseUrl: "https://api.deepseek.com",
  model: "deepseek-v4-flash"
};

const brief: DeckBrief = {
  topic: "校园二手交易平台",
  audience: "投资人",
  goal: "证明需求真实并获得种子资金",
  duration: "8分钟"
};

describe("ai deck generation", () => {
  it("routes DeepSeek calls through the local Vite proxy during browser development", () => {
    expect(resolveChatCompletionsEndpoint("https://api.deepseek.com/")).toBe(
      "/deepseek/v1/chat/completions"
    );
    expect(resolveChatCompletionsEndpoint("https://api.openai.com")).toBe(
      "https://api.openai.com/v1/chat/completions"
    );
  });

  it("posts an OpenAI-compatible request and converts JSON content into a deck", async () => {
    const fetcher = vi.fn(async (_input: RequestInfo | URL, _init?: RequestInit) =>
      new Response(
        JSON.stringify({
          choices: [
            {
              message: {
                content: JSON.stringify({
                  deck: {
                    title: "校园二手交易平台融资叙事",
                    audience: "投资人",
                    goal: "证明需求真实并获得种子资金",
                    tone: "清晰、克制、有商业判断",
                    duration: "8分钟"
                  },
                  nodes: [
                    {
                      title: "真实痛点",
                      intent: "用毕业季闲置堆积引出交易效率问题",
                      role: "开场",
                      duration: "0:45",
                      slide: {
                        layout: "statement",
                        title: "闲置物品不是没有价值，而是难以被安全成交",
                        body: "毕业季集中释放供给，但校内买卖双方仍被信任、定价和交付阻碍。",
                        bullets: ["供给集中释放", "信任成本高", "交付难约定"],
                        note: "用具体校园场景开场。"
                      }
                    },
                    {
                      title: "解决路径",
                      intent: "说明产品如何降低交易成本",
                      role: "转折",
                      duration: "1:00",
                      slide: {
                        layout: "process",
                        title: "把交易成本拆成四个可降低环节",
                        body: "围绕发布、匹配、认证和交付建立闭环。",
                        bullets: ["标准化发布", "校内身份认证", "预约交付"],
                        note: "避免堆功能。"
                      }
                    }
                  ]
                })
              }
            }
          ]
        }),
        { status: 200, headers: { "content-type": "application/json" } }
      )
    );

    const deck = await generateDeckFromBrief(brief, settings, fetcher);

    expect(fetcher).toHaveBeenCalledWith(
      "/deepseek/v1/chat/completions",
      expect.objectContaining({
        method: "POST",
        headers: expect.objectContaining({
          Authorization: "Bearer sk-test",
          "Content-Type": "application/json"
        })
      })
    );
    const firstCall = fetcher.mock.calls[0];
    const request = JSON.parse(firstCall[1]?.body as string);
    expect(request.model).toBe("deepseek-v4-flash");
    expect(request.messages[1].content).toContain("校园二手交易平台");
    expect(request.messages[1].content).toContain("statement|three-point|process|closing");
    expect(deck.nodes).toHaveLength(2);
    expect(deck.nodes[0]).toMatchObject({
      id: "ai-node-1",
      slideId: "ai-slide-1",
      title: "真实痛点"
    });
    expect(deck.slides[0]).toMatchObject({
      id: "ai-slide-1",
      nodeId: "ai-node-1",
      layout: "statement",
      title: "闲置物品不是没有价值，而是难以被安全成交"
    });
    expect(deck.slides[1].layout).toBe("process");
  });

  it("rewrites only the selected slide from the node intent context", async () => {
    const fetcher = vi.fn(async (_input: RequestInfo | URL, _init?: RequestInit) =>
      new Response(
        JSON.stringify({
          choices: [
            {
              message: {
                content: JSON.stringify({
                  title: "一副耳机卡住了校园交易的真实矛盾",
                  body: "从一个学生三次约交易失败的故事切入，让听众先感受到信任和履约成本。",
                  bullets: ["状态不透明", "沟通成本高", "见面履约不确定"],
                  note: "用一个连续受阻的小故事，而不是直接抛结论。"
                })
              }
            }
          ]
        }),
        { status: 200, headers: { "content-type": "application/json" } }
      )
    );

    const rewritten = await rewriteSlideFromIntent(
      initialDeck,
      "node-1",
      "用一个连续受阻的小故事开场",
      settings,
      fetcher
    );

    expect(fetcher).toHaveBeenCalledWith(
      "/deepseek/v1/chat/completions",
      expect.objectContaining({
        method: "POST",
        headers: expect.objectContaining({
          Authorization: "Bearer sk-test"
        })
      })
    );
    const firstCall = fetcher.mock.calls[0];
    const request = JSON.parse(firstCall[1]?.body as string);
    expect(request.model).toBe("deepseek-v4-flash");
    expect(request.messages[1].content).toContain("问题引入");
    expect(request.messages[1].content).toContain("用一个连续受阻的小故事开场");
    expect(rewritten).toEqual({
      title: "一副耳机卡住了校园交易的真实矛盾",
      body: "从一个学生三次约交易失败的故事切入，让听众先感受到信任和履约成本。",
      bullets: ["状态不透明", "沟通成本高", "见面履约不确定"],
      note: "用一个连续受阻的小故事，而不是直接抛结论。"
    });
  });

  it("creates a fixed deck template when a new narrative map is generated", async () => {
    const fetcher = vi.fn(async (_input: RequestInfo | URL, _init?: RequestInit) =>
      new Response(
        JSON.stringify({
          choices: [
            {
              message: {
                content: JSON.stringify({
                  deck: {
                    title: "AI 生成项目",
                    audience: "投资人",
                    goal: "说明机会",
                    tone: "清晰",
                    duration: "8分钟"
                  },
                  nodes: [
                    {
                      title: "问题引入",
                      intent: "从具体场景切入",
                      role: "开场",
                      duration: "0:45",
                      slide: {
                        layout: "unknown",
                        title: "一个具体问题",
                        body: "用故事打开。",
                        bullets: ["场景", "阻碍", "机会"],
                        note: "开场页。"
                      }
                    }
                  ]
                })
              }
            }
          ]
        }),
        { status: 200, headers: { "content-type": "application/json" } }
      )
    );

    const deck = await generateDeckFromBrief(brief, settings, fetcher);

    expect(deck.template).toMatchObject({
      aspectRatio: "16:9",
      backgroundColor: expect.any(String),
      accentColor: expect.any(String)
    });
    expect(deck.slides[0].layout).toBe("statement");
  });
});
