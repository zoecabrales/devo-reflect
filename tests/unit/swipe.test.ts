import { isChapterSwipe, isZoomedIn } from "@/src/utils/swipe";

const drag = { dx: -60, dy: 5, touches: 1, zoomed: false };

describe("isChapterSwipe", () => {
  it("accepts a one-finger sideways drag either way", () => {
    expect(isChapterSwipe(drag)).toBe(true);
    expect(isChapterSwipe({ ...drag, dx: 60 })).toBe(true);
  });

  it("leaves short drags and scrolling alone", () => {
    expect(isChapterSwipe({ ...drag, dx: 10 })).toBe(false);
    expect(isChapterSwipe({ ...drag, dy: 40 })).toBe(false);
  });

  it("ignores pinches, and drags while zoomed in", () => {
    expect(isChapterSwipe({ ...drag, touches: 2 })).toBe(false);
    expect(isChapterSwipe({ ...drag, zoomed: true })).toBe(false);
  });
});

describe("isZoomedIn", () => {
  it("allows for rounding, and browsers without a scale", () => {
    expect(isZoomedIn(undefined)).toBe(false);
    expect(isZoomedIn(1.001)).toBe(false);
    expect(isZoomedIn(1.5)).toBe(true);
  });
});
