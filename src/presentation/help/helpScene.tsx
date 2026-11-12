import { useLayoutEffect, useMemo, useRef, useState } from 'react';
import { Box, Typography } from '@mui/material';
import { helpMarkerSize, placeHelpMarkers, type HelpRect } from '../../domain/help/markers.js';
import { useHelpScreen } from './helpScreen.js';
import { HelpDemo } from './helpDemo.js';
import type { HelpRole } from './helpTopics.js';

export function HelpScene({ role }: { role: HelpRole }) {
  const { preview, snapshot, stage, viewport } = useHelpScreen(role);
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
  const scale =
    size.width > 0 ? Math.min(size.width / viewport.width, size.height / viewport.height) : 1;
  const width = viewport.width * scale;
  const height = viewport.height * scale;
  const left = (size.width - width) / 2;
  const top = (size.height - height) / 2;
  const layout = useMemo(() => {
    if (
      !snapshot ||
      snapshot.scene !== `${role}:${stage}` ||
      snapshot.width !== viewport.width ||
      snapshot.height !== viewport.height
    )
      return [];
    const scaled = (rect: HelpRect): HelpRect => ({
      x: rect.x * scale + left,
      y: rect.y * scale + top,
      width: rect.width * scale,
      height: rect.height * scale,
    });
    const targets = snapshot.anchors.map(scaled);
    const positions = placeHelpMarkers(
      targets,
      snapshot.blockers.map(scaled),
      size.width,
      size.height,
    );
    return positions.map((position, index) => ({
      position,
      target: targets[index]!,
      anchor: snapshot.anchors[index]!,
    }));
  }, [snapshot, role, stage, viewport, scale, left, top, size]);
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
        aria-label="ゲーム画面の見本"
        sx={{ position: 'relative', minWidth: 0, minHeight: 0, overflow: 'hidden' }}
      >
        <Box
          inert
          aria-hidden="true"
          sx={{
            position: 'absolute',
            left,
            top,
            width: viewport.width,
            height: viewport.height,
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
          <div
            ref={preview}
            data-help-example
            style={{ width: viewport.width, height: viewport.height }}
          >
            <HelpDemo role={role} stage={stage} />
          </div>
        </Box>
        <Box aria-hidden="true" sx={{ position: 'absolute', inset: 0, pointerEvents: 'none' }}>
          {layout.map(({ position, target, anchor }, index) => {
            const x = position.x + helpMarkerSize / 2;
            const y = position.y + helpMarkerSize / 2;
            const endX = Math.max(target.x, Math.min(x, target.x + target.width));
            const endY = Math.max(target.y, Math.min(y, target.y + target.height));
            return (
              <Box key={anchor.id}>
                <Box
                  sx={{
                    position: 'absolute',
                    left: target.x,
                    top: target.y,
                    width: target.width,
                    height: target.height,
                    outline: '1px solid #2449bb',
                    borderRadius: 0.5,
                  }}
                />
                <Box
                  data-help-connector={anchor.id}
                  sx={{
                    position: 'absolute',
                    left: x,
                    top: y,
                    width: Math.hypot(endX - x, endY - y),
                    height: '1px',
                    bgcolor: '#2449bbaa',
                    transform: `rotate(${Math.atan2(endY - y, endX - x)}rad)`,
                    transformOrigin: 'left center',
                  }}
                />
                <Box
                  data-help-marker={anchor.id}
                  sx={{
                    position: 'absolute',
                    left: position.x,
                    top: position.y,
                    width: helpMarkerSize,
                    height: helpMarkerSize,
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
            );
          })}
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
        {layout.map(({ anchor }, index) => (
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
