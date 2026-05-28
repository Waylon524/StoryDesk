import type { DeckState, SlideLayoutKind } from "../types";
import type { Slide } from "../types";

export function selectNode(state: DeckState, nodeId: string): DeckState {
  if (!state.nodes.some((node) => node.id === nodeId)) {
    return state;
  }

  return {
    ...state,
    activeNodeId: nodeId
  };
}

export function applyIntentRewrite(state: DeckState, nodeId: string, intent: string): DeckState {
  const nodes = state.nodes.map((node) =>
    node.id === nodeId
      ? {
          ...node,
          intent,
          risk: "已根据场景化意图重写，下一步可补充真实数据或图片证据。"
        }
      : node
  );

  const slides = state.slides.map((slide) => {
    if (slide.nodeId !== nodeId) {
      return slide;
    }

    return {
      ...slide,
      title: "一台闲置耳机，为什么很难被真正卖出去？",
      body: "小林想卖掉一副闲置耳机。他发了朋友圈、班群和二手群，却连续遇到三个阻碍：买家不确定耳机状态，他不确定对方是否真想买，最后交易约了三次都没完成。",
      bullets: ["买家不确定耳机状态", "卖家不确定对方是否真想买", "交易约了三次都没完成"],
      note: "用户编辑的是意图，页面标题、正文和论证角度随之联动。"
    };
  });

  return {
    ...state,
    activeNodeId: nodeId,
    nodes,
    slides
  };
}

export function applySlideRewrite(
  state: DeckState,
  nodeId: string,
  intent: string,
  rewrittenSlide: Pick<Slide, "title" | "body" | "bullets" | "note">
): DeckState {
  return {
    ...state,
    activeNodeId: nodeId,
    nodes: state.nodes.map((node) =>
      node.id === nodeId
        ? {
            ...node,
            intent,
            risk: "已根据当前意图完成单页 AI 重写。"
          }
        : node
    ),
    slides: state.slides.map((slide) =>
      slide.nodeId === nodeId
        ? {
            ...slide,
            ...rewrittenSlide
          }
        : slide
    )
  };
}

export function applySlideLayout(state: DeckState, nodeId: string, layout: SlideLayoutKind): DeckState {
  return {
    ...state,
    activeNodeId: nodeId,
    slides: state.slides.map((slide) =>
      slide.nodeId === nodeId
        ? {
            ...slide,
            layout
          }
        : slide
    )
  };
}

export function moveNode(state: DeckState, activeId: string, overId: string): DeckState {
  const fromIndex = state.nodes.findIndex((node) => node.id === activeId);
  const toIndex = state.nodes.findIndex((node) => node.id === overId);

  if (fromIndex < 0 || toIndex < 0 || fromIndex === toIndex) {
    return state;
  }

  const nodes = [...state.nodes];
  const [movedNode] = nodes.splice(fromIndex, 1);
  nodes.splice(toIndex, 0, movedNode);

  const solutionIndex = nodes.findIndex((node) => node.title === "解决方向");
  const businessIndex = nodes.findIndex((node) => node.title === "商业模式");
  const riskPrompt =
    businessIndex >= 0 && solutionIndex >= 0 && businessIndex < solutionIndex
      ? "结构风险：听众尚未理解产品机制时，过早进入商业模式，可能造成理解断层。建议将该节点改写为“商业机会预告”，或先补充核心交易流程。"
      : null;

  return {
    ...state,
    activeNodeId: activeId,
    nodes,
    riskPrompt
  };
}

export function getActiveSlide(state: DeckState) {
  const activeNode = state.nodes.find((node) => node.id === state.activeNodeId);
  const activeSlide = state.slides.find((slide) => slide.nodeId === activeNode?.id);

  if (!activeSlide) {
    throw new Error(`No slide found for node ${state.activeNodeId}`);
  }

  return activeSlide;
}
