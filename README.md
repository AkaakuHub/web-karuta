# web-karuta

ジャンルやデータ取得元に依存しないWebかるたシステムです。ReactとMUIのゲームUI、ひとり練習、復習・途中保存、音声再生、Cloudflare Durable Objectsによる対戦ルームとWebSocketの状態同期・再接続を提供します。

## 利用

Gitリポジトリのコミットを依存先に指定します。インストール時にJavaScriptと型定義を生成します。Node.js24.22.2以上25未満とpnpm12.18以上13未満を使用します。

```json
{
  "dependencies": {
    "web-karuta": "github:AkaakuHub/web-karuta#<commit>"
  }
}
```

ブラウザー側は`KarutaProvider`へ保存キーの接頭辞とJSONを返すHTTPクライアントを渡します。`GameBoard`へ札IDと描画関数を渡し、`useGame`へIDを持つ出題データ・音源URLの解決関数・復習と進行保存の関数を渡します。

```tsx
import { KarutaProvider } from 'web-karuta/presentation/config/karutaProvider';
import { GameBoard } from 'web-karuta/presentation/game/gameBoard';

<KarutaProvider value={{ storagePrefix: 'my-karuta', request }}>
  <GameBoard
    slots={ids}
    retired={null}
    incorrect={[]}
    disabled={false}
    renderCard={(id, back) => <Card id={id} back={back} />}
    onTake={take}
  />
</KarutaProvider>;
```

対戦用Workerは`web-karuta/worker/multiplayer/gameRoom`の`GameRoom`を継承し、コンストラクターでDurable Objectの状態と`{ deckIds(id), audioFor(cardId, round) }`を渡します。`deckIds`は出題する札ID、`audioFor`はブラウザーから取得できる音源URLを返します。`web-karuta/worker/multiplayer/routes`の`routeRoom`へリクエストとルームのバインディングを渡すと、`/api/rooms`を処理します。認証・アクセス元の確認・その他のルーティングは利用側で実装します。

札のデザイン、ジャンル固有データ、デッキの分類、外部サービスからの収集・照合は利用側で用意します。音声中継が必要な場合は`web-karuta/worker/audio/proxy`の`streamAudio`へURL・リクエスト・掲載元向けヘッダーを生成する関数を渡します。

## 開発

```sh
pnpm install
pnpm run check
```

MITライセンスです。
