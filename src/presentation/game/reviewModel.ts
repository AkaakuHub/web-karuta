import type { RoundResult } from '../../domain/game/results.js';

export interface ReviewCard extends RoundResult {
  title: string;
  backText: string;
  links: readonly { name: string; url: string }[];
}
