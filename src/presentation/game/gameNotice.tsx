import { Alert, Box } from '@mui/material';
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
  if (error) return <ErrorAlert message={error} />;
  if (!reserve && !mistake) return null;
  return (
    <Box aria-live="polite" sx={{ minHeight: 40, flexShrink: 0 }}>
      {mistake && (
        <Alert
          severity="warning"
          sx={{
            py: 0,
            alignItems: 'center',
            minHeight: 40,
            '& .MuiAlert-message': { fontSize: 13, overflowWrap: 'anywhere' },
          }}
        >
          お手つき。この曲の札は取れません。
        </Alert>
      )}
    </Box>
  );
}
