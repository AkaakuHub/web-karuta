import { IconButton, Tooltip } from '@mui/material';
import SettingsRounded from '@mui/icons-material/SettingsRounded';

export function GameSettingsButton({ onClick }: { onClick: () => void }) {
  return (
    <Tooltip title="ゲーム設定">
      <IconButton aria-label="ゲーム設定" size="small" onClick={onClick} sx={{ p: 0.25 }}>
        <SettingsRounded fontSize="small" />
      </IconButton>
    </Tooltip>
  );
}
