import { Box } from '@mui/material';
import type { GameFeedback as Feedback } from '../../domain/game/session.js';
import { GameNotice } from './gameNotice.js';
import { GameFeedback } from './gameFeedback.js';

export function GameStatus({
  active,
  error,
  mistake = false,
  feedback,
  winner,
}: {
  active: boolean;
  error: string;
  mistake?: boolean;
  feedback: Feedback | null;
  winner?: string;
}) {
  if (!active) return <GameNotice error={error} reserve={false} />;
  return (
    <Box
      data-game-panel="status"
      data-game-error={!!error}
      sx={{
        height: error ? 'auto' : 40,
        minHeight: 40,
        minWidth: 0,
        flexShrink: 0,
        display: 'grid',
        alignItems: 'center',
        '& .MuiAlert-message': { maxHeight: 96, overflowY: 'auto' },
      }}
    >
      {error || mistake ? (
        <GameNotice error={error} mistake={mistake} />
      ) : (
        <GameFeedback feedback={feedback} winner={winner} />
      )}
    </Box>
  );
}
