import { describe, expect, it } from "vitest";
import { getPptSlideLayout, previewSlideLayout } from "./slideLayout";

describe("slide layout mapping", () => {
  it("maps the fixed preview canvas to the PowerPoint wide canvas proportionally", () => {
    const layout = getPptSlideLayout();

    expect(previewSlideLayout.canvas).toEqual({
      width: 850,
      height: 478.125
    });
    expect(layout.canvas).toEqual({
      width: 13.333,
      height: 7.5
    });
    expect(layout.title.x / layout.canvas.width).toBeCloseTo(previewSlideLayout.title.x / previewSlideLayout.canvas.width, 4);
    expect(layout.title.y / layout.canvas.height).toBeCloseTo(previewSlideLayout.title.y / previewSlideLayout.canvas.height, 4);
    expect(layout.body.x / layout.canvas.width).toBeCloseTo(previewSlideLayout.body.x / previewSlideLayout.canvas.width, 4);
    expect(layout.note.y / layout.canvas.height).toBeCloseTo(previewSlideLayout.note.y / previewSlideLayout.canvas.height, 4);
    expect(layout.bulletCards).toHaveLength(3);
  });
});
