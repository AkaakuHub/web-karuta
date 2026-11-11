import {
  Accordion,
  AccordionDetails,
  AccordionSummary,
  Box,
  Link,
  Stack,
  Typography,
} from '@mui/material';
import ExpandMoreRounded from '@mui/icons-material/ExpandMoreRounded';
import OpenInNewRounded from '@mui/icons-material/OpenInNewRounded';
import type { CatalogEntry } from '../../domain/catalog/model.js';

export function Versions({ song }: { song: CatalogEntry }) {
  return (
    <Stack spacing={1}>
      {song.releases.map((release) => (
        <Accordion
          key={release.id}
          disableGutters
          elevation={0}
          sx={{ border: '1px solid', borderColor: 'divider', borderRadius: 1 }}
        >
          <AccordionSummary expandIcon={<ExpandMoreRounded />}>
            <Box>
              <Typography sx={{ fontSize: 14, fontWeight: 700 }}>
                {release.title}
                {release.edition && ` ${release.edition}`}
              </Typography>
              {release.releasedOn && (
                <Typography variant="caption" color="text.secondary">
                  {release.releasedOn}
                </Typography>
              )}
            </Box>
          </AccordionSummary>
          <AccordionDetails>
            {release.recordings.map((recording) => (
              <Box key={recording.id} sx={{ mb: 1 }}>
                <Typography variant="body2">{recording.title}</Typography>
                {recording.artist && (
                  <Typography variant="caption" color="text.secondary">
                    {recording.artist}
                  </Typography>
                )}
              </Box>
            ))}
            <Link href={release.url} target="_blank" rel="noreferrer" variant="body2">
              収録情報を見る
            </Link>
          </AccordionDetails>
        </Accordion>
      ))}
    </Stack>
  );
}

export function Videos({ song }: { song: CatalogEntry }) {
  return (
    <Stack spacing={1}>
      {song.videos.map((video) => (
        <Link
          key={video.id}
          href={video.url}
          target="_blank"
          rel="noreferrer"
          sx={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            p: 1.5,
            border: '1px solid',
            borderColor: 'divider',
            borderRadius: 1,
          }}
        >
          {video.title}
          <OpenInNewRounded fontSize="small" sx={{ ml: 1, flexShrink: 0 }} />
        </Link>
      ))}
    </Stack>
  );
}
