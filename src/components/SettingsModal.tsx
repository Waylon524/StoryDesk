import { Clock3, FileDown, FileText, KeyRound, Loader2, RotateCcw, Save, Sparkles, Upload, X } from "lucide-react";
import type { ChangeEvent, Dispatch, SetStateAction } from "react";
import type { AiSettings, DeckBrief, DeckVersion } from "../types";

interface AsyncStatus {
  status: "idle" | "working" | "done" | "error";
  message: string;
}

interface ProjectStatus {
  status: "idle" | "done" | "error";
  message: string;
}

interface VersionDraft {
  label: string;
  summary: string;
}

interface SettingsModalProps {
  brief: DeckBrief;
  setBrief: Dispatch<SetStateAction<DeckBrief>>;
  settingsDraft: AiSettings;
  setSettingsDraft: Dispatch<SetStateAction<AiSettings>>;
  generationState: AsyncStatus;
  versions: DeckVersion[];
  versionDraft: VersionDraft;
  setVersionDraft: Dispatch<SetStateAction<VersionDraft>>;
  projectState: ProjectStatus;
  onClose: () => void;
  onGenerateDeck: () => void;
  onSaveVersion: () => void;
  onRestoreVersion: (versionId: string) => void;
  onResetDeck: () => void;
  onExportProject: () => void;
  onImportProject: (event: ChangeEvent<HTMLInputElement>) => void;
  onSaveSettings: () => void;
}

export function SettingsModal({
  brief,
  setBrief,
  settingsDraft,
  setSettingsDraft,
  generationState,
  versions,
  versionDraft,
  setVersionDraft,
  projectState,
  onClose,
  onGenerateDeck,
  onSaveVersion,
  onRestoreVersion,
  onResetDeck,
  onExportProject,
  onImportProject,
  onSaveSettings
}: SettingsModalProps) {
  return (
    <div className="modal-backdrop" role="presentation">
      <section className="settings-modal" role="dialog" aria-modal="true" aria-labelledby="settings-title">
        <div className="modal-header">
          <div>
            <span className="section-label">全局设置</span>
            <h2 id="settings-title">全局设置</h2>
          </div>
          <button className="icon-button" onClick={onClose} aria-label="关闭设置">
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
          <button className="apply-button" onClick={onGenerateDeck} disabled={generationState.status === "working"}>
            {generationState.status === "working" ? <Loader2 className="spin" size={16} /> : <Sparkles size={16} />}
            生成叙事地图
          </button>
          {generationState.message ? <p className={`status-message ${generationState.status}`}>{generationState.message}</p> : null}
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
            <button className="secondary-action" onClick={onSaveVersion}>
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
                  <button className="secondary-action" onClick={() => onRestoreVersion(version.id)}>
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
            <button className="secondary-action" onClick={onResetDeck}>
              <RotateCcw size={16} />
              重置为示例 Deck
            </button>
            <button className="secondary-action" onClick={onExportProject}>
              <FileDown size={16} />
              导出项目
            </button>
            <label className="file-action secondary-action" htmlFor="storydeck-import">
              <Upload size={16} />
              导入项目
            </label>
            <input
              id="storydeck-import"
              className="visually-hidden"
              type="file"
              accept=".json,.storydeck.json,application/json"
              aria-label="导入项目"
              onChange={onImportProject}
            />
          </div>
          <p className={`status-message ${projectState.status}`}>{projectState.message}</p>
        </section>

        <div className="modal-actions">
          <button className="secondary-action" onClick={onClose}>
            取消
          </button>
          <button className="primary-action" onClick={onSaveSettings}>
            <Save size={16} />
            保存设置
          </button>
        </div>
      </section>
    </div>
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
