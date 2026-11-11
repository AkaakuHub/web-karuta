import { useEffect, useMemo, useState } from 'react';
import { GameToast } from '../game/gameToast.js';
import { Alert } from '@mui/material';
import type { RoomView } from '../../domain/multiplayer/protocol.js';
import { waitingPlayers } from '../../domain/multiplayer/participants.js';

export function PreparationWarning({ room, you }: { room: RoomView | null; you: string }) {
  const preparation = useMemo(
    () => ({ phase: room?.phase, round: room?.round, audio: room?.audio }),
    [room?.phase, room?.round, room?.audio],
  );
  const [delayed, setDelayed] = useState<typeof preparation | null>(null);
  const loading = room?.phase === 'loading';
  useEffect(() => {
    if (!loading) return;
    const timer = window.setTimeout(() => setDelayed(preparation), 10000);
    return () => window.clearTimeout(timer);
  }, [loading, preparation]);
  const waiting = room ? waitingPlayers(room).filter((player) => player.id !== you) : [];
  return (
    <GameToast
      open={loading && delayed === preparation && waiting.length > 0}
      duration={8000}
      onClose={() => setDelayed(null)}
    >
      <Alert
        severity="warning"
        variant="filled"
        onClose={() => setDelayed(null)}
        sx={{ maxWidth: '100%', overflowWrap: 'anywhere' }}
      >
        準備に10秒以上かかっています。{waiting.map((player) => player.name).join('、')}
        さんがスリープ中、または通信が途切れている可能性があります。
      </Alert>
    </GameToast>
  );
}
