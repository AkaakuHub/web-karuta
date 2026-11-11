import { useState } from 'react';
import {
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  TextField,
} from '@mui/material';

export function RoomNameDialog({
  name,
  onClose,
  onRename,
}: {
  name: string;
  onClose: () => void;
  onRename: (name: string) => void;
}) {
  const [value, setValue] = useState(name);
  return (
    <Dialog open onClose={onClose} fullWidth maxWidth="xs" aria-labelledby="room-name-title">
      <form
        onSubmit={(event) => {
          event.preventDefault();
          if (value.trim()) {
            onRename(value.trim());
            onClose();
          }
        }}
      >
        <DialogTitle id="room-name-title">名前を変更</DialogTitle>
        <DialogContent>
          <TextField
            autoFocus
            fullWidth
            required
            label="名前"
            value={value}
            onChange={(event) => setValue(event.target.value)}
            slotProps={{ htmlInput: { maxLength: 24 } }}
            sx={{ mt: 1 }}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={onClose}>戻る</Button>
          <Button type="submit" variant="contained" disabled={!value.trim()}>
            変更する
          </Button>
        </DialogActions>
      </form>
    </Dialog>
  );
}
