import type { RoomView } from '../../domain/multiplayer/protocol.js';
import type { PlayerSeries } from '../../domain/game/seriesBreakdown.js';
import type { HelpCard } from './helpExamples.js';
import type { HelpRole } from './helpTopics.js';

export type HelpStage =
  | 'create'
  | 'join'
  | 'reconnect'
  | 'lobby'
  | 'loading'
  | 'playing'
  | 'revealed'
  | 'results';
export function helpRoom(cards: readonly HelpCard[], role: HelpRole, stage: HelpStage): RoomView {
  const active = ['playing', 'revealed', 'loading'].includes(stage);
  const results =
    stage === 'results'
      ? cards.map((card, index) => ({
          id: card.id,
          owner: role === 'solo' || index < 18 ? 'help-a' : 'help-b',
        }))
      : active
        ? cards.slice(21, 25).map((card, index) => ({
            id: card.id,
            owner: role === 'solo' || index < 3 ? 'help-a' : 'help-b',
          }))
        : [];
  if (stage === 'revealed') results.push({ id: cards[0]!.id, owner: 'help-a' });
  const players = [
    { id: 'help-a', name: 'あかり' },
    ...(role === 'solo' ? [] : [{ id: 'help-b', name: 'ひなた' }]),
  ].map((player) => ({
    ...player,
    score: results.filter((result) => result.owner === player.id).length,
    connected: true,
    removed: false,
  }));
  return {
    host: role === 'player' || role === 'spectator' ? 'help-b' : 'help-a',
    deckId: 'help-example',
    players,
    spectators:
      role === 'spectator' ? [{ id: 'help-viewer', name: 'さくら', connected: true }] : [],
    board: cards.slice(0, 21).map((card) => card.id),
    phase:
      stage === 'results'
        ? 'finished'
        : stage === 'revealed'
          ? 'revealed'
          : stage === 'playing'
            ? 'playing'
            : stage === 'loading'
              ? 'loading'
              : 'lobby',
    round: active ? 4 : stage === 'results' ? cards.length - 1 : 0,
    total: cards.length,
    startsAt: null,
    audio: null,
    answer: stage === 'revealed' ? cards[0]!.id : null,
    winner: stage === 'revealed' ? 'help-a' : null,
    blocked: [],
    ready: stage === 'loading' ? ['help-a'] : players.map((player) => player.id),
    results,
  };
}

export function helpSeries(room: RoomView): PlayerSeries[] {
  return room.players.map((player) => ({
    id: player.id,
    name: player.name,
    total: player.score,
    slices: player.score
      ? [
          {
            id: 'a',
            name: 'シリーズA',
            color: '#168fe5',
            count: Math.ceil(player.score * 0.6),
            value: Math.ceil(player.score * 0.6),
          },
          {
            id: 'b',
            name: 'シリーズB',
            color: '#ed70aa',
            count: Math.floor(player.score * 0.4),
            value: Math.floor(player.score * 0.4),
          },
        ].filter((slice) => slice.count > 0)
      : [],
  }));
}

export function ignoreHelpAction() {}
