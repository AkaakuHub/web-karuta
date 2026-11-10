import { Box, Link } from '@mui/material';
import OpenInNewRounded from '@mui/icons-material/OpenInNewRounded';
import type { ReviewCard } from './reviewModel.js';

export function ReviewLinks({ links }: { links: ReviewCard['links'] }) {
  return (
    <Box
      data-review-links
      sx={{ display: 'flex', flexWrap: 'wrap', gap: 1.5, alignItems: 'center' }}
    >
      {links.map((link) => (
        <Link
          key={link.name}
          href={link.url}
          target="_blank"
          rel="noopener noreferrer"
          sx={{ display: 'inline-flex', alignItems: 'center', gap: 0.5, fontSize: 13 }}
        >
          {link.name}
          <OpenInNewRounded sx={{ fontSize: 14 }} />
        </Link>
      ))}
    </Box>
  );
}
