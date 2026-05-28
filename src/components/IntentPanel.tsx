import { AlertTriangle, Bot, Check, Loader2, Lock, Sparkles } from "lucide-react";
import type { Dispatch, SetStateAction } from "react";
import { PanelHeader } from "./PanelHeader";
import { SlideSummary } from "./SlideSummary";
import type { Slide, StoryNode } from "../types";

interface RewriteCandidate {
  originalSlide: Slide;
  rewrittenSlide: Pick<Slide, "title" | "body" | "bullets" | "note">;
}

interface SlideRewriteState {
  status: "idle" | "working" | "done" | "error";
  message: string;
}

interface IntentPanelProps {
  deckGoal: string;
  deckTone: string;
  deckDuration: string;
  activeNode: StoryNode;
  intentDraft: string;
  setIntentDraft: Dispatch<SetStateAction<string>>;
  slideRewriteState: SlideRewriteState;
  rewriteCandidate: RewriteCandidate | null;
  riskPrompt: string | null;
  onApplyIntent: () => void;
  onAiRewriteSlide: () => void;
  onDismissRewriteCandidate: () => void;
  onApplyRewriteCandidate: () => void;
  onApplyRiskSuggestion: () => void;
}

export function IntentPanel({
  deckGoal,
  deckTone,
  deckDuration,
  activeNode,
  intentDraft,
  setIntentDraft,
  slideRewriteState,
  rewriteCandidate,
  riskPrompt,
  onApplyIntent,
  onAiRewriteSlide,
  onDismissRewriteCandidate,
  onApplyRewriteCandidate,
  onApplyRiskSuggestion
}: IntentPanelProps) {
  return (
    <aside className="intent-panel">
      <PanelHeader icon={<Lock size={17} />} title="Intent Panel" subtitle="意图锁与 AI 建议" />
      <section className="intent-block">
        <span className="section-label">全局意图</span>
        <p>{deckGoal}</p>
        <div className="intent-tags">
          <span>{deckTone}</span>
          <span>{deckDuration}</span>
        </div>
      </section>

      <section className="intent-block current">
        <span className="section-label">当前节点</span>
        <h2>{activeNode.title}</h2>
        <label htmlFor="intent-editor">表达目标</label>
        <textarea id="intent-editor" value={intentDraft} onChange={(event) => setIntentDraft(event.target.value)} />
        <button className="apply-button" onClick={onApplyIntent}>
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
            <button className="secondary-action" onClick={onAiRewriteSlide} disabled={slideRewriteState.status === "working"}>
              {slideRewriteState.status === "working" ? <Loader2 className="spin" size={16} /> : <Sparkles size={16} />}
              重新生成
            </button>
            <button className="secondary-action" onClick={onDismissRewriteCandidate}>
              放弃
            </button>
            <button className="apply-button" onClick={onApplyRewriteCandidate}>
              <Check size={16} />
              应用 AI 建议
            </button>
          </div>
        </section>
      ) : null}

      {riskPrompt ? (
        <section className="risk-panel">
          <div>
            <AlertTriangle size={17} />
            <strong>结构风险</strong>
          </div>
          <p>{riskPrompt}</p>
          <button onClick={onApplyRiskSuggestion}>改写为商业机会预告</button>
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
  );
}
