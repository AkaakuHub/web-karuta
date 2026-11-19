import { boardCapacity } from '../../domain/game/boardLayout.js';
import { BoardControls } from './boardControls.js';
import { memo, useContext, type ReactNode } from 'react';
import { Box } from '@mui/material';
import { useCardLayout } from '../cards/useCardLayout.js';
import { boardGap, boardPadding } from '../shared/playLayout.js';
import { GameCard } from './gameCard.js';

const CardFace = memo(function CardFace({
  id,
  renderCard,
}: {
  id: string;
  renderCard: (id: string, back: boolean) => ReactNode;
}) {
  return renderCard(id, false);
});

export const GameBoard = memo(function GameBoard({
  slots,
  retired,
  incorrect,
  disabled,
  renderCard,
  onTake,
  pendingId,
}: {
  slots: readonly (string | null)[];
  retired: { id: string; slot: number } | null;
  incorrect: readonly string[];
  disabled: boolean;
  pendingId?: string | null;
  renderCard: (id: string, back: boolean) => ReactNode;
  onTake: (id: string, at: number) => void;
}) {
  const board = Array.from(
    { length: Math.max(boardCapacity, slots.length) },
    (_, slot) => slots[slot] ?? null,
  );
  const controls = useContext(BoardControls);
  const gap = controls ? boardGap.mobile : boardGap.desktop;
  const lastRowMinHeight = controls ? 146 : 0;
  const { container, layout } = useCardLayout(
    board.length + (controls ? 4 : 0),
    gap,
    controls ? 5 : undefined,
    lastRowMinHeight,
  );
  return (
    <Box
      sx={{
        minHeight: 0,
        p: `${boardPadding}px`,
        borderRadius: 1,
        bgcolor: 'background.default',
        overflow: 'hidden',
      }}
    >
      <Box ref={container} aria-label="取り札" sx={{ height: '100%', position: 'relative' }}>
        {layout && (
          <Box
            sx={{
              height: '100%',
              display: 'grid',
              gap: `${gap}px`,
              gridTemplateColumns: `repeat(${layout.columns}, ${layout.cardWidth}px)`,
              gridTemplateRows: controls
                ? [
                    ...Array<string>(layout.rows - 1).fill(`${layout.cardHeight}px`),
                    `${Math.max(layout.cardHeight, lastRowMinHeight)}px`,
                  ].join(' ')
                : `repeat(${layout.rows}, ${layout.cardHeight}px)`,
              alignContent: controls ? 'start' : 'center',
              justifyContent: 'center',
            }}
          >
            {board.map((id, slot) => {
              const taken = retired?.slot === slot;
              const displayed = taken ? retired.id : id;
              return (
                <Box
                  key={slot}
                  data-slot={slot}
                  sx={{
                    position: 'relative',
                    height: layout.cardHeight,
                    minHeight: 0,
                    borderRadius: 1,
                    border: displayed ? undefined : '1px dashed',
                    borderColor: 'divider',
                  }}
                >
                  {displayed && (
                    <GameCard
                      key={displayed}
                      label={`${slot + 1}番の札を取る`}
                      taken={taken}
                      pending={pendingId === displayed}
                      incorrect={incorrect.includes(displayed)}
                      disabled={disabled || taken}
                      onTake={(at) => onTake(displayed, at)}
                    >
                      <CardFace id={displayed} renderCard={renderCard} />
                    </GameCard>
                  )}
                </Box>
              );
            })}
            {controls && (
              <Box sx={{ gridColumn: `span ${Math.min(4, layout.columns)}`, minHeight: 0 }}>
                {controls.content}
              </Box>
            )}
          </Box>
        )}
      </Box>
    </Box>
  );
});
