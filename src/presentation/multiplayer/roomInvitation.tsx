import { useKarutaConfig } from '../config/karutaProvider.js';
import { useRef, useState } from 'react';
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
import ContentCopyRounded from '@mui/icons-material/ContentCopyRounded';
import CheckRounded from '@mui/icons-material/CheckRounded';
import GroupsRounded from '@mui/icons-material/GroupsRounded';
import ArrowForwardRounded from '@mui/icons-material/ArrowForwardRounded';

export function RoomEntrance({
  roomId,
  loaded,
  reconnect,
  onJoin,
}: {
  roomId: string;
  loaded: boolean;
  reconnect: boolean;
  onJoin: (name: string, create: boolean, code: string, spectator: boolean) => Promise<void>;
}) {
  const { storagePrefix } = useKarutaConfig();
  const [name, setName] = useState(localStorage.getItem(`${storagePrefix}-name`) ?? '');
  const [spectator, setSpectator] = useState(
    reconnect && sessionStorage.getItem(`${storagePrefix}-spectator`) === 'true',
  );
  const [invalid, setInvalid] = useState(false);
  const input = useRef<HTMLInputElement>(null);
  const invited = roomId !== '';
  return (
    <Stack
      spacing={2.5}
      component="form"
      onSubmit={(event) => {
        event.preventDefault();
        if (!name.trim()) {
          setInvalid(true);
          input.current?.focus();
          return;
        }
        localStorage.setItem(`${storagePrefix}-name`, name.trim());
        sessionStorage.setItem(`${storagePrefix}-spectator`, String(spectator));
        void onJoin(name, !invited, roomId, spectator);
      }}
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
        label="名前"
        required
        fullWidth
        inputRef={input}
        value={name}
        error={invalid}
        autoComplete="nickname"
        onChange={(event) => {
          setName(event.target.value);
          setInvalid(false);
        }}
        slotProps={{ htmlInput: { maxLength: 24 } }}
      />
      <RoomSpectatorSwitch checked={spectator} disabled={reconnect} onChange={setSpectator} />
      <Button
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

export function RoomInvitation({
  roomId,
  onError,
}: {
  roomId: string;
  onError: (message: string) => void;
}) {
  const [copied, setCopied] = useState(false);
  function copy() {
    void navigator.clipboard
      .writeText(new URL(`?room=${roomId}`, location.href).href)
      .then(() => setCopied(true))
      .catch(() => onError('招待URLをコピーできません'));
  }
  return (
    <Button
      variant="outlined"
      aria-label={copied ? '招待URLをコピーしました' : '招待URLをコピー'}
      size="small"
      sx={{ whiteSpace: 'nowrap', px: 1 }}
      startIcon={copied ? <CheckRounded /> : <ContentCopyRounded />}
      onClick={copy}
    >
      招待URLをコピー
    </Button>
  );
}

export function RoomSpectatorSwitch({
  checked,
  disabled = false,
  onChange,
}: {
  checked: boolean;
  disabled?: boolean;
  onChange: (checked: boolean) => void;
}) {
  return (
    <FormControlLabel
      label="閲覧のみ"
      control={
        <Switch checked={checked} disabled={disabled} onChange={(_, value) => onChange(value)} />
      }
    />
  );
}
