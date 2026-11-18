import type { Theme } from '@mui/material/styles';

export function tintedSurface(tone: 'primary' | 'success' | 'error' | 'warning' | 'secondary') {
  return (theme: Theme) => {
    const { palette } = theme.vars ?? theme;
    return `color-mix(in srgb, ${palette[tone].main} 12%, ${palette.background.paper})`;
  };
}
