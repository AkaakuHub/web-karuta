import HelpOutlineRounded from '@mui/icons-material/HelpOutlineRounded';
import CloseRounded from '@mui/icons-material/CloseRounded';
import {
  Box,
  Dialog,
  DialogContent,
  DialogTitle,
  IconButton,
  Tooltip,
  Typography,
} from '@mui/material';
import { helpRoleNames, helpTopics, type HelpRole } from './helpTopics.js';

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
        maxWidth="sm"
        aria-labelledby="game-help-title"
        slotProps={{
          paper: {
            sx: {
              m: 1.5,
              width: 'calc(100% - 24px)',
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
            px: 2,
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
        <DialogContent sx={{ px: 1.5, pb: 1.5, overflowX: 'hidden' }}>
          <Typography sx={{ fontSize: 12, px: 0.5, mb: 1 }}>
            {role === 'spectator'
              ? '閲覧のみで参加中です。札の取得や部屋の管理はしません。'
              : role === 'visitor'
                ? '曲を聴いて札をタップ。招待URLから同じ部屋に参加できます。'
                : '曲を聴いて、対応する札をタップ・クリックします。'}
          </Typography>
          <Box
            sx={{
              display: 'grid',
              gridTemplateColumns: { xs: 'minmax(0, 1fr)', sm: 'repeat(2, minmax(0, 1fr))' },
              gap: 0.75,
            }}
          >
            {helpTopics(role).map((topic) => (
              <Box
                key={topic.title}
                sx={{
                  display: 'grid',
                  gridTemplateColumns: { xs: '64px minmax(0, 1fr)', sm: 'minmax(0, 1fr)' },
                  '@media (min-width: 360px) and (max-width: 599.95px)': {
                    gridTemplateColumns: '96px minmax(0, 1fr)',
                  },
                  alignItems: 'center',
                  gap: 0.75,
                  p: 0.75,
                  border: '1px solid',
                  borderColor: 'divider',
                  borderRadius: 1.5,
                }}
              >
                <Box
                  inert
                  aria-hidden="true"
                  sx={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    minHeight: 44,
                    minWidth: 0,
                    pointerEvents: 'none',
                    userSelect: 'none',
                    '& [data-game-panel="players"]': {
                      flexWrap: 'wrap',
                      width: '100%',
                      height: 'auto',
                      justifyContent: 'center',
                      overflow: 'hidden',
                      '& .MuiChip-root': { maxWidth: '100%' },
                    },
                    '& .MuiButton-outlined .MuiButton-startIcon': {
                      display: { xs: 'none', sm: 'inline-flex' },
                    },
                    '& .MuiButton-root': {
                      fontSize: 10,
                      px: 0.5,
                      minWidth: 0,
                      whiteSpace: 'normal',
                      lineHeight: 1.3,
                    },
                    '& .MuiFormControlLabel-root': { m: 0 },
                    '& .MuiFormControlLabel-label': { fontSize: 11 },
                  }}
                >
                  {topic.screen}
                </Box>
                <Box sx={{ minWidth: 0 }}>
                  <Typography
                    component="h3"
                    sx={{
                      fontSize: 13,
                      fontWeight: 800,
                      mb: 0.25,
                      '@media (max-width: 359.95px)': { fontSize: 12 },
                    }}
                  >
                    {topic.title}
                  </Typography>
                  <Typography
                    sx={{
                      fontSize: 12,
                      lineHeight: 1.45,
                      '@media (max-width: 359.95px)': { fontSize: 11 },
                    }}
                  >
                    {topic.description}
                  </Typography>
                </Box>
              </Box>
            ))}
          </Box>
        </DialogContent>
      </Dialog>
    </>
  );
}
