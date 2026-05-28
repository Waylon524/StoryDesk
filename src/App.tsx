import { Download, Settings } from "lucide-react";
import { type ChangeEvent, useState } from "react";
import { IntentPanel } from "./components/IntentPanel";
import { NarrativeMap } from "./components/NarrativeMap";
import { SettingsModal } from "./components/SettingsModal";
import { SlidePreview } from "./components/SlidePreview";
import { useAiRewrite } from "./hooks/useAiRewrite";
import { useDeckWorkspace } from "./hooks/useDeckWorkspace";
import { useLibreOfficePreview } from "./hooks/useLibreOfficePreview";
import { useProjectVersions } from "./hooks/useProjectVersions";
import { generateDeckFromBrief, generateTemplateForDeck } from "./lib/aiGeneration";
import { loadAiSettings, saveAiSettings } from "./lib/aiSettings";
import { ensureDeckState } from "./lib/deckTemplate";
import { parseDeckJson, serializeDeckState } from "./lib/deckPersistence";
import { exportDeckPptx } from "./lib/pptxExport";
import type { AiSettings } from "./types";

function App() {
  const {
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
  } = useDeckWorkspace();
  const [exportState, setExportState] = useState<"idle" | "working" | "done">("idle");
  const [aiSettings, setAiSettings] = useState<AiSettings>(() => loadAiSettings());
  const [settingsDraft, setSettingsDraft] = useState<AiSettings>(() => loadAiSettings());
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [generationState, setGenerationState] = useState<{
    status: "idle" | "working" | "done" | "error";
    message: string;
  }>({ status: "idle", message: "" });
  const [templateGenerationState, setTemplateGenerationState] = useState<{
    status: "idle" | "working" | "done" | "error";
    message: string;
  }>({ status: "idle", message: "" });
  const previewState = useLibreOfficePreview(deckState);
  const {
    versions,
    versionDraft,
    setVersionDraft,
    projectState,
    setProjectState,
    handleSaveVersion,
    saveAutomaticVersion,
    handleRestoreVersion
  } = useProjectVersions();
  const {
    slideRewriteState,
    rewriteCandidate,
    handleAiRewriteSlide,
    handleApplyRewriteCandidate,
    handleDismissRewriteCandidate,
    resetRewriteState
  } = useAiRewrite({
    deckState,
    activeNode,
    activeSlide,
    intentDraft,
    aiSettings,
    setDeckState,
    setIntentDraft
  });

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
      if (!currentSettings.apiKey.trim()) {
        throw new Error("请先在设置中填写 API Key。");
      }
      if (settingsOpen) {
        saveAiSettings(currentSettings);
        setAiSettings(currentSettings);
      }

      const next = await generateDeckFromBrief(brief, currentSettings);
      replaceDeck(ensureDeckState(next));
      resetRewriteState();
      setGenerationState({ status: "done", message: "已生成新的叙事地图，可继续编辑节点意图。" });
      window.setTimeout(() => setGenerationState({ status: "idle", message: "" }), 2200);
    } catch (error) {
      setGenerationState({
        status: "error",
        message: error instanceof Error ? error.message : "AI 生成失败，请检查设置后重试。"
      });
    }
  }

  async function handleRegenerateTemplate() {
    setTemplateGenerationState({ status: "working", message: "正在根据当前叙事地图生成模板..." });

    try {
      const currentSettings = settingsOpen ? settingsDraft : aiSettings;
      if (!currentSettings.apiKey.trim()) {
        throw new Error("请先在设置中填写 API Key。");
      }
      if (settingsOpen) {
        saveAiSettings(currentSettings);
        setAiSettings(currentSettings);
      }

      saveAutomaticVersion(
        deckState,
        "模板重生成前自动保存",
        `重新生成「${deckState.template.name}」模板前的当前状态。`
      );
      const template = await generateTemplateForDeck(deckState, brief, currentSettings);
      setDeckState((current) => ({
        ...current,
        template
      }));
      setTemplateGenerationState({ status: "done", message: "已重新生成并锁定模板，已自动保存变更前版本。" });
      window.setTimeout(() => setTemplateGenerationState({ status: "idle", message: "" }), 2600);
    } catch (error) {
      setTemplateGenerationState({
        status: "error",
        message: error instanceof Error ? error.message : "AI 模板生成失败，请检查设置后重试。"
      });
    }
  }

  function handleResetDeck() {
    resetDeck();
    resetRewriteState();
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
      replaceDeck(ensureDeckState(importedDeck));
      resetRewriteState();
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
          onSelectNode={(nodeId) => {
            handleSelectNode(nodeId);
            resetRewriteState();
          }}
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
          deckTemplate={deckState.template}
          templateGenerationState={templateGenerationState}
          versions={versions}
          versionDraft={versionDraft}
          setVersionDraft={setVersionDraft}
          projectState={projectState}
          onClose={() => setSettingsOpen(false)}
          onGenerateDeck={handleGenerateDeck}
          onRegenerateTemplate={handleRegenerateTemplate}
          onSaveVersion={() => handleSaveVersion(deckState)}
          onRestoreVersion={(versionId) =>
            handleRestoreVersion({
              currentDeck: deckState,
              versionId,
              onRestore: (restoredDeck) => {
                replaceDeck(restoredDeck);
                resetRewriteState();
              }
            })
          }
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
