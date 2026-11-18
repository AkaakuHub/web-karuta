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
            m: 0,
            width: '100%',
            maxHeight: '100dvh',
            borderRadius: { xs: 0, sm: 1 },
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
          alignItems: 'start',
          gap: 1.5,
          px: { xs: 1.5, sm: 2 },
          pb: 1.5,
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
              width: { xs: 'min(100%, 30dvh)', sm: 'min(100%, 39dvh)' },
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
