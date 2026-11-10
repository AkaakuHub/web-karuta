import { IconButton, Tooltip } from '@mui/material';
import PauseRounded from '@mui/icons-material/PauseRounded';
import PlayArrowRounded from '@mui/icons-material/PlayArrowRounded';

export function PlaybackButton({
  playing,
  disabled,
  onPlay,
  onPause,
}: {
  playing: boolean;
  disabled: boolean;
  onPlay: () => void | Promise<void>;
  onPause: () => void;
}) {
  const label = playing ? '一時停止' : '再生';
  return (
    <Tooltip title={label}>
      <span>
        <IconButton
          aria-label={label}
          disabled={disabled}
          onClick={() => (playing ? onPause() : void onPlay())}
          sx={{
            p: { xs: 0.5, sm: 1 },
            '&.Mui-disabled': { bgcolor: 'action.disabledBackground', color: 'action.disabled' },
            bgcolor: 'primary.main',
            color: 'primary.contrastText',
            '&:hover': { bgcolor: 'primary.dark' },
          }}
        >
          {playing ? <PauseRounded /> : <PlayArrowRounded />}
        </IconButton>
      </span>
    </Tooltip>
  );
}
