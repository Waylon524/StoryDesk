import type { DragEndEvent } from "@dnd-kit/core";
import { Download, Settings } from "lucide-react";
import { type ChangeEvent, useEffect, useMemo, useState } from "react";
import { IntentPanel } from "./components/IntentPanel";
import { NarrativeMap } from "./components/NarrativeMap";
import { SettingsModal } from "./components/SettingsModal";
import { SlidePreview } from "./components/SlidePreview";
import { initialDeck } from "./data/seedDeck";
import { generateDeckFromBrief, rewriteSlideFromIntent } from "./lib/aiGeneration";
import { loadAiSettings, saveAiSettings } from "./lib/aiSettings";
import { applyIntentRewrite, applySlideRewrite, getActiveSlide, moveNode, selectNode } from "./lib/deckLogic";
import { ensureDeckState } from "./lib/deckTemplate";
import {
  clearSavedDeck,
  loadSavedDeck,
  parseDeckJson,
  saveDeckState,
  serializeDeckState
} from "./lib/deckPersistence";
import { appendDeckVersion, loadDeckVersions, restoreDeckVersion } from "./lib/deckVersions";
import { renderSlidePreviewImage } from "./lib/libreOfficePreview";
import { exportDeckPptx } from "./lib/pptxExport";
import type { AiSettings, DeckBrief, DeckState, DeckVersion, Slide } from "./types";

interface RewriteCandidate {
  nodeId: string;
  intent: string;
  originalSlide: Slide;
  rewrittenSlide: Pick<Slide, "title" | "body" | "bullets" | "note">;
}

function App() {
  const [initialDeckState] = useState<DeckState>(() => ensureDeckState(loadSavedDeck() ?? initialDeck));
  const [deckState, setDeckState] = useState<DeckState>(initialDeckState);
  const [versions, setVersions] = useState<DeckVersion[]>(() => loadDeckVersions());
  const [intentDraft, setIntentDraft] = useState(
    initialDeckState.nodes.find((node) => node.id === initialDeckState.activeNodeId)?.intent ?? initialDeckState.nodes[0].intent
  );
  const [exportState, setExportState] = useState<"idle" | "working" | "done">("idle");
  const [aiSettings, setAiSettings] = useState<AiSettings>(() => loadAiSettings());
  const [settingsDraft, setSettingsDraft] = useState<AiSettings>(() => loadAiSettings());
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [versionDraft, setVersionDraft] = useState({
    label: "",
    summary: ""
  });
  const [brief, setBrief] = useState<DeckBrief>({
    topic: "校园二手交易平台",
    audience: initialDeckState.deck.audience,
    goal: initialDeckState.deck.goal,
    duration: initialDeckState.deck.duration
  });
  const [generationState, setGenerationState] = useState<{
    status: "idle" | "working" | "done" | "error";
    message: string;
  }>({ status: "idle", message: "" });
  const [projectState, setProjectState] = useState<{
    status: "idle" | "done" | "error";
    message: string;
  }>({ status: "idle", message: "当前项目会自动保存。" });
  const [slideRewriteState, setSlideRewriteState] = useState<{
    status: "idle" | "working" | "done" | "error";
    message: string;
  }>({ status: "idle", message: "" });
  const [previewState, setPreviewState] = useState<{
    status: "idle" | "rendering" | "ready" | "error";
    imageUrl: string | null;
    message: string;
  }>({ status: "idle", imageUrl: null, message: "正在等待 LibreOffice 预览服务。" });
  const [rewriteCandidate, setRewriteCandidate] = useState<RewriteCandidate | null>(null);

  useEffect(() => {
    saveDeckState(deckState);
  }, [deckState]);

  useEffect(() => {
    if (import.meta.env.MODE === "test") {
      return;
    }

    const controller = new AbortController();
    const timeout = window.setTimeout(() => {
      setPreviewState((current) => ({
        status: "rendering",
        imageUrl: null,
        message: "正在使用 LibreOffice 渲染真实 PPT 预览..."
      }));

      renderSlidePreviewImage(deckState, deckState.activeNodeId, controller.signal)
        .then((imageUrl) => {
          setPreviewState((current) => {
            if (current.imageUrl) {
              URL.revokeObjectURL(current.imageUrl);
            }
            return {
              status: "ready",
              imageUrl,
              message: "预览来自 LibreOffice 渲染结果。"
            };
          });
        })
        .catch((error) => {
          if (controller.signal.aborted) {
            return;
          }
          setPreviewState((current) => ({
            status: "error",
            imageUrl: current.imageUrl,
            message:
              error instanceof TypeError
                ? "LibreOffice 预览服务未连接，已回退到编辑预览。请运行 npm run preview-server。"
                : error instanceof Error
                  ? error.message
                  : "LibreOffice 预览服务不可用，已回退到编辑预览。"
          }));
        });
    }, 800);

    return () => {
      controller.abort();
      window.clearTimeout(timeout);
    };
  }, [deckState]);

  useEffect(() => {
    return () => {
      if (previewState.imageUrl) {
        URL.revokeObjectURL(previewState.imageUrl);
      }
    };
  }, [previewState.imageUrl]);

  const activeNode = useMemo(
    () => deckState.nodes.find((node) => node.id === deckState.activeNodeId) ?? deckState.nodes[0],
    [deckState.activeNodeId, deckState.nodes]
  );
  const activeSlide = getActiveSlide(deckState);
  const totalMinutes = deckState.nodes.reduce((sum, node) => {
    const [minutes, seconds] = node.duration.split(":").map(Number);
    return sum + minutes + seconds / 60;
  }, 0);

  function handleSelectNode(nodeId: string) {
    const next = selectNode(deckState, nodeId);
    const selected = next.nodes.find((node) => node.id === nodeId);
    setDeckState(next);
    setIntentDraft(selected?.intent ?? "");
    setRewriteCandidate(null);
    setSlideRewriteState({ status: "idle", message: "" });
  }

  function handleApplyIntent() {
    setDeckState((current) => applyIntentRewrite(current, activeNode.id, intentDraft));
  }

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

    setDeckState((current) =>
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

  function openSettings() {
    setSettingsDraft(aiSettings);
    setSettingsOpen(true);
  }

  function handleSaveSettings() {
    saveAiSettings(settingsDraft);
    const saved = loadAiSettings();
    setAiSettings(saved);
    setSettingsDraft(saved);
    setSettingsOpen(false);
  }

  async function handleGenerateDeck() {
    setGenerationState({ status: "working", message: "正在生成叙事地图..." });

    try {
      const currentSettings = settingsOpen ? settingsDraft : aiSettings;
      if (settingsOpen) {
        saveAiSettings(currentSettings);
        setAiSettings(currentSettings);
      }

      const next = await generateDeckFromBrief(brief, currentSettings);
      setDeckState(ensureDeckState(next));
      setIntentDraft(next.nodes[0]?.intent ?? "");
      setGenerationState({ status: "done", message: "已生成新的叙事地图，可继续编辑节点意图。" });
      window.setTimeout(() => setGenerationState({ status: "idle", message: "" }), 2200);
    } catch (error) {
      setGenerationState({
        status: "error",
        message: error instanceof Error ? error.message : "AI 生成失败，请检查设置后重试。"
      });
    }
  }

  function handleResetDeck() {
    clearSavedDeck();
    setDeckState(ensureDeckState(initialDeck));
    setIntentDraft(initialDeck.nodes[0].intent);
    setBrief({
      topic: "校园二手交易平台",
      audience: initialDeck.deck.audience,
      goal: initialDeck.deck.goal,
      duration: initialDeck.deck.duration
    });
    setProjectState({ status: "done", message: "已重置为示例 Deck。" });
  }

  function handleExportProject() {
    const blob = new Blob([serializeDeckState(deckState)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement("a");
    anchor.href = url;
    anchor.download = `${deckState.deck.title || "StoryDeck"}.storydeck.json`;
    anchor.click();
    URL.revokeObjectURL(url);
    setProjectState({ status: "done", message: "已导出 .storydeck.json 项目文件。" });
  }

  async function handleImportProject(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    if (!file) {
      return;
    }

    try {
      const importedDeck = parseDeckJson(await file.text());
      const nextDeck = ensureDeckState(importedDeck);
      setDeckState(nextDeck);
      setIntentDraft(nextDeck.nodes.find((node) => node.id === nextDeck.activeNodeId)?.intent ?? nextDeck.nodes[0].intent);
      setBrief((current) => ({
        ...current,
        audience: nextDeck.deck.audience,
        goal: nextDeck.deck.goal,
        duration: nextDeck.deck.duration
      }));
      setProjectState({ status: "done", message: `已导入 ${file.name}。` });
    } catch (error) {
      setProjectState({
        status: "error",
        message: error instanceof Error ? error.message : "导入失败，请选择有效的 StoryDeck 项目文件。"
      });
    } finally {
      event.target.value = "";
    }
  }

  function handleSaveVersion() {
    const nextVersions = appendDeckVersion(deckState, versionDraft.label || "手动保存", undefined, new Date(), versionDraft.summary);
    setVersions(nextVersions);
    setVersionDraft({ label: "", summary: "" });
    setProjectState({ status: "done", message: "已保存当前版本。" });
  }

  function handleRestoreVersion(versionId: string) {
    const restoredDeck = restoreDeckVersion(versions, versionId);
    const version = versions.find((item) => item.id === versionId);
    if (!restoredDeck || !version) {
      setProjectState({ status: "error", message: "未找到这个版本。" });
      return;
    }

    const nextVersions = appendDeckVersion(
      deckState,
      "恢复前自动保存",
      undefined,
      new Date(),
      `恢复「${version.label}」前的当前状态。`
    );
    const nextDeck = ensureDeckState(restoredDeck);
    setDeckState(nextDeck);
    setVersions(nextVersions);
    setIntentDraft(nextDeck.nodes.find((node) => node.id === nextDeck.activeNodeId)?.intent ?? nextDeck.nodes[0].intent);
    setBrief((current) => ({
      ...current,
      audience: nextDeck.deck.audience,
      goal: nextDeck.deck.goal,
      duration: nextDeck.deck.duration
    }));
    setProjectState({ status: "done", message: `已恢复版本：${version.label}。` });
  }

  async function exportPptx() {
    setExportState("working");
    await exportDeckPptx(deckState);
    setExportState("done");
    window.setTimeout(() => setExportState("idle"), 1800);
  }

  return (
    <div className="app-shell">
      <header className="topbar">
        <div className="brand-lockup">
          <div className="brand-mark">S</div>
          <div>
            <strong>StoryDeck</strong>
            <span>AI Native PPT 叙事工作台</span>
          </div>
        </div>
        <div className="deck-meta">
          <span>{deckState.deck.audience}</span>
          <span>{deckState.deck.duration}</span>
          <span>{totalMinutes.toFixed(1)} 分钟结构</span>
          <span>{aiSettings.apiKey ? "API 已配置" : "API 未配置"}</span>
        </div>
        <button className="secondary-action" onClick={openSettings}>
          <Settings size={16} />
          设置
        </button>
        <button className="primary-action" onClick={exportPptx} disabled={exportState === "working"}>
          <Download size={16} />
          {exportState === "working" ? "导出中" : exportState === "done" ? "已导出" : "导出 PPTX"}
        </button>
      </header>

      <main className="workspace">
        <NarrativeMap
          nodes={deckState.nodes}
          activeNodeId={activeNode.id}
          onSelectNode={handleSelectNode}
          onDragEnd={handleDragEnd}
        />
        <SlidePreview
          activeNode={activeNode}
          activeSlide={activeSlide}
          template={deckState.template}
          rewriteStatus={slideRewriteState.status}
          previewState={previewState}
          onAiRewriteSlide={handleAiRewriteSlide}
        />
        <IntentPanel
          deckGoal={deckState.deck.goal}
          deckTone={deckState.deck.tone}
          deckDuration={deckState.deck.duration}
          activeNode={activeNode}
          intentDraft={intentDraft}
          setIntentDraft={setIntentDraft}
          slideRewriteState={slideRewriteState}
          rewriteCandidate={rewriteCandidate}
          riskPrompt={deckState.riskPrompt}
          onApplyIntent={handleApplyIntent}
          onAiRewriteSlide={handleAiRewriteSlide}
          onDismissRewriteCandidate={handleDismissRewriteCandidate}
          onApplyRewriteCandidate={handleApplyRewriteCandidate}
          onApplyRiskSuggestion={applyRiskSuggestion}
        />
      </main>

      {settingsOpen ? (
        <SettingsModal
          brief={brief}
          setBrief={setBrief}
          settingsDraft={settingsDraft}
          setSettingsDraft={setSettingsDraft}
          generationState={generationState}
          versions={versions}
          versionDraft={versionDraft}
          setVersionDraft={setVersionDraft}
          projectState={projectState}
          onClose={() => setSettingsOpen(false)}
          onGenerateDeck={handleGenerateDeck}
          onSaveVersion={handleSaveVersion}
          onRestoreVersion={handleRestoreVersion}
          onResetDeck={handleResetDeck}
          onExportProject={handleExportProject}
          onImportProject={handleImportProject}
          onSaveSettings={handleSaveSettings}
        />
      ) : null}
    </div>
  );
}

export default App;
