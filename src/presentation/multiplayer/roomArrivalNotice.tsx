import { useEffect, useRef, useState } from 'react';
import { Box, SnackbarContent } from '@mui/material';
import { GameToast } from '../game/gameToast.js';
import type { RoomView } from '../../domain/multiplayer/protocol.js';

export function RoomArrivalNotice({ room, you }: { room: RoomView; you: string }) {
  const previous = useRef<RoomView | null>(null);
  const [notice, setNotice] = useState<{ message: string; revision: number } | null>(null);
  useEffect(() => {
    const before = previous.current;
    previous.current = room;
    if (!before || before.phase === 'lobby' || before.phase === 'finished') return;
    const arrivals = [...room.players, ...room.spectators].filter(
      (player) =>
        player.id !== you &&
        player.connected &&
        ![...before.players, ...before.spectators].some((existing) => existing.id === player.id),
    );
    if (arrivals.length) {
      setNotice((current) => ({
        message: arrivals.map((player) => player.name).join('、'),
        revision: (current?.revision ?? 0) + 1,
      }));
    }
  }, [room, you]);
  return (
    <GameToast
      key={notice?.revision}
      open={notice !== null && room.phase !== 'lobby' && room.phase !== 'finished'}
      onClose={() => setNotice(null)}
    >
      <SnackbarContent
        role="status"
        aria-live="polite"
        message={
          <Box sx={{ display: 'flex', alignItems: 'center', minWidth: 0 }}>
            <Box
              component="span"
              sx={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}
            >
              {notice?.message}
            </Box>
            <Box component="span" sx={{ flexShrink: 0 }}>
              さんが入室しました
            </Box>
          </Box>
        }
        sx={{
          minWidth: { xs: 0, sm: 0 },
          width: 'max-content',
          maxWidth: '100%',
          flexGrow: 0,
          py: 0,
          px: 1.5,
          bgcolor: '#17202d',
          '& .MuiSnackbarContent-message': { py: 0.75, fontSize: 13, minWidth: 0 },
        }}
      />
    </GameToast>
  );
}
