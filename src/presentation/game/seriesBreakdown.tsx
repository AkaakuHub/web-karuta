import { Box, Chip, Paper, Typography } from '@mui/material';
import { seriesGradient, type PlayerSeries } from '../../domain/game/seriesBreakdown.js';

export function SeriesBreakdown({ players }: { players: readonly PlayerSeries[] }) {
  return (
    <Box component="section" aria-label="プレイヤー別のシリーズ割合" sx={{ mt: 3, minWidth: 0 }}>
      <Typography component="h2" sx={{ fontSize: 16, fontWeight: 800, mb: 1.5 }}>
        取得札のシリーズ割合
      </Typography>
      <Box
        sx={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 280px), 1fr))',
          gap: 1.5,
        }}
      >
        {players.map((player) => (
          <Paper
            key={player.id}
            variant="outlined"
            component="article"
            aria-label={`${player.name}のシリーズ割合`}
            sx={{ p: 1.5, borderRadius: 2, minWidth: 0 }}
          >
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1.5 }}>
              <Typography
                component="h3"
                sx={{
                  fontSize: 14,
                  fontWeight: 800,
                  minWidth: 0,
                  overflowWrap: 'anywhere',
                  flex: 1,
                }}
              >
                {player.name}
              </Typography>
              <Chip size="small" label={`${player.total}枚`} sx={{ flexShrink: 0 }} />
            </Box>
            <Box
              sx={{
                display: 'grid',
                gridTemplateColumns: '112px minmax(0, 1fr)',
                alignItems: 'center',
                gap: 1.5,
              }}
            >
              <Box
                role="img"
                aria-label={
                  player.slices.length
                    ? player.slices
                        .map(
                          (slice) =>
                            `${slice.name} ${((slice.value / player.total) * 100).toFixed(1)}%`,
                        )
                        .join('、')
                    : '取得した札は0枚'
                }
                sx={{
                  width: 112,
                  aspectRatio: '1',
                  borderRadius: '50%',
                  background: player.slices.length ? seriesGradient(player.slices) : '#e8edf4',
                }}
              />
              <Box
                component="ul"
                sx={{ listStyle: 'none', m: 0, p: 0, display: 'grid', gap: 0.75, minWidth: 0 }}
              >
                {player.slices.map((slice) => (
                  <Box
                    key={slice.id}
                    component="li"
                    sx={{
                      display: 'grid',
                      gridTemplateColumns: '8px minmax(0, 1fr) auto',
                      alignItems: 'center',
                      columnGap: 0.5,
                    }}
                  >
                    <Box
                      aria-hidden
                      sx={{ width: 8, height: 8, borderRadius: '50%', bgcolor: slice.color }}
                    />
                    <Typography sx={{ fontSize: 11, lineHeight: 1.4, overflowWrap: 'anywhere' }}>
                      {slice.name}
                    </Typography>
                    <Typography
                      sx={{ fontSize: 11, fontWeight: 700, fontVariantNumeric: 'tabular-nums' }}
                    >
                      {Math.round((slice.value / player.total) * 100)}%
                    </Typography>
                  </Box>
                ))}
              </Box>
            </Box>
          </Paper>
        ))}
      </Box>
    </Box>
  );
}
