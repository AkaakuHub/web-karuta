import { useMemo, useRef, useState } from 'react';
import { Box, Stack, Typography } from '@mui/material';
import { AppToolbar } from '../shared/appToolbar.js';
import { HeaderTarget } from '../shared/appHeaderContent.js';
import { playPagePadding } from '../shared/playLayout.js';
import { GameLayout } from '../game/gameLayout.js';
import { GameBoard } from '../game/gameBoard.js';
import { GameControls } from '../game/gameControls.js';
import { GameResults } from '../game/gameResults.js';
import { GameStatus } from '../game/gameStatus.js';
import { GameClockDisplay } from '../game/gameClock.js';
import { FavoritePreview } from '../game/favorites.js';
import { DeckSettings } from '../game/deckSettings.js';
import { RoundInfo } from '../game/roundInfo.js';
import { RoomPlayers } from '../multiplayer/roomPlayers.js';
import { RoomLobby } from '../multiplayer/roomLobby.js';
import { RoomWaiting } from '../multiplayer/roomWaiting.js';
import { RoomInvitation } from '../multiplayer/roomInvitation.js';
import { RoomEntranceForm } from '../multiplayer/roomEntranceForm.js';
import { useHelpExamples } from './helpExamples.js';
import { helpRoom, helpSeries, ignoreHelpAction as ignore, type HelpStage } from './helpModel.js';
import { GameHelp } from './gameHelp.js';
import type { HelpRole } from './helpTopics.js';

export function HelpDemo({ role, stage }: { role: HelpRole; stage: HelpStage }) {
  const { cards, renderCard, renderPicker } = useHelpExamples();
  const room = useMemo(() => helpRoom(cards, role, stage), [cards, role, stage]);
  const [target, setTarget] = useState<HTMLDivElement | null>(null);
  const input = useRef<HTMLInputElement>(null);
  const solo = role === 'solo';
  const host = role === 'host' || solo;
  const entrance = ['create', 'join', 'reconnect'].includes(stage);
  const active = ['playing', 'revealed', 'loading'].includes(stage);
  const finished = stage === 'results';
  const you = role === 'spectator' ? 'help-viewer' : 'help-a';
  const reviews = room.results.map((result) => ({
    ...cards.find((card) => card.id === result.id)!,
    ...result,
  }));
  const players =
    !solo && !entrance ? (
      <RoomPlayers room={room} you={you} onRename={ignore} onKick={ignore} onUnkick={ignore} />
    ) : null;
  const settings =
    host && !entrance && !active ? (
      <DeckSettings
        visible
        disabled={false}
        label={finished ? (solo ? 'もう一度遊ぶ' : 'もう一度対戦') : solo ? 'スタート' : '対戦開始'}
        defaultDeckIds={['help-example']}
        renderPicker={() => renderPicker(cards, ignore)}
        onStart={ignore}
      />
    ) : null;
  const controls =
    active || finished ? (
      <GameControls
        state={{
          phase: finished
            ? 'complete'
            : stage === 'revealed'
              ? 'revealed'
              : stage === 'loading'
                ? 'ready'
                : 'playing',
          round: room.round,
          total: room.total,
          winner: stage === 'revealed' ? 'あかり' : undefined,
          loading: stage === 'loading',
          playing: stage === 'playing',
          needsResume: false,
          canSeek: stage === 'revealed',
          progress: { position: 12, duration: 45 },
          volume: 0.6,
          muted: false,
          claimed: room.results.length,
          board: room.board.length,
          reserve: Math.max(
            0,
            room.total - room.results.length - room.board.length + (stage === 'revealed' ? 1 : 0),
          ),
          statistics: [],
        }}
        onPlay={ignore}
        onPause={ignore}
        onSeek={ignore}
        onVolume={ignore}
        onToggleMuted={ignore}
        onSettings={host ? ignore : undefined}
        onReveal={host && stage !== 'revealed' ? ignore : undefined}
        onNext={host ? ignore : undefined}
        onReset={ignore}
        resetLabel={solo ? '設定に戻る' : '退出'}
      />
    ) : null;
  return (
    <FavoritePreview>
      <HeaderTarget value={target}>
        <Box
          sx={{
            display: 'flex',
            flexDirection: 'column',
            height: '100%',
            minHeight: 0,
            overflow: 'hidden',
            bgcolor: 'background.default',
          }}
        >
          <AppToolbar title={solo ? 'ひとりで遊ぶ' : 'オンライン対戦'} onMenu={ignore}>
            <Box ref={setTarget} sx={{ flex: 1, minWidth: 0 }} />
          </AppToolbar>
          <Box
            component="main"
            sx={{
              maxWidth: 1800,
              mx: 'auto',
              p: playPagePadding,
              minWidth: 0,
              minHeight: 0,
              flex: 1,
              width: '100%',
            }}
          >
            <GameLayout
              actions={
                <Stack direction="row" sx={{ alignItems: 'center', gap: 0.5 }}>
                  {!entrance && !solo && <Typography variant="caption">24ms</Typography>}
                  {!entrance && !solo && (active || finished) && (
                    <RoomInvitation roomId="help-example" onError={ignore} />
                  )}
                  <GameHelp role={role} open={false} onChange={ignore} />
                </Stack>
              }
              regulation={active || finished ? '見本の出題範囲' : undefined}
              clock={solo && active ? <GameClockDisplay seconds={12} /> : undefined}
              board={
                active ? (
                  <GameBoard
                    slots={room.board}
                    retired={stage === 'revealed' ? { id: cards[0]!.id, slot: 0 } : null}
                    incorrect={[]}
                    disabled={stage !== 'playing' || role === 'spectator'}
                    renderCard={renderCard}
                    onTake={ignore}
                  />
                ) : null
              }
              results={
                finished ? (
                  <GameResults
                    players={room.players}
                    results={room.results}
                    series={helpSeries(room)}
                    durationMs={solo ? 154000 : undefined}
                    feedback={<GameStatus active error="" feedback={null} />}
                  >
                    {players}
                    {settings}
                    {!solo && <RoomWaiting room={room} you={you} />}
                    <RoundInfo
                      cards={reviews}
                      you={you}
                      revision={0}
                      renderCard={renderCard}
                      summaryOnly
                    />
                  </GameResults>
                ) : undefined
              }
            >
              {entrance && (
                <RoomEntranceForm
                  name="あかり"
                  spectator={false}
                  invalid={false}
                  loaded
                  reconnect={stage === 'reconnect'}
                  invited={stage !== 'create'}
                  inputRef={input}
                  onName={ignore}
                  onSpectator={ignore}
                  onSubmit={(event) => event.preventDefault()}
                />
              )}
              {!active && !finished && !entrance && !solo && (
                <RoomLobby
                  room={room}
                  you={you}
                  roomId="help-example"
                  onError={ignore}
                  onLeave={ignore}
                />
              )}
              {!finished && players}
              {!finished && settings}
              {controls}
              {!finished && (
                <GameStatus
                  active={active}
                  error=""
                  feedback={null}
                  winner={stage === 'revealed' ? 'あかり' : undefined}
                />
              )}
              {active && (
                <RoundInfo cards={reviews} you={you} revision={0} renderCard={renderCard} />
              )}
            </GameLayout>
          </Box>
        </Box>
      </HeaderTarget>
    </FavoritePreview>
  );
}
