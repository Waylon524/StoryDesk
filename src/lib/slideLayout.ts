import type { NodeRole, SlideLayoutKind } from "../types";

interface CanvasSize {
  width: number;
  height: number;
}

interface LayoutBox {
  x: number;
  y: number;
  w: number;
  h: number;
}

interface SlideLayoutDefinition {
  kind: SlideLayoutKind;
  label: string;
  className: string;
  canvas: CanvasSize;
  accentBand: LayoutBox;
  kicker: LayoutBox;
  title: LayoutBox;
  body: LayoutBox;
  bulletCards: LayoutBox[];
  note: LayoutBox;
}

export interface PptSlideLayout {
  kind: SlideLayoutKind;
  label: string;
  canvas: CanvasSize;
  accentBand: LayoutBox;
  kicker: LayoutBox;
  title: LayoutBox;
  body: LayoutBox;
  bulletCards: LayoutBox[];
  note: LayoutBox;
}

export const pptWideCanvas = {
  width: 13.333,
  height: 7.5
};

export const previewSlideCanvas: CanvasSize = {
  width: 850,
  height: 478.125
};

export const slideLayoutRegistry: Record<SlideLayoutKind, SlideLayoutDefinition> = {
  statement: {
    kind: "statement",
    label: "场景陈述",
    className: "layout-statement",
    canvas: previewSlideCanvas,
    accentBand: {
      x: 0,
      y: 0,
      w: 310,
      h: 478.125
    },
    kicker: {
      x: 56,
      y: 112,
      w: 320,
      h: 20
    },
    title: {
      x: 56,
      y: 148,
      w: 690,
      h: 72
    },
    body: {
      x: 56,
      y: 244,
      w: 640,
      h: 58
    },
    bulletCards: [
      {
        x: 56,
        y: 340,
        w: 240,
        h: 64
      },
      {
        x: 310,
        y: 340,
        w: 240,
        h: 64
      },
      {
        x: 564,
        y: 340,
        w: 240,
        h: 64
      }
    ],
    note: {
      x: 56,
      y: 424,
      w: 720,
      h: 28
    }
  },
  "three-point": {
    kind: "three-point",
    label: "三点论证",
    className: "layout-three-point",
    canvas: previewSlideCanvas,
    accentBand: {
      x: 0,
      y: 0,
      w: 310,
      h: 478.125
    },
    kicker: {
      x: 56,
      y: 122,
      w: 320,
      h: 20
    },
    title: {
      x: 56,
      y: 155,
      w: 740,
      h: 58
    },
    body: {
      x: 56,
      y: 226,
      w: 710,
      h: 52
    },
    bulletCards: [
      {
        x: 56,
        y: 302,
        w: 240,
        h: 86
      },
      {
        x: 310,
        y: 302,
        w: 240,
        h: 86
      },
      {
        x: 564,
        y: 302,
        w: 240,
        h: 86
      }
    ],
    note: {
      x: 56,
      y: 424,
      w: 720,
      h: 28
    }
  },
  process: {
    kind: "process",
    label: "流程路径",
    className: "layout-process",
    canvas: previewSlideCanvas,
    accentBand: {
      x: 0,
      y: 0,
      w: 260,
      h: 478.125
    },
    kicker: {
      x: 56,
      y: 78,
      w: 320,
      h: 20
    },
    title: {
      x: 56,
      y: 112,
      w: 720,
      h: 58
    },
    body: {
      x: 56,
      y: 190,
      w: 690,
      h: 48
    },
    bulletCards: [
      {
        x: 56,
        y: 288,
        w: 172,
        h: 92
      },
      {
        x: 242,
        y: 288,
        w: 172,
        h: 92
      },
      {
        x: 428,
        y: 288,
        w: 172,
        h: 92
      },
      {
        x: 614,
        y: 288,
        w: 172,
        h: 92
      }
    ],
    note: {
      x: 56,
      y: 424,
      w: 720,
      h: 28
    }
  },
  closing: {
    kind: "closing",
    label: "行动收束",
    className: "layout-closing",
    canvas: previewSlideCanvas,
    accentBand: {
      x: 0,
      y: 0,
      w: 850,
      h: 478.125
    },
    kicker: {
      x: 70,
      y: 104,
      w: 320,
      h: 20
    },
    title: {
      x: 70,
      y: 142,
      w: 680,
      h: 76
    },
    body: {
      x: 70,
      y: 244,
      w: 640,
      h: 52
    },
    bulletCards: [
      {
        x: 70,
        y: 338,
        w: 210,
        h: 58
      },
      {
        x: 296,
        y: 338,
        w: 210,
        h: 58
      },
      {
        x: 522,
        y: 338,
        w: 210,
        h: 58
      }
    ],
    note: {
      x: 70,
      y: 424,
      w: 680,
      h: 28
    }
  }
};

export const previewSlideLayout = slideLayoutRegistry["three-point"];

export const layoutKinds = Object.keys(slideLayoutRegistry) as SlideLayoutKind[];

export function resolveSlideLayoutKind(value: unknown, role?: NodeRole): SlideLayoutKind {
  if (typeof value === "string" && layoutKinds.includes(value as SlideLayoutKind)) {
    return value as SlideLayoutKind;
  }

  switch (role) {
    case "开场":
    case "共鸣":
      return "statement";
    case "转折":
      return "process";
    case "行动":
    case "收束":
      return "closing";
    case "冲突":
    case "论证":
    default:
      return "three-point";
  }
}

export function getPreviewSlideLayout(kind: SlideLayoutKind = "three-point") {
  return slideLayoutRegistry[kind] ?? slideLayoutRegistry["three-point"];
}

export function getPptSlideLayout(kind: SlideLayoutKind = "three-point"): PptSlideLayout {
  const layout = getPreviewSlideLayout(kind);
  return {
    kind: layout.kind,
    label: layout.label,
    canvas: pptWideCanvas,
    accentBand: toPptBox(layout.accentBand),
    kicker: toPptBox(layout.kicker),
    title: toPptBox(layout.title),
    body: toPptBox(layout.body),
    bulletCards: layout.bulletCards.map(toPptBox),
    note: toPptBox(layout.note)
  };
}

function toPptBox(box: LayoutBox): LayoutBox {
  return {
    x: toPptX(box.x),
    y: toPptY(box.y),
    w: toPptX(box.w),
    h: toPptY(box.h)
  };
}

function toPptX(value: number) {
  return round((value / previewSlideCanvas.width) * pptWideCanvas.width);
}

function toPptY(value: number) {
  return round((value / previewSlideCanvas.height) * pptWideCanvas.height);
}

function round(value: number) {
  return Number(value.toFixed(3));
}
