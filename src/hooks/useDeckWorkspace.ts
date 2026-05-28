import type { DragEndEvent } from "@dnd-kit/core";
import { useEffect, useMemo, useRef, useState } from "react";
import { initialDeck } from "../data/seedDeck";
import { applyIntentRewrite, applySlideLayout, getActiveSlide, moveNode, selectNode } from "../lib/deckLogic";
import { ensureDeckState } from "../lib/deckTemplate";
import { clearSavedDeck, loadSavedDeck, saveDeckState } from "../lib/deckPersistence";
import type { DeckBrief, DeckState, SlideLayoutKind } from "../types";

const maxUndoDepth = 20;

interface ReplaceDeckOptions {
  trackUndo?: boolean;
}

export function useDeckWorkspace() {
  const [initialDeckState] = useState<DeckState>(() => ensureDeckState(loadSavedDeck() ?? initialDeck));
  const deckStateRef = useRef<DeckState>(initialDeckState);
  const [deckState, setDeckState] = useState<DeckState>(initialDeckState);
  const [undoStack, setUndoStack] = useState<DeckState[]>([]);
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

  function pushUndoSnapshot(snapshot: DeckState) {
    setUndoStack((current) => [snapshot, ...current].slice(0, maxUndoDepth));
  }

  function setCurrentDeckState(nextDeck: DeckState) {
    deckStateRef.current = nextDeck;
    setDeckState(nextDeck);
  }

  function updateDeckStateWithUndo(updater: (current: DeckState) => DeckState) {
    const current = deckStateRef.current;
    const next = ensureDeckState(updater(current));
    if (next === current) {
      return;
    }

    pushUndoSnapshot(current);
    setCurrentDeckState(next);
  }

  function replaceDeck(nextDeck: DeckState, options: ReplaceDeckOptions = {}) {
    const ensuredDeck = ensureDeckState(nextDeck);
    if (options.trackUndo) {
      pushUndoSnapshot(deckStateRef.current);
    } else {
      setUndoStack([]);
    }
    setCurrentDeckState(ensuredDeck);
    syncIntentDraft(ensuredDeck);
    syncBriefFromDeck(ensuredDeck);
  }

  function handleUndo() {
    const previous = undoStack[0];
    if (!previous) {
      return;
    }

    const ensuredPrevious = ensureDeckState(previous);
    setCurrentDeckState(ensuredPrevious);
    setUndoStack((current) => current.slice(1));
    syncIntentDraft(ensuredPrevious);
    syncBriefFromDeck(ensuredPrevious);
  }

  function handleSelectNode(nodeId: string) {
    const next = selectNode(deckState, nodeId);
    const selected = next.nodes.find((node) => node.id === nodeId);
    setCurrentDeckState(next);
    setIntentDraft(selected?.intent ?? "");
  }

  function handleApplyIntent() {
    updateDeckStateWithUndo((current) => applyIntentRewrite(current, activeNode.id, intentDraft));
  }

  function handleChangeSlideLayout(layout: SlideLayoutKind) {
    updateDeckStateWithUndo((current) => applySlideLayout(current, activeNode.id, layout));
  }

  function handleDragEnd(event: DragEndEvent) {
    const { active, over } = event;
    if (!over || active.id === over.id) {
      return;
    }
    updateDeckStateWithUndo((current) => {
      const next = moveNode(current, String(active.id), String(over.id));
      const movedNode = next.nodes.find((node) => node.id === String(active.id));
      setIntentDraft(movedNode?.intent ?? "");
      return next;
    });
  }

  function applyRiskSuggestion() {
    const suggestedIntent = "先让听众意识到校园交易具备可商业化空间，而不展开复杂收入模型。";
    setIntentDraft(suggestedIntent);
    updateDeckStateWithUndo((current) => ({
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
    replaceDeck(ensureDeckState(initialDeck), { trackUndo: true });
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
    updateDeckStateWithUndo,
    activeNode,
    activeSlide,
    totalMinutes,
    canUndo: undoStack.length > 0,
    intentDraft,
    setIntentDraft,
    brief,
    setBrief,
    replaceDeck,
    resetDeck,
    handleUndo,
    handleSelectNode,
    handleApplyIntent,
    handleChangeSlideLayout,
    handleDragEnd,
    applyRiskSuggestion
  };
}
