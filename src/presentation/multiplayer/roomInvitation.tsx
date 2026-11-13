import { useKarutaConfig } from '../config/karutaProvider.js';
import { useRef, useState } from 'react';
import { Button } from '@mui/material';
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
  compact = false,
}: {
  roomId: string;
  onError: (message: string) => void;
  compact?: boolean;
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
        minWidth: compact ? 32 : 64,
        '& .MuiButton-startIcon': { mr: compact ? 0 : 1, ml: 0 },
      }}
      startIcon={copied ? <CheckRounded /> : <ContentCopyRounded />}
      onClick={copy}
    >
      {!compact && '招待URLをコピー'}
    </Button>
  );
}
