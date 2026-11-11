import { Box, Stack, Typography } from '@mui/material';
import EmojiEventsRounded from '@mui/icons-material/EmojiEventsRounded';
import { SeriesPie } from './seriesBreakdown.js';
import type { PlayerSeries } from '../../domain/game/seriesBreakdown.js';
import type { rankPlayers } from '../../domain/game/ranking.js';

const places = [
  { rank: 2, column: 1, height: 40, color: '#64748b', background: '#e2e8f0' },
  { rank: 1, column: 2, height: 56, color: '#9a6700', background: '#ffdf80' },
  { rank: 3, column: 3, height: 28, color: '#98532c', background: '#f2d2bc' },
];

export function ResultPodium({
  players,
  series,
}: {
  players: ReturnType<typeof rankPlayers>;
  series: readonly PlayerSeries[];
}) {
  const groups = places
    .map((place) => ({
      ...place,
      players: players.filter((player) => player.rank === place.rank),
    }))
    .filter((place) => place.players.length > 0);
  return (
    <Box
      component="section"
      aria-label="表彰台"
      sx={{
        display: 'grid',
        gridTemplateColumns: 'repeat(3, minmax(0, 1fr))',
        alignItems: 'end',
        gap: 0.75,
        pt: 1,
      }}
    >
      {groups.map((place) => (
        <Box
          key={place.rank}
          aria-label={`${place.rank}位`}
          sx={{
            gridColumn: groups.length === 1 ? '1 / -1' : place.column,
            minWidth: 0,
            textAlign: 'center',
          }}
        >
          <EmojiEventsRounded sx={{ color: place.color, fontSize: place.rank === 1 ? 28 : 24 }} />
          <Stack spacing={0.75} sx={{ pb: 1 }}>
            {place.players.map((player) => (
              <Box key={player.id}>
                <Box
                  sx={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: 0.25,
                  }}
                >
                  <SeriesPie player={series.find((item) => item.id === player.id)!} />
                  <Typography
                    sx={{
                      fontWeight: 800,
                      fontSize: { xs: 13, sm: 15 },
                      lineHeight: 1.35,
                      overflowWrap: 'anywhere',
                    }}
                  >
                    {player.name}
                  </Typography>
                </Box>
                <Typography sx={{ fontWeight: 700, fontSize: 13 }}>{player.count}枚</Typography>
              </Box>
            ))}
          </Stack>
          <Box
            sx={{
              height: place.height,
              bgcolor: place.background,
              color: place.color,
              borderTop: '3px solid',
              borderRadius: '4px 4px 0 0',
              display: 'grid',
              placeItems: 'center',
            }}
          >
            <Typography sx={{ fontSize: place.rank === 1 ? 28 : 23, fontWeight: 900 }}>
              {place.rank}位
            </Typography>
          </Box>
        </Box>
      ))}
    </Box>
  );
}
