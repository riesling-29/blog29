/** Fit a complete slide and its content; never crop overflowing text to fake a fit. */
export const SLIDE_WIDTH = 1280;
export const SLIDE_HEIGHT = 720;
export const SLIDE_INSET_X = 56;
export const SLIDE_INSET_Y = 44;

type Size = { width: number; height: number };

export function fitPresentation(viewport: Size, content: Size) {
  const availableWidth = SLIDE_WIDTH - 2 * SLIDE_INSET_X;
  const availableHeight = SLIDE_HEIGHT - 2 * SLIDE_INSET_Y;
  const canvasScale = Math.max(0, Math.min(viewport.width / SLIDE_WIDTH, viewport.height / SLIDE_HEIGHT));
  const contentScale = Math.min(1, availableWidth / Math.max(1, content.width), availableHeight / Math.max(1, content.height));
  return {
    width: SLIDE_WIDTH * canvasScale,
    height: SLIDE_HEIGHT * canvasScale,
    canvasScale,
    contentScale,
    contentLeft: (SLIDE_WIDTH - content.width * contentScale) / 2,
    contentTop: SLIDE_INSET_Y,
  };
}
