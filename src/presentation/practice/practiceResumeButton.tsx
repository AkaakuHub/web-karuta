import { Button } from '@mui/material';
import PlayArrowRounded from '@mui/icons-material/PlayArrowRounded';
import type { GameCheckpoint } from '../../domain/game/checkpoint.js';

export function PracticeResumeButton({
  checkpoint,
  disabled,
  onRestore,
}: {
  checkpoint?: GameCheckpoint;
  disabled: boolean;
  onRestore: (checkpoint: GameCheckpoint) => void;
}) {
  if (!checkpoint) return null;
  return (
    <Button
      variant="contained"
      startIcon={<PlayArrowRounded />}
      disabled={disabled}
      onClick={() => onRestore(checkpoint)}
    >
      前回の続きから（{checkpoint.session.results.length}/{checkpoint.session.order.length}曲）
    </Button>
  );
}
