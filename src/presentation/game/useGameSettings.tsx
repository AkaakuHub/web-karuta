import { useKarutaConfig } from '../config/karutaProvider.js';
import { useState } from 'react';
import {
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  FormControlLabel,
  Stack,
  Switch,
  TextField,
} from '@mui/material';
import { z } from 'zod';
import { ErrorAlert } from '../shared/errorAlert.js';
import { errorMessage } from '../shared/errorMessage.js';

const settingsSchema = z.object({
  autoNext: z.boolean(),
  delaySeconds: z.number().int().min(0).max(300),
});
export type GameSettings = z.infer<typeof settingsSchema>;
const defaults: GameSettings = { autoNext: true, delaySeconds: 1 };

export function useGameSettings() {
  const { storagePrefix } = useKarutaConfig();
  const key = `${storagePrefix}-game-settings`;
  const [value, setValue] = useState(() => {
    const raw = localStorage.getItem(key);
    return raw === null ? defaults : settingsSchema.parse(JSON.parse(raw));
  });
  const [open, setOpen] = useState(false);
  return {
    value,
    open,
    show: () => setOpen(true),
    dialog: open ? (
      <GameSettingsDialog
        value={value}
        onClose={() => setOpen(false)}
        onSave={(value) => {
          localStorage.setItem(key, JSON.stringify(value));
          setValue(value);
          setOpen(false);
        }}
      />
    ) : null,
  };
}

function GameSettingsDialog({
  value,
  onClose,
  onSave,
}: {
  value: GameSettings;
  onClose: () => void;
  onSave: (value: GameSettings) => void;
}) {
  const [autoNext, setAutoNext] = useState(value.autoNext);
  const [delay, setDelay] = useState(String(value.delaySeconds));
  const [error, setError] = useState('');
  function save() {
    const parsed = settingsSchema.safeParse({ autoNext, delaySeconds: Number(delay) });
    if (!delay.trim() || !parsed.success) {
      setError('待ち時間は0〜300の整数で入力してください');
      return;
    }
    try {
      onSave(parsed.data);
    } catch (reason) {
      setError(errorMessage(reason, 'ゲーム設定を保存できません'));
    }
  }
  return (
    <Dialog open onClose={onClose} fullWidth maxWidth="xs" aria-labelledby="game-settings-title">
      <DialogTitle id="game-settings-title">ゲーム設定</DialogTitle>
      <DialogContent>
        <Stack spacing={2} sx={{ pt: 1 }}>
          <FormControlLabel
            label="正解後、自動で次の曲へ"
            control={<Switch checked={autoNext} onChange={(_, checked) => setAutoNext(checked)} />}
          />
          <TextField
            label="次の曲までの待ち時間（秒）"
            type="number"
            value={delay}
            disabled={!autoNext}
            onChange={(event) => setDelay(event.target.value)}
            slotProps={{ htmlInput: { min: 0, max: 300, step: 1, inputMode: 'numeric' } }}
          />
          {error && <ErrorAlert message={error} />}
        </Stack>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose}>キャンセル</Button>
        <Button variant="contained" onClick={save}>
          保存
        </Button>
      </DialogActions>
    </Dialog>
  );
}
