import type { ReactNode } from 'react';
import { RoomPlayers } from '../multiplayer/roomPlayers.js';
import { RoomInvitation, RoomSpectatorSwitch } from '../multiplayer/roomInvitation.js';
import { GameSettingsButton } from '../game/gameSettingsButton.js';
import { NextRoundButton, GameExitButton } from '../game/gameActionButtons.js';
import { FavoriteToggle } from '../game/favorites.js';
import { SeriesPie } from '../game/seriesBreakdown.js';
import { PlaybackButton } from '../audio/playbackButton.js';
import { helpRoom, helpSeries } from './helpSamples.js';

export type HelpRole = 'host' | 'player' | 'spectator' | 'solo' | 'visitor';
export const helpRoleNames: Record<HelpRole, string> = {
  host: 'ホスト',
  player: '参加者',
  spectator: '閲覧のみ',
  solo: 'ひとりで遊ぶ',
  visitor: '入室前',
};
interface HelpTopic {
  title: string;
  description: string;
  screen: ReactNode;
}
function ignore() {}

export function helpTopics(role: HelpRole): HelpTopic[] {
  const controls = role === 'host' || role === 'solo';
  const solo = role === 'solo';
  const visitor = role === 'visitor';
  return [
    solo
      ? {
          title: '音が出ないとき',
          description: '再生ボタンを押して、音声を再開します。音量も変更できます。',
          screen: (
            <PlaybackButton disabled={false} playing={false} onPlay={ignore} onPause={ignore} />
          ),
        }
      : {
          title: '名前をタップ・クリック',
          description:
            role === 'host'
              ? '自分の名前で改名。他の人の名前でキック・解除ができます。'
              : '自分の名前で改名。キックはホストだけが操作できます。',
          screen: (
            <RoomPlayers
              room={{
                ...helpRoom,
                host: role === 'host' ? 'you' : 'other',
                ...(role === 'spectator'
                  ? {
                      players: helpRoom.players.slice(1),
                      spectators: [{ id: 'you', name: 'あなた', connected: true }],
                    }
                  : {}),
              }}
              you="you"
              onRename={ignore}
              onKick={ignore}
              onUnkick={ignore}
            />
          ),
        },
    controls
      ? {
          title: '次の曲までの待ち時間',
          description: '歯車の設定から、自動送りと待ち時間を変更できます。',
          screen: <GameSettingsButton onClick={ignore} />,
        }
      : {
          title: visitor ? '見るだけでも参加' : '友だちを招待',
          description: visitor
            ? '入室前に「閲覧のみ」をオン。札の取得や部屋の管理はしません。'
            : '招待URLをコピーして共有すると、同じ部屋に参加できます。',
          screen: visitor ? (
            <RoomSpectatorSwitch checked onChange={ignore} />
          ) : (
            <RoomInvitation roomId="sample" onError={ignore} />
          ),
        },
    {
      title: controls ? 'Space・Enterで進行' : '進行はホストにおまかせ',
      description: controls
        ? '答えを表示し、表示後は次の曲へ進みます。入力中は反応しません。'
        : role === 'spectator'
          ? '札は取れません。対戦が終わっても、そのまま次の対戦を見られます。'
          : '次の曲や待ち時間はホストが操作。同じ部屋で続けて遊べます。',
      screen: controls ? (
        <NextRoundButton round={0} total={10} onNext={ignore} />
      ) : (
        <NextRoundButton round={0} total={10} />
      ),
    },
    {
      title: '気になった曲を保存',
      description: '曲情報や取得済み札の星で保存。図鑑の「スター」で見返せます。',
      screen: <FavoriteToggle title="気になった曲" selected={false} onToggle={ignore} />,
    },
    {
      title: '結果の円グラフ',
      description: '名前の横の円をタップ・ホバーすると、枚数とシリーズの割合を表示。',
      screen: <SeriesPie player={helpSeries} />,
    },
    {
      title: solo ? '中断して設定へ戻る' : '部屋から退出',
      description: solo
        ? '×を押して確認すると、記録を保存して中断します。あとから再開できます。'
        : '操作欄の×を押し、確認画面で「退出する」を選ぶと退室します。',
      screen: <GameExitButton label={solo ? '設定に戻る' : '退出'} onClick={ignore} />,
    },
  ];
}
