import { GameSettingsButton } from './gameSettingsButton.js';
import { useContext } from 'react';
import { useRoundShortcut } from './useRoundShortcut.js';
import { BoardControls } from './boardControls.js';
import {
  Box,
  Button,
  Chip,
  CircularProgress,
  LinearProgress,
  Paper,
  Tooltip,
  Typography,
} from '@mui/material';
import { NextRoundButton, GameExitButton } from './gameActionButtons.js';
import SkipNextRounded from '@mui/icons-material/SkipNextRounded';
import CheckCircleRounded from '@mui/icons-material/CheckCircleRounded';
import CancelRounded from '@mui/icons-material/CancelRounded';
import EmojiEventsRounded from '@mui/icons-material/EmojiEventsRounded';
import { ResultControls } from './resultControls.js';
import { VolumeControl } from '../audio/volumeControl.js';
import type { GameControlsProps } from './controlsModel.js';
import { AudioSeek } from '../audio/audioSeek.js';
import { PlaybackButton } from '../audio/playbackButton.js';

export function GameControls({
  state,
  onPlay,
  onPause,
  onSeek,
  onVolume,
  onToggleMuted,
  onSettings,
  onGiveUp,
  givenUp,
  onReveal,
  onNext,
  onReset,
  resetLabel,
}: GameControlsProps) {
  const compact = useContext(BoardControls);
  const complete = state.phase === 'complete';
  const revealed = state.phase === 'revealed';
  useRoundShortcut(complete ? undefined : revealed ? onNext : onReveal);
  if (complete)
    return (
      <ResultControls
        state={state}
        onVolume={onVolume}
        onToggleMuted={onToggleMuted}
        onReset={onReset}
        resetLabel={resetLabel}
        onSettings={onSettings}
      />
    );
  return (
    <Paper
      data-game-panel="controls"
      data-help-stage={state.loading ? 'loading' : state.phase}
      sx={{
        p: { xs: 0.25, sm: 1 },
        border: '1px solid',
        borderColor: 'divider',
        borderRadius: 1,
        height: compact ? '100%' : 148,
        minHeight: 0,
        flexShrink: 0,
        display: 'grid',
        gridTemplateRows: { xs: 'auto 12px 32px 24px 2px', sm: '28px 24px 36px 32px 3px' },
        gridTemplateColumns: 'minmax(0, 1fr)',
        alignContent: 'space-between',
        overflow: 'hidden',
      }}
    >
      <Box
        sx={{
          display: 'flex',
          flexWrap: { xs: 'wrap', sm: 'nowrap' },
          alignItems: 'center',
          gap: 0.5,
          rowGap: 0,
          minWidth: 0,
          gridColumn: '1 / -1',
          '& .MuiChip-root': { height: { xs: 16, sm: 24 } },
          '& .MuiChip-label': { fontSize: { xs: 10, sm: 12 }, px: 0.5 },
        }}
      >
        <Chip size="small" label={complete ? '結果' : `${state.round + 1} / ${state.total}`} />
        <CircularProgress
          size={16}
          aria-label="音声を準備中"
          sx={{ visibility: state.loading ? 'visible' : 'hidden', flexShrink: 0 }}
        />
        {state.winner && (
          <Chip
            size="small"
            color="success"
            icon={<EmojiEventsRounded />}
            label={state.winner}
            sx={{ maxWidth: { xs: 60, sm: 150 } }}
          />
        )}
        <Box sx={{ flex: 1, display: { xs: 'none', sm: 'block' } }} />
        <Box
          sx={{
            display: 'flex',
            flexWrap: { xs: 'wrap', sm: 'nowrap' },
            width: { xs: '100%', sm: 'auto' },
            justifyContent: { xs: 'space-between', sm: 'flex-start' },
            gap: { xs: 0.125, sm: 0.75 },
            flexShrink: 0,
            fontSize: { xs: 9, sm: 14 },
            '& svg': { fontSize: { xs: 14, sm: 20 } },
          }}
        >
          {state.statistics.map((statistic) => {
            const Icon =
              statistic.kind === 'score'
                ? EmojiEventsRounded
                : statistic.kind === 'correct'
                  ? CheckCircleRounded
                  : statistic.kind === 'incorrect'
                    ? CancelRounded
                    : SkipNextRounded;
            return (
              <Tooltip key={statistic.name} title={statistic.name}>
                <Box
                  aria-label={`${statistic.name}${statistic.value}`}
                  sx={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: { xs: 0.125, sm: 0.5 },
                    color:
                      statistic.kind === 'correct'
                        ? '#16854c'
                        : statistic.kind === 'incorrect'
                          ? '#d32f2f'
                          : '#64748b',
                    fontWeight: 800,
                    whiteSpace: 'nowrap',
                    fontVariantNumeric: 'tabular-nums',
                  }}
                >
                  <Icon fontSize="small" />
                  {statistic.value}
                </Box>
              </Tooltip>
            );
          })}
        </Box>
      </Box>
      <AudioSeek progress={state.progress} disabled={!state.canSeek} onSeek={onSeek} />
      <Box
        sx={{
          display: 'flex',
          alignItems: 'center',
          gap: { xs: 0.5, sm: 1 },
          minWidth: 0,
          gridColumn: 1,
          '& .MuiButton-root': {
            minWidth: 0,
            minHeight: { xs: 28, sm: 32 },
            px: 0.5,
            fontSize: { xs: 11, sm: 13 },
          },
          '& .MuiButton-startIcon': { mr: 0.25 },
        }}
      >
        <PlaybackButton
          playing={state.playing}
          disabled={state.loading || (state.phase === 'playing' && !state.needsResume)}
          onPlay={onPlay}
          onPause={onPause}
        />
        {!complete && !revealed && onReveal && (
          <Button
            data-help="reveal"
            size="small"
            aria-keyshortcuts="Space Enter"
            onClick={onReveal}
          >
            <Box component="span" sx={{ display: { xs: 'inline', sm: 'none' } }}>
              答え
            </Box>
            <Box component="span" sx={{ display: { xs: 'none', sm: 'inline' } }}>
              答えを見る
            </Box>
          </Button>
        )}
        {!complete && !revealed && onGiveUp && (
          <Button size="small" onClick={onGiveUp} disabled={givenUp || state.loading}>
            {givenUp ? 'お手上げ済み' : 'お手上げ'}
          </Button>
        )}
        {revealed && <NextRoundButton round={state.round} total={state.total} onNext={onNext} />}
        {onSettings && (
          <Box sx={{ ml: 'auto', display: 'flex' }}>
            <GameSettingsButton onClick={onSettings} />
          </Box>
        )}
      </Box>
      <Box
        sx={{
          display: 'flex',
          alignItems: 'center',
          gap: 0.5,
          gridColumn: 1,
          justifyContent: 'space-between',
          '& > .MuiTooltip-root': { p: 0.25 },
        }}
      >
        <Typography
          variant="caption"
          sx={{
            display: { xs: 'none', sm: 'block' },
            mr: 'auto',
            ml: 'auto',
            whiteSpace: 'nowrap',
          }}
        >
          場{state.board}枚・控え{state.reserve}枚
        </Typography>
        <VolumeControl
          value={state.volume}
          muted={state.muted}
          onToggleMuted={onToggleMuted}
          onChange={onVolume}
        />
        <GameExitButton label={resetLabel} onClick={onReset} />
      </Box>
      <LinearProgress
        variant="determinate"
        value={state.total ? (state.claimed / state.total) * 100 : 0}
        sx={{ height: 2, borderRadius: 1, gridColumn: '1 / -1' }}
      />
    </Paper>
  );
}
