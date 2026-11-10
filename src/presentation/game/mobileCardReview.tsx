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
  return (
    <Box sx={{ position: 'relative', height: '100%', minHeight: 0, '& h3': { pr: 3.5 } }}>
      {card && <CardText card={card} />}
      <IconButton
        aria-label="取得済みの札を一覧表示"
        disabled={!card}
        onClick={onCollection}
        size="small"
        sx={{ position: 'absolute', right: 0, top: 0, p: 0.5 }}
      >
        <CollectionsBookmarkRounded sx={{ fontSize: 20 }} />
      </IconButton>
    </Box>
  );
}
