import { useKarutaConfig } from '../config/karutaProvider.js';
import { useRef, useState } from 'react';
import { Box, Button } from '@mui/material';
import { RoomEntranceForm } from './roomEntranceForm.js';
import ContentCopyRounded from '@mui/icons-material/ContentCopyRounded';
import CheckRounded from '@mui/icons-material/CheckRounded';

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
    <RoomEntranceForm
      name={name}
      spectator={spectator}
      invalid={invalid}
      loaded={loaded}
      reconnect={reconnect}
      invited={invited}
      inputRef={input}
      onName={(value) => {
        setName(value);
        setInvalid(false);
      }}
      onSpectator={setSpectator}
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
    />
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
      data-help="invite"
      aria-label={copied ? '招待URLをコピーしました' : '招待URLをコピー'}
      size="small"
      sx={{
        whiteSpace: 'nowrap',
        px: 1,
        minWidth: { xs: 32, sm: 64 },
        '& .MuiButton-startIcon': { mr: { xs: 0, sm: 1 }, ml: 0 },
      }}
      startIcon={copied ? <CheckRounded /> : <ContentCopyRounded />}
      onClick={copy}
    >
      <Box component="span" sx={{ display: { xs: 'none', sm: 'inline' } }}>
        招待URLをコピー
      </Box>
    </Button>
  );
}
