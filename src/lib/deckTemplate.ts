import type { DeckBrief, DeckState, DeckTemplate } from "../types";
import { resolveSlideLayoutKind } from "./slideLayout";

export const defaultDeckTemplate: DeckTemplate = {
  id: "template-quiet-teal",
  name: "Quiet Teal",
  aspectRatio: "16:9",
  backgroundColor: "FFFFFF",
  surfaceColor: "F8FAFC",
  accentColor: "0F766E",
  accentSoftColor: "CCFBF1",
  textColor: "111827",
  bodyColor: "374151",
  borderColor: "DCE4EB"
};

const generatedPalettes = [
  {
    name: "Investor Teal",
    backgroundColor: "FFFFFF",
    surfaceColor: "F8FAFC",
    accentColor: "0F766E",
    accentSoftColor: "CCFBF1",
    textColor: "111827",
    bodyColor: "374151",
    borderColor: "DCE4EB"
  },
  {
    name: "Research Blue",
    backgroundColor: "FFFFFF",
    surfaceColor: "F7F9FC",
    accentColor: "2563EB",
    accentSoftColor: "DBEAFE",
    textColor: "111827",
    bodyColor: "3F4756",
    borderColor: "D7E0EA"
  },
  {
    name: "Signal Green",
    backgroundColor: "FFFFFF",
    surfaceColor: "F7FBF8",
    accentColor: "15803D",
    accentSoftColor: "DCFCE7",
    textColor: "111827",
    bodyColor: "3F4A3F",
    borderColor: "D8E7DC"
  }
] as const;

export function createDeckTemplate(brief: DeckBrief): DeckTemplate {
  const palette = generatedPalettes[hashString(`${brief.topic}|${brief.audience}|${brief.goal}`) % generatedPalettes.length];

  return {
    id: `template-${slugify(brief.topic)}`,
    aspectRatio: "16:9",
    ...palette
  };
}

export function ensureDeckTemplate(deckState: DeckState | Omit<DeckState, "template">): DeckState {
  const maybeTemplate = (deckState as Partial<DeckState>).template;
  if (isDeckTemplate(maybeTemplate)) {
    return deckState as DeckState;
  }

  return {
    ...(deckState as Omit<DeckState, "template">),
    template: defaultDeckTemplate
  };
}

export function ensureDeckState(deckState: DeckState | Omit<DeckState, "template">): DeckState {
  const stateWithTemplate = ensureDeckTemplate(deckState);

  return {
    ...stateWithTemplate,
    slides: stateWithTemplate.slides.map((slide) => {
      const node = stateWithTemplate.nodes.find((item) => item.id === slide.nodeId);
      return {
        ...slide,
        layout: resolveSlideLayoutKind((slide as Partial<DeckState["slides"][number]>).layout, node?.role)
      };
    })
  };
}

function isDeckTemplate(value: unknown): value is DeckTemplate {
  if (!value || typeof value !== "object") {
    return false;
  }

  const template = value as Partial<DeckTemplate>;
  return Boolean(
    template.aspectRatio === "16:9" &&
      typeof template.backgroundColor === "string" &&
      typeof template.surfaceColor === "string" &&
      typeof template.accentColor === "string" &&
      typeof template.textColor === "string"
  );
}

function hashString(value: string) {
  return Array.from(value).reduce((hash, char) => (hash * 31 + char.charCodeAt(0)) >>> 0, 7);
}

function slugify(value: string) {
  const slug = value
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");

  return slug || "generated";
}
