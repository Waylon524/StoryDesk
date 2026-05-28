import type PptxGenJS from "pptxgenjs";
import type { DeckState } from "../types";
import { getPptSlideLayout, pptWideCanvas, resolveSlideLayoutKind } from "./slideLayout";

interface PptxBuildOptions {
  nodeId?: string;
}

export async function exportDeckPptx(deckState: DeckState, fileName = "StoryDeck-demo.pptx") {
  const pptx = await buildStoryDeckPptx(deckState);
  await pptx.writeFile({ fileName });
}

export async function createSlidePptxBlob(deckState: DeckState, nodeId: string): Promise<Blob> {
  const pptx = await buildStoryDeckPptx(deckState, { nodeId });
  const output = await pptx.write({ outputType: "blob" });

  if (output instanceof Blob) {
    return output;
  }

  let blobPart: BlobPart;
  if (output instanceof Uint8Array) {
    const copy = new Uint8Array(output.byteLength);
    copy.set(output);
    blobPart = copy.buffer;
  } else if (typeof output === "string" || output instanceof ArrayBuffer) {
    blobPart = output;
  } else {
    throw new Error("PPTX 输出格式不支持生成预览。");
  }

  return new Blob([blobPart], {
    type: "application/vnd.openxmlformats-officedocument.presentationml.presentation"
  });
}

async function buildStoryDeckPptx(deckState: DeckState, options: PptxBuildOptions = {}) {
  const pptxgen = (await import("pptxgenjs")).default;
  const pptx = new pptxgen();
  pptx.defineLayout({ name: "STORYDECK_WIDE", width: pptWideCanvas.width, height: pptWideCanvas.height });
  pptx.layout = "STORYDECK_WIDE";
  pptx.author = "StoryDeck";
  pptx.subject = deckState.deck.goal;

  const nodes = options.nodeId ? deckState.nodes.filter((node) => node.id === options.nodeId) : deckState.nodes;
  nodes.forEach((node) => {
    const slideContent = deckState.slides.find((slide) => slide.nodeId === node.id);
    if (!slideContent) {
      return;
    }

    addStoryDeckSlide(pptx, deckState, node.id);
  });

  return pptx;
}

function addStoryDeckSlide(pptx: PptxGenJS, deckState: DeckState, nodeId: string) {
  const node = deckState.nodes.find((item) => item.id === nodeId);
  const slideContent = deckState.slides.find((slide) => slide.nodeId === nodeId);
  if (!node || !slideContent) {
    return;
  }

  const template = deckState.template;
  const layout = getPptSlideLayout(resolveSlideLayoutKind(slideContent.layout, node.role));
  const slide = pptx.addSlide();
  slide.background = { color: template.backgroundColor };
  slide.addShape(pptx.ShapeType.rect, {
    ...layout.accentBand,
    fill: { color: template.accentSoftColor, transparency: 55 },
    line: { color: template.accentSoftColor, transparency: 100 }
  });
  slide.addText(node.title, {
    ...layout.kicker,
    fontSize: 10,
    bold: true,
    color: template.accentColor
  });
  slide.addText(slideContent.title, {
    ...layout.title,
    fontSize: 30,
    bold: true,
    color: template.textColor,
    breakLine: false,
    fit: "shrink"
  });
  slide.addText(slideContent.body, {
    ...layout.body,
    fontSize: 15,
    color: template.bodyColor,
    breakLine: false,
    fit: "shrink"
  });
  slideContent.bullets.slice(0, layout.bulletCards.length).forEach((bullet, index) => {
    const card = layout.bulletCards[index];
    const compactCard = card.h < 1;
    const labelY = card.y + (compactCard ? 0.13 : 0.18);
    const textY = card.y + (compactCard ? 0.39 : 0.58);
    const textHeight = Math.max(card.h - (compactCard ? 0.5 : 0.72), 0.32);
    slide.addShape(pptx.ShapeType.roundRect, {
      ...card,
      fill: { color: template.surfaceColor },
      line: { color: template.borderColor }
    });
    slide.addText(String(index + 1).padStart(2, "0"), {
      x: card.x + 0.17,
      y: labelY,
      w: 0.45,
      h: 0.18,
      fontSize: 9,
      bold: true,
      color: template.accentColor,
      breakLine: false
    });
    slide.addText(bullet, {
      x: card.x + 0.17,
      y: textY,
      w: card.w - 0.34,
      h: textHeight,
      fontSize: compactCard ? 12 : 13,
      bold: true,
      color: template.textColor,
      breakLine: false,
      fit: "shrink"
    });
  });
  slide.addText(slideContent.note, {
    ...layout.note,
    fontSize: 12,
    color: "64748B",
    breakLine: false,
    fit: "shrink"
  });
}
