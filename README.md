# SlideKit

Slidevデッキを最初から最後まで作るツールキットです。テンプレートからの対話的な作成、検査つきビルド、PDF出力、スライド専用エージェントを1つのCLIにまとめています。

- **対話的なデッキ作成**: `slidev-kit init` がテンプレート選択 → デッキ名 → タイトル → テンプレートの質問を順に聞き、すぐ始められるディレクトリを作ります
- **テンプレート**: `template.json`（manifest）とトークン（`{{title}}` など）で独自テンプレートを作成できます
- **標準構成**: `ref/`（参考資料）`data/` `public/images/` を空で用意
- **検査つきビルド**: `slidev-kit build` は検査を通してからビルドします
- **PDF**: `slidev-kit pdf`
- **スライド専用エージェント**: `slidev-kit agent run "..."`。`ref/` の参考資料を読んでから編集します
- **MCP サーバー**: `slidev-kit mcp`。MCP 対応クライアントへスライド操作ツールを公開します
- **デザイン拡張**: [`docs/designs.md`](docs/designs.md) に従い、同じ `slides.md` のままテーマ variant ごとに部品を変更できます
- **デザイン例**: [`examples/design-contract/`](examples/design-contract/) にテーマ実装例と生成済みPDF、[`examples/design-library/`](examples/design-library/) に共有ライブラリ、[`examples/template-library/`](examples/template-library/) にGitHubテンプレートの例があります

## インストール

当面は GitHub リポジトリを配布元として使います。タグまたはブランチを指定してください。

```sh
npx github:mame7743/slidev-kit#main init my-report
cd my-report
npm install
npm run dev
```

デッキ作成後は生成された `package.json` の依存に従って `npm install` します。

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
slidev-kit mcp                    # MCP stdioサーバー
```

省略時のデッキは `slidev-kit.config.json` の `defaultDeck`（既定 `slides.md`）です。

## テンプレート

詳細は [packages/cli/README.md](packages/cli/README.md) を参照してください。要点:

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

- `packages/cli/` 公開パッケージ `slidev-kit`（CLI・配布）
- `packages/core/` テンプレート・検査・Slidev資産（内部）
- `packages/runner/` Slidev実行ワークフロー（内部）
- `packages/agent/` スライド専用エージェント（内部）
- `packages/charts/` 図表生成（内部）

## ライセンス

MIT
