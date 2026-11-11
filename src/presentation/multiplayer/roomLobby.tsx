import { Button, Chip, Divider, Stack, Typography } from '@mui/material';
import type { RoomView } from '../../domain/multiplayer/protocol.js';
import { RoomInvitation } from './roomInvitation.js';
import { RoomWaiting } from './roomWaiting.js';

export function RoomLobby({
  room,
  you,
  roomId,
  onError,
  onLeave,
}: {
  room: RoomView;
  you: string;
  roomId: string;
  onError: (message: string) => void;
  onLeave: () => void;
}) {
  const count = room.players.filter((player) => player.connected).length;
  return (
    <>
      <Stack direction="row" sx={{ alignItems: 'center', justifyContent: 'space-between' }}>
        <Typography component="h2" variant="h5" sx={{ fontWeight: 800 }}>
          対戦ルーム
        </Typography>
        <Chip size="small" color={count >= 2 ? 'success' : 'default'} label={`${count}人参加中`} />
      </Stack>
      <Divider />
      <Stack direction="row" sx={{ alignItems: 'center', flexWrap: 'wrap', gap: 0.5 }}>
        <RoomInvitation roomId={roomId} onError={onError} />
        <Button onClick={onLeave} sx={{ ml: 'auto' }}>
          退出
        </Button>
      </Stack>
      <RoomWaiting room={room} you={you} />
    </>
  );
}
