import { HIGHLIGHT_COLORS } from "@/src/features/bible/readerConstants";
import {
  highlightShades,
  highlightTextShadow,
  isDarkColor,
} from "@/src/utils/highlightStyle";

const lightness = (hsl: string) => Number(hsl.match(/(\d+)%\)$/)![1]);
const hue = (hsl: string) => Number(hsl.match(/^hsl\((\d+)/)![1]);

describe("isDarkColor", () => {
  it("tells dark theme backgrounds from light ones", () => {
    for (const dark of ["#121212", "#1c1409", "#0d1b2e"]) expect(isDarkColor(dark)).toBe(true);
    for (const light of ["#ffffff", "#fdf6e3", "#f0f8ff"]) expect(isDarkColor(light)).toBe(false);
  });
});

describe("highlightShades", () => {
  it("keeps the hue of the saved highlight colour", () => {
    expect(hue(highlightShades("#FFD966", true).edge)).toBe(45);
    expect(hue(highlightShades("#76A9EA", false).edge)).toBe(214);
  });

  it("makes the side under the letters darker than the outline", () => {
    for (const color of HIGHLIGHT_COLORS) {
      for (const darkPage of [true, false]) {
        const { edge, depth } = highlightShades(color, darkPage);
        expect(lightness(depth)).toBeLessThan(lightness(edge));
      }
    }
  });

  it("keeps the sky blue visibly paler than the blue", () => {
    for (const darkPage of [true, false]) {
      const blue = lightness(highlightShades("#76A9EA", darkPage).edge);
      const sky = lightness(highlightShades("#A0C4FF", darkPage).edge);
      expect(sky - blue).toBeGreaterThanOrEqual(8);
    }
  });

  it("gives every offered colour its own outline", () => {
    for (const darkPage of [true, false]) {
      const edges = HIGHLIGHT_COLORS.map((c) => highlightShades(c, darkPage).edge);
      expect(new Set(edges).size).toBe(HIGHLIGHT_COLORS.length);
    }
  });
});

describe("highlightTextShadow", () => {
  it("draws an outline all round, two depth layers and a soft shadow", () => {
    const layers = highlightTextShadow("#FFD966", true).split(/,(?![^(]*\))/);
    expect(layers).toHaveLength(19);
    // Right, below, left and above the letter
    for (const offset of ["0.9px 0px", "0px 0.9px", "-0.9px 0px", "0px -0.9px"]) {
      expect(layers.some((l) => l.trim().startsWith(offset))).toBe(true);
    }
  });
});
