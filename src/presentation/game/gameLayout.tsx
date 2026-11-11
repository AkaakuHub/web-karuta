import { AppHeaderContent } from '../shared/appHeaderContent.js';
import { BoardControls } from './boardControls.js';
import { type ReactNode } from 'react';
import { Box, Paper, Stack, Chip, useMediaQuery, useTheme } from '@mui/material';
import { bottomControlsHeight, panelGap, sideControlsWidth } from '../shared/playLayout.js';

export function GameLayout({
  board,
  regulation,
  clock,
  children,
  actions,
  results,
}: {
  board: ReactNode;
  regulation?: string;
  clock?: ReactNode;
  children: ReactNode;
  actions?: ReactNode;
  results?: ReactNode;
}) {
  const area = results ?? board;
  const mobile = useMediaQuery(useTheme().breakpoints.down('sm'));
  const controls = (
    <Paper
      component="aside"
      aria-label="ゲームコントロール"
      sx={{
        position: 'relative',
        borderRadius: board ? 0.5 : 1.5,
        p: results ? 0 : board ? (mobile ? 0 : 1) : { xs: 2, sm: 3 },
        maxWidth: area ? undefined : 560,
        minHeight: 0,
        height: board && mobile ? '100%' : undefined,
        overflow: board ? 'hidden' : 'auto',
        maxHeight: '100%',
        bgcolor: 'background.paper',
        border: results || (board && mobile) ? 0 : '1px solid',
        borderColor: 'divider',
      }}
    >
      <Stack
        spacing={mobile && board ? 0.5 : 1}
        useFlexGap
        sx={{
          display: board ? { xs: 'flex', sm: 'grid', md: 'flex' } : 'flex',
          height: board ? '100%' : undefined,
          minHeight: 0,
          gridTemplateColumns: 'minmax(0, 1fr) minmax(0, 1fr)',
          gridTemplateRows: 'min-content min-content min-content minmax(0, 1fr)',
          alignContent: 'start',
          '& > *': { minWidth: 0, gridColumn: 1 },
          ...(!board ? { '& > [data-game-panel="status"]': { order: -1 } } : {}),
          ...(board
            ? {
                '@media (max-width: 599.95px)': {
                  display: 'grid',
                  gridTemplateRows: 'min-content minmax(0, 1fr)',
                  columnGap: '6px',
                  rowGap: '2px',
                  '& > [data-game-panel="players"]': { gridColumn: 1, gridRow: 1 },
                  '& > [data-game-panel="controls"]': { gridColumn: 1, gridRow: 2 },
                  '& > [data-game-panel="review"]': {
                    gridColumn: 2,
                    gridRow: '1 / span 2',
                    height: '100%',
                    pb: '18px',
                  },
                  '& > [data-game-panel="status"]': {
                    position: 'absolute',
                    right: 0,
                    bottom: 0,
                    width: 'calc((100% - 6px) / 2)',
                    height: 16,
                    minHeight: 16,
                    '& [role="status"]': { height: 16 },
                    '& [role="status"] p': { fontSize: 11 },
                  },
                  '& > :not([data-game-panel])': {
                    flexWrap: 'nowrap',
                    overflowX: 'auto',
                    flexShrink: 0,
                    gap: 0.25,
                  },
                  '& > :not([data-game-panel]) .MuiChip-root': { height: 16, flexShrink: 0 },
                  '& > :not([data-game-panel]) .MuiChip-label': { fontSize: 10 },
                },
                '& > [data-game-panel="review"]': { gridColumn: 2, gridRow: '1 / span 4' },
              }
            : {}),
        }}
      >
        {children}
      </Stack>
    </Paper>
  );
  return (
    <BoardControls
      value={
        mobile && board
          ? {
              content: controls,
            }
          : null
      }
    >
      <AppHeaderContent>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5, minWidth: 0 }}>
          {regulation && (
            <Chip
              size="small"
              label={regulation}
              sx={{ minWidth: 0, '& .MuiChip-label': { px: 0.75, fontSize: { xs: 10, sm: 12 } } }}
            />
          )}
          {clock}
          {actions && <Box sx={{ ml: 'auto', flexShrink: 0 }}>{actions}</Box>}
        </Box>
      </AppHeaderContent>
      <Box
        sx={{
          height: '100%',
          display: area ? 'grid' : 'block',
          overflow: 'hidden',
          gridTemplateColumns: results
            ? 'minmax(0, 1fr)'
            : { xs: 'minmax(0, 1fr)', md: `minmax(0, 1fr) ${sideControlsWidth}px` },
          gridTemplateRows: results
            ? 'minmax(0, 1fr) 48px'
            : mobile
              ? 'minmax(0, 1fr)'
              : { sm: `minmax(0, 1fr) ${bottomControlsHeight}px`, md: 'minmax(0, 1fr)' },
          gap: `${panelGap}px`,
          minHeight: 0,
        }}
      >
        {area}
        {(!mobile || !board) && controls}
      </Box>
    </BoardControls>
  );
}
