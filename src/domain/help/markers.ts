export interface HelpRect {
  x: number;
  y: number;
  width: number;
  height: number;
}
export interface HelpPoint {
  x: number;
  y: number;
}
export const helpMarkerSize = 18;

function intersects(a: HelpRect, b: HelpRect, gap: number) {
  return (
    a.x < b.x + b.width + gap &&
    a.x + a.width + gap > b.x &&
    a.y < b.y + b.height + gap &&
    a.y + a.height + gap > b.y
  );
}

export function placeHelpMarkers(
  targets: readonly HelpRect[],
  blockers: readonly HelpRect[],
  width: number,
  height: number,
): HelpPoint[] {
  const size = helpMarkerSize;
  if (width < size + 4 || height < size + 4) return [];
  const placed: HelpRect[] = [];
  for (const target of targets) {
    const candidates: HelpPoint[] = [
      { x: target.x - size - 5, y: target.y - size - 5 },
      { x: target.x + target.width + 5, y: target.y - size - 5 },
      { x: target.x - size - 5, y: target.y + target.height + 5 },
      { x: target.x + target.width + 5, y: target.y + target.height + 5 },
    ];
    for (let y = 2; y <= height - size - 2; y += 6)
      for (let x = 2; x <= width - size - 2; x += 6) candidates.push({ x, y });
    let best: HelpPoint | null = null;
    let distance = Infinity;
    for (const point of candidates) {
      const rect = { ...point, width: size, height: size };
      if (point.x < 2 || point.y < 2 || point.x + size > width - 2 || point.y + size > height - 2)
        continue;
      if (
        blockers.some((blocker) => intersects(rect, blocker, 3)) ||
        placed.some((marker) => intersects(rect, marker, 5))
      )
        continue;
      const dx = point.x + size / 2 - (target.x + target.width / 2);
      const dy = point.y + size / 2 - (target.y + target.height / 2);
      const crowding = placed.reduce((total, marker) => {
        const separation = Math.hypot(point.x - marker.x, point.y - marker.y);
        return total + Math.max(0, 44 - separation) ** 2 * 3;
      }, 0);
      const next = dx * dx + dy * dy + crowding;
      if (next < distance) {
        best = point;
        distance = next;
      }
    }
    if (!best) break;
    placed.push({ ...best, width: size, height: size });
  }
  return placed.map(({ x, y }) => ({ x, y }));
}
