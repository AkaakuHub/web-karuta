import { AppHeaderContent } from '../shared/appHeaderContent.js';
import { BoardControls } from './boardControls.js';
import { type ReactNode } from 'react';
import { Box, Paper, Stack, Chip, Tooltip, useMediaQuery, useTheme } from '@mui/material';
import {
  boardGap,
  bottomControlsHeight,
  panelGap,
  sideControlsWidth,
} from '../shared/playLayout.js';

export function GameLayout({
  board,
  regulation,
  regulationDetails,
  clock,
  children,
  actions,
  results,
  players,
}: {
  board: ReactNode;
  regulation?: string;
  regulationDetails?: readonly string[];
  clock?: ReactNode;
  children: ReactNode;
  actions?: ReactNode;
  results?: ReactNode;
  players?: ReactNode;
}) {
  const regulationChip = regulation && (
    <Chip
      size="small"
      label={regulation}
      tabIndex={regulationDetails?.length ? 0 : undefined}
      sx={{ minWidth: 0, '& .MuiChip-label': { px: 0.75, fontSize: { xs: 10, sm: 12 } } }}
    />
  );
  const area = results ?? board;
  const mobile = useMediaQuery(useTheme().breakpoints.down('sm'));
  const controls = (
    <Paper
      component="aside"
      aria-label="ゲームコントロール"
      sx={{
        position: 'relative',
        borderRadius: board ? 0.5 : 1,
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
          gridTemplateRows:
            board && players
              ? 'min-content min-content min-content minmax(0, 1fr) auto'
              : 'min-content min-content min-content minmax(0, 1fr)',
          alignContent: 'start',
          '& > *': { minWidth: 0, gridColumn: 1 },
          ...(board
            ? {
                '@media (max-width: 599.95px)': {
                  display: 'grid',
                  gridTemplateRows: 'minmax(0, 1fr)',
                  columnGap: `${boardGap.mobile}px`,
                  '& > [data-game-panel="controls"]': { gridRow: 1 },
                  '& > [data-game-panel="review"]': {
                    gridColumn: 2,
                    gridRow: 1,
                    minHeight: 0,
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
                '& > [data-game-panel="review"]': {
                  gridColumn: 2,
                  gridRow: { sm: '1 / span 4' },
                },
                '& > [data-game-panel="players"]': {
                  gridColumn: '1 / -1',
                  gridRow: 5,
                },
              }
            : {}),
        }}
      >
        {!board && players}
        {children}
        {board && !mobile && players}
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
          {regulationChip && regulationDetails?.length ? (
            <Tooltip
              describeChild
              arrow
              title={regulationDetails.join('\n')}
              slotProps={{ tooltip: { sx: { whiteSpace: 'pre-line' } } }}
            >
              {regulationChip}
            </Tooltip>
          ) : (
            regulationChip
          )}
          {clock}
          {actions && <Box sx={{ ml: 'auto', flexShrink: 0 }}>{actions}</Box>}
        </Box>
      </AppHeaderContent>
      <Box
        data-game-board-layout={board ? true : undefined}
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
              ? players
                ? 'auto minmax(0, 1fr)'
                : 'minmax(0, 1fr)'
              : { sm: `minmax(0, 1fr) ${bottomControlsHeight}px`, md: 'minmax(0, 1fr)' },
          gap: mobile && board ? 0 : `${panelGap}px`,
          minHeight: 0,
        }}
      >
        {mobile && board && players}
        {area}
        {(!mobile || !board) && controls}
      </Box>
    </BoardControls>
  );
}
