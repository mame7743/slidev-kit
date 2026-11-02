# Phase 1 設計・Slidev調査

## 対象と前提

2026-11-02に公式ドキュメントとnpmを確認。現行の `@slidev/cli` は **53.0.0**、本リポジトリの固定バージョンも同じ。Node.js >=22.12を使用する。
既存のCLI・AI・図表・デザインライブラリは維持する。Phase 1の執筆・プレビュー・PDF出力にはAIの設定や起動は不要。既存依存の削除やmonorepoの再構成はしない。

## 標準機能と独自実装の分担

| 要件 | 実現方法 |
|---|---|
| Markdown解析・YAML・表・画像 | Slidev標準。独自Markdownパーサーは作らない |
| 名前付きスロット | VueのslotとSlidevの `::left::` 等を使う |
| グラフ | Phase 1は標準Mermaid `xychart-beta` を使用。標準 `setup/mermaid.ts` でCorporateトークンと寸法を適用。CSVグラフ拡張は既存機能のまま |
| ロードマップ | 標準Markdown表をCSSで整える。表を独自データ構造へ変換しない |
| カード | 標準の名前付きスロットを使用。見出しを正規表現で分割しない |
| プレビュー・HMR・ビルド・PDF | Slidev CLI / Vite / Playwrightに委譲 |
| レイアウト | `packages/core/layouts/` のVue SFCと共有 `KitSlide.vue` |
| デザイン | `themeConfig.variant: corporate` と共有CSS Custom Properties |
| 仕様・カタログ | JSON Schema + レジストリからMarkdown例、カタログ、デッキを生成 |
| 入力検査 | Slidev公式parserでスライドを解析し、レジストリのID/variant/density/slotを検査 |
| はみ出し | 実DOMに基づく警告。本文を削除・自動縮小しない |

## 最小構成（既存構造を再利用）

```text
packages/core/
  layouts/                  # 安定した公開ID。既存IDは削除しない
  components/layouts/KitSlide.vue
  designs/corporate/         # tokens.css + corporate.css + 既存Design契約への登録
  registry/                 # layouts.schema.json / layouts.json（10種の唯一の定義元）
  setup/mermaid.ts          # 標準Mermaid設定。shadow DOMのSVGは外側CSSで変更できない
  public/slidev-kit/        # Markdown画像で利用するサンプル画像
docs/phase1/                # 設計・執筆ガイド・検証結果
scripts/phase1/
  generate-catalog.mjs       # docs / templates / sampleの再生成・差分検査
  check-phase1.mjs           # Slidev parserによるスキーマ検査
  phase1-lib.mjs             # レジストリ読込・生成・検査の共通処理
  verify-phase1-browser.mjs  # 実ブラウザ・PDF検査
catalog/
  layouts/                  # GitHubで読める説明・プレビュー・コピペ例
  templates/                # 各スライドのMarkdown
  previews/                 # 実ブラウザのスクリーンショット
examples/phase1/slides.md    # 10レイアウトの実行可能なカタログ
```

既存のcover/content/comparisonはCorporate選択時のみ新しい共通構造へ切り替える。それ以外の既存デッキは従来実装を使用する。追加7 IDは共通部品を薄くラップする。構造は `data-layout` / `data-variant`、装飾はCSS変数とCorporate CSSに分離する。新デザインはこの共通DOMを再利用できる。将来の40 IDを先行実装したり、未実装を利用可能として登録しない。

## 共通スキーマ

`packages/core/registry/layouts.schema.json` はJSON Schema draft-07。ID、カテゴリ、用途、slot（必須/任意）、対応variant、density、情報量目安、注意点、Markdown template、previewパスを管理する。既定variantは配列の先頭。`relaxed / normal / compact` は余白と文字サイズだけを変更する。レイアウトvariantと既存 `themeConfig.variant`（デザイン）の意味を混同しない。

レジストリを将来のAI選択の入力として利用できるが、AI依存は追加しない。ブラウザ上の見た目はスキーマ検査では保証せず、実レンダリングを別途検査する。

## 実レンダリングで確認した標準APIの注意点

- テーマの `public/` はSlidevの配信対象になる。一方、VueがMarkdown画像を静的importへ変換するとユーザー側publicと異なるため、テーマのVite設定で `/slidev-kit` をテーマ画像ディレクトリへ解決する。
- Mermaid SVGはshadow DOM内にあり、外側の `.mermaid svg` CSSは効かない。Corporateの `setup/mermaid.ts` から共通CSSトークンを読み、標準設定APIへ渡す。独自レンダラーは作らない。
- 図の高さ・軸ラベルを含む目視確認は必須。SVGがスライド内にあるだけでは、主見出しや注記と重ならないことは保証できない。ブラウザ検査にchartの見出し・注記との非重複も追加した。
- VueはSlidev 53の依存範囲と揃う **3.5.44** に固定し、複数Vueバージョンの混在を解消した。

## スコープ外

Talk、全40レイアウト、対話セットアップ、独自Gantt描画、独自GUI、自動視覚修正は後続Phase。Phase 1のchartは数値軸を持つ単一Mermaidグラフ、roadmapは3〜5行程度の表であり、高度なチャートエディタや日程管理ではない。

## 一次情報

- https://sli.dev/guide/theme-addon — ローカルテーマ、theme/addonの責務
- https://sli.dev/guide/write-layout — Vueレイアウトと名前付きslot
- https://sli.dev/features/slot-sugar — Markdownの名前付きslot
- https://sli.dev/custom/config-transformers — 拡張ポイント（今回は新規変換不要）
- https://sli.dev/guide/exporting — PDF、Playwright、フォントと待機条件
- https://sli.dev/features/mermaid — 標準Mermaidコードブロック
- https://sli.dev/custom/config-mermaid — `defineMermaidSetup` と標準設定フック
- https://mermaid.js.org/syntax/xyChart.html — XY chartの構文
- https://www.npmjs.com/package/@slidev/cli — 確認時の最新バージョン
