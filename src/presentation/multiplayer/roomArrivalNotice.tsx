import { useEffect, useRef, useState } from 'react';
import { SnackbarContent } from '@mui/material';
import { GameToast } from '../game/gameToast.js';
import type { RoomView } from '../../domain/multiplayer/protocol.js';

export function RoomArrivalNotice({ room, you }: { room: RoomView; you: string }) {
  const previous = useRef<RoomView | null>(null);
  const [notice, setNotice] = useState<{ message: string; revision: number } | null>(null);
  useEffect(() => {
    const before = previous.current;
    previous.current = room;
    if (!before || before.phase === 'lobby' || before.phase === 'finished') return;
    const arrivals = room.players.filter(
      (player) =>
        player.id !== you &&
        player.connected &&
        !player.removed &&
        !before.players.some((existing) => existing.id === player.id),
    );
    if (arrivals.length) {
      setNotice((current) => ({
        message: `${arrivals.map((player) => player.name).join('、')}さんが入室しました`,
        revision: (current?.revision ?? 0) + 1,
      }));
    }
  }, [room, you]);
  return (
    <GameToast
      key={notice?.revision}
      open={notice !== null && room.phase !== 'lobby' && room.phase !== 'finished'}
      duration={4000}
      onClose={() => setNotice(null)}
    >
      <SnackbarContent
        role="status"
        aria-live="polite"
        message={notice?.message}
        sx={{ minWidth: 0, py: 0, '& .MuiSnackbarContent-message': { py: 0.75, fontSize: 12 } }}
      />
    </GameToast>
  );
}
