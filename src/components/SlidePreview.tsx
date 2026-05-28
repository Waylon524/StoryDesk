import { ArrowDownUp, FileText, Loader2, MessageSquareText, Server, Sparkles } from "lucide-react";
import { type CSSProperties, useMemo, useState } from "react";
import { getPreviewSlideLayout, layoutKinds, resolveSlideLayoutKind } from "../lib/slideLayout";
import type { DeckTemplate, Slide, SlideLayoutKind, StoryNode } from "../types";

interface PreviewState {
  status: "idle" | "rendering" | "ready" | "error";
  imageUrl: string | null;
  message: string;
}

interface SlidePreviewProps {
  activeNode: StoryNode;
  activeSlide: Slide;
  template: DeckTemplate;
  rewriteStatus: "idle" | "working" | "done" | "error";
  previewState: PreviewState;
  onAiRewriteSlide: () => void;
  onLayoutChange: (layout: SlideLayoutKind) => void;
}

export function SlidePreview({
  activeNode,
  activeSlide,
  template,
  rewriteStatus,
  previewState,
  onAiRewriteSlide,
  onLayoutChange
}: SlidePreviewProps) {
  const [serviceGuideOpen, setServiceGuideOpen] = useState(false);
  const activeLayoutKind = resolveSlideLayoutKind(activeSlide.layout, activeNode.role);
  const activeLayout = getPreviewSlideLayout(activeLayoutKind);
  const slideTemplateStyle = useMemo(
    () =>
      ({
        "--slide-bg": `#${template.backgroundColor}`,
        "--slide-surface": `#${template.surfaceColor}`,
        "--slide-accent": `#${template.accentColor}`,
        "--slide-accent-soft": `#${template.accentSoftColor}`,
        "--slide-text": `#${template.textColor}`,
        "--slide-body": `#${template.bodyColor}`,
        "--slide-border": `#${template.borderColor}`
      }) as CSSProperties,
    [template]
  );

  return (
    <section className="canvas-panel">
      <div className="canvas-toolbar">
        <div>
          <span className="toolbar-label">Slide Preview</span>
          <strong>{activeNode.title}</strong>
          <small>{activeLayout.label}</small>
        </div>
        <div className="toolbar-actions">
          <label className="layout-select-control">
            <FileText size={15} />
            <span>页面布局</span>
            <select
              aria-label="页面布局"
              value={activeLayoutKind}
              onChange={(event) => onLayoutChange(event.target.value as SlideLayoutKind)}
            >
              {layoutKinds.map((kind) => (
                <option key={kind} value={kind}>
                  {getPreviewSlideLayout(kind).label}
                </option>
              ))}
            </select>
          </label>
          <button>
            <ArrowDownUp size={15} /> 过渡
          </button>
          <button onClick={onAiRewriteSlide} disabled={rewriteStatus === "working"}>
            {rewriteStatus === "working" ? <Loader2 className="spin" size={15} /> : <Sparkles size={15} />}
            AI 重写
          </button>
        </div>
      </div>
      <article className="slide-stage" aria-label="当前幻灯片预览">
        {previewState.imageUrl ? (
          <img className="rendered-slide-preview" src={previewState.imageUrl} alt="LibreOffice 渲染的当前幻灯片预览" />
        ) : (
          <div className={`slide-card ${activeLayout.className}`} style={slideTemplateStyle}>
            <div className="slide-kicker">
              {activeNode.role} · {activeNode.duration}
            </div>
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
        <div className="preview-service-stack">
          <div className="preview-status-row">
            <div className={`preview-render-status ${previewState.status}`}>
              {previewState.status === "rendering" ? <Loader2 className="spin" size={14} /> : <FileText size={14} />}
              <span>{previewState.message}</span>
            </div>
            <button
              className={`preview-service-button ${previewState.status}`}
              type="button"
              aria-expanded={serviceGuideOpen}
              aria-controls="preview-service-guide"
              onClick={() => setServiceGuideOpen((current) => !current)}
            >
              <Server size={14} />
              预览服务状态
            </button>
          </div>
          {serviceGuideOpen ? (
            <section
              id="preview-service-guide"
              className="preview-service-guide"
              role="region"
              aria-label="LibreOffice 预览服务说明"
            >
              <div>
                <strong>启动真实预览服务</strong>
                <span>当前预览会优先使用 LibreOffice 渲染 PPTX，服务不可用时自动回退到编辑预览。</span>
              </div>
              <code>npm run preview-server</code>
              <span>
                默认地址：<code>127.0.0.1:5175</code>
              </span>
            </section>
          ) : null}
        </div>
      </article>
    </section>
  );
}
