import { Alert } from '@mui/material';
import { GameToast } from './gameToast.js';
import type { GameFeedback as Feedback } from '../../domain/game/session.js';
import { GameNotice } from './gameNotice.js';
import { GameFeedback } from './gameFeedback.js';

export function GameStatus({
  active,
  error,
  mistake = false,
  feedback,
  winner,
  pending = false,
  waiting = false,
}: {
  active: boolean;
  error: string;
  mistake?: boolean;
  feedback: Feedback | null;
  winner?: string;
  pending?: boolean;
  waiting?: boolean;
}) {
  if (!active || error || mistake) return <GameNotice error={error} mistake={active && mistake} />;
  if (!pending && !waiting) return <GameFeedback feedback={feedback} winner={winner} />;
  const message = pending ? '判定中…' : '次の曲から参加';
  return (
    <GameToast key={message} open>
      <Alert severity="info" role="status">
        {message}
      </Alert>
    </GameToast>
  );
}
