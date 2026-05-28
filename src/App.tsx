import { DndContext, type DragEndEvent, closestCenter } from "@dnd-kit/core";
import { SortableContext, verticalListSortingStrategy, useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import {
  AlertTriangle,
  ArrowDownUp,
  Bot,
  Check,
  Clock3,
  Download,
  FileDown,
  FileText,
  GripVertical,
  KeyRound,
  Lock,
  Loader2,
  MessageSquareText,
  PanelLeft,
  RotateCcw,
  Save,
  Settings,
  Sparkles,
  Upload,
  X
} from "lucide-react";
import { type CSSProperties, useEffect, useMemo, useRef, useState } from "react";
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
import { getPreviewSlideLayout, resolveSlideLayoutKind } from "./lib/slideLayout";
import type { AiSettings, DeckBrief, DeckState, DeckVersion, Slide, StoryNode } from "./types";

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
  const fileInputRef = useRef<HTMLInputElement>(null);
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
  const activeLayoutKind = resolveSlideLayoutKind(activeSlide.layout, activeNode.role);
  const activeLayout = getPreviewSlideLayout(activeLayoutKind);
  const slideTemplateStyle = useMemo(
    () =>
      ({
        "--slide-bg": `#${deckState.template.backgroundColor}`,
        "--slide-surface": `#${deckState.template.surfaceColor}`,
        "--slide-accent": `#${deckState.template.accentColor}`,
        "--slide-accent-soft": `#${deckState.template.accentSoftColor}`,
        "--slide-text": `#${deckState.template.textColor}`,
        "--slide-body": `#${deckState.template.bodyColor}`,
        "--slide-border": `#${deckState.template.borderColor}`
      }) as CSSProperties,
    [deckState.template]
  );
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

  async function handleImportProject(event: React.ChangeEvent<HTMLInputElement>) {
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
        <aside className="narrative-panel">
          <PanelHeader
            icon={<PanelLeft size={17} />}
            title="Narrative Map"
            subtitle="线性叙事节点"
          />
          <DndContext collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
            <SortableContext items={deckState.nodes.map((node) => node.id)} strategy={verticalListSortingStrategy}>
              <div className="node-list">
                {deckState.nodes.map((node, index) => (
                  <SortableNode
                    key={node.id}
                    index={index}
                    node={node}
                    active={node.id === activeNode.id}
                    onSelect={() => handleSelectNode(node.id)}
                  />
                ))}
              </div>
            </SortableContext>
          </DndContext>
        </aside>

        <section className="canvas-panel">
          <div className="canvas-toolbar">
            <div>
              <span className="toolbar-label">Slide Preview</span>
              <strong>{activeNode.title}</strong>
              <small>{activeLayout.label}</small>
            </div>
            <div className="toolbar-actions">
              <button><FileText size={15} /> 页面</button>
              <button><ArrowDownUp size={15} /> 过渡</button>
              <button onClick={handleAiRewriteSlide} disabled={slideRewriteState.status === "working"}>
                {slideRewriteState.status === "working" ? <Loader2 className="spin" size={15} /> : <Sparkles size={15} />}
                AI 重写
              </button>
            </div>
          </div>
          <article className="slide-stage" aria-label="当前幻灯片预览">
            {previewState.imageUrl ? (
              <img className="rendered-slide-preview" src={previewState.imageUrl} alt="LibreOffice 渲染的当前幻灯片预览" />
            ) : (
              <div className={`slide-card ${activeLayout.className}`} style={slideTemplateStyle}>
                <div className="slide-kicker">{activeNode.role} · {activeNode.duration}</div>
                <h1>{activeSlide.title}</h1>
                <p>{activeSlide.body}</p>
                <div className="slide-grid">
                  {activeSlide.bullets.slice(0, activeLayout.bulletCards.length).map((bullet, index) => (
                    <div className="slide-point" key={bullet}>
                      <span>{String(index + 1).padStart(2, "0")}</span>
                      <strong>{bullet}</strong>
                    </div>
                  ))}
                </div>
                <div className="speaker-note">
                  <MessageSquareText size={16} />
                  <span>{activeSlide.note}</span>
                </div>
              </div>
            )}
            <div className={`preview-render-status ${previewState.status}`}>
              {previewState.status === "rendering" ? <Loader2 className="spin" size={14} /> : <FileText size={14} />}
              <span>{previewState.message}</span>
            </div>
          </article>
        </section>

        <aside className="intent-panel">
          <PanelHeader
            icon={<Lock size={17} />}
            title="Intent Panel"
            subtitle="意图锁与 AI 建议"
          />
          <section className="intent-block">
            <span className="section-label">全局意图</span>
            <p>{deckState.deck.goal}</p>
            <div className="intent-tags">
              <span>{deckState.deck.tone}</span>
              <span>{deckState.deck.duration}</span>
            </div>
          </section>

          <section className="intent-block current">
            <span className="section-label">当前节点</span>
            <h2>{activeNode.title}</h2>
            <label htmlFor="intent-editor">表达目标</label>
            <textarea
              id="intent-editor"
              value={intentDraft}
              onChange={(event) => setIntentDraft(event.target.value)}
            />
            <button className="apply-button" onClick={handleApplyIntent}>
              <Check size={16} />
              应用修改
            </button>
            {slideRewriteState.message ? (
              <p className={`status-message ${slideRewriteState.status}`}>{slideRewriteState.message}</p>
            ) : null}
          </section>

          {rewriteCandidate ? (
            <section className="rewrite-review-panel" aria-label="AI 重写对比">
              <div className="review-header">
                <span className="section-label">AI 重写对比</span>
                <strong>应用前确认</strong>
              </div>
              <div className="review-columns">
                <SlideSummary title="原稿" slide={rewriteCandidate.originalSlide} />
                <SlideSummary title="AI 建议稿" slide={rewriteCandidate.rewrittenSlide} />
              </div>
              <div className="review-actions">
                <button className="secondary-action" onClick={handleAiRewriteSlide} disabled={slideRewriteState.status === "working"}>
                  {slideRewriteState.status === "working" ? <Loader2 className="spin" size={16} /> : <Sparkles size={16} />}
                  重新生成
                </button>
                <button className="secondary-action" onClick={handleDismissRewriteCandidate}>
                  放弃
                </button>
                <button className="apply-button" onClick={handleApplyRewriteCandidate}>
                  <Check size={16} />
                  应用 AI 建议
                </button>
              </div>
            </section>
          ) : null}

          {deckState.riskPrompt ? (
            <section className="risk-panel">
              <div>
                <AlertTriangle size={17} />
                <strong>结构风险</strong>
              </div>
              <p>{deckState.riskPrompt}</p>
              <button onClick={applyRiskSuggestion}>改写为商业机会预告</button>
            </section>
          ) : (
            <section className="ai-panel">
              <div>
                <Bot size={17} />
                <strong>AI 建议</strong>
              </div>
              <ul>
                <li>补一个真实用户故事，让问题从抽象词变成具体阻碍。</li>
                <li>把功能点压缩成解决路径，减少产品说明书感。</li>
                <li>每个论证节点保留一个可验证证据。</li>
              </ul>
            </section>
          )}
        </aside>
      </main>

      {settingsOpen ? (
        <div className="modal-backdrop" role="presentation">
          <section className="settings-modal" role="dialog" aria-modal="true" aria-labelledby="settings-title">
            <div className="modal-header">
              <div>
                <span className="section-label">全局设置</span>
                <h2 id="settings-title">全局设置</h2>
              </div>
              <button className="icon-button" onClick={() => setSettingsOpen(false)} aria-label="关闭设置">
                <X size={17} />
              </button>
            </div>

            <section className="settings-section">
              <div className="generate-title">
                <Sparkles size={17} />
                <strong>新建叙事地图</strong>
              </div>
              <label htmlFor="brief-topic">主题</label>
              <input
                id="brief-topic"
                value={brief.topic}
                onChange={(event) => setBrief((current) => ({ ...current, topic: event.target.value }))}
              />
              <label htmlFor="brief-audience">受众</label>
              <input
                id="brief-audience"
                value={brief.audience}
                onChange={(event) => setBrief((current) => ({ ...current, audience: event.target.value }))}
              />
              <label htmlFor="brief-goal">目标</label>
              <textarea
                id="brief-goal"
                value={brief.goal}
                onChange={(event) => setBrief((current) => ({ ...current, goal: event.target.value }))}
              />
              <label htmlFor="brief-duration">时长</label>
              <input
                id="brief-duration"
                value={brief.duration}
                onChange={(event) => setBrief((current) => ({ ...current, duration: event.target.value }))}
              />
              <button className="apply-button" onClick={handleGenerateDeck} disabled={generationState.status === "working"}>
                {generationState.status === "working" ? <Loader2 className="spin" size={16} /> : <Sparkles size={16} />}
                生成叙事地图
              </button>
              {generationState.message ? (
                <p className={`status-message ${generationState.status}`}>{generationState.message}</p>
              ) : null}
            </section>

            <section className="settings-section">
              <div className="generate-title">
                <KeyRound size={17} />
                <strong>OpenAI-compatible API</strong>
              </div>
              <label htmlFor="api-key">API Key</label>
              <div className="key-input">
                <KeyRound size={16} />
                <input
                  id="api-key"
                  type="password"
                  autoComplete="off"
                  value={settingsDraft.apiKey}
                  placeholder="sk-..."
                  onChange={(event) => setSettingsDraft((current) => ({ ...current, apiKey: event.target.value }))}
                />
              </div>
              <label htmlFor="base-url">Base URL</label>
              <input
                id="base-url"
                value={settingsDraft.baseUrl}
                onChange={(event) => setSettingsDraft((current) => ({ ...current, baseUrl: event.target.value }))}
              />
              <label htmlFor="model-name">模型</label>
              <input
                id="model-name"
                value={settingsDraft.model}
                onChange={(event) => setSettingsDraft((current) => ({ ...current, model: event.target.value }))}
              />
            </section>

            <section className="settings-section">
              <div className="generate-title">
                <Clock3 size={17} />
                <strong>版本管理</strong>
              </div>
              <label htmlFor="version-label">版本名称</label>
              <input
                id="version-label"
                value={versionDraft.label}
                placeholder="例如：AI 模板生成前"
                onChange={(event) => setVersionDraft((current) => ({ ...current, label: event.target.value }))}
              />
              <label htmlFor="version-summary">变更摘要</label>
              <textarea
                id="version-summary"
                value={versionDraft.summary}
                placeholder="记录这次版本的关键变化，留空则自动生成摘要。"
                onChange={(event) => setVersionDraft((current) => ({ ...current, summary: event.target.value }))}
              />
              <div className="project-actions">
                <button className="secondary-action" onClick={handleSaveVersion}>
                  <Save size={16} />
                  保存当前版本
                </button>
              </div>
              <div className="version-list">
                {versions.length > 0 ? (
                  versions.map((version) => (
                    <div className="version-row" key={version.id}>
                      <div>
                        <strong>{version.label}</strong>
                        <span>{formatVersionTime(version.createdAt)}</span>
                        <p>{version.summary}</p>
                      </div>
                      <button className="secondary-action" onClick={() => handleRestoreVersion(version.id)}>
                        恢复
                      </button>
                    </div>
                  ))
                ) : (
                  <p className="empty-version">暂无保存版本</p>
                )}
              </div>
            </section>

            <section className="settings-section">
              <div className="generate-title">
                <FileText size={17} />
                <strong>项目文件</strong>
              </div>
              <div className="project-actions">
                <button className="secondary-action" onClick={handleResetDeck}>
                  <RotateCcw size={16} />
                  重置为示例 Deck
                </button>
                <button className="secondary-action" onClick={handleExportProject}>
                  <FileDown size={16} />
                  导出项目
                </button>
                <label className="file-action secondary-action" htmlFor="storydeck-import">
                  <Upload size={16} />
                  导入项目
                </label>
                <input
                  ref={fileInputRef}
                  id="storydeck-import"
                  className="visually-hidden"
                  type="file"
                  accept=".json,.storydeck.json,application/json"
                  aria-label="导入项目"
                  onChange={handleImportProject}
                />
              </div>
              <p className={`status-message ${projectState.status}`}>{projectState.message}</p>
            </section>

            <div className="modal-actions">
              <button className="secondary-action" onClick={() => setSettingsOpen(false)}>
                取消
              </button>
              <button className="primary-action" onClick={handleSaveSettings}>
                <Save size={16} />
                保存设置
              </button>
            </div>
          </section>
        </div>
      ) : null}
    </div>
  );
}

interface PanelHeaderProps {
  icon: React.ReactNode;
  title: string;
  subtitle: string;
}

function PanelHeader({ icon, title, subtitle }: PanelHeaderProps) {
  return (
    <div className="panel-header">
      <div className="panel-title">
        {icon}
        <strong>{title}</strong>
      </div>
      <span>{subtitle}</span>
    </div>
  );
}

interface SlideSummaryProps {
  title: string;
  slide: Pick<Slide, "title" | "body" | "bullets" | "note">;
}

function SlideSummary({ title, slide }: SlideSummaryProps) {
  return (
    <div className="slide-summary">
      <span>{title}</span>
      <strong>{slide.title}</strong>
      <p>{slide.body}</p>
      <ul>
        {slide.bullets.map((bullet) => (
          <li key={bullet}>{bullet}</li>
        ))}
      </ul>
      <small>{slide.note}</small>
    </div>
  );
}

interface SortableNodeProps {
  node: StoryNode;
  index: number;
  active: boolean;
  onSelect: () => void;
}

function SortableNode({ node, index, active, onSelect }: SortableNodeProps) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id: node.id });
  const style = {
    transform: CSS.Transform.toString(transform),
    transition
  };

  return (
    <button
      ref={setNodeRef}
      style={style}
      className={`story-node ${active ? "active" : ""} ${isDragging ? "dragging" : ""}`}
      onClick={onSelect}
      type="button"
    >
      <span className="drag-handle" {...attributes} {...listeners} aria-label="拖动节点">
        <GripVertical size={15} />
      </span>
      <span className="node-index">{String(index + 1).padStart(2, "0")}</span>
      <span className="node-main">
        <strong>{node.title}</strong>
        <small>{node.intent}</small>
      </span>
      <span className="node-side">
        <em>{node.role}</em>
        <small>{node.duration}</small>
      </span>
    </button>
  );
}

function formatVersionTime(value: string) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return "未知时间";
  }

  return new Intl.DateTimeFormat("zh-CN", {
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit"
  }).format(date);
}

export default App;
