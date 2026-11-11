import {
  createContext,
  useContext,
  useLayoutEffect,
  useRef,
  useState,
  type RefObject,
} from 'react';
import { helpTopics, type HelpRole, type HelpTopic } from './helpTopics.js';

export const HelpScreenSource = createContext<RefObject<HTMLElement | null> | null>(null);
export interface HelpAnchor extends HelpTopic {
  x: number;
  y: number;
  width: number;
  height: number;
}
interface ScreenSnapshot {
  width: number;
  height: number;
  anchors: HelpAnchor[];
}

function visibleAnchors(source: HTMLElement, role: HelpRole): HelpAnchor[] {
  const screen = source.getBoundingClientRect();
  return helpTopics(role)
    .flatMap((topic) => {
      const element = Array.from(
        source.querySelectorAll<HTMLElement>(`[data-help="${topic.id}"]`),
      ).find((element) => {
        const rect = element.getBoundingClientRect();
        return (
          rect.width > 0 &&
          rect.height > 0 &&
          rect.top >= screen.top &&
          rect.bottom <= screen.bottom &&
          rect.left >= screen.left &&
          rect.right <= screen.right
        );
      });
      if (!element) return [];
      const rect = element.getBoundingClientRect();
      return [
        {
          ...topic,
          x: rect.left - screen.left,
          y: rect.top - screen.top,
          width: rect.width,
          height: rect.height,
        },
      ];
    })
    .slice(0, 6)
    .sort((a, b) => a.y - b.y || a.x - b.x);
}

export function useHelpScreen(role: HelpRole) {
  const source = useContext(HelpScreenSource);
  const content = useRef<HTMLDivElement>(null);
  const [snapshot, setSnapshot] = useState<ScreenSnapshot | null>(null);
  useLayoutEffect(() => {
    const original = source?.current;
    const target = content.current;
    if (!original || !target) throw new Error('ヘルプに表示する画面がありません');
    let frame = 0;
    let signature = '';
    const capture = (force = false) => {
      const rect = original.getBoundingClientRect();
      const anchors = visibleAnchors(original, role);
      const next = `${rect.width}:${rect.height}:${anchors.map((anchor) => `${anchor.id}:${Math.round(anchor.x)}:${Math.round(anchor.y)}:${Math.round(anchor.width)}:${Math.round(anchor.height)}`).join(',')}`;
      if (!force && next === signature) return;
      signature = next;
      const cloned = original.cloneNode(true);
      if (!(cloned instanceof HTMLElement)) throw new Error('ヘルプ画面を複製できません');
      cloned.removeAttribute('id');
      cloned.querySelectorAll('[id]').forEach((element) => element.removeAttribute('id'));
      cloned.style.width = `${rect.width}px`;
      cloned.style.height = `${rect.height}px`;
      cloned.style.minHeight = '0';
      cloned.style.overflow = 'hidden';
      cloned.style.margin = '0';
      target.replaceChildren(cloned);
      setSnapshot({ width: rect.width, height: rect.height, anchors });
    };
    const schedule = () => {
      cancelAnimationFrame(frame);
      frame = requestAnimationFrame(() => capture());
    };
    const resize = () => {
      signature = '';
      schedule();
    };
    capture(true);
    const observer = new MutationObserver(schedule);
    observer.observe(original, {
      childList: true,
      subtree: true,
      attributes: true,
      attributeFilter: ['data-help', 'class'],
    });
    window.addEventListener('resize', resize);
    return () => {
      cancelAnimationFrame(frame);
      observer.disconnect();
      window.removeEventListener('resize', resize);
      target.replaceChildren();
    };
  }, [source, role]);
  return { content, snapshot };
}
