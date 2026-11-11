import { useState, type ReactNode } from 'react';
import {
  Accordion,
  AccordionDetails,
  AccordionSummary,
  Box,
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  IconButton,
  Tab,
  Tabs,
  Typography,
  useMediaQuery,
  useTheme,
} from '@mui/material';
import CloseRounded from '@mui/icons-material/CloseRounded';
import FlipRounded from '@mui/icons-material/FlipRounded';
import NavigateBeforeRounded from '@mui/icons-material/NavigateBeforeRounded';
import NavigateNextRounded from '@mui/icons-material/NavigateNextRounded';
import ExpandMoreRounded from '@mui/icons-material/ExpandMoreRounded';
import { FavoriteButton } from '../game/favorites.js';
import type { CatalogEntry } from '../../domain/catalog/model.js';
import { SongAudioPlayer } from './songAudioPlayer.js';
import { SongMetadata } from './songMetadata.js';
import { Versions, Videos } from './sourceDetails.js';
export type { CatalogEntry } from '../../domain/catalog/model.js';

export function CatalogSongDialog({
  entries,
  selectedId,
  renderCard,
  renderImages,
  onSelect,
  onClose,
}: {
  entries: readonly CatalogEntry[];
  selectedId: string;
  renderCard: (id: string, back: boolean) => ReactNode;
  renderImages: (id: string) => ReactNode;
  onSelect: (id: string) => void;
  onClose: () => void;
}) {
  const index = entries.findIndex((entry) => entry.id === selectedId);
  const song = entries[index];
  if (!song) return null;
  return (
    <Dialog
      open
      onClose={onClose}
      fullWidth
      maxWidth="md"
      aria-labelledby="catalog-song-title"
      slotProps={{
        paper: {
          sx: {
            m: 1,
            width: 'calc(100% - 16px)',
            maxHeight: 'calc(100dvh - 16px)',
            borderRadius: 2,
          },
        },
      }}
    >
      <DialogTitle
        id="catalog-song-title"
        sx={{ display: 'flex', alignItems: 'center', gap: 0.5, px: 1.5, py: 1 }}
      >
        <Typography
          component="span"
          sx={{
            flex: 1,
            minWidth: 0,
            fontSize: { xs: 16, sm: 20 },
            fontWeight: 800,
            overflowWrap: 'anywhere',
            display: '-webkit-box',
            WebkitBoxOrient: 'vertical',
            WebkitLineClamp: 2,
            overflow: 'hidden',
          }}
        >
          {song.title}
        </Typography>
        <FavoriteButton id={song.id} title={song.title} />
        <IconButton aria-label="詳細を閉じる" onClick={onClose} size="small" sx={{ flexShrink: 0 }}>
          <CloseRounded />
        </IconButton>
      </DialogTitle>
      <SongContent key={song.id} song={song} renderCard={renderCard} renderImages={renderImages} />
      <DialogActions
        sx={{
          px: 1.5,
          py: 0.75,
          justifyContent: 'space-between',
          borderTop: '1px solid',
          borderColor: 'divider',
        }}
      >
        <Button
          aria-label="前の曲"
          disabled={index === 0}
          startIcon={<NavigateBeforeRounded />}
          onClick={() => onSelect(entries[index - 1]!.id)}
        >
          前の曲
        </Button>
        <Typography variant="caption" sx={{ fontVariantNumeric: 'tabular-nums' }}>
          {index + 1} / {entries.length}
        </Typography>
        <Button
          aria-label="次の曲"
          disabled={index + 1 === entries.length}
          endIcon={<NavigateNextRounded />}
          onClick={() => onSelect(entries[index + 1]!.id)}
        >
          次の曲
        </Button>
      </DialogActions>
    </Dialog>
  );
}

function SongContent({
  song,
  renderCard,
  renderImages,
}: {
  song: CatalogEntry;
  renderCard: (id: string, back: boolean) => ReactNode;
  renderImages: (id: string) => ReactNode;
}) {
  const [tab, setTab] = useState('card');
  const [back, setBack] = useState(false);
  const [metadataOpen, setMetadataOpen] = useState<boolean | null>(null);
  const desktop = useMediaQuery(useTheme().breakpoints.up('sm'));
  return (
    <>
      <Tabs
        value={tab}
        onChange={(_, value: string) => setTab(value)}
        variant="scrollable"
        scrollButtons="auto"
        allowScrollButtonsMobile
        aria-label="楽曲の詳細"
        sx={{
          '& .MuiTab-root': { minWidth: 0, px: { xs: 1, sm: 2 }, fontSize: { xs: 12, sm: 14 } },
        }}
      >
        <Tab value="card" label="カード" />
        {song.releases.length > 0 && <Tab value="releases" label="収録・別バージョン" />}
        {song.videos.length > 0 && <Tab value="videos" label="動画" />}
        <Tab value="images" label="画像" />
      </Tabs>
      <DialogContent sx={{ p: { xs: 1.5, sm: 2 }, minHeight: 0 }}>
        {tab === 'card' && (
          <Box
            sx={{
              display: 'grid',
              gridTemplateColumns: { xs: 'minmax(0, 1fr)', sm: 'minmax(0, 240px) minmax(0, 1fr)' },
              gap: 1.5,
            }}
          >
            <Box
              sx={{
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                gap: 0.5,
                minWidth: 0,
              }}
            >
              <Box
                aria-label="カード画像"
                sx={{ width: { xs: 'min(142px, 18dvh)', sm: 'min(200px, 26dvh)' }, flexShrink: 0 }}
              >
                {renderCard(song.id, back)}
              </Box>
              <Button size="small" startIcon={<FlipRounded />} onClick={() => setBack(!back)}>
                {back ? '表面を見る' : '裏面を見る'}
              </Button>
              <Box aria-label="楽曲の再生" sx={{ width: '100%', maxWidth: 320, minWidth: 0 }}>
                <SongAudioPlayer sources={song.audioSources} />
              </Box>
            </Box>
            <Accordion
              expanded={metadataOpen ?? desktop}
              onChange={(_, expanded) => setMetadataOpen(expanded)}
              disableGutters
              elevation={0}
              sx={{
                minWidth: 0,
                alignSelf: 'start',
                border: '1px solid',
                borderColor: 'divider',
                borderRadius: 1,
              }}
            >
              <AccordionSummary expandIcon={<ExpandMoreRounded />} sx={{ minHeight: 40 }}>
                <Typography variant="body2" sx={{ fontWeight: 700 }}>
                  楽曲情報
                </Typography>
              </AccordionSummary>
              <AccordionDetails sx={{ px: 1.5 }}>
                <SongMetadata song={song} />
              </AccordionDetails>
            </Accordion>
          </Box>
        )}
        {tab === 'releases' && <Versions song={song} />}
        {tab === 'videos' && <Videos song={song} />}
        {tab === 'images' && renderImages(song.id)}
      </DialogContent>
    </>
  );
}
