# yomiage-discord
yomiage-discordはDiscordに投稿されたメッセージを合成音声で読み上げるアプリケーションです。

## 作成動機
仲間内でライトニングトークをするとき、（発表後ではなく）発表中にコメントや合いの手を入れるために作りました。
人間の声の代わりに機械の声を使うことで発表者とそれ以外の人の発言を明確に区別できるようにし、後者の発言がスルーしやすくなることを期待しています。

## 機能
- 投稿されたメッセージを読み上げる（例: ⌨️「こんにちは」 → 🔊「こんにちは」）
- GPT-3を利用してボットへのメンションに回答する（例: ⌨️「@(ボット名) 聖蹟桜ヶ丘の読み仮名は？」 → 🔊「せいせきおうかおか」。注意: 正しくは「せいせきさくらがおか」です）

## 導入方法
本アプリケーションはGoogleの[Cloud Text-to-Speech](https://cloud.google.com/text-to-speech)と[OpenAIのAPI](https://openai.com/api/)を使用しています。最初にこれらのサービスの利用登録を行ないます。

### Cloud Text-to-Speechを利用する
⚠️ Cloud Text-to-Speechの利用で課金が発生する可能性があります。詳しくは[Pricing](https://cloud.google.com/text-to-speech/pricing)をご覧ください。

1. [Google Cloud Console](https://console.cloud.google.com)にアクセスする
2. 新しいプロジェクトを作成する
3. 左上のナビゲーションメニュー（☰）をクリックし、IAMの管理、サービスアカウントを選択する。出てきた画面でサービスアカウントを作成する（①から③までありますが①だけで十分です）。その後、作成したサービスアカウントの詳細画面を開き、「キー」のタブから鍵を作成する。鍵のタイプはJSONを選ぶ。そうすると、鍵のダウンロードが始まる。この鍵は後で使うのでどこにあったか覚えておく。
4. [https://console.cloud.google.com/flows/enableapi?apiid=texttospeech.googleapis.com]()にアクセスする。「① プロジェクトの確認」でプロジェクトの名前が正しいことを確認したうえでCloud Text-to-Speechを有効にする。

### OpenAIのAPIを利用する
⚠️ OpenAIのAPIは基本的に有料です（無料枠を除く）。詳しくは[Pricing](https://openai.com/api/pricing/)の「Language models」をご覧ください。

1. [Account API Keys - OpenAI API](https://beta.openai.com/account/api-keys)にアクセスし、OpenAIのAPIキーを作成する。このAPIキーは後で使うのでメモしておく。

次にDiscordにアプリケーションを登録します。

### アプリケーションを登録する
1. [Discord Developer Portal](https://discord.com/developers/applications)にアクセスする
2. 「New Application」ボタンを押して、新しいアプリケーションを作成する
3. 作成後の画面で「Bot」をクリックする。さらに「Add a bot」をクリックし、ボットを作成する。その後、以下の設定を行なう。
    - 「Reset Token」ボタンをクリックし、新しいトークンを生成する。このトークンは後で使うのでメモしておく。
    - 「PUBLIC BOT」を無効にする
    - 「MESSAGE CONTENT INTENT」を有効にする
4. 「OAuth2」、「General」をクリックし、表示されたクライアントIDをメモしておく。
5. 続けて「URL Generator」をクリックする。「SCOPES」の項目の中から「bot」と「application.commands」を選択する。そうすると、画面の一番下にアプリケーションを使うためのURLが表示されるのでアクセスする。アクセス先の画面ではアプリケーションを導入するサーバーを指定する。
6. 手順5で指定したサーバーのIDを探す。探し方は[ユーザー/サーバー/メッセージIDはどこで見つけられる？ – Discord](https://support.discord.com/hc/ja/articles/206346498-%E3%83%A6%E3%83%BC%E3%82%B6%E3%83%BC-%E3%82%B5%E3%83%BC%E3%83%90%E3%83%BC-%E3%83%A1%E3%83%83%E3%82%BB%E3%83%BC%E3%82%B8ID%E3%81%AF%E3%81%A9%E3%81%93%E3%81%A7%E8%A6%8B%E3%81%A4%E3%81%91%E3%82%89%E3%82%8C%E3%82%8B-)をご参照ください。このサーバーIDは後で使うのでメモしておく。

最後にアプリケーションを動かします。

### アプリケーションを動かす

1. このレポジトリをクローンし、作成されたディレクトリに移動する
2. `config.json`を作成し、以下の内容を書き込む

```json
{
    "discord": {
        "token": "Discordのトークン",
        "clientId": "DiscordのクライアントID",
        "guildId": "DiscordのサーバーID"
    },
    "openAI": {
        "apiKey": "OpenAIのAPIキー"
    }
}
```

他のファイルに書き込むこともできます。その場合、`YOMIAGE_DISCORD_CONFIG`にそのファイルのパスを指定してください。

3. `npm install`を実行する
4. `npm run build`を実行する
5. `npm run deploy`を実行する
6. `GOOGLE_APPLICATION_CREDENTIALS=(サービスアカウントの鍵ファイル) npm start`を実行する
7. ボイスチャンネルのチャットで`/yomiage start`と入力するとメッセージの読み上げ機能が有効になる。機能を有効にできるのはボイスチャンネルのチャットからのみで、他のテキストチャンネルやDMからは有効にならない。
8. `/yomiage stop`と入力すると読み上げ機能が無効になる。無効にするのはどのチャンネルからでもできる

#### ローカル環境で動かす

設定は`config.json`に書き込むのではなく、以下の環境変数に指定してください。

- `DISCORD_TOKEN`: Discordのトークン
- `DISCORD_CLIENT_ID`: DiscordのクライアントID
- `DISCORD_GUILD_ID`: DiscordのサーバーID
- `OPENAI_API_KEY`: OpenAIのAPIキー

また、環境変数の設定には[1Password CLI](https://developer.1password.com/docs/cli/)などを使ってください。
`EV=val`を使う方法、`.env`ファイルを使う方法は非推奨です。

アプリケーションの起動は`GOOGLE_APPLICATION_CREDENTIALS=(サービスアカウントの鍵ファイル) npm run dev`でできます。ただし、環境変数の設定方法によってはコマンドの微修正が必要になることがあります。

## 工夫点 (備忘録)
- 複数のコメントの音声化を同時に進める（非同期処理）
- 音声が中断されないようにする。[discord.js](https://discord.js.org/#/)において音声を再生するには[`AudioPlayer.play`メソッド](https://discord.js.org/#/docs/voice/main/class/AudioPlayer?scrollTo=play)を使うのですが、音声を再生中にこのメソッドを呼び出すとその音声は中断され、新しい音声が再生されてしまいます。これを防ぐためにバッファ付きの音声再生関数を作成しています（[`src/utilities.ts`](src/utilities.ts)の`attachBufferToPlay`関数）
