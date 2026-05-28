import type { DragEndEvent } from "@dnd-kit/core";
import { useEffect, useMemo, useState } from "react";
import { initialDeck } from "../data/seedDeck";
import { applyIntentRewrite, getActiveSlide, moveNode, selectNode } from "../lib/deckLogic";
import { ensureDeckState } from "../lib/deckTemplate";
import { clearSavedDeck, loadSavedDeck, saveDeckState } from "../lib/deckPersistence";
import type { DeckBrief, DeckState } from "../types";

export function useDeckWorkspace() {
  const [initialDeckState] = useState<DeckState>(() => ensureDeckState(loadSavedDeck() ?? initialDeck));
  const [deckState, setDeckState] = useState<DeckState>(initialDeckState);
  const [intentDraft, setIntentDraft] = useState(
    initialDeckState.nodes.find((node) => node.id === initialDeckState.activeNodeId)?.intent ?? initialDeckState.nodes[0].intent
  );
  const [brief, setBrief] = useState<DeckBrief>({
    topic: "校园二手交易平台",
    audience: initialDeckState.deck.audience,
    goal: initialDeckState.deck.goal,
    duration: initialDeckState.deck.duration
  });

  useEffect(() => {
    saveDeckState(deckState);
  }, [deckState]);

  const activeNode = useMemo(
    () => deckState.nodes.find((node) => node.id === deckState.activeNodeId) ?? deckState.nodes[0],
    [deckState.activeNodeId, deckState.nodes]
  );
  const activeSlide = getActiveSlide(deckState);
  const totalMinutes = deckState.nodes.reduce((sum, node) => {
    const [minutes, seconds] = node.duration.split(":").map(Number);
    return sum + minutes + seconds / 60;
  }, 0);

  function replaceDeck(nextDeck: DeckState) {
    const ensuredDeck = ensureDeckState(nextDeck);
    setDeckState(ensuredDeck);
    syncIntentDraft(ensuredDeck);
    syncBriefFromDeck(ensuredDeck);
  }

  function handleSelectNode(nodeId: string) {
    const next = selectNode(deckState, nodeId);
    const selected = next.nodes.find((node) => node.id === nodeId);
    setDeckState(next);
    setIntentDraft(selected?.intent ?? "");
  }

  function handleApplyIntent() {
    setDeckState((current) => applyIntentRewrite(current, activeNode.id, intentDraft));
  }

  function handleDragEnd(event: DragEndEvent) {
    const { active, over } = event;
    if (!over || active.id === over.id) {
      return;
    }
    setDeckState((current) => {
      const next = moveNode(current, String(active.id), String(over.id));
      const movedNode = next.nodes.find((node) => node.id === String(active.id));
      setIntentDraft(movedNode?.intent ?? "");
      return next;
    });
  }

  function applyRiskSuggestion() {
    const suggestedIntent = "先让听众意识到校园交易具备可商业化空间，而不展开复杂收入模型。";
    setIntentDraft(suggestedIntent);
    setDeckState((current) => ({
      ...current,
      riskPrompt: null,
      nodes: current.nodes.map((node) =>
        node.id === "node-5"
          ? {
              ...node,
              title: "商业机会预告",
              intent: suggestedIntent
            }
          : node
      ),
      slides: current.slides.map((slide) =>
        slide.nodeId === "node-5"
          ? {
              ...slide,
              title: "校园交易里已经存在可被服务的商业空间",
              body: "在讲清产品机制之前，先用交易频次和服务缺口提示商业机会，把详细收入模型留到后半段。",
              bullets: ["周期性高频交易", "校内信任服务缺口", "后续可展开收入模型"],
              note: "结构移动后，页面表达从收入模型改成机会预告。"
            }
          : slide
      )
    }));
  }

  function resetDeck() {
    clearSavedDeck();
    replaceDeck(ensureDeckState(initialDeck));
    setBrief({
      topic: "校园二手交易平台",
      audience: initialDeck.deck.audience,
      goal: initialDeck.deck.goal,
      duration: initialDeck.deck.duration
    });
  }

  function syncIntentDraft(deck: DeckState) {
    setIntentDraft(deck.nodes.find((node) => node.id === deck.activeNodeId)?.intent ?? deck.nodes[0].intent);
  }

  function syncBriefFromDeck(deck: DeckState) {
    setBrief((current) => ({
      ...current,
      audience: deck.deck.audience,
      goal: deck.deck.goal,
      duration: deck.deck.duration
    }));
  }

  return {
    deckState,
    setDeckState,
    activeNode,
    activeSlide,
    totalMinutes,
    intentDraft,
    setIntentDraft,
    brief,
    setBrief,
    replaceDeck,
    resetDeck,
    handleSelectNode,
    handleApplyIntent,
    handleDragEnd,
    applyRiskSuggestion
  };
}
