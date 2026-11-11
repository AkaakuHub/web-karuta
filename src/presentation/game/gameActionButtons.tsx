import { Box, Button, IconButton, Tooltip } from '@mui/material';
import CloseRounded from '@mui/icons-material/CloseRounded';
import SkipNextRounded from '@mui/icons-material/SkipNextRounded';

export function GameExitButton({
  label,
  onClick,
  size = 'small',
}: {
  label: string;
  onClick: () => void;
  size?: 'small' | 'medium';
}) {
  return (
    <Tooltip title={label}>
      <IconButton data-help="exit" aria-label={label} size={size} onClick={onClick}>
        <CloseRounded />
      </IconButton>
    </Tooltip>
  );
}

export function NextRoundButton({
  round,
  total,
  onNext,
}: {
  round: number;
  total: number;
  onNext?: () => void | Promise<void>;
}) {
  const label = round + 1 === total ? '結果を見る' : '次の曲を再生';
  return (
    <Button
      size="small"
      variant="contained"
      data-help="next"
      aria-keyshortcuts="Space Enter"
      aria-label={label}
      sx={{
        width: { xs: 32, sm: 'auto' },
        minWidth: 0,
        '& .MuiButton-startIcon': { m: { xs: 0, sm: undefined } },
      }}
      startIcon={<SkipNextRounded />}
      disabled={!onNext}
      onClick={() => void onNext?.()}
    >
      <Box component="span" sx={{ display: { xs: 'none', sm: 'inline' } }}>
        {label}
      </Box>
    </Button>
  );
}
