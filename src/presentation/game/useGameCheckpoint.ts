import { useKarutaConfig } from '../config/karutaProvider.js';
import { useCallback, useRef, useState } from 'react';
import { GameCheckpointStore } from '../../infrastructure/game/checkpointStore.js';
import type { GameSession } from '../../domain/game/session.js';
import type { PracticeMode } from '../../domain/practice/model.js';
import { errorMessage } from '../shared/errorMessage.js';

export function useGameCheckpoint() {
  const { storagePrefix } = useKarutaConfig();
  const [initial] = useState(() => {
    try {
      return {
        store: new GameCheckpointStore(localStorage, `${storagePrefix}-solo-game`),
        error: '',
      };
    } catch (reason) {
      return { store: null, error: errorMessage(reason, '練習の続きの記録を読み込めません') };
    }
  });
  const [snapshot, setSnapshot] = useState(
    () =>
      initial.store?.snapshot ?? {
        saved: {},
        latestDeckId: null,
        invalidDeckIds: [],
        unreadableCurrent: false,
        error: initial.error,
      },
  );
  const [error, setError] = useState('');
  const selection = useRef<{ deckId: string; mode: PracticeMode } | null>(null);
  const select = useCallback((deckId: string, mode: PracticeMode) => {
    selection.current = { deckId, mode };
  }, []);
  const save = useCallback(
    (session: GameSession) => {
      try {
        if (!initial.store) throw new Error(initial.error);
        if (!selection.current) throw new Error('保存する出題範囲がありません');
        initial.store.save(selection.current.deckId, selection.current.mode, session);
        setSnapshot(initial.store.snapshot);
        setError('');
        return true;
      } catch (reason) {
        setError(errorMessage(reason, '練習の続きの記録を保存できません'));
        return false;
      }
    },
    [initial],
  );
  const has = (deckId: string) =>
    !!snapshot.saved[deckId] ||
    snapshot.unreadableCurrent ||
    snapshot.invalidDeckIds.includes(deckId);
  return {
    saved: snapshot.saved,
    latestDeckId: snapshot.latestDeckId,
    error: error || snapshot.error,
    has,
    select,
    save,
  };
}
