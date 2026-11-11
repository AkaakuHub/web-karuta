import { IconButton, Tooltip } from '@mui/material';
import SettingsRounded from '@mui/icons-material/SettingsRounded';

export function GameSettingsButton({ onClick }: { onClick: () => void }) {
  return (
    <Tooltip title="ゲーム設定">
      <IconButton
        data-help="settings"
        aria-label="ゲーム設定"
        size="small"
        onClick={onClick}
        sx={{ p: 0.25 }}
      >
        <SettingsRounded fontSize="small" />
      </IconButton>
    </Tooltip>
  );
}
