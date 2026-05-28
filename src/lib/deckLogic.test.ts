import { describe, expect, it } from "vitest";
import { initialDeck } from "../data/seedDeck";
import { applyIntentRewrite, applySlideRewrite, getActiveSlide, moveNode, selectNode } from "./deckLogic";

describe("deck narrative state", () => {
  it("selects a narrative node and resolves the bound slide", () => {
    const state = selectNode(initialDeck, "node-3");

    expect(state.activeNodeId).toBe("node-3");
    expect(getActiveSlide(state).title).toBe("不是没有需求，而是交易成本太高");
  });

  it("rewrites the problem-intent node into a concrete story slide", () => {
    const state = applyIntentRewrite(
      initialDeck,
      "node-1",
      "用真实场景让听众感受到交易低效"
    );
    const slide = getActiveSlide(state);

    expect(state.nodes[0].intent).toBe("用真实场景让听众感受到交易低效");
    expect(slide.title).toBe("一台闲置耳机，为什么很难被真正卖出去？");
    expect(slide.body).toContain("小林想卖掉一副闲置耳机");
    expect(slide.bullets).toEqual(["买家不确定耳机状态", "卖家不确定对方是否真想买", "交易约了三次都没完成"]);
  });

  it("warns when commercial logic is moved before the product solution", () => {
    const state = moveNode(initialDeck, "node-5", "node-4");

    expect(state.nodes[3].id).toBe("node-5");
    expect(state.riskPrompt).toContain("过早进入商业模式");
  });

  it("updates the selected slide and intent without changing other slides", () => {
    const state = applySlideRewrite(initialDeck, "node-3", "把矛盾写成三段阻碍", {
      title: "交易失败不是偶然，而是三段成本叠加",
      body: "买卖双方在状态验证、价格判断和线下履约上连续受阻。",
      bullets: ["状态验证成本", "价格判断成本", "线下履约成本"],
      note: "这一页只改核心矛盾节点。"
    });

    expect(state.activeNodeId).toBe("node-3");
    expect(state.nodes.find((node) => node.id === "node-3")?.intent).toBe("把矛盾写成三段阻碍");
    expect(state.slides.find((slide) => slide.nodeId === "node-3")).toMatchObject({
      layout: "three-point",
      title: "交易失败不是偶然，而是三段成本叠加",
      bullets: ["状态验证成本", "价格判断成本", "线下履约成本"]
    });
    expect(state.slides.find((slide) => slide.nodeId === "node-2")?.title).toBe("毕业季之前，闲置物品开始堆积");
  });

  it("keeps the deck template stable when a slide is rewritten", () => {
    const state = applySlideRewrite(initialDeck, "node-3", "把矛盾写成三段阻碍", {
      title: "交易失败不是偶然，而是三段成本叠加",
      body: "买卖双方在状态验证、价格判断和线下履约上连续受阻。",
      bullets: ["状态验证成本", "价格判断成本", "线下履约成本"],
      note: "这一页只改核心矛盾节点。"
    });

    expect(state.template).toEqual(initialDeck.template);
    expect(state.slides.find((slide) => slide.nodeId === "node-3")?.layout).toBe("three-point");
  });
});
