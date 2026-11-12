import {
  createContext,
  useContext,
  useLayoutEffect,
  useRef,
  useState,
  type RefObject,
} from 'react';
import type { HelpRect } from '../../domain/help/markers.js';
import { helpTopics, type HelpRole, type HelpTopic } from './helpTopics.js';
import type { HelpStage } from './helpModel.js';

export const HelpScreenSource = createContext<RefObject<HTMLElement | null> | null>(null);
export interface HelpAnchor extends HelpTopic, HelpRect {}
interface HelpSnapshot {
  scene: string;
  width: number;
  height: number;
  anchors: HelpAnchor[];
  blockers: HelpRect[];
}
function sceneOf(source: HTMLElement): HelpStage {
  const entrance = source.querySelector('[data-help-entrance]')?.getAttribute('data-help-entrance');
  if (entrance === 'create' || entrance === 'join' || entrance === 'reconnect') return entrance;
  if (source.querySelector('[aria-label="対戦結果"]')) return 'results';
  const stage = source.querySelector('[data-help-stage]')?.getAttribute('data-help-stage');
  if (stage === 'playing' || stage === 'revealed') return stage;
  if (stage === 'loading' || stage === 'ready') return 'loading';
  return 'lobby';
}

export function useHelpScreen(role: HelpRole) {
  const source = useContext(HelpScreenSource)?.current;
  if (!source) throw new Error('ヘルプの場面を確認できません');
  const preview = useRef<HTMLDivElement>(null);
  const [stage, setStage] = useState(() => sceneOf(source));
  const [viewport, setViewport] = useState(() => ({
    width: window.innerWidth,
    height: window.innerHeight,
  }));
  const [snapshot, setSnapshot] = useState<HelpSnapshot | null>(null);
  useLayoutEffect(() => {
    const observer = new MutationObserver(() => setStage(sceneOf(source)));
    observer.observe(source, {
      childList: true,
      subtree: true,
      attributes: true,
      attributeFilter: ['data-help-stage', 'data-help-entrance'],
    });
    const resize = () => setViewport({ width: window.innerWidth, height: window.innerHeight });
    window.addEventListener('resize', resize);
    return () => {
      observer.disconnect();
      window.removeEventListener('resize', resize);
    };
  }, [source]);
  useLayoutEffect(() => {
    const element = preview.current;
    if (!element) return;
    let frame = 0;
    let signature = '';
    const capture = () => {
      const screen = element.getBoundingClientRect();
      if (!screen.width || !element.offsetWidth) return;
      const factor = screen.width / element.offsetWidth;
      const rectOf = (node: Element): HelpRect => {
        const rect = node.getBoundingClientRect();
        return {
          x: (rect.left - screen.left) / factor,
          y: (rect.top - screen.top) / factor,
          width: rect.width / factor,
          height: rect.height / factor,
        };
      };
      const visible = (node: HTMLElement) => {
        const rect = rectOf(node);
        return (
          rect.width > 0 &&
          rect.height > 0 &&
          rect.x >= -1 &&
          rect.y >= -1 &&
          rect.x + rect.width <= element.offsetWidth + 1 &&
          rect.y + rect.height <= element.offsetHeight + 1
        );
      };
      const anchors = helpTopics(role)
        .flatMap((topic) => {
          const node = Array.from(
            element.querySelectorAll<HTMLElement>(`[data-help="${topic.id}"]`),
          ).find(
            (node) =>
              visible(node) &&
              (topic.id !== 'cards' || role === 'spectator' || !node.matches(':disabled')),
          );
          return node ? [{ ...topic, ...rectOf(node) }] : [];
        })
        .slice(0, 6)
        .sort((a, b) => a.y - b.y || a.x - b.x);
      const blockers = Array.from(
        element.querySelectorAll<Element>(
          'button,input,select,a,[role="slider"],[role="combobox"],.MuiTypography-root,.MuiChip-root,label,svg',
        ),
      ).flatMap((node) => {
        if (node.tagName.toLowerCase() === 'svg' && node.closest('button')) return [];
        const rect = rectOf(node);
        const x = Math.max(0, rect.x);
        const y = Math.max(0, rect.y);
        const width = Math.min(element.offsetWidth, rect.x + rect.width) - x;
        const height = Math.min(element.offsetHeight, rect.y + rect.height) - y;
        return width > 0 && height > 0 ? [{ x, y, width, height }] : [];
      });
      const next = JSON.stringify({
        width: element.offsetWidth,
        height: element.offsetHeight,
        anchors,
        blockers,
      });
      if (signature === next) return;
      signature = next;
      setSnapshot({
        scene: `${role}:${stage}`,
        width: element.offsetWidth,
        height: element.offsetHeight,
        anchors,
        blockers,
      });
    };
    const schedule = () => {
      cancelAnimationFrame(frame);
      frame = requestAnimationFrame(capture);
    };
    const observer = new MutationObserver(schedule);
    observer.observe(element, {
      childList: true,
      subtree: true,
      attributes: true,
      attributeFilter: ['class', 'data-help'],
    });
    const resize = new ResizeObserver(schedule);
    resize.observe(element);
    schedule();
    return () => {
      cancelAnimationFrame(frame);
      observer.disconnect();
      resize.disconnect();
    };
  }, [role, stage, viewport]);
  return { preview, snapshot, stage, viewport };
}
