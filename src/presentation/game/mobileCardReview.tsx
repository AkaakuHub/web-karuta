import { Box, IconButton } from '@mui/material';
import CollectionsBookmarkRounded from '@mui/icons-material/CollectionsBookmarkRounded';
import type { ReviewCard } from './reviewModel.js';
import { CardText } from './cardText.js';

export function MobileCardReview({
  card,
  onCollection,
}: {
  card?: ReviewCard;
  onCollection: () => void;
}) {
  const collection = (
    <IconButton
      aria-label="取得済みの札を一覧表示"
      disabled={!card}
      onClick={onCollection}
      size="small"
      sx={{ p: 0.5 }}
    >
      <CollectionsBookmarkRounded sx={{ fontSize: 20 }} />
    </IconButton>
  );
  return (
    <Box sx={{ height: '100%', minHeight: 0 }}>
      {card ? <CardText card={card} actions={collection} /> : collection}
    </Box>
  );
}
