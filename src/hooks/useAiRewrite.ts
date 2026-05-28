import { type Dispatch, type SetStateAction, useState } from "react";
import { rewriteSlideFromIntent } from "../lib/aiGeneration";
import { applySlideRewrite } from "../lib/deckLogic";
import type { AiSettings, DeckState, Slide, StoryNode } from "../types";

interface RewriteCandidate {
  nodeId: string;
  intent: string;
  originalSlide: Slide;
  rewrittenSlide: Pick<Slide, "title" | "body" | "bullets" | "note">;
}

interface UseAiRewriteOptions {
  deckState: DeckState;
  activeNode: StoryNode;
  activeSlide: Slide;
  intentDraft: string;
  aiSettings: AiSettings;
  updateDeckState: (updater: (current: DeckState) => DeckState) => void;
  setIntentDraft: Dispatch<SetStateAction<string>>;
}

export function useAiRewrite({
  deckState,
  activeNode,
  activeSlide,
  intentDraft,
  aiSettings,
  updateDeckState,
  setIntentDraft
}: UseAiRewriteOptions) {
  const [slideRewriteState, setSlideRewriteState] = useState<{
    status: "idle" | "working" | "done" | "error";
    message: string;
  }>({ status: "idle", message: "" });
  const [rewriteCandidate, setRewriteCandidate] = useState<RewriteCandidate | null>(null);

  async function handleAiRewriteSlide() {
    setSlideRewriteState({ status: "working", message: "正在重写当前页..." });
    setRewriteCandidate(null);

    try {
      const rewrittenSlide = await rewriteSlideFromIntent(deckState, activeNode.id, intentDraft, aiSettings);
      setRewriteCandidate({
        nodeId: activeNode.id,
        intent: intentDraft,
        originalSlide: activeSlide,
        rewrittenSlide
      });
      setSlideRewriteState({ status: "done", message: "已生成 AI 建议稿，请对比后应用。" });
    } catch (error) {
      setSlideRewriteState({
        status: "error",
        message: error instanceof Error ? error.message : "AI 重写失败，请检查设置后重试。"
      });
    }
  }

  function handleApplyRewriteCandidate() {
    if (!rewriteCandidate) {
      return;
    }

    updateDeckState((current) =>
      applySlideRewrite(current, rewriteCandidate.nodeId, rewriteCandidate.intent, rewriteCandidate.rewrittenSlide)
    );
    setIntentDraft(rewriteCandidate.intent);
    setRewriteCandidate(null);
    setSlideRewriteState({ status: "done", message: "已应用 AI 建议稿。" });
    window.setTimeout(() => setSlideRewriteState({ status: "idle", message: "" }), 2200);
  }

  function handleDismissRewriteCandidate() {
    setRewriteCandidate(null);
    setSlideRewriteState({ status: "idle", message: "" });
  }

  function resetRewriteState() {
    setRewriteCandidate(null);
    setSlideRewriteState({ status: "idle", message: "" });
  }

  return {
    slideRewriteState,
    rewriteCandidate,
    handleAiRewriteSlide,
    handleApplyRewriteCandidate,
    handleDismissRewriteCandidate,
    resetRewriteState
  };
}
