import { useKarutaConfig } from '../config/karutaProvider.js';
import { useCallback, useEffect, useRef, useState } from 'react';
import { DefaultScheduler } from 'ts-fsrs';
import {
  practiceSchema,
  reviewPractice,
  type PracticeRecords,
} from '../../domain/practice/model.js';
import { errorMessage } from '../shared/errorMessage.js';

export function usePractice() {
  const { storagePrefix } = useKarutaConfig();
  const storageKey = `${storagePrefix}-practice`;
  const [records, setRecords] = useState<PracticeRecords>({});
  const [now, setNow] = useState(() => new Date());
  const [ready, setReady] = useState(false);
  const [error, setError] = useState('');
  const scheduler = useRef<DefaultScheduler | null>(null);
  const current = useRef<PracticeRecords>({});
  const readable = useRef(false);
  useEffect(() => {
    let active = true;
    try {
      const saved = localStorage.getItem(storageKey);
      current.current = saved === null ? {} : practiceSchema.parse(JSON.parse(saved));
      setRecords(current.current);
      readable.current = true;
    } catch (reason) {
      setError(errorMessage(reason, '学習記録を読み込めません'));
    }
    void DefaultScheduler({ enableFuzz: false })
      .then((value) => {
        if (!active) return;
        scheduler.current = value;
        setReady(readable.current);
      })
      .catch((reason: unknown) => setError(errorMessage(reason, '復習機能を準備できません')));
    return () => {
      active = false;
    };
  }, [storageKey]);
  useEffect(() => {
    const due = Object.values(records)
      .map((record) => record.card.dueAt.getTime())
      .filter((time) => time > now.getTime());
    const refresh = () => setNow(new Date());
    window.addEventListener('focus', refresh);
    const timer = due.length
      ? window.setTimeout(refresh, Math.min(2_147_483_647, Math.min(...due) - Date.now() + 1))
      : undefined;
    return () => {
      window.removeEventListener('focus', refresh);
      window.clearTimeout(timer);
    };
  }, [records, now]);
  const review = useCallback(
    (songId: string, correct: boolean) => {
      const value = scheduler.current;
      if (!value || !readable.current) return;
      try {
        const next = {
          ...current.current,
          [songId]: reviewPractice(value, current.current[songId], songId, correct, new Date()),
        };
        localStorage.setItem(storageKey, JSON.stringify(next));
        current.current = next;
        setRecords(next);
        setError('');
      } catch (reason) {
        setError(errorMessage(reason, '学習記録を保存できません'));
      }
    },
    [storageKey],
  );
  return { records, ready, error, review, now };
}
