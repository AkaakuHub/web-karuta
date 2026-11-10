import { Box, CardActionArea } from '@mui/material';
import { memo, type ReactNode } from 'react';

export const GameCard = memo(function GameCard({
  children,
  label,
  taken,
  incorrect,
  disabled,
  onTake,
}: {
  children: ReactNode;
  label: string;
  taken: boolean;
  incorrect: boolean;
  disabled: boolean;
  onTake?: () => void;
}) {
  return (
    <Box
      className="game-card"
      sx={{
        height: '100%',
        opacity: incorrect ? 0.4 : 1,
        filter: incorrect ? 'grayscale(1)' : undefined,
        outline: taken ? '3px solid #16854c' : undefined,
        outlineOffset: 2,
        animation: incorrect ? 'card-shake 360ms ease-in-out' : undefined,
        '@keyframes card-shake': {
          '0%,100%': { transform: 'translateX(0)' },
          '20%,60%': { transform: 'translateX(-6px) rotate(-2deg)' },
          '40%,80%': { transform: 'translateX(6px) rotate(2deg)' },
        },
        '@media (prefers-reduced-motion: reduce)': {
          animation: 'none',
        },
      }}
    >
      <CardActionArea
        aria-label={label}
        disabled={disabled || incorrect || taken}
        onClick={onTake}
        sx={{ height: '100%', borderRadius: 0, '&.Mui-disabled': { opacity: 1 } }}
      >
        {children}
      </CardActionArea>
    </Box>
  );
});
