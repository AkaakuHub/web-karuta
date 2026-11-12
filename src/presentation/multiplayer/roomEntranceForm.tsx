import type { FormEvent, RefObject } from 'react';
import {
  Avatar,
  Box,
  Button,
  Divider,
  FormControlLabel,
  Stack,
  Switch,
  TextField,
  Typography,
} from '@mui/material';
import GroupsRounded from '@mui/icons-material/GroupsRounded';
import ArrowForwardRounded from '@mui/icons-material/ArrowForwardRounded';

export function RoomEntranceForm({
  name,
  spectator,
  invalid,
  loaded,
  reconnect,
  invited,
  inputRef,
  onName,
  onSpectator,
  onSubmit,
}: {
  name: string;
  spectator: boolean;
  invalid: boolean;
  loaded: boolean;
  reconnect: boolean;
  invited: boolean;
  inputRef: RefObject<HTMLInputElement | null>;
  onName: (name: string) => void;
  onSpectator: (spectator: boolean) => void;
  onSubmit: (event: FormEvent<HTMLFormElement>) => void;
}) {
  return (
    <Stack
      data-help-entrance={reconnect ? 'reconnect' : invited ? 'join' : 'create'}
      spacing={2.5}
      component="form"
      onSubmit={onSubmit}
    >
      <Stack direction="row" spacing={1.5} sx={{ alignItems: 'center' }}>
        <Avatar variant="rounded" sx={{ bgcolor: 'primary.main', width: 44, height: 44 }}>
          <GroupsRounded />
        </Avatar>
        <Typography variant="h5" component="h2" sx={{ fontWeight: 800 }}>
          {reconnect ? '部屋に戻る' : invited ? '招待された部屋に参加' : '部屋を作る'}
        </Typography>
      </Stack>
      <Divider />
      <TextField
        data-help="name"
        label="名前"
        required
        fullWidth
        inputRef={inputRef}
        value={name}
        error={invalid}
        autoComplete="nickname"
        onChange={(event) => onName(event.target.value)}
        slotProps={{ htmlInput: { maxLength: 24 } }}
      />
      <RoomSpectatorSwitch checked={spectator} disabled={reconnect} onChange={onSpectator} />
      <Button
        data-help="join"
        type="submit"
        variant="contained"
        size="large"
        loading={!loaded}
        endIcon={<ArrowForwardRounded />}
      >
        {reconnect ? '再接続' : invited ? '部屋に参加' : '部屋を作る'}
      </Button>
      {invited && (
        <Box sx={{ textAlign: 'right' }}>
          <Button href="/" size="small">
            新しい部屋を作る
          </Button>
        </Box>
      )}
    </Stack>
  );
}

function RoomSpectatorSwitch({
  checked,
  disabled,
  onChange,
}: {
  checked: boolean;
  disabled: boolean;
  onChange: (checked: boolean) => void;
}) {
  return (
    <FormControlLabel
      data-help="spectator"
      label="閲覧のみ"
      control={
        <Switch checked={checked} disabled={disabled} onChange={(_, value) => onChange(value)} />
      }
    />
  );
}
