import { useState, type ReactNode } from 'react';
import { Alert, Button, Stack, Tooltip } from '@mui/material';
import type { SxProps, Theme } from '@mui/material/styles';
import ContentCopyRounded from '@mui/icons-material/ContentCopyRounded';
import CheckRounded from '@mui/icons-material/CheckRounded';

export function ErrorAlert({
  message,
  action,
  sx = [],
}: {
  message: string;
  action?: ReactNode;
  sx?: SxProps<Theme>;
}) {
  const [copy, setCopy] = useState<{ message: string; failed: boolean } | null>(null);
  const copied = copy?.message === message && !copy.failed;
  const failed = copy?.message === message && copy.failed;
  async function copyMessage() {
    try {
      await navigator.clipboard.writeText(message);
      setCopy({ message, failed: false });
    } catch {
      setCopy({ message, failed: true });
    }
  }
  return (
    <Alert
      severity="error"
      sx={[
        {
          minWidth: 0,
          p: 1,
          alignItems: 'flex-start',
          '& .MuiAlert-icon': { fontSize: 20, mr: 1, py: 0.5 },
          '& .MuiAlert-message': {
            minWidth: 0,
            flex: 1,
            py: 0.5,
            fontSize: 13,
            lineHeight: 1.5,
            whiteSpace: 'pre-wrap',
            overflowWrap: 'anywhere',
          },
          '& .MuiAlert-action': { p: 0, m: 0, ml: 1, flexShrink: 0 },
        },
        ...(Array.isArray(sx) ? sx : [sx]),
      ]}
      action={
        <Stack spacing={0.5} sx={{ alignItems: 'flex-end' }}>
          <Tooltip
            title={
              failed ? 'コピーできませんでした。もう一度押してください。' : 'エラー全文をコピー'
            }
          >
            <Button
              aria-label={copied ? 'エラーをコピーしました' : 'エラーをコピー'}
              size="small"
              color="inherit"
              startIcon={copied ? <CheckRounded /> : <ContentCopyRounded />}
              onClick={() => void copyMessage()}
              sx={{ minHeight: 30, px: 0.75, fontSize: 12, whiteSpace: 'nowrap' }}
            >
              {copied ? 'コピー済み' : failed ? '再度コピー' : 'コピー'}
            </Button>
          </Tooltip>
          {action}
        </Stack>
      }
    >
      {message}
    </Alert>
  );
}
