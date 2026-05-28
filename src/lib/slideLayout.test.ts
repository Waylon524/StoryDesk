import { describe, expect, it } from "vitest";
import {
  getPptSlideLayout,
  getPreviewSlideLayout,
  layoutKinds,
  previewSlideCanvas,
  resolveSlideLayoutKind
} from "./slideLayout";

describe("slide layout mapping", () => {
  it("maps every fixed preview layout to the PowerPoint wide canvas proportionally", () => {
    layoutKinds.forEach((kind) => {
      const previewLayout = getPreviewSlideLayout(kind);
      const layout = getPptSlideLayout(kind);

      expect(previewLayout.canvas).toEqual(previewSlideCanvas);
      expect(layout.canvas).toEqual({
        width: 13.333,
        height: 7.5
      });
      expect(layout.kind).toBe(kind);
      expect(layout.title.x / layout.canvas.width).toBeCloseTo(previewLayout.title.x / previewLayout.canvas.width, 3);
      expect(layout.title.y / layout.canvas.height).toBeCloseTo(previewLayout.title.y / previewLayout.canvas.height, 3);
      expect(layout.body.x / layout.canvas.width).toBeCloseTo(previewLayout.body.x / previewLayout.canvas.width, 3);
      expect(layout.note.y / layout.canvas.height).toBeCloseTo(previewLayout.note.y / previewLayout.canvas.height, 3);
      expect(layout.bulletCards).toHaveLength(previewLayout.bulletCards.length);
    });
  });

  it("resolves missing layout kinds from narrative roles", () => {
    expect(resolveSlideLayoutKind(undefined, "开场")).toBe("statement");
    expect(resolveSlideLayoutKind(undefined, "转折")).toBe("process");
    expect(resolveSlideLayoutKind(undefined, "行动")).toBe("closing");
    expect(resolveSlideLayoutKind(undefined, "论证")).toBe("three-point");
    expect(resolveSlideLayoutKind("process", "论证")).toBe("process");
  });
});
