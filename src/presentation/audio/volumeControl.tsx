import { Box, Slider, IconButton, Tooltip } from '@mui/material';
import VolumeOffRounded from '@mui/icons-material/VolumeOffRounded';
import VolumeUpRounded from '@mui/icons-material/VolumeUpRounded';

export function VolumeControl({
  value,
  muted,
  onToggleMuted,
  onChange,
}: {
  value: number;
  muted: boolean;
  onToggleMuted: () => void;
  onChange: (value: number) => void;
}) {
  return (
    <Box
      sx={{
        display: 'flex',
        alignItems: 'center',
        gap: { xs: 0.5, sm: 1 },
        width: { xs: 104, sm: 132 },
        flexShrink: 0,
      }}
    >
      <Tooltip title={muted ? 'ミュートを解除' : 'ミュート'}>
        <IconButton
          size="small"
          aria-label={muted ? 'ミュートを解除' : 'ミュート'}
          aria-pressed={muted}
          onClick={onToggleMuted}
        >
          {muted ? <VolumeOffRounded fontSize="small" /> : <VolumeUpRounded fontSize="small" />}
        </IconButton>
      </Tooltip>
      <Slider
        aria-label="再生音量"
        size="small"
        value={muted ? 0 : value * 100}
        onChange={(_, next) => {
          if (typeof next === 'number') onChange(next / 100);
        }}
      />
    </Box>
  );
}
