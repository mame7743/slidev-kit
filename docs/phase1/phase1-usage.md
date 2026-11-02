# Phase 1 執筆ガイド

[READMEのセットアップ](../../README.md#phase-1markdownだけで書く) → [カタログ](../../catalog/README.md) → [10枚のサンプル](../../examples/phase1/slides.md) の順に利用してください。AI設定は不要です。

## 基本設定

デッキの最初のFrontmatterでローカルテーマとCorporateデザインを指定します。リポジトリ内 `examples/<name>/slides.md` なら次の設定です。

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

テーマパスは `slides.md` の場所を基準に変更してください。2枚目以降ではテーマ設定を繰り返す必要はありません。カタログのコードブロックを末尾へコピーすると、次のスライドとして利用できます。

## どのレイアウトを使うか

| 書きたい内容 | ID | 入力 |
|---|---|---|
| タイトル・発表者 | cover | 見出し、文章 |
| 話題の切り替え | section | 見出し、短い補足 |
| 本文・箇条書き | content | 標準Markdown |
| 文章と補足を並べる | split | `::left::` / `::right::` |
| 新旧・2案を比べる | comparison | `::left::` / `::right::` |
| 特徴を3点に整理する | cards | `::first::` / `::second::` / `::third::` |
| 図・写真を大きく見せる | visual | Markdown画像、任意の引用注記 |
| データの傾向を見せる | chart | Mermaid `xychart-beta` |
| 仕様・データを示す | table | Markdown表 |
| 段階的な計画を示す | roadmap | Markdown表、`variant: phases` |

名前付きslotは独立した段落として書きます。見出しと空行を挟んでください。2カラムの主見出しは最初のslotより前に置きます。

## 配置と密度

- `variant` は配置。対応値は各カタログに記載しています。左右カラムは `balanced` / `left` / `right`。
- `density` は `relaxed` / `normal` / `compact`。スライドに未指定なら `themeConfig.density`、さらに未指定なら `normal`。
- デザインを指定する `themeConfig.variant: corporate` とは別の設定です。
- `compact` は内容を削除しません。無理に詰めず、情報量目安を超えたらスライドを分けます。

はみ出し警告はブラウザの開発者コンソールに `[slidev-kit] ... content overflows` と出ます。任意の図の文字重なり・最小フォントまで保証する検査ではないため、最終的にPDFも確認してください。

## 図表と画像

表・roadmapは通常のMarkdown表です。Phase 1は表を独自構文へ変換しません。chartはSlidev標準Mermaidをそのまま使い、Corporateの `setup/mermaid.ts` が配色と基本寸法を設定します。複雑なグラフが収まることは保証していません。

画像はデッキ直下の `public/images/` に配置し、`![図の説明](/images/figure.png)` と書きます。サンプルの `/slidev-kit/pipeline.svg` はテーマ同梱の画像です。`/slidev-kit/` はテーマ画像用の予約パスです。SVG data URLはMarkdown側の安全なURL処理に拒否されるため使用しません。

## 検査と出力

```sh
npm run phase1:check -- examples/my-report/slides.md
npx slidev examples/my-report/slides.md
npx slidev build examples/my-report/slides.md
npx slidev export examples/my-report/slides.md --output dist/my-report.pdf
```

構文検査はSlidev公式parserとMarkdown-itを利用し、未知のID、未対応variant/density、必須slotの不足・空・重複、H1不足、不正YAMLを検出します。Markdownがすべての誤記を構文エラーにするわけではなく、グラフの意味やレイアウトの見栄えは実レンダリングで確認します。

日本語PDFにはOSの日本語フォントとChromiumが必要です。Linuxでは別途フォントやChromiumのシステム依存が必要になることがあります。ヘッドレス環境固有の注意点は[検証結果](phase1-verification.md)を参照してください。
