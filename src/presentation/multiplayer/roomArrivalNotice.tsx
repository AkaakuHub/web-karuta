import { useEffect, useRef, useState } from 'react';
import { Snackbar } from '@mui/material';
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
    <Snackbar
      key={notice?.revision}
      open={notice !== null && room.phase !== 'lobby' && room.phase !== 'finished'}
      autoHideDuration={4000}
      onClose={(_, reason) => {
        if (reason !== 'clickaway') setNotice(null);
      }}
      message={notice?.message}
      slotProps={{ content: { role: 'status', 'aria-live': 'polite' } }}
      sx={{
        position: 'absolute',
        top: { xs: 0, sm: 0 },
        bottom: { xs: 0, sm: 0 },
        left: { xs: 0, sm: 0 },
        right: { xs: 0, sm: 0 },
        transform: { xs: 'none', sm: 'none' },
        pointerEvents: 'none',
        minWidth: 0,
        '& .MuiSnackbarContent-root': {
          width: '100%',
          minWidth: 0,
          height: '100%',
          minHeight: 0,
          boxSizing: 'border-box',
          px: 0.75,
          py: 0,
          flexWrap: 'nowrap',
          borderRadius: 1,
        },
        '& .MuiSnackbarContent-message': {
          p: 0,
          fontSize: { xs: 11, sm: 12 },
          whiteSpace: 'nowrap',
          overflow: 'hidden',
          textOverflow: 'ellipsis',
        },
      }}
    />
  );
}
