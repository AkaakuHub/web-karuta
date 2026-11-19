import { Alert, Box } from '@mui/material';
import { GameToast } from './gameToast.js';
import type { GameFeedback as FeedbackState } from '../../domain/game/session.js';

export function GameFeedback({
  feedback,
  winner,
}: {
  feedback: FeedbackState | null;
  winner?: string;
}) {
  if (!feedback) return null;
  const name = feedback.winner ?? winner;
  const { kind, time } = feedback;
  const message =
    kind === 'correct'
      ? name
        ? `${name}さんが正解！`
        : '正解！'
      : kind === 'incorrect'
        ? 'お手つき！'
        : kind === 'complete'
          ? 'コンプリート！'
          : '答えを確認';
  const severity =
    kind === 'incorrect' ? 'error' : feedback.opponent || kind === 'skipped' ? 'info' : 'success';

  return (
    <GameToast key={feedback.id} open>
      <Alert severity={severity} role="status">
        {message}
        {kind === 'correct' && time !== null && (
          <Box component="span" sx={{ ml: 0.75, whiteSpace: 'nowrap' }}>
            {(time / 1000).toFixed(2)}秒
          </Box>
        )}
      </Alert>
    </GameToast>
  );
}
