import { useState } from 'react';
import { Box, Slider, Typography } from '@mui/material';
import type { TrackProgress } from '../../infrastructure/audio/audioProgress.js';
import { formatClock } from '../shared/duration.js';

export function AudioSeek({
  progress,
  disabled,
  onSeek,
}: {
  progress: TrackProgress;
  disabled: boolean;
  onSeek: (position: number) => void | Promise<void>;
}) {
  const [position, setPosition] = useState<number | null>(null);
  return (
    <Box sx={{ display: 'flex', gap: 1, alignItems: 'center', gridColumn: '1 / -1', minWidth: 0 }}>
      <Slider
        disabled={disabled || progress.duration <= 0}
        aria-label="再生位置"
        size="small"
        onChange={(_, value) => {
          if (typeof value === 'number') setPosition(value);
        }}
        onChangeCommitted={(_, value) => {
          if (typeof value === 'number') void onSeek(value);
          setPosition(null);
        }}
        value={Math.min(position ?? progress.position, Math.max(1, progress.duration))}
        max={Math.max(1, progress.duration)}
        sx={{
          color: '#2449bb',
          py: 1,
          '&.Mui-disabled': { color: 'action.disabled' },
          '& .MuiSlider-thumb': { width: 8, height: 8 },
        }}
      />
      <Typography
        variant="caption"
        sx={{
          whiteSpace: 'nowrap',
          fontVariantNumeric: 'tabular-nums',
          fontSize: { xs: 10, sm: 12 },
        }}
      >
        {formatClock(progress.position, 1)} / {formatClock(progress.duration, 1)}
      </Typography>
    </Box>
  );
}
