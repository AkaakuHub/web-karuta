import { useCallback, useEffect, useMemo, useRef, useState, type ReactNode } from 'react';
import { useVirtualizer } from '@tanstack/react-virtual';
import { Box, ButtonBase, TextField, Typography } from '@mui/material';
import { FavoriteButton } from './favorites.js';
import type { ReviewCard } from './reviewModel.js';

export function CardCollection({
  cards,
  selectedId,
  renderCard,
  onSelect,
  large = false,
}: {
  cards: readonly ReviewCard[];
  large?: boolean;
  selectedId: string | undefined;
  renderCard: (id: string, back: boolean) => ReactNode;
  onSelect: (id: string) => void;
}) {
  const [query, setQuery] = useState('');
  const area = useRef<HTMLDivElement>(null);
  const visible = useMemo(
    () =>
      cards
        .toReversed()
        .filter((card) =>
          card.title.toLocaleLowerCase().includes(query.trim().toLocaleLowerCase()),
        ),
    [cards, query],
  );
  const key = useCallback((index: number) => visible[index]!.id, [visible]);
  const virtualizer = useVirtualizer({
    count: visible.length,
    getScrollElement: () => area.current,
    estimateSize: () => (large ? 176 : 96),
    getItemKey: key,
    horizontal: true,
    overscan: 3,
    useFlushSync: false,
  });
  useEffect(() => {
    const element = area.current;
    if (!element) return;
    const wheel = (event: WheelEvent) => {
      if (Math.abs(event.deltaY) > Math.abs(event.deltaX)) {
        event.preventDefault();
        element.scrollLeft += event.deltaY;
      }
    };
    element.addEventListener('wheel', wheel, { passive: false });
    return () => element.removeEventListener('wheel', wheel);
  }, []);
  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1, minHeight: 0, flex: 1 }}>
      {cards.length > 12 && (
        <TextField
          label="取得済みの札を検索"
          size="small"
          value={query}
          onChange={(event) => {
            setQuery(event.target.value);
            virtualizer.scrollToOffset(0);
          }}
          fullWidth
        />
      )}
      <Box
        ref={area}
        aria-label="取得済み札のスクロール一覧"
        tabIndex={0}
        onKeyDown={(event) => {
          if (event.key === 'ArrowRight' || event.key === 'ArrowLeft') {
            event.preventDefault();
            virtualizer.scrollBy(event.key === 'ArrowRight' ? 96 : -96);
          }
        }}
        sx={{
          minHeight: 0,
          flex: 1,
          overflowX: 'auto',
          overflowY: 'hidden',
          scrollbarWidth: 'thin',
          overscrollBehaviorX: 'contain',
        }}
      >
        <Box sx={{ width: virtualizer.getTotalSize(), height: '100%', position: 'relative' }}>
          {virtualizer.getVirtualItems().map((item) => {
            const card = visible[item.index]!;
            return (
              <Box
                key={item.key}
                sx={{
                  position: 'absolute',
                  top: 0,
                  left: 0,
                  width: item.size,
                  maxHeight: '100%',
                  transform: `translateX(${item.start}px)`,
                  pr: 1,
                  display: 'flex',
                  flexDirection: 'column',
                }}
              >
                <ButtonBase
                  aria-label={`${card.title}に注目`}
                  onClick={() => onSelect(card.id)}
                  sx={{
                    flex: '0 1 auto',
                    minHeight: 0,
                    width: '100%',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: 0.5,
                    p: 0.5,
                    minWidth: 0,
                    border: '2px solid',
                    borderColor: selectedId === card.id ? 'primary.main' : 'transparent',
                    borderRadius: 0.5,
                    '&:hover': { bgcolor: 'action.hover' },
                  }}
                >
                  <Box
                    sx={{
                      flex: '0 1 auto',
                      minHeight: 0,
                      width: '100%',
                      display: 'flex',
                      justifyContent: 'center',
                      '& > svg': {
                        height: 'auto',
                        width: '100%',
                        maxHeight: '100%',
                        display: 'block',
                      },
                    }}
                  >
                    {renderCard(card.id, false)}
                  </Box>
                  <Typography
                    sx={{
                      fontSize: 12,
                      lineHeight: '18px',
                      flexShrink: 0,
                      width: '100%',
                      whiteSpace: 'nowrap',
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                    }}
                  >
                    {card.title}
                  </Typography>
                </ButtonBase>
                <Box sx={{ alignSelf: 'flex-end' }}>
                  <FavoriteButton id={card.id} title={card.title} />
                </Box>
              </Box>
            );
          })}
        </Box>
      </Box>
    </Box>
  );
}
