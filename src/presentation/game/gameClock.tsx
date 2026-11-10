import { memo, useEffect, useState } from 'react';
import { Typography } from '@mui/material';
import type { GameSession } from '../../domain/game/session.js';
import { elapsedTime } from '../../domain/game/timing.js';
import { formatClock } from '../shared/duration.js';

export const GameClock = memo(function GameClock({ session }: { session: GameSession }) {
  const [now, setNow] = useState(() => performance.now());
  const active = session.phase === 'playing' && session.startedAt !== null;
  useEffect(() => {
    if (!active) return;
    const timer = window.setInterval(() => setNow(performance.now()), 1000);
    return () => window.clearInterval(timer);
  }, [active]);
  const seconds = elapsedTime(session, now) / 1000;
  return (
    <Typography
      component="time"
      dateTime={`PT${Math.floor(seconds)}S`}
      aria-label="出題時間"
      sx={{
        fontWeight: 700,
        fontSize: { xs: 13, sm: 16 },
        fontVariantNumeric: 'tabular-nums',
        whiteSpace: 'nowrap',
        flexShrink: 0,
      }}
    >
      {formatClock(seconds, 2)}
    </Typography>
  );
});
