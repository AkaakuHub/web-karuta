import { useEffect, useRef, useState } from 'react';
import { fitKarutaBoard } from '../../domain/game/boardLayout.js';

export function useCardLayout(count: number, gap: number, fixedColumns?: number) {
  const container = useRef<HTMLDivElement>(null);
  const [size, setSize] = useState({ width: 0, height: 0 });
  useEffect(() => {
    const element = container.current;
    if (!element) return;
    const observer = new ResizeObserver(([entry]) => {
      if (entry) setSize({ width: entry.contentRect.width, height: entry.contentRect.height });
    });
    observer.observe(element);
    return () => observer.disconnect();
  }, []);
  return { container, layout: fitKarutaBoard(count, size.width, size.height, gap, fixedColumns) };
}
