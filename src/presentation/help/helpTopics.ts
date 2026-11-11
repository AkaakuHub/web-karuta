export type HelpRole = 'host' | 'player' | 'spectator' | 'solo' | 'visitor';
export const helpRoleNames: Record<HelpRole, string> = {
  host: 'ホスト',
  player: '参加者',
  spectator: '閲覧のみ',
  solo: 'ひとりで遊ぶ',
  visitor: '入室前',
};
export interface HelpTopic {
  id: string;
  title: string;
  description: string;
}
export function helpTopics(role: HelpRole): HelpTopic[] {
  const controls = role === 'host' || role === 'solo';
  return [
    {
      id: 'players',
      title: '名前をタップ・クリック',
      description:
        role === 'host'
          ? '自分の名前で改名。他の人の名前でキック・解除ができます。'
          : '自分の名前で改名できます。キックはホストだけが操作できます。',
    },
    {
      id: 'cards',
      title: role === 'spectator' ? '対戦を観戦' : '曲を聴いて札を取る',
      description:
        role === 'spectator'
          ? '閲覧のみで参加中です。札の取得や進行の操作はしません。'
          : '流れている曲の札をタップ・クリックして取ります。',
    },
    {
      id: 'range',
      title: '出題範囲を選ぶ',
      description: '分類と出題範囲を選びます。選んだ範囲の曲が出題されます。',
    },
    {
      id: 'settings',
      title: '次の曲までの待ち時間',
      description: '歯車から、自動送りと次の曲までの待ち時間を変更できます。',
    },
    {
      id: 'start',
      title: 'ゲームを始める',
      description:
        role === 'solo'
          ? '出題範囲を選んでスタートします。'
          : '2人以上そろったら開始できます。次の対戦も同じ部屋を使います。',
    },
    {
      id: 'reveal',
      title: '答えを見る',
      description: controls
        ? 'このボタンかSpace・Enterで答えを表示します。入力中は反応しません。'
        : '進行はホストが操作します。',
    },
    {
      id: 'next',
      title: controls ? '次の曲へ進む' : 'ホストの進行を待つ',
      description: controls
        ? 'このボタンかSpace・Enterで次の曲へ。待ち時間は歯車から変更できます。'
        : '次の曲へ進めるのはホストです。そのままお待ちください。',
    },
    {
      id: 'exit',
      title: role === 'solo' ? '中断して設定へ戻る' : '部屋から退出',
      description:
        role === 'solo'
          ? '×から確認し、記録を保存して中断します。あとから再開できます。'
          : 'この退出ボタンから確認画面を開き、部屋から退出します。',
    },
    {
      id: 'favorite',
      title: '気になった曲を保存',
      description: '星で保存し、あとで図鑑の「スター」から見返せます。',
    },
    {
      id: 'series',
      title: 'シリーズの内訳',
      description: '名前の横の円をタップ・ホバーすると、シリーズごとの枚数と割合を表示。',
    },
    {
      id: 'volume',
      title: '音量とミュート',
      description: 'スピーカーでミュートを切り替え、つまみで音量を調整します。',
    },
    {
      id: 'invite',
      title: '友だちを招待',
      description: '招待URLをコピーして共有すると、同じ部屋に参加できます。',
    },
    {
      id: 'cross',
      title: 'シリーズ横断曲',
      description: '複数のシリーズが参加する曲を含めるか切り替えます。',
    },
    {
      id: 'name',
      title: '名前を入力',
      description: '前回の名前はこの端末に保存されます。入室後も自分の名前から改名できます。',
    },
    {
      id: 'spectator',
      title: '見るだけでも参加',
      description: 'オンにすると閲覧のみで参加。札を取ったり、ホストになったりしません。',
    },
    {
      id: 'join',
      title: '部屋に入る',
      description: '名前を入力して入室します。招待URLから同じ部屋に参加できます。',
    },
    {
      id: 'collection',
      title: '取得した札を見る',
      description: '取得済み札の一覧や曲情報を開きます。新しい札から確認できます。',
    },
  ];
}
