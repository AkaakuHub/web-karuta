import { Box, Chip, Link, Stack, Typography } from '@mui/material';
import type { CatalogEntry } from '../../domain/catalog/model.js';

export function SongMetadata({ song }: { song: CatalogEntry }) {
  return (
    <Stack spacing={1}>
      <Stack direction="row" sx={{ gap: 0.5, flexWrap: 'wrap' }}>
        {song.series.map((series) => (
          <Chip
            key={series.id}
            size="small"
            label={series.name}
            sx={{ borderLeft: `4px solid ${series.color}`, maxWidth: '100%' }}
          />
        ))}
      </Stack>
      <Typography variant="body2" sx={{ fontWeight: 700 }}>
        {song.artists.join(' / ')}
      </Typography>
      <Box>
        {song.credits.map((credit, index) => (
          <Typography key={index} variant="body2">
            {credit.role}：{credit.name}
          </Typography>
        ))}
      </Box>
      {song.releasedOn && <Typography variant="body2">発売日：{song.releasedOn}</Typography>}
      <Typography variant="body2">
        {song.number}
        {song.packs.length > 0 && `・パック${song.packs.join(' / ')}`}
      </Typography>
      <Stack direction="row" sx={{ gap: 2, flexWrap: 'wrap' }}>
        {song.links.map((link) => (
          <Link key={link.url} href={link.url} target="_blank" rel="noreferrer" variant="body2">
            {link.name}
          </Link>
        ))}
      </Stack>
    </Stack>
  );
}
