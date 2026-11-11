import { useLayoutEffect, useRef, useState } from 'react';
import { Box, Typography } from '@mui/material';
import { useHelpScreen } from './helpScreen.js';
import type { HelpRole } from './helpTopics.js';

export function HelpScene({ role }: { role: HelpRole }) {
  const { content, snapshot } = useHelpScreen(role);
  const area = useRef<HTMLDivElement>(null);
  const [size, setSize] = useState({ width: 0, height: 0 });
  useLayoutEffect(() => {
    if (!area.current) return;
    const observer = new ResizeObserver(([entry]) => {
      if (entry) setSize({ width: entry.contentRect.width, height: entry.contentRect.height });
    });
    observer.observe(area.current);
    return () => observer.disconnect();
  }, []);
  const scale = snapshot ? Math.min(size.width / snapshot.width, size.height / snapshot.height) : 0;
  const width = (snapshot?.width ?? 0) * scale;
  const height = (snapshot?.height ?? 0) * scale;
  const left = (size.width - width) / 2;
  const top = (size.height - height) / 2;
  return (
    <Box
      sx={{
        display: 'grid',
        gridTemplateColumns: {
          xs: 'minmax(0, 1.15fr) minmax(0, 1fr)',
          sm: 'minmax(0, 1.8fr) minmax(0, 1fr)',
          md: 'minmax(0, 3fr) minmax(0, 1fr)',
        },
        gap: { xs: 1, sm: 2 },
        minHeight: 0,
        height: '100%',
      }}
    >
      <Box
        ref={area}
        aria-label="現在のゲーム画面の見本"
        sx={{ position: 'relative', minWidth: 0, minHeight: 0, overflow: 'hidden' }}
      >
        <Box
          inert
          aria-hidden="true"
          sx={{
            position: 'absolute',
            left,
            top,
            width: snapshot?.width ?? 0,
            height: snapshot?.height ?? 0,
            transform: `scale(${scale})`,
            transformOrigin: 'top left',
            pointerEvents: 'none',
            userSelect: 'none',
            bgcolor: 'background.default',
            overflow: 'hidden',
            borderRadius: 1,
            boxShadow: '0 0 0 1px #cbd5e1',
          }}
        >
          <div ref={content} />
        </Box>
        <Box
          aria-hidden="true"
          sx={{ position: 'absolute', left, top, width, height, pointerEvents: 'none' }}
        >
          {snapshot?.anchors.map((anchor, index) => (
            <Box
              key={anchor.id}
              data-help-marker={anchor.id}
              sx={{
                position: 'absolute',
                left: anchor.x * scale,
                top: anchor.y * scale,
                width: anchor.width * scale,
                height: anchor.height * scale,
                outline: '1px solid #2449bb',
                borderRadius: 0.5,
              }}
            >
              <Box
                sx={{
                  position: 'absolute',
                  top: -8,
                  left: -4,
                  width: 18,
                  height: 18,
                  display: 'grid',
                  placeItems: 'center',
                  bgcolor: 'primary.main',
                  color: 'white',
                  fontSize: 11,
                  fontWeight: 800,
                  borderRadius: '50%',
                  boxShadow: '0 0 0 2px white',
                }}
              >
                {index + 1}
              </Box>
            </Box>
          ))}
        </Box>
      </Box>
      <Box
        component="ol"
        aria-label="この画面の操作"
        sx={{
          listStyle: 'none',
          m: 0,
          p: 0,
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'center',
          gap: { xs: 1, sm: 2 },
          minWidth: 0,
          minHeight: 0,
        }}
      >
        {snapshot?.anchors.map((anchor, index) => (
          <Box
            component="li"
            key={anchor.id}
            data-help-description={anchor.id}
            sx={{
              display: 'grid',
              gridTemplateColumns: '18px minmax(0, 1fr)',
              gap: 0.5,
              alignItems: 'start',
            }}
          >
            <Box
              aria-hidden
              sx={{
                width: 18,
                height: 18,
                display: 'grid',
                placeItems: 'center',
                bgcolor: 'primary.main',
                color: 'white',
                fontSize: 11,
                fontWeight: 800,
                borderRadius: '50%',
              }}
            >
              {index + 1}
            </Box>
            <Box sx={{ minWidth: 0 }}>
              <Typography
                component="h3"
                sx={{ fontWeight: 800, fontSize: { xs: 11, sm: 13 }, lineHeight: 1.4, mb: 0.25 }}
              >
                {anchor.title}
              </Typography>
              <Typography
                sx={{
                  fontSize: { xs: 11, sm: 12 },
                  lineHeight: 1.5,
                  '@media (max-width: 359.95px)': { fontSize: 10 },
                }}
              >
                {anchor.description}
              </Typography>
            </Box>
          </Box>
        ))}
      </Box>
    </Box>
  );
}
