import { useEffect, useState } from "react";
import { renderSlidePreviewImage } from "../lib/libreOfficePreview";
import type { DeckState } from "../types";

export interface PreviewState {
  status: "idle" | "rendering" | "ready" | "error";
  imageUrl: string | null;
  message: string;
}

export function useLibreOfficePreview(deckState: DeckState) {
  const [previewState, setPreviewState] = useState<PreviewState>({
    status: "idle",
    imageUrl: null,
    message: "正在等待 LibreOffice 预览服务。"
  });

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

  return previewState;
}
