import { Box, Typography } from '@mui/material';
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
  if (!active) return <GameNotice error={error} reserve={false} />;
  return (
    <Box
      data-game-panel="status"
      sx={{
        height: 40,
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
      ) : pending || waiting ? (
        <Typography
          role="status"
          sx={{ textAlign: 'center', fontSize: 12, fontWeight: 700, color: 'primary.main' }}
        >
          {pending ? '判定中…' : '次の曲から参加'}
        </Typography>
      ) : (
        <GameFeedback feedback={feedback} winner={winner} />
      )}
    </Box>
  );
}
