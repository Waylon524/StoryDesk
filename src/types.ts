export type NodeRole = "开场" | "共鸣" | "冲突" | "论证" | "转折" | "行动" | "收束";
export type SlideLayoutKind = "statement" | "three-point" | "process" | "closing";

export interface StoryNode {
  id: string;
  title: string;
  intent: string;
  role: NodeRole;
  duration: string;
  slideId: string;
  risk?: string;
}

export interface Slide {
  id: string;
  nodeId: string;
  layout: SlideLayoutKind;
  title: string;
  body: string;
  bullets: string[];
  note: string;
}

export interface DeckTemplate {
  id: string;
  name: string;
  aspectRatio: "16:9";
  backgroundColor: string;
  surfaceColor: string;
  accentColor: string;
  accentSoftColor: string;
  textColor: string;
  bodyColor: string;
  borderColor: string;
}

export interface DeckState {
  deck: {
    title: string;
    audience: string;
    goal: string;
    tone: string;
    duration: string;
  };
  template: DeckTemplate;
  nodes: StoryNode[];
  slides: Slide[];
  activeNodeId: string;
  riskPrompt: string | null;
}

export interface AiSettings {
  apiKey: string;
  baseUrl: string;
  model: string;
}

export interface DeckBrief {
  topic: string;
  audience: string;
  goal: string;
  duration: string;
}

export interface DeckVersion {
  id: string;
  label: string;
  summary: string;
  createdAt: string;
  deckState: DeckState;
}
