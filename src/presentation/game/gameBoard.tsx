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
  blocked = false,
}: {
  slots: readonly (string | null)[];
  retired: { id: string; slot: number } | null;
  incorrect: readonly string[];
  disabled: boolean;
  blocked?: boolean;
  pendingId?: string | null;
  renderCard: (id: string, back: boolean) => ReactNode;
  onTake: (id: string, at: number) => void;
}) {
  const board = slots;
  const controls = useContext(BoardControls);
  const gap = controls ? boardGap.mobile : boardGap.desktop;
  const { container, layout } = useCardLayout(
    board.length + (controls ? 4 : 0),
    gap,
    controls ? 5 : undefined,
  );
  return (
    <Box
      sx={{
        minHeight: 0,
        p: `${boardPadding}px`,
        borderRadius: 1,
        bgcolor: '#e5eaf3',
        filter: blocked ? 'grayscale(1)' : undefined,
        opacity: blocked ? 0.4 : 1,
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
              gridTemplateRows: `repeat(${layout.rows}, ${layout.cardHeight}px)`,
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
                    minHeight: 0,
                    borderRadius: 1,
                    border: displayed ? undefined : '1px dashed #bac6d9',
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
