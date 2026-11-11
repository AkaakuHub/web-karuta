import { GameSettingsButton } from './gameSettingsButton.js';
import { Paper } from '@mui/material';
import { GameExitButton } from './gameActionButtons.js';
import { VolumeControl } from '../audio/volumeControl.js';
import type { GameControlsProps } from './controlsModel.js';

export function ResultControls({
  state,
  onVolume,
  onToggleMuted,
  onReset,
  resetLabel,
  onSettings,
}: Pick<
  GameControlsProps,
  'state' | 'onVolume' | 'onToggleMuted' | 'onReset' | 'resetLabel' | 'onSettings'
>) {
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
      <VolumeControl
        value={state.volume}
        muted={state.muted}
        onChange={onVolume}
        onToggleMuted={onToggleMuted}
      />
      {onSettings && <GameSettingsButton onClick={onSettings} />}
      <GameExitButton size="medium" label={resetLabel} onClick={onReset} />
    </Paper>
  );
}
