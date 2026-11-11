import { Box, Table, TableBody, TableCell, TableHead, TableRow, Typography } from '@mui/material';
import type { SeriesGroup } from '../../domain/game/seriesBreakdown.js';

export function SeriesBreakdown({
  groups,
  opponents = true,
}: {
  groups: readonly SeriesGroup[];
  opponents?: boolean;
}) {
  const total = groups.reduce((sum, group) => sum + group.total, 0);
  if (!total) return null;
  const background = (colors: readonly string[]) =>
    colors.length === 1
      ? colors[0]
      : `linear-gradient(90deg, ${colors.map((color, index) => `${color} ${(index / colors.length) * 100}% ${((index + 1) / colors.length) * 100}%`).join(', ')})`;
  return (
    <Box component="section" aria-label="シリーズ別の結果" sx={{ mt: 2, minWidth: 0 }}>
      <Typography component="h2" sx={{ fontSize: 16, fontWeight: 800, mb: 1 }}>
        シリーズ別
      </Typography>
      <Box
        role="img"
        aria-label={groups.map((group) => `${group.name} ${group.total}枚`).join('、')}
        sx={{ display: 'flex', height: 12, borderRadius: 2, overflow: 'hidden', mb: 1 }}
      >
        {groups.map((group) => (
          <Box
            key={group.id}
            sx={{ flex: group.total, minWidth: 2, background: background(group.colors) }}
          />
        ))}
      </Box>
      <Table
        size="small"
        aria-label="シリーズごとの取得枚数"
        sx={{
          tableLayout: 'fixed',
          '& .MuiTableCell-root': { px: 0.5, py: 0.75, fontSize: 12 },
          '& .MuiTableCell-root:not(:first-of-type)': {
            width: 48,
            whiteSpace: 'nowrap',
            fontVariantNumeric: 'tabular-nums',
          },
        }}
      >
        <TableHead>
          <TableRow>
            <TableCell>シリーズ</TableCell>
            <TableCell align="right">自分</TableCell>
            {opponents && <TableCell align="right">相手</TableCell>}
            <TableCell align="right">未取得</TableCell>
          </TableRow>
        </TableHead>
        <TableBody>
          {groups.map((group) => (
            <TableRow key={group.id}>
              <TableCell>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.75 }}>
                  <Box
                    aria-hidden
                    sx={{
                      width: 6,
                      alignSelf: 'stretch',
                      flexShrink: 0,
                      borderRadius: 1,
                      background: background(group.colors),
                    }}
                  />
                  <Box component="span" sx={{ overflowWrap: 'anywhere' }}>
                    {group.name}
                  </Box>
                </Box>
              </TableCell>
              <TableCell align="right" sx={{ fontWeight: group.mine ? 800 : 400 }}>
                {group.mine}枚
              </TableCell>
              {opponents && <TableCell align="right">{group.opponent}枚</TableCell>}
              <TableCell align="right">{group.unclaimed}枚</TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </Box>
  );
}
