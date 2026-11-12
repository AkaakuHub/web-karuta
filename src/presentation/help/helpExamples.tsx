import { createContext, useContext, useMemo, type ReactNode } from 'react';
import { sampleHelpCards } from '../../domain/help/sampleCards.js';
import type { ReviewCard } from '../game/reviewModel.js';

export type HelpCard = Omit<ReviewCard, 'owner'>;
interface HelpExamples {
  cards: readonly HelpCard[];
  renderCard: (id: string, back: boolean) => ReactNode;
  renderPicker: (cards: readonly HelpCard[], onSettings: () => void) => ReactNode;
}
const Examples = createContext<HelpExamples | null>(null);

export function HelpExamplesProvider({
  cards,
  renderCard,
  renderPicker,
  children,
}: HelpExamples & { children: ReactNode }) {
  const selected = useMemo(() => sampleHelpCards(cards), [cards]);
  return <Examples value={{ cards: selected, renderCard, renderPicker }}>{children}</Examples>;
}

export function useHelpExamples() {
  const examples = useContext(Examples);
  if (!examples || examples.cards.length < 2) throw new Error('ヘルプ用のカードがありません');
  return examples;
}
