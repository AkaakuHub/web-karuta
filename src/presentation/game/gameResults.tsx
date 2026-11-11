import { formatDuration } from '../shared/duration.js';
import type { ReactNode } from 'react';
import {
  Box,
  Paper,
  Stack,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableRow,
  Typography,
} from '@mui/material';
import type { PlayerSeries } from '../../domain/game/seriesBreakdown.js';
import { SeriesPie } from './seriesBreakdown.js';
import { ResultPodium } from './resultPodium.js';
import { rankPlayers } from '../../domain/game/ranking.js';
import type { RoundResult } from '../../domain/game/results.js';

export function GameResults({
  players,
  results,
  children,
  feedback,
  durationMs,
  series,
}: {
  players: readonly { id: string; name: string }[];
  results: readonly RoundResult[];
  children: ReactNode;
  feedback: ReactNode;
  durationMs?: number;
  series: readonly PlayerSeries[];
}) {
  const ranked = rankPlayers(players, results);
  const remaining = ranked.filter((player) => player.rank > 3);
  return (
    <Paper
      component="section"
      aria-label="対戦結果"
      variant="outlined"
      sx={{
        p: { xs: 1.5, sm: 2 },
        minHeight: 0,
        overflow: 'auto',
        '& > [data-game-panel="status"]:not([data-game-error="true"])': {
          height: { xs: 24, sm: 40 },
          minHeight: { xs: 24, sm: 40 },
        },
      }}
    >
      {feedback}
      <Box
        sx={{
          minWidth: 0,
        }}
      >
        <Box sx={{ maxWidth: 640, mx: 'auto' }}>
          <ResultPodium players={ranked} series={series} />
          {durationMs !== undefined && (
            <Typography sx={{ mt: 1, fontWeight: 700 }}>
              出題時間 {formatDuration(durationMs)}
            </Typography>
          )}
          {remaining.length > 0 && (
            <Table
              size="small"
              aria-label="4位以下の順位と取得枚数"
              sx={{ mt: 2, '& .MuiTableCell-root': { py: 0.5 } }}
            >
              <TableHead>
                <TableRow>
                  <TableCell>順位</TableCell>
                  <TableCell>プレイヤー</TableCell>
                  <TableCell align="right">取得</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {remaining.map((player) => (
                  <TableRow key={player.id}>
                    <TableCell sx={{ fontWeight: 800 }}>{player.rank}位</TableCell>
                    <TableCell sx={{ overflowWrap: 'anywhere' }}>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                        <SeriesPie player={series.find((item) => item.id === player.id)!} />
                        {player.name}
                      </Box>
                    </TableCell>
                    <TableCell align="right" sx={{ whiteSpace: 'nowrap', fontWeight: 800 }}>
                      {player.count}枚
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
          <Typography sx={{ mt: 1 }}>
            未取得 {results.filter((result) => result.owner === null).length}枚
          </Typography>
        </Box>
        <Stack
          spacing={1.5}
          sx={{
            mt: 3,
            maxWidth: 560,
            mx: 'auto',
            '& > .MuiStack-root': { gap: 1 },
            '& > .MuiStack-root > .MuiButton-root': { order: -1 },
          }}
        >
          {children}
        </Stack>
      </Box>
    </Paper>
  );
}
