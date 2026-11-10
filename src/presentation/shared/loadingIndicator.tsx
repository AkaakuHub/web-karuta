import { Box, CircularProgress } from '@mui/material';

export function LoadingIndicator({ label, inline = false }: { label: string; inline?: boolean }) {
  return (
    <Box
      sx={{
        display: inline ? 'inline-grid' : 'grid',
        placeItems: 'center',
        height: inline ? 24 : '100%',
        minHeight: inline ? 0 : 160,
      }}
    >
      <CircularProgress size={inline ? 20 : 40} aria-label={label} />
    </Box>
  );
}
