import { expect, it } from 'vite-plus/test';
import { helpMarkerSize, placeHelpMarkers, type HelpRect } from './markers.js';

function overlap(a: HelpRect, b: HelpRect) {
  return (
    Math.min(a.x + a.width, b.x + b.width) > Math.max(a.x, b.x) &&
    Math.min(a.y + a.height, b.y + b.height) > Math.max(a.y, b.y)
  );
}

for (const width of [140, 180, 430, 1000]) {
  it(`${width}pxの画面でも密集した操作欄と番号同士を重ねない`, () => {
    const height = 420;
    const targets = Array.from({ length: 6 }, (_, index) => ({
      x: 20 + (index % 3) * 28,
      y: 230 + Math.floor(index / 3) * 28,
      width: 24,
      height: 24,
    }));
    const blockers = [...targets, { x: 4, y: 20, width: width - 8, height: 180 }];
    const points = placeHelpMarkers(targets, blockers, width, height);
    expect(points).toHaveLength(targets.length);
    expect(placeHelpMarkers(targets, blockers, width, height)).toEqual(points);
    const markers = points.map((point) => ({
      ...point,
      width: helpMarkerSize,
      height: helpMarkerSize,
    }));
    for (const [index, marker] of markers.entries()) {
      expect(marker.x).toBeGreaterThanOrEqual(0);
      expect(marker.y).toBeGreaterThanOrEqual(0);
      expect(marker.x + marker.width).toBeLessThanOrEqual(width);
      expect(marker.y + marker.height).toBeLessThanOrEqual(height);
      expect(blockers.some((blocker) => overlap(marker, blocker))).toBe(false);
      expect(markers.slice(0, index).some((other) => overlap(marker, other))).toBe(false);
    }
  });
}
