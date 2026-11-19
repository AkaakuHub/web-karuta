import { GameSettingsButton } from './gameSettingsButton.js';
import { Paper } from '@mui/material';
import { GameExitButton } from './gameActionButtons.js';
import type { GameControlsProps } from './controlsModel.js';

export function ResultControls({
  onReset,
  resetLabel,
  onSettings,
}: Pick<GameControlsProps, 'onReset' | 'resetLabel' | 'onSettings'>) {
  return (
    <Paper
      data-game-panel="controls"
      sx={{
        height: 48,
        px: 1,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
      }}
    >
      {onSettings && <GameSettingsButton onClick={onSettings} />}
      <GameExitButton size="medium" label={resetLabel} onClick={onReset} />
    </Paper>
  );
}
