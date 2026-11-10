import { useState, type ReactNode } from 'react';
import {
  Box,
  Dialog,
  DialogContent,
  DialogTitle,
  IconButton,
  ToggleButton,
  ToggleButtonGroup,
} from '@mui/material';
import CloseRounded from '@mui/icons-material/CloseRounded';
import type { ReviewCard } from './reviewModel.js';
import { CardText } from './cardText.js';

export function CardFocus({
  card,
  renderCard,
  onClose,
}: {
  card: ReviewCard;
  renderCard: (id: string, back: boolean) => ReactNode;
  onClose: () => void;
}) {
  const [back, setBack] = useState(false);
  return (
    <Dialog
      open
      onClose={onClose}
      fullWidth
      maxWidth="md"
      aria-labelledby="card-focus-title"
      slotProps={{
        paper: {
          sx: {
            m: { xs: 1.5, sm: 3 },
            width: '100%',
            maxHeight: 'calc(100dvh - 24px)',
            overflow: 'hidden',
          },
        },
      }}
    >
      <DialogTitle id="card-focus-title" sx={{ pr: 7, fontWeight: 800 }}>
        {card.title}
        <IconButton
          aria-label="拡大表示を閉じる"
          onClick={onClose}
          sx={{ position: 'absolute', right: 8, top: 8 }}
        >
          <CloseRounded />
        </IconButton>
      </DialogTitle>
      <DialogContent
        sx={{
          display: 'grid',
          gridTemplateColumns: { xs: 'minmax(0, 1fr)', sm: 'minmax(0, 280px) minmax(0, 1fr)' },
          gridTemplateRows: { xs: 'minmax(0, 1fr) minmax(0, 0.8fr)', sm: 'minmax(0, 1fr)' },
          gap: 2,
          height: 'min(650px, 78dvh)',
          overflow: 'hidden',
        }}
      >
        <Box
          sx={{
            display: 'flex',
            flexDirection: 'column',
            minHeight: 0,
            alignItems: 'center',
            gap: 1,
          }}
        >
          <Box
            sx={{
              minHeight: 0,
              flex: 1,
              display: 'flex',
              justifyContent: 'center',
              width: '100%',
              '& > svg': { width: 'auto', height: '100%', maxWidth: '100%' },
            }}
          >
            {renderCard(card.id, back)}
          </Box>
          <ToggleButtonGroup
            exclusive
            size="small"
            value={back ? 'back' : 'front'}
            onChange={(_, value: string | null) => {
              if (value) setBack(value === 'back');
            }}
            aria-label="カードの面"
          >
            <ToggleButton value="front">表面</ToggleButton>
            <ToggleButton value="back">裏面</ToggleButton>
          </ToggleButtonGroup>
        </Box>
        <CardText card={card} large />
      </DialogContent>
    </Dialog>
  );
}
