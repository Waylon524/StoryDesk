import { normalizeBaseUrl } from "./aiSettings";
import { createDeckTemplate } from "./deckTemplate";
import type { AiSettings, DeckBrief, DeckState, NodeRole, Slide } from "../types";

type Fetcher = typeof fetch;

interface GeneratedNode {
  title: string;
  intent: string;
  role: string;
  duration: string;
  slide: {
    title: string;
    body: string;
    bullets: string[];
    note: string;
  };
}

interface GeneratedDeckPayload {
  deck: DeckState["deck"];
  nodes: GeneratedNode[];
}

type GeneratedSlidePayload = Pick<Slide, "title" | "body" | "bullets" | "note">;

const allowedRoles: NodeRole[] = ["开场", "共鸣", "冲突", "论证", "转折", "行动", "收束"];

export function resolveChatCompletionsEndpoint(baseUrl: string) {
  const normalized = normalizeBaseUrl(baseUrl);

  try {
    const url = new URL(normalized);
    if (url.hostname === "api.deepseek.com") {
      return "/deepseek/v1/chat/completions";
    }
  } catch {
    return "/deepseek/v1/chat/completions";
  }

  const versionedBase = normalized.endsWith("/v1") ? normalized : `${normalized}/v1`;
  return `${versionedBase}/chat/completions`;
}

export async function generateDeckFromBrief(
  brief: DeckBrief,
  settings: AiSettings,
  fetcher: Fetcher = fetch
): Promise<DeckState> {
  if (!settings.apiKey.trim()) {
    throw new Error("请先在设置中填写 API Key。");
  }

  const response = await fetcher(resolveChatCompletionsEndpoint(settings.baseUrl), {
    method: "POST",
    headers: {
      Authorization: `Bearer ${settings.apiKey.trim()}`,
      "Content-Type": "application/json"
    },
    body: JSON.stringify({
      model: settings.model.trim(),
      temperature: 0.45,
      response_format: { type: "json_object" },
      messages: [
        {
          role: "system",
          content:
            "你是 StoryDeck 的 AI 叙事架构师。只输出严格 JSON，不要 Markdown。生成 6 到 8 个叙事节点，每个节点都绑定一页幻灯片。"
        },
        {
          role: "user",
          content: buildDeckPrompt(brief)
        }
      ]
    })
  });

  if (!response.ok) {
    const detail = await response.text().catch(() => "");
    throw new Error(`AI 生成失败：${response.status}${detail ? ` ${detail}` : ""}`);
  }

  const data = await response.json();
  const content = data?.choices?.[0]?.message?.content;
  if (typeof content !== "string") {
    throw new Error("AI 返回格式不正确，缺少 message.content。");
  }

  return payloadToDeckState(parseJsonContent(content), brief);
}

export async function rewriteSlideFromIntent(
  deckState: DeckState,
  nodeId: string,
  intent: string,
  settings: AiSettings,
  fetcher: Fetcher = fetch
): Promise<GeneratedSlidePayload> {
  if (!settings.apiKey.trim()) {
    throw new Error("请先在设置中填写 API Key。");
  }

  const node = deckState.nodes.find((item) => item.id === nodeId);
  const slide = deckState.slides.find((item) => item.nodeId === nodeId);
  if (!node || !slide) {
    throw new Error("未找到当前节点对应的幻灯片。");
  }

  const response = await fetcher(resolveChatCompletionsEndpoint(settings.baseUrl), {
    method: "POST",
    headers: {
      Authorization: `Bearer ${settings.apiKey.trim()}`,
      "Content-Type": "application/json"
    },
    body: JSON.stringify({
      model: settings.model.trim(),
      temperature: 0.42,
      response_format: { type: "json_object" },
      messages: [
        {
          role: "system",
          content:
            "你是 StoryDeck 的单页 PPT 文案编辑。只输出严格 JSON，不要 Markdown。你只能重写当前幻灯片，不要改变整套叙事结构。"
        },
        {
          role: "user",
          content: buildSlideRewritePrompt(deckState, node, slide, intent)
        }
      ]
    })
  });

  if (!response.ok) {
    const detail = await response.text().catch(() => "");
    throw new Error(`AI 重写失败：${response.status}${detail ? ` ${detail}` : ""}`);
  }

  const data = await response.json();
  const content = data?.choices?.[0]?.message?.content;
  if (typeof content !== "string") {
    throw new Error("AI 返回格式不正确，缺少 message.content。");
  }

  return normalizeSlidePayload(parseJsonContent(content) as unknown);
}

function buildDeckPrompt(brief: DeckBrief) {
  return [
    `主题：${brief.topic}`,
    `受众：${brief.audience}`,
    `目标：${brief.goal}`,
    `演讲时长：${brief.duration}`,
    "",
    "请输出这个 JSON 结构：",
    "{",
    '  "deck": { "title": "...", "audience": "...", "goal": "...", "tone": "...", "duration": "..." },',
    '  "nodes": [',
    '    { "title": "...", "intent": "...", "role": "开场|共鸣|冲突|论证|转折|行动|收束", "duration": "0:45",',
    '      "slide": { "title": "...", "body": "...", "bullets": ["..."], "note": "..." } }',
    "  ]",
    "}",
    "要求：标题具体，正文不空泛，bullets 每页 3 到 4 条，整体结构先问题后解决再行动。",
    "除非用户在主题中提供了明确数字，否则不要编造具体统计数据；需要数据时写成“待验证假设”或“建议补充调研数据”。"
  ].join("\n");
}

function buildSlideRewritePrompt(
  deckState: DeckState,
  node: DeckState["nodes"][number],
  slide: Slide,
  intent: string
) {
  return [
    `全局标题：${deckState.deck.title}`,
    `受众：${deckState.deck.audience}`,
    `全局目标：${deckState.deck.goal}`,
    `整体语气：${deckState.deck.tone}`,
    `当前节点：${node.title}`,
    `节点角色：${node.role}`,
    `新的表达目标：${intent}`,
    "",
    "当前幻灯片：",
    `标题：${slide.title}`,
    `正文：${slide.body}`,
    `要点：${slide.bullets.join(" / ")}`,
    `讲者备注：${slide.note}`,
    "",
    "请只输出这个 JSON 结构：",
    '{ "title": "...", "body": "...", "bullets": ["...", "...", "..."], "note": "..." }',
    "要求：标题具体，正文 1 到 2 句，bullets 3 到 4 条，note 说明讲述策略。",
    "除非当前内容已经提供明确数字，否则不要编造具体统计数据。"
  ].join("\n");
}

function parseJsonContent(content: string): GeneratedDeckPayload {
  const cleaned = content
    .trim()
    .replace(/^```(?:json)?/i, "")
    .replace(/```$/i, "")
    .trim();
  return JSON.parse(cleaned) as GeneratedDeckPayload;
}

function normalizeSlidePayload(payload: unknown): GeneratedSlidePayload {
  const slide = payload as Partial<GeneratedSlidePayload>;
  if (!slide || typeof slide.title !== "string" || typeof slide.body !== "string") {
    throw new Error("AI 未返回可用的幻灯片内容。");
  }

  return {
    title: slide.title,
    body: slide.body,
    bullets: Array.isArray(slide.bullets) && slide.bullets.length > 0 ? slide.bullets.slice(0, 4) : ["补充关键论点"],
    note: typeof slide.note === "string" ? slide.note : "由 AI 根据当前意图重写。"
  };
}

function payloadToDeckState(payload: GeneratedDeckPayload, brief: DeckBrief): DeckState {
  const nodes = payload.nodes.slice(0, 8).map((node, index) => {
    const id = `ai-node-${index + 1}`;
    const slideId = `ai-slide-${index + 1}`;
    return {
      id,
      title: node.title || `叙事节点 ${index + 1}`,
      intent: node.intent || "补充该节点的表达意图。",
      role: allowedRoles.includes(node.role as NodeRole) ? (node.role as NodeRole) : "论证",
      duration: node.duration || "0:50",
      slideId
    };
  });

  const slides = payload.nodes.slice(0, 8).map((node, index) => {
    const slide = node.slide;
    return {
      id: `ai-slide-${index + 1}`,
      nodeId: `ai-node-${index + 1}`,
      title: slide?.title || node.title || `幻灯片 ${index + 1}`,
      body: slide?.body || node.intent || "这里需要补充页面正文。",
      bullets: Array.isArray(slide?.bullets) && slide.bullets.length > 0 ? slide.bullets.slice(0, 4) : ["补充关键论点"],
      note: slide?.note || "由 AI 初稿生成，可继续在意图面板中调整。"
    };
  });

  if (nodes.length === 0) {
    throw new Error("AI 未生成可用节点。");
  }

  return {
    deck: {
      title: payload.deck?.title || brief.topic,
      audience: payload.deck?.audience || brief.audience,
      goal: payload.deck?.goal || brief.goal,
      tone: payload.deck?.tone || "清晰、克制、有商业判断",
      duration: payload.deck?.duration || brief.duration
    },
    template: createDeckTemplate(brief),
    nodes,
    slides,
    activeNodeId: nodes[0].id,
    riskPrompt: null
  };
}
