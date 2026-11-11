import { useState } from 'react';
import { Box, ClickAwayListener, IconButton, Tooltip, Typography } from '@mui/material';
import { seriesGradient, type PlayerSeries } from '../../domain/game/seriesBreakdown.js';

export function SeriesPie({ player }: { player: PlayerSeries }) {
  const [open, setOpen] = useState(false);
  const title = (
    <Box sx={{ p: 0.5, minWidth: 160, maxWidth: 300 }}>
      <Typography sx={{ fontSize: 12, fontWeight: 800, mb: 0.75 }}>
        {player.name}・{player.total}枚
      </Typography>
      {player.slices.map((slice) => (
        <Box
          key={slice.id}
          sx={{
            display: 'grid',
            gridTemplateColumns: '8px minmax(0, 1fr) auto',
            gap: 0.75,
            alignItems: 'center',
            mb: 0.5,
          }}
        >
          <Box
            aria-hidden
            sx={{ width: 8, height: 8, borderRadius: '50%', bgcolor: slice.color }}
          />
          <Typography sx={{ fontSize: 11, lineHeight: 1.4 }}>{slice.name}</Typography>
          <Typography
            sx={{ fontSize: 11, whiteSpace: 'nowrap', fontVariantNumeric: 'tabular-nums' }}
          >
            {slice.count}枚・{Math.round((slice.value / player.total) * 100)}%
          </Typography>
        </Box>
      ))}
    </Box>
  );
  return (
    <ClickAwayListener onClickAway={() => setOpen(false)}>
      <Box component="span" sx={{ display: 'inline-flex', flexShrink: 0 }}>
        <Tooltip
          title={title}
          open={open}
          onOpen={() => setOpen(true)}
          onClose={() => setOpen(false)}
          disableTouchListener
          arrow
          slotProps={{
            tooltip: { sx: { bgcolor: '#243247', boxShadow: 3 } },
            arrow: { sx: { color: '#243247' } },
          }}
        >
          <IconButton
            data-help="series"
            aria-label={`${player.name}のシリーズ内訳`}
            aria-expanded={open}
            size="small"
            onClick={() => setOpen(true)}
            sx={{ p: 0.5 }}
          >
            <Box
              component="span"
              aria-hidden
              sx={{
                width: 24,
                height: 24,
                borderRadius: '50%',
                background: player.slices.length ? seriesGradient(player.slices) : '#dce3ed',
              }}
            />
          </IconButton>
        </Tooltip>
      </Box>
    </ClickAwayListener>
  );
}
