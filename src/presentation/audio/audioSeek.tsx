import { useState } from 'react';
import { Box, IconButton, Slider, Typography } from '@mui/material';
import FastForwardRounded from '@mui/icons-material/FastForwardRounded';
import FastRewindRounded from '@mui/icons-material/FastRewindRounded';
import { useGameSettings } from '../game/useGameSettings.js';
import type { TrackProgress } from '../../infrastructure/audio/audioProgress.js';
import { formatClock } from '../shared/duration.js';

export function AudioSeek({
  progress,
  disabled,
  onSeek,
  hideDuration = false,
}: {
  progress: TrackProgress;
  disabled: boolean;
  hideDuration?: boolean;
  onSeek: (position: number) => void | Promise<void>;
}) {
  const {
    value: { seekSeconds },
  } = useGameSettings();
  const canSeek = !disabled && progress.duration > 0;
  const clockWidth = `${Math.max(4, formatClock(progress.duration, 1).length)}ch`;
  const [position, setPosition] = useState<number | null>(null);
  function jump(direction: number) {
    const next = Math.max(
      0,
      Math.min(progress.duration, progress.position + seekSeconds * direction),
    );
    setPosition(null);
    void onSeek(next);
  }
  return (
    <Box
      sx={{ display: 'flex', gap: 0.5, alignItems: 'center', gridColumn: '1 / -1', minWidth: 0 }}
    >
      <IconButton
        size="small"
        aria-label={`${seekSeconds}秒戻す`}
        title={`${seekSeconds}秒戻す`}
        disabled={!canSeek}
        onClick={() => jump(-1)}
        sx={{ p: 0.25 }}
      >
        <FastRewindRounded sx={{ fontSize: 16 }} />
      </IconButton>
      <Slider
        disabled={!canSeek}
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
      <IconButton
        size="small"
        aria-label={`${seekSeconds}秒進める`}
        title={`${seekSeconds}秒進める`}
        disabled={!canSeek}
        onClick={() => jump(1)}
        sx={{ p: 0.25 }}
      >
        <FastForwardRounded sx={{ fontSize: 16 }} />
      </IconButton>
      <Typography
        variant="caption"
        sx={{
          whiteSpace: 'nowrap',
          flexShrink: 0,
          display: 'flex',
          '& > span': { width: clockWidth, textAlign: 'right' },
          fontVariantNumeric: 'tabular-nums',
          fontSize: { xs: 10, sm: 12 },
        }}
      >
        <Box component="span">{formatClock(progress.position, 1)}</Box>
        {' / '}
        <Box component="span">{hideDuration ? '?:??' : formatClock(progress.duration, 1)}</Box>
      </Typography>
    </Box>
  );
}
