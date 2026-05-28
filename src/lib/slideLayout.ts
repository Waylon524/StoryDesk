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

interface PreviewSlideLayout {
  canvas: CanvasSize;
  accentBand: LayoutBox;
  kicker: LayoutBox;
  title: LayoutBox;
  body: LayoutBox;
  bulletCards: LayoutBox[];
  note: LayoutBox;
}

export interface PptSlideLayout {
  canvas: CanvasSize;
  accentBand: LayoutBox;
  kicker: LayoutBox;
  title: LayoutBox;
  body: LayoutBox;
  bulletCards: LayoutBox[];
  note: LayoutBox;
}

export const previewSlideLayout: PreviewSlideLayout = {
  canvas: {
    width: 850,
    height: 478.125
  },
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
};

export const pptWideCanvas = {
  width: 13.333,
  height: 7.5
};

export function getPptSlideLayout(): PptSlideLayout {
  return {
    canvas: pptWideCanvas,
    accentBand: toPptBox(previewSlideLayout.accentBand),
    kicker: toPptBox(previewSlideLayout.kicker),
    title: toPptBox(previewSlideLayout.title),
    body: toPptBox(previewSlideLayout.body),
    bulletCards: previewSlideLayout.bulletCards.map(toPptBox),
    note: toPptBox(previewSlideLayout.note)
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
  return round((value / previewSlideLayout.canvas.width) * pptWideCanvas.width);
}

function toPptY(value: number) {
  return round((value / previewSlideLayout.canvas.height) * pptWideCanvas.height);
}

function round(value: number) {
  return Number(value.toFixed(3));
}
