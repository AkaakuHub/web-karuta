import { Alert } from '@mui/material';
import type { RoomView } from '../../domain/multiplayer/protocol.js';

export function RoomWaiting({ room, you }: { room: RoomView; you: string }) {
  if (room.host === you || !['lobby', 'finished'].includes(room.phase)) return null;
  return (
    <Alert severity="info" sx={{ overflowWrap: 'anywhere' }}>
      {room.host
        ? 'ホストが次の出題範囲を選んでいます。この部屋で次の対戦が始まります。'
        : 'プレイヤーの入室を待っています。'}
    </Alert>
  );
}
