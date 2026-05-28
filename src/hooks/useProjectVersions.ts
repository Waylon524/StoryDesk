import { useState } from "react";
import { appendDeckVersion, loadDeckVersions, restoreDeckVersion } from "../lib/deckVersions";
import type { DeckState, DeckVersion } from "../types";

interface VersionDraft {
  label: string;
  summary: string;
}

interface RestoreDeckOptions {
  currentDeck: DeckState;
  versionId: string;
  onRestore: (deckState: DeckState) => void;
}

export function useProjectVersions() {
  const [versions, setVersions] = useState<DeckVersion[]>(() => loadDeckVersions());
  const [versionDraft, setVersionDraft] = useState<VersionDraft>({
    label: "",
    summary: ""
  });
  const [projectState, setProjectState] = useState<{
    status: "idle" | "done" | "error";
    message: string;
  }>({ status: "idle", message: "当前项目会自动保存。" });

  function handleSaveVersion(deckState: DeckState) {
    const nextVersions = appendDeckVersion(deckState, versionDraft.label || "手动保存", undefined, new Date(), versionDraft.summary);
    setVersions(nextVersions);
    setVersionDraft({ label: "", summary: "" });
    setProjectState({ status: "done", message: "已保存当前版本。" });
  }

  function handleRestoreVersion({ currentDeck, versionId, onRestore }: RestoreDeckOptions) {
    const restoredDeck = restoreDeckVersion(versions, versionId);
    const version = versions.find((item) => item.id === versionId);
    if (!restoredDeck || !version) {
      setProjectState({ status: "error", message: "未找到这个版本。" });
      return;
    }

    const nextVersions = appendDeckVersion(
      currentDeck,
      "恢复前自动保存",
      undefined,
      new Date(),
      `恢复「${version.label}」前的当前状态。`
    );
    onRestore(restoredDeck);
    setVersions(nextVersions);
    setProjectState({ status: "done", message: `已恢复版本：${version.label}。` });
  }

  return {
    versions,
    versionDraft,
    setVersionDraft,
    projectState,
    setProjectState,
    handleSaveVersion,
    handleRestoreVersion
  };
}
