import HelpOutlineRounded from '@mui/icons-material/HelpOutlineRounded';
import CloseRounded from '@mui/icons-material/CloseRounded';
import { Dialog, DialogContent, DialogTitle, IconButton, Tooltip } from '@mui/material';
import { helpRoleNames, type HelpRole } from './helpTopics.js';
import { HelpScene } from './helpScene.js';
export { HelpScreenSource } from './helpScreen.js';

export function GameHelp({
  role,
  open,
  onChange,
}: {
  role: HelpRole;
  open: boolean;
  onChange: (open: boolean) => void;
}) {
  return (
    <>
      <Tooltip title="遊び方">
        <IconButton
          aria-label="遊び方を開く"
          size="small"
          onClick={() => onChange(true)}
          sx={{ flexShrink: 0 }}
        >
          <HelpOutlineRounded fontSize="small" />
        </IconButton>
      </Tooltip>
      <Dialog
        open={open}
        onClose={() => onChange(false)}
        fullWidth
        maxWidth="xl"
        aria-labelledby="game-help-title"
        slotProps={{
          paper: {
            sx: {
              m: 1.5,
              width: 'calc(100% - 24px)',
              height: 'calc(100dvh - 24px)',
              maxHeight: 'calc(100dvh - 24px)',
              borderRadius: 2,
            },
          },
        }}
      >
        <DialogTitle
          id="game-help-title"
          sx={{
            display: 'flex',
            alignItems: 'center',
            py: 1,
            px: 1.5,
            gap: 1,
            fontSize: 17,
            fontWeight: 800,
          }}
        >
          遊び方・{helpRoleNames[role]}
          <IconButton
            aria-label="遊び方を閉じる"
            onClick={() => onChange(false)}
            size="small"
            sx={{ ml: 'auto' }}
          >
            <CloseRounded fontSize="small" />
          </IconButton>
        </DialogTitle>
        <DialogContent
          sx={{
            px: 1.5,
            pb: 1.5,
            display: 'flex',
            flexDirection: 'column',
            minHeight: 0,
            overflow: 'hidden',
          }}
        >
          <HelpScene role={role} />
        </DialogContent>
      </Dialog>
    </>
  );
}
