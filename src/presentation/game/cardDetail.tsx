import type { ReactNode } from 'react';
import { Box, ButtonBase } from '@mui/material';
import type { ReviewCard } from './reviewModel.js';
import { CardText } from './cardText.js';

export function CardDetail({
  card,
  renderCard,
  onFocus,
}: {
  card: ReviewCard;
  renderCard: (id: string, back: boolean) => ReactNode;
  onFocus: () => void;
}) {
  return (
    <Box
      sx={{
        display: 'grid',
        gridTemplateColumns: {
          xs: '92px minmax(0, 1fr)',
          sm: '100px minmax(0, 1fr)',
          md: '104px minmax(0, 1fr)',
        },
        gap: 1.5,
        minHeight: 0,
        flex: 1,
      }}
    >
      <ButtonBase
        aria-label={`${card.title}を拡大`}
        onClick={onFocus}
        sx={{ alignSelf: 'start', height: '100%', minHeight: 0 }}
      >
        <Box
          aria-label="札の表面"
          sx={{
            width: '100%',
            height: '100%',
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'flex-start',
            '& > svg': { height: '100%', width: 'auto', maxWidth: '100%' },
          }}
        >
          {renderCard(card.id, false)}
        </Box>
      </ButtonBase>
      <CardText key={card.id} card={card} />
    </Box>
  );
}
