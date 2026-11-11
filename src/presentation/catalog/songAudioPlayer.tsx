import { useState } from 'react';
import { Box, CircularProgress, MenuItem, Stack, TextField } from '@mui/material';
import { AudioSeek } from '../audio/audioSeek.js';
import { PlaybackButton } from '../audio/playbackButton.js';
import { useTrackPlayer } from '../audio/useTrackPlayer.js';
import { VolumeControl } from '../audio/volumeControl.js';
import type { CatalogEntry } from '../../domain/catalog/model.js';
import { ErrorAlert } from '../shared/errorAlert.js';

export function SongAudioPlayer({ sources }: { sources: CatalogEntry['audioSources'] }) {
  const [variant, setVariant] = useState(0);
  const url = sources[variant]?.url;
  if (!url) return null;
  return (
    <Stack spacing={1} sx={{ width: '100%' }}>
      {sources.length > 1 && (
        <TextField
          select
          size="small"
          label="音源"
          value={variant}
          onChange={(event) => setVariant(Number(event.target.value))}
        >
          {sources.map((source, index) => (
            <MenuItem key={source.url} value={index}>
              {source.title}
            </MenuItem>
          ))}
        </TextField>
      )}
      <TrackPlayer key={url} url={url} />
    </Stack>
  );
}

function TrackPlayer({ url }: { url: string }) {
  const audio = useTrackPlayer(url);
  return (
    <Stack spacing={1}>
      <AudioSeek progress={audio.progress} disabled={audio.loading} onSeek={audio.seek} />
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
        <PlaybackButton
          playing={audio.playing}
          disabled={audio.loading}
          onPlay={audio.play}
          onPause={audio.pause}
        />
        <Box sx={{ width: 16, height: 16 }}>
          {audio.loading && <CircularProgress size={16} aria-label="音声を準備中" />}
        </Box>
        <Box sx={{ ml: 'auto' }}>
          <VolumeControl
            value={audio.volume.volume}
            muted={audio.volume.muted}
            onChange={audio.volume.setVolume}
            onToggleMuted={audio.volume.toggleMuted}
          />
        </Box>
      </Box>
      {audio.error && <ErrorAlert message={audio.error} />}
    </Stack>
  );
}
