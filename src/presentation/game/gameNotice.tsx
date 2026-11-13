import { Alert } from '@mui/material';
import { useState } from 'react';
import { GameToast } from './gameToast.js';
import { ErrorAlert } from '../shared/errorAlert.js';

export function GameNotice({
  error,
  mistake = false,
  reserve = true,
}: {
  error: string;
  mistake?: boolean;
  reserve?: boolean;
}) {
  const [dismissed, setDismissed] = useState('');
  if (error)
    return (
      <GameToast open={error !== dismissed} onClose={() => setDismissed(error)}>
        <ErrorAlert message={error} />
      </GameToast>
    );
  if (!reserve && !mistake) return null;
  return (
    <GameToast open={mistake} onClose={() => {}}>
      <Alert severity="warning">お手つき。この曲の札は取れません。</Alert>
    </GameToast>
  );
}
