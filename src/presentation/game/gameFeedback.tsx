import { Box, Typography } from '@mui/material';
import CheckCircleRounded from '@mui/icons-material/CheckCircleRounded';
import CancelRounded from '@mui/icons-material/CancelRounded';
import SkipNextRounded from '@mui/icons-material/SkipNextRounded';
import EmojiEventsRounded from '@mui/icons-material/EmojiEventsRounded';
import { useContext } from 'react';
import { BoardControls } from './boardControls.js';
import type { GameFeedback as FeedbackState } from '../../domain/game/session.js';

export function GameFeedback({
  feedback,
  winner,
}: {
  feedback: FeedbackState | null;
  winner?: string;
}) {
  const compact = useContext(BoardControls) !== null;
  if (!feedback) return null;
  const wrong = feedback.kind === 'incorrect';
  const complete = feedback.kind === 'complete';
  const correct = feedback.kind === 'correct';
  const color = wrong ? '#d32f2f' : correct && !feedback.opponent ? '#16854c' : '#2449bb';
  const Icon = wrong
    ? CancelRounded
    : complete
      ? EmojiEventsRounded
      : correct
        ? CheckCircleRounded
        : SkipNextRounded;
  const title = wrong
    ? 'お手つき！'
    : complete
      ? 'コンプリート！'
      : correct
        ? feedback.winner
          ? `${feedback.winner}さんが獲得！`
          : winner
            ? `${winner}さんが獲得！`
            : '正解！'
        : '答えを確認';
  return (
    <Box
      key={feedback.id}
      role="status"
      aria-live="polite"
      sx={{
        position: 'relative',
        height: { xs: 24, sm: 40 },
        overflow: 'hidden',
        zIndex: 2,
        pointerEvents: 'none',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 1,
        animation: complete
          ? 'feedback-appear 350ms cubic-bezier(.15,.9,.25,1)'
          : `feedback-dismiss ${correct ? 1500 : 900}ms ease forwards`,
        '@keyframes feedback-appear': {
          from: { opacity: 0, transform: 'scale(.75)' },
          to: { opacity: 1, transform: 'scale(1)' },
        },
        '@keyframes feedback-dismiss': {
          '0%': { opacity: 0, transform: 'scale(.6)' },
          '10%,85%': { opacity: 1, transform: 'scale(1)' },
          '100%': { opacity: 0, transform: 'scale(1.15)' },
        },
        '@media (prefers-reduced-motion: reduce)': {
          animation: complete ? 'none' : `feedback-dismiss ${correct ? 1500 : 900}ms ease forwards`,
        },
      }}
    >
      {(correct || complete) &&
        Array.from({ length: 22 }, (_, index) => {
          const angle = (index * Math.PI * 2) / 22;
          return (
            <Box
              key={index}
              sx={{
                position: 'absolute',
                left: '50%',
                top: '40%',
                width: 6,
                height: 12,
                borderRadius: 1,
                bgcolor: ['#ffbd39', '#16854c', '#5476e8', '#ef7b46'][index % 4],
                '--dx': `${Math.cos(angle) * 180}px`,
                '--dy': `${Math.sin(angle) * 130 + 70}px`,
                animation: 'confetti-burst 1000ms ease-out forwards',
                '@keyframes confetti-burst': {
                  '0%': { opacity: 1, transform: 'translate(0,0) rotate(0)' },
                  '100%': {
                    opacity: 0,
                    transform: 'translate(var(--dx),var(--dy)) rotate(250deg)',
                  },
                },
                '@media (prefers-reduced-motion: reduce)': { display: 'none' },
              }}
            />
          );
        })}
      <Box
        sx={{
          display: 'flex',
          alignItems: 'center',
          gap: compact ? 0.25 : 1,
          color,
          bgcolor: feedback.opponent ? '#e6f0ff' : '#ffffffee',
          px: { xs: 0.5, sm: 1.5 },
          maxWidth: '100%',
          minWidth: 0,
          py: compact ? 0 : 0.5,
          borderRadius: 3,
          boxShadow: '0 8px 30px #18233115',
        }}
      >
        <Icon
          sx={{
            flexShrink: 0,
            fontSize: { xs: compact ? 14 : 18, sm: wrong || complete ? 32 : 28 },
          }}
        />
        <Box sx={{ minWidth: 0 }}>
          <Typography
            sx={{
              overflowWrap: 'anywhere',
              ...(compact
                ? { whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }
                : {}),
              lineHeight: 1.2,
              fontWeight: 900,
              fontSize: { xs: 13, sm: wrong || complete ? 20 : 18 },
            }}
          >
            {title}
          </Typography>
          {correct && feedback.time !== null && (
            <Typography variant="caption" sx={{ display: { xs: 'none', sm: 'block' } }}>
              {(feedback.time / 1000).toFixed(2)}秒で取得
            </Typography>
          )}
        </Box>
      </Box>
    </Box>
  );
}
