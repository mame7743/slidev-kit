# Slidev Kit

**Write content. Let design happen.**

## Markdownからスライドを作る

公開17レイアウトとCorporate / Editorialデザインを、Slidev標準のMarkdown・名前付きスロット・Mermaidで利用できます。**AIの設定・APIキー・独自CLIは不要**です。既存のCLI・エージェント機能は後述のとおり引き続き利用できます。

### 最初のプレビュー

Node.js **22.12以上**とnpmを使用します。検証バージョンはSlidev **53.0.0**です。

```sh
git clone https://github.com/mame7743/slidev-kit.git
cd slidev-kit
npm ci
npm run dev
```

ターミナルに表示されるURLを開き、[`examples/quickstart/slides.md`](examples/quickstart/slides.md) を編集します。Slidevのホットリロードが反映します。日本語フォントはOSのローカルフォント（Hiragino / Yu Gothic / Noto Sans CJK JP）を使います。PDFを作る環境にも日本語フォントを用意してください。

```sh
npx playwright install chromium   # PDF・ブラウザ検証用。初回のみ
npm run build                    # 入力検査 → Web用ビルド
npm run export                   # dist/quickstart.pdf
```

### 自分のデッキを作る

```sh
cp -R examples/quickstart examples/my-report
npx slidev examples/my-report/slides.md
```

[`examples/quickstart/`](examples/quickstart/) を出発点にし、[レイアウトカタログ](catalog/README.md)から必要なスライド例を選んで追加してください。カタログは1枚単位のレイアウト選びとコピー、examplesはデッキ全体や構成例です。先頭の設定は残します。

```yaml
---
theme: ../../packages/theme
themeConfig:
  variant: corporate
  organization: 開発チーム
aspectRatio: 16/9
canvasWidth: 1280
layout: cover
---
```

`theme: ../../packages/theme` はデッキからテーマ実体 `packages/theme/` への相対パスです。別の場所に移す場合は変更してください。デザインは `themeConfig.variant`、スライド内の配置は `variant` で指定します。

````md
---
layout: comparison
variant: balanced
density: normal
---

# 新旧方式の比較

::left::

## 従来
- 手動設定
- 個別処理

::right::

## 改善後
- 自動設定
- 標準化
````

対応ID：`cover` / `section` / `content` / `split` / `comparison` / `cards` / `visual` / `chart` / `table` / `roadmap`。表はMarkdown表、グラフはMermaid、画像はMarkdown画像構文を使います。カードは `::first::` / `::second::` / `::third::` の3スロットです。HTML・Vueの記述は不要です。

`density` は `relaxed` / `normal` / `compact`。入力内容を削除・自動縮小しません。はみ出す場合はブラウザコンソールに警告します。情報量を減らすかスライドを分けてください。警告は任意の図の重なりを完全に検出するものではありません。

```sh
npm run phase1:check -- examples/my-report/slides.md
npx slidev build examples/my-report/slides.md
npx slidev export examples/my-report/slides.md --output dist/my-report.pdf
```

`phase1:check` はKitの公開ID契約を検査します（既定サンプルは既存10枚）。従来の拡張レイアウトを含むデッキには既存CLIの検査を使ってください。

### カタログ・品質検証

```sh
npm run catalog          # レジストリから説明・テンプレート・サンプルを再生成
npm run catalog:check    # 生成物との不一致を検出
npm run verify           # テスト + Vue/TypeScript型検査
npm run phase1:browser   # Chromiumで10枚・全variant/densityを検査し、PDFも出力
```

ブラウザ検証は `catalog/previews/*.png` を更新し、PDFとレポートを `dist/phase1-verification/` に出力します。通常のプレビュー・PDF出力にこの検証スクリプトは不要です。

設計・標準APIとの分担は [docs/phase1/phase1-design.md](docs/phase1/phase1-design.md)、実施結果と既知の制約は [docs/phase1/phase1-verification.md](docs/phase1/phase1-verification.md) を参照してください。Talk・40レイアウト・独自Gantt・新規AI支援は後続Phaseです。

## 追加レイアウトを使う

既存10IDの後へ `agenda / summary / end / quote / metrics / process / code` を追加しました。Corporate / Editorialで同じMarkdown・slotを使えます。既存10枚サンプルとpreviewは維持しています。

kit preset（`themeConfig.variant: corporate | editorial`）は本文Markdownだけを描画するため、frontmatterの `title` / `subtitle` / `note` / `takeaway` は無視され、console端に警告が出ます（旧テーマでは従来どおりfrontmatterを描画）。新しい7IDの本文はH1から書いてください。

[7IDの使用法・40候補の実装状態](docs/phase2/layout-expansion-plan.md) / [17枚の検証用fixture](examples/all-layouts/slides.md) / [検証結果と制約](docs/phase2/expansion-verification.md)

```bash
npm run phase2:expansion:check
npm run phase2:expansion:browser
```

## デザインをEditorialへ切り替える

10ID共通の構造・密度を保ったまま、`themeConfig.variant: editorial` で白地・墨色・朱色のEditorialに切り替えられます。Corporateは従来の見た目を維持します。スライド直下の `variant` は引き続き配置指定です。

```sh
npx slidev examples/editorial-variant/slides.md
npm run phase2:check     # 同じレジストリから生成した10枚を検査
npm run phase2:browser   # 両presetのDOM/全配置/密度/図表/PDFを検査
```

サンプル本文はPhase1と同じです。検証成果物は `dist/phase2-verification/{corporate,editorial}/` に隔離し、既存catalog previewを上書きしません。[仕様・使い方・互換性](docs/phase2/README.md)、[実検証結果](docs/phase2/verification.md) を参照してください。40ID化・Talk・AI/GUIはこの段階の対象外です。

## 既存CLI・拡張機能

Slidevデッキを最初から最後まで作るツールキットです。テンプレートからの対話的な作成、検査つきビルド、PDF出力、スライド専用エージェントを1つのCLIにまとめています。

- **対話的なデッキ作成**: `slidev-kit init` がテンプレート選択 → デッキ名 → タイトル → テンプレートの質問を順に聞き、すぐ始められるディレクトリを作ります
- **テンプレート**: `template.json`（manifest）とトークン（`{{title}}` など）で独自テンプレートを作成できます
- **標準構成**: `ref/`（参考資料）`data/` `public/images/` を空で用意
- **検査つきビルド**: `slidev-kit build` は検査を通してからビルドします
- **PDF**: `slidev-kit pdf`
- **スライド専用エージェント**: `slidev-kit agent run "..."`。`ref/` の参考資料を読んでから編集します
- **MCP サーバー**: `slidev-kit mcp`。MCP 対応クライアントへスライド操作ツールを公開します
- **デザイン拡張**: [`docs/designs.md`](docs/designs.md) に従い、同じ `slides.md` のままテーマ variant ごとに部品を変更できます
- **デザイン例**: [`examples/design-contract/`](examples/design-contract/) にテーマ実装例と生成済みPDF、[`examples/design-library/`](examples/design-library/) に共有ライブラリ、[`examples/template-library/`](examples/template-library/) にGitHubテンプレートの例、[`examples/slidev-template/`](examples/slidev-template/) に `mame7743/slidev-template` の利用例があります

## インストール

配布は npm レジストリではなく、バージョンごとの **GitHub Release asset（`.tgz`）** です。下記のバージョン固定 URL から導入してください（`vX.Y.Z` は利用するリリースに合わせます）。

```sh
npm install https://github.com/mame7743/slidev-kit/releases/download/v0.2.2/slidev-kit-0.2.2.tgz
```

`slidev-kit` だけをインストールすれば、テーマ・CLI・エージェント・MCP と図表生成が同梱されます。リポジトリルートからの直接導入（`npx github:mame7743/slidev-kit`）はサポート対象外です。

新しいデッキは `init` で作成します。

```sh
npx slidev-kit init my-report
cd my-report
npm install
npm run dev
```

デッキ作成後は生成された `package.json` の依存（既定は同じ Release tarball URL）に従って `npm install` します。

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

## ディレクトリ構成

```text
packages/theme/layouts/*.vue          # registry登録済みの公開17レイアウト
packages/theme/layouts/extras/        # registry・catalog対象外（手書き利用・テストは可能）
packages/theme/components/kit/        # KitSlideと共通コンテンツ描画
packages/theme/components/templates/  # 旧レイアウト用テンプレート
packages/theme/components/visuals/    # 図表・画像コンポーネント
packages/theme/registry/              # 公開レイアウト定義
packages/theme/charts/                # 図表生成（slidev-charts）
packages/core/                        # init・検査・deck操作などNode.jsコア
packages/cli/                         # 配布パッケージ slidev-kit
catalog/                              # 公開サンプルとブラウザpreview
examples/                             # 用途別の実行例（詳細はexamples/README.md）
docs/layout-inventory.md              # 自動生成される公開状態の唯一の判定表
```

テーマ資産は `packages/theme/` が唯一の実体です。ルートにテーマ資産のsymlinkやコピーは置かず、ルート `package.json`（`slidev-kit-workspace`）は npm workspaces を設定した開発専用のprivateパッケージです。配布物は `packages/cli/` の `slidev-kit` だけです。

## 開発

[ドキュメント索引](docs/README.md) / [開発用スクリプト](scripts/README.md) / [開発メモリ](docs/memory/README.md) / [レイアウト判定表](docs/layout-inventory.md)

```sh
npm ci
npm test        # Vitest
npm run e2e     # 隔離環境で init → install → build
```

- `packages/cli/` 公開パッケージ `slidev-kit`（CLI・配布）
- `packages/theme/` Slidev表示資産と図表生成の唯一の実体（内部）
- `packages/core/` init・検査・deck操作などNode.jsコア（内部）
- `packages/runner/` Slidev実行ワークフロー（内部）
- `packages/agent/` スライド専用エージェント（内部）

## ライセンス

MIT
