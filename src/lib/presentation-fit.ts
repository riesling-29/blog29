/** Every page has the same master. Only the complete canvas scales with the viewport. */
export const PRESENTATION_MASTER = {
  width: 1280,
  height: 720,
  left: 56,
  right: 56,
  sectionTop: 30,
  titleTop: 64,
  titleHeight: 104,
  bodyTop: 190,
  bodyHeight: 462,
  footerTop: 676,
  titleSize: 40,
  subtitleSize: 26,
  bodySize: 22,
  tableSize: 18,
  captionSize: 14,
} as const;
export const SLIDE_WIDTH = PRESENTATION_MASTER.width;
export const SLIDE_HEIGHT = PRESENTATION_MASTER.height;

export function fitPresentation(viewport: { width: number; height: number }) {
  const canvasScale = Math.max(0, Math.min(viewport.width / SLIDE_WIDTH, viewport.height / SLIDE_HEIGHT));
  return { width: SLIDE_WIDTH * canvasScale, height: SLIDE_HEIGHT * canvasScale, canvasScale };
}
