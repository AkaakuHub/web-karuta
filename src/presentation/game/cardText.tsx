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
  const compact = !!actions;
  const buttons = (
    <Box
      sx={{
        ...(compact
          ? {
              float: 'inline-end',
              ml: 0.25,
              '& .MuiIconButton-root': { p: 0.25, minWidth: 24, minHeight: 24 },
              '& .MuiSvgIcon-root': { fontSize: 16 },
            }
          : { position: 'absolute', top: 0, right: 0 }),
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'flex-end',
      }}
    >
      <FavoriteButton id={card.id} title={card.title} />
      {actions}
    </Box>
  );
  return (
    <Stack
      aria-label="札の裏面"
      spacing={large ? 0.5 : 0}
      sx={{ minWidth: 0, minHeight: 0, height: '100%', position: 'relative', pr: compact ? 0 : 4 }}
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
        {compact && buttons}
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
                lineHeight: compact ? 1.3 : 1.5,
                mb: compact ? 0.25 : 0.5,
                '&:last-child': { mb: 0 },
              }}
            >
              {text}
            </Typography>
          ))}
      </Box>
      {!compact && buttons}
      {large && <ReviewLinks links={card.links} />}
    </Stack>
  );
}
