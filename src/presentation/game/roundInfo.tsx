import { MobileCardReview } from './mobileCardReview.js';
import { BoardControls } from './boardControls.js';
import CloseRounded from '@mui/icons-material/CloseRounded';
import { useContext, useMemo, useState, type ReactNode } from 'react';
import {
  Box,
  Button,
  ButtonBase,
  Chip,
  Paper,
  Stack,
  Typography,
  Tabs,
  Tab,
  Dialog,
  DialogTitle,
  DialogContent,
  IconButton,
} from '@mui/material';
import MusicNoteRounded from '@mui/icons-material/MusicNoteRounded';
import GridViewRounded from '@mui/icons-material/GridViewRounded';
import ArticleRounded from '@mui/icons-material/ArticleRounded';
import { resultGroup } from '../../domain/game/results.js';
import type { ResultGroup } from '../../domain/game/results.js';
import type { ReviewCard } from './reviewModel.js';
import { CardCollection } from './cardCollection.js';
import { CardFocus } from './cardFocus.js';
import { CardDetail } from './cardDetail.js';

export function RoundInfo({
  cards,
  renderCard,
  you,
  revision,
  summaryOnly = false,
}: {
  cards: readonly ReviewCard[];
  you: string;
  revision: number;
  summaryOnly?: boolean;
  renderCard: (id: string, back: boolean) => ReactNode;
}) {
  const inline = useContext(BoardControls);
  const [view, setView] = useState<{
    revision: number;
    id: string | null;
    group: ResultGroup | null;
    collection: boolean;
    focused: boolean;
  }>({ revision, id: null, group: null, collection: false, focused: false });
  const fresh = view.revision === revision;
  const collection = fresh && view.collection;
  const focused = fresh && view.focused;
  const latest = cards.at(-1);
  const group = fresh && view.group ? view.group : latest ? resultGroup(latest.owner, you) : 'mine';
  const grouped = useMemo(
    () => ({
      mine: cards.filter((card) => resultGroup(card.owner, you) === 'mine'),
      opponent: cards.filter((card) => resultGroup(card.owner, you) === 'opponent'),
      unclaimed: cards.filter((card) => card.owner === null),
    }),
    [cards, you],
  );
  const groupCards = grouped[group];
  const card = groupCards.find((card) => fresh && card.id === view.id) ?? groupCards.at(-1);
  function select(id: string) {
    setView({ revision, id, group, collection, focused: true });
  }
  const collectionLabel = collection ? '選択した札の情報を表示' : '取得済みの札を一覧表示';
  const groupTabs = (
    <Tabs
      value={group}
      onChange={(_, value: ResultGroup) => {
        setView({ revision, id: null, group: value, collection: true, focused: false });
      }}
      variant="fullWidth"
      aria-label="札の取得者"
      sx={{
        minHeight: 28,
        '& .MuiTab-root': { minHeight: 28, p: 0.5, minWidth: 0, fontSize: 12 },
      }}
    >
      <Tab value="mine" label={`自分 ${grouped.mine.length}`} />
      <Tab value="opponent" label={`相手 ${grouped.opponent.length}`} />
      <Tab value="unclaimed" label={`未取得 ${grouped.unclaimed.length}`} />
    </Tabs>
  );
  return (
    <>
      {summaryOnly ? (
        <Button
          variant="outlined"
          startIcon={<GridViewRounded />}
          onClick={() =>
            setView({ revision, id: card?.id ?? null, group, collection: true, focused: false })
          }
        >
          取得した札（{cards.length}枚）
        </Button>
      ) : (
        <Paper
          component="section"
          data-game-panel="review"
          aria-label="取得した札の情報"
          variant="outlined"
          sx={{
            borderRadius: 1,
            ...(inline ? { border: 0, p: 0, bgcolor: 'transparent' } : {}),
            p: inline ? 0 : 1,
            height: inline ? '100%' : { xs: 270, sm: 270, md: collection ? 420 : 300 },
            minHeight: inline ? 0 : 200,
            flexShrink: 0,
            display: 'flex',
            flexDirection: 'column',
            gap: inline ? 0.25 : 1,
          }}
        >
          {inline ? (
            <MobileCardReview
              card={card}
              onCollection={() =>
                setView({ revision, id: card?.id ?? null, group, collection: true, focused: false })
              }
            />
          ) : (
            <>
              <Stack direction="row" sx={{ alignItems: 'center', flexShrink: 0, gap: 0.5 }}>
                <ButtonBase
                  aria-label={collectionLabel}
                  disabled={!groupCards.length}
                  onClick={() =>
                    setView({
                      revision,
                      id: card?.id ?? null,
                      group,
                      collection: !collection,
                      focused: false,
                    })
                  }
                  sx={{
                    display: 'flex',
                    justifyContent: 'flex-start',
                    flex: 1,
                    gap: inline ? 0 : 1,
                    minWidth: 0,
                    borderRadius: 0.5,
                    '&:hover': { bgcolor: 'action.hover' },
                  }}
                >
                  <Box
                    aria-hidden
                    sx={{
                      position: 'relative',
                      width: { xs: 34, sm: 56 },
                      height: { xs: 24, sm: 44 },
                      flexShrink: 0,
                    }}
                  >
                    {groupCards.slice(-3).map((card, index) => (
                      <Box
                        key={card.id}
                        sx={{
                          position: 'absolute',
                          width: { xs: 14, sm: 25 },
                          left: { xs: index * 7 + 2, sm: index * 11 + 4 },
                          top: 1,
                          transform: `rotate(${(index - 1) * 9}deg)`,
                          transformOrigin: '50% 100%',
                          boxShadow: '0 1px 4px #18233140',
                        }}
                      >
                        {renderCard(card.id, false)}
                      </Box>
                    ))}
                    {!groupCards.length && (
                      <MusicNoteRounded sx={{ m: 1, color: 'text.disabled' }} />
                    )}
                  </Box>
                  <Typography
                    component="h2"
                    sx={{ fontWeight: 800, fontSize: { xs: 11, sm: 14 }, whiteSpace: 'nowrap' }}
                  >
                    取得した札
                  </Typography>
                  <Chip
                    size="small"
                    label={`${groupCards.length}枚`}
                    sx={{ height: { xs: 18, sm: 24 }, fontSize: { xs: 10, sm: 12 } }}
                  />
                  {collection && !inline ? (
                    <ArticleRounded fontSize="small" />
                  ) : (
                    <GridViewRounded fontSize="small" />
                  )}
                </ButtonBase>
              </Stack>
              {!inline && groupTabs}
              {collection && !inline ? (
                <CardCollection
                  key={group}
                  cards={groupCards}
                  selectedId={card?.id}
                  renderCard={renderCard}
                  onSelect={select}
                />
              ) : card ? (
                <CardDetail card={card} renderCard={renderCard} onFocus={() => select(card.id)} />
              ) : (
                <Box
                  sx={{ flex: 1, display: 'grid', placeItems: 'center', color: 'text.disabled' }}
                >
                  <MusicNoteRounded sx={{ fontSize: 48 }} />
                </Box>
              )}
            </>
          )}
        </Paper>
      )}
      {(inline || summaryOnly) && collection && (
        <Dialog
          open
          onClose={() => setView({ ...view, collection: false })}
          fullWidth
          maxWidth="md"
        >
          <DialogTitle>
            取得した札
            <IconButton
              aria-label="取得済み一覧を閉じる"
              onClick={() => setView({ ...view, collection: false })}
              sx={{ position: 'absolute', right: 8, top: 8 }}
            >
              <CloseRounded />
            </IconButton>
          </DialogTitle>
          <DialogContent
            sx={{
              height: 'min(480px, 72dvh)',
              display: 'flex',
              flexDirection: 'column',
              gap: 1,
              overflow: 'hidden',
            }}
          >
            {groupTabs}
            <CardCollection
              key={group}
              cards={groupCards}
              selectedId={card?.id}
              renderCard={renderCard}
              onSelect={select}
              large
            />
          </DialogContent>
        </Dialog>
      )}
      {focused && card && (
        <CardFocus
          card={card}
          renderCard={renderCard}
          onClose={() => setView({ ...view, focused: false })}
        />
      )}
    </>
  );
}
