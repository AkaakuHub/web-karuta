import type { ReactNode } from 'react';
import { FavoriteButton } from './favorites.js';
import { Box, Stack, Typography } from '@mui/material';
import type { ReviewCard } from './reviewModel.js';
import { ReviewLinks } from './reviewLinks.js';

export function CardText({
  card,
  large = false,
  actions,
}: {
  card: ReviewCard;
  large?: boolean;
  actions?: ReactNode;
}) {
  return (
    <Stack
      aria-label="札の裏面"
      spacing={0.5}
      sx={{ minWidth: 0, minHeight: 0, height: '100%', position: 'relative', pr: 4 }}
    >
      <Box
        sx={{
          minHeight: 0,
          flex: 1,
          overflow: 'auto',
          scrollbarWidth: 'thin',
          overflowWrap: 'anywhere',
        }}
      >
        {card.backText
          .trim()
          .split(/\n\s*\n/u)
          .map((text, index) => (
            <Typography
              key={index}
              component={index === 0 ? 'h3' : 'p'}
              sx={{
                whiteSpace: 'pre-line',
                fontSize: index === 0 ? (large ? 20 : 15) : large ? 16 : 13,
                fontWeight: index === 0 ? 800 : 400,
                lineHeight: 1.5,
                mb: 0.5,
              }}
            >
              {text}
            </Typography>
          ))}
      </Box>
      <Box
        sx={{
          position: 'absolute',
          top: 0,
          right: 0,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'flex-end',
        }}
      >
        <FavoriteButton id={card.id} title={card.title} />
        {actions}
      </Box>
      {large && <ReviewLinks links={card.links} />}
    </Stack>
  );
}
