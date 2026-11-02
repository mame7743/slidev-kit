# Slidev Kit

**Write content. Let design happen.**

## Phase 1：Markdownだけで書く

基本10レイアウトとCorporateデザインを、Slidev標準のMarkdown・名前付きスロット・Mermaidで利用できます。**AIの設定・APIキー・独自CLIは不要**です。既存のCLI・エージェント機能は後述のとおり引き続き利用できます。

### 最初のプレビュー

Node.js **22.12以上**とnpmを使用します。検証バージョンはSlidev **53.0.0**です。

```sh
git clone https://github.com/mame7743/slidev-kit.git
cd slidev-kit
npm ci
npm run dev
```

ターミナルに表示されるURLを開き、`examples/phase1/slides.md` を編集します。Slidevのホットリロードが反映します。日本語フォントはOSのローカルフォント（Hiragino / Yu Gothic / Noto Sans CJK JP）を使います。PDFを作る環境にも日本語フォントを用意してください。

```sh
npx playwright install chromium   # PDF・ブラウザ検証用。初回のみ
npm run build                    # 入力検査 → Web用ビルド
npm run export                   # dist/phase1.pdf
```

### 自分のデッキを作る

```sh
cp -R examples/phase1 examples/my-report
npx slidev examples/my-report/slides.md
```

[レイアウトカタログ](catalog/README.md) の使用例をコピーしてスライドを置き換えてください。[コピペ用テンプレート](catalog/templates/) と[実行可能な10枚のサンプル](examples/phase1/slides.md) もあります。先頭の設定は残します。

```yaml
---
theme: ../../
themeConfig:
  variant: corporate
  organization: 開発チーム
aspectRatio: 16/9
canvasWidth: 1280
layout: cover
---
```

`theme: ../../` はデッキからリポジトリルートへの相対パスです。別の場所に移す場合は変更してください。デザインは `themeConfig.variant`、スライド内の配置は `variant` で指定します。

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

`phase1:check` は今回の10 IDを対象とする検査です。従来の拡張レイアウトを含むデッキには既存CLIの検査を使ってください。

### カタログ・品質検証

```sh
npm run catalog          # レジストリから説明・テンプレート・サンプルを再生成
npm run catalog:check    # 生成物との不一致を検出
npm run verify           # テスト + Vue/TypeScript型検査
npm run phase1:browser   # Chromiumで10枚・全variant/densityを検査し、PDFも出力
```

ブラウザ検証は `catalog/previews/*.png` を更新し、PDFとレポートを `dist/phase1-verification/` に出力します。通常のプレビュー・PDF出力にこの検証スクリプトは不要です。

設計・標準APIとの分担は [docs/phase1/phase1-design.md](docs/phase1/phase1-design.md)、実施結果と既知の制約は [docs/phase1/phase1-verification.md](docs/phase1/phase1-verification.md) を参照してください。Talk・40レイアウト・独自Gantt・新規AI支援は後続Phaseです。

## Phase 2 第1段階：本文を変えずにEditorialへ

10ID共通の構造・密度を保ったまま、`themeConfig.variant: editorial` で白地・墨色・朱色のEditorialに切り替えられます。Corporateは従来の見た目を維持します。スライド直下の `variant` は引き続き配置指定です。

```sh
npx slidev examples/phase2/slides.md
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

[ドキュメント索引](docs/README.md) / [開発用スクリプト](scripts/README.md) / [開発メモリ](docs/memory/README.md)

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
