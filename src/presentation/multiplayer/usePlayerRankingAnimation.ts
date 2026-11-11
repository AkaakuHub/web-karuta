import { useLayoutEffect, useRef } from 'react';

export function usePlayerRankingAnimation(order: string) {
  const container = useRef<HTMLDivElement>(null);
  const positions = useRef(new Map<string, { x: number; y: number }>());
  useLayoutEffect(() => {
    const element = container.current;
    if (!element) return;
    const next = new Map<string, { x: number; y: number }>();
    const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    for (const child of element.children) {
      if (!(child instanceof HTMLElement) || !child.dataset.playerId) continue;
      const id = child.dataset.playerId;
      const before = positions.current.get(id);
      const position = { x: child.offsetLeft, y: child.offsetTop };
      next.set(id, position);
      if (before && !reduced) {
        const transform = new DOMMatrix(getComputedStyle(child).transform);
        const x = before.x + transform.m41 - position.x;
        const y = before.y + transform.m42 - position.y;
        child.getAnimations().forEach((animation) => animation.cancel());
        if (x || y)
          child.animate(
            [{ transform: `translate(${x}px, ${y}px)` }, { transform: 'translate(0, 0)' }],
            { duration: 280, easing: 'cubic-bezier(.2,.8,.2,1)' },
          );
      }
    }
    positions.current = next;
  }, [order]);
  return container;
}
