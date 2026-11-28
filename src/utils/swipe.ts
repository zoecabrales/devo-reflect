/** Page zoom above this counts as zoomed in (allows for rounding). */
const ZOOMED_SCALE = 1.01;

export function isZoomedIn(scale: number | undefined): boolean {
  return (scale ?? 1) > ZOOMED_SCALE;
}

/**
 * Whether a drag is a chapter swipe: one finger, clearly sideways, on a page
 * that isn't zoomed in (there, dragging moves around the page).
 */
export function isChapterSwipe(drag: {
  dx: number;
  dy: number;
  touches: number;
  zoomed: boolean;
}): boolean {
  const { dx, dy, touches, zoomed } = drag;
  return (
    !zoomed && touches === 1 && Math.abs(dx) > 14 && Math.abs(dx) > Math.abs(dy) * 2
  );
}
