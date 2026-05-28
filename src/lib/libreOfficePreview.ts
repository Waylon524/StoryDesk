import type { DeckState } from "../types";
import { createSlidePptxBlob } from "./pptxExport";

const previewServiceUrl = import.meta.env.VITE_STORYDECK_PREVIEW_URL || "http://127.0.0.1:5175";

export async function renderSlidePreviewImage(deckState: DeckState, nodeId: string, signal?: AbortSignal) {
  const pptxBlob = await createSlidePptxBlob(deckState, nodeId);
  const response = await fetch(`${previewServiceUrl}/render-pptx`, {
    method: "POST",
    headers: {
      "Content-Type": "application/vnd.openxmlformats-officedocument.presentationml.presentation"
    },
    body: pptxBlob,
    signal
  });

  if (!response.ok) {
    const detail = await response.json().catch(() => null);
    throw new Error(detail?.error || `LibreOffice 预览渲染失败：${response.status}`);
  }

  const imageBlob = await response.blob();
  return URL.createObjectURL(imageBlob);
}
