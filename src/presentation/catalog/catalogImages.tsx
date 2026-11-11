import type { ReactNode } from 'react';
import { Box, Button, Link, Typography } from '@mui/material';
import type { CatalogImage } from '../../domain/catalog/model.js';
export type { CatalogImage } from '../../domain/catalog/model.js';

export function CatalogImages({
  images,
  selectedId,
  renderImage,
  onSelect,
}: {
  images: readonly CatalogImage[];
  selectedId: string | undefined;
  renderImage: (id: string) => ReactNode;
  onSelect?: (id: string) => void;
}) {
  return (
    <Box
      sx={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fill, minmax(120px, 1fr))',
        gap: 1.5,
      }}
    >
      {images.map((image) => (
        <Box
          key={image.id}
          sx={{
            p: 1,
            border: '1px solid',
            borderColor: selectedId === image.id ? 'primary.main' : 'divider',
            borderRadius: 1,
          }}
        >
          <Box
            sx={{
              height: { xs: 170, sm: 220 },
              display: 'flex',
              justifyContent: 'center',
              overflow: 'hidden',
              '& > svg': { height: '100%', width: 'auto' },
            }}
          >
            {renderImage(image.id)}
          </Box>
          <Typography variant="body2" sx={{ mt: 1, fontWeight: 700 }}>
            {image.title}
          </Typography>
          {image.edition && <Typography variant="caption">{image.edition}</Typography>}
          <Link
            href={image.sourceUrl}
            target="_blank"
            rel="noreferrer"
            variant="caption"
            sx={{ display: 'block', mt: 0.5 }}
          >
            出典を見る
          </Link>
          {onSelect && (
            <Button
              fullWidth
              variant={selectedId === image.id ? 'contained' : 'outlined'}
              disabled={selectedId === image.id}
              onClick={() => onSelect(image.id)}
              sx={{ mt: 1 }}
            >
              {selectedId === image.id ? '使用中' : 'この画像にする'}
            </Button>
          )}
        </Box>
      ))}
    </Box>
  );
}
