import { Alert } from '@mui/material';
import { useState } from 'react';
import { GameToast } from './gameToast.js';
import { ErrorAlert } from '../shared/errorAlert.js';

export function GameNotice({
  error,
  mistake = false,
}: {
  error: string;
  mistake?: boolean;
  reserve?: boolean;
}) {
  const message = error || (mistake ? 'お手つき。この曲の札は取れません。' : '');
  const [dismissed, setDismissed] = useState('');
  const [previous, setPrevious] = useState(message);
  if (previous !== message) {
    setPrevious(message);
    setDismissed('');
  }
  return (
    <GameToast open={!!message && message !== dismissed} onClose={() => setDismissed(message)}>
      {error ? <ErrorAlert message={error} /> : <Alert severity="warning">{message}</Alert>}
    </GameToast>
  );
}
