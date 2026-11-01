# SlideKit

Slidevデッキを最初から最後まで作るツールキットです。テンプレートからの対話的な作成、検査つきビルド、PDF出力、スライド専用エージェントを1つのCLIにまとめています。

- **対話的なデッキ作成**: `slidev-kit init` がテンプレート選択 → デッキ名 → タイトル → テンプレートの質問を順に聞き、すぐ始められるディレクトリを作ります
- **テンプレート**: `template.json`（manifest）とトークン（`{{title}}` など）で独自テンプレートを作成できます
- **標準構成**: `ref/`（参考資料）`data/` `public/images/` を空で用意
- **検査つきビルド**: `slidev-kit build` は検査を通してからビルドします
- **PDF**: `slidev-kit pdf`
- **スライド専用エージェント**: `slidev-kit agent run "..."`。`ref/` の参考資料を読んでから編集します

## インストール

npmjs公開までの間はgit URLで実行できます。

```sh
npx github:mame7743/slidev-kit#v0.1.0 init my-report
cd my-report
npm install
npm run dev
```

公開後は `npm i -D slidev-kit` でインストールできます。

## 使い方

```sh
slidev-kit [slides.md] --open     # プレビュー（既定動作）
slidev-kit build [slides.md]      # 検査 → ビルド
slidev-kit build --check-only     # 検査のみ
slidev-kit pdf [slides.md]        # PDF
slidev-kit doctor                 # 環境診断
slidev-kit init                   # 対話でデッキ作成
slidev-kit init --list            # テンプレート一覧
slidev-kit agent run "..."        # エージェント実行
```

省略時のデッキは `slidev-kit.config.json` の `defaultDeck`（既定 `slides.md`）です。

## テンプレート

詳細は [packages/slidev-kit/README.md](packages/slidev-kit/README.md) を参照してください。要点:

```text
templates/<name>/
  template.json       # manifest（name / description / modes / tokens / prompts / scaffoldFiles）
  slides.md           # デッキ本体（トークン置換あり）
  data/ public/       # 追加コンテンツ（そのままコピー）
```

- `tokens` に宣言したトークンだけ置換します
- 標準構成（`ref/` `data/` `public/images/` + 足場）はシステムが用意します
- 既存ファイルは上書きしません

## ref/ とエージェント

デッキ直下の `ref/` に参考資料（md / txt / csv / pdf / pptx など）を置くと、`slidev-kit agent` が執筆前にテキスト系を読んで従います。詳細は [docs/agent.md](docs/agent.md) を参照してください。

## 開発

```sh
npm ci
npm test        # Vitest
npm run e2e     # 隔離環境で init → install → build
```

- `packages/slidev-kit/` エンジン本体（CLI・init・テンプレート）
- `packages/slidev-report/` ワークフロー実装（内部）
- `packages/slidev-agent/` スライド専用エージェント（内部）

## ライセンス

MIT
