# examples — 機能を試すチュートリアル

各例は「**入力データ・説明する機能・出力**」をひとまとまりに確認できる学習用サンプルです。まずは[クイックスタート](./quickstart/README.md)でデッキを読み、目的に合わせて機能別の例へ進んでください。レイアウトを1枚単位で選ぶ場合は[レイアウトカタログ](../catalog/README.md)を使います。

## できあがりを見るチュートリアル

| チュートリアル | 入力・データ | 主に説明する機能 | 出力 |
|---|---|---|---|
| [はじめてのデッキ](./quickstart/README.md) | `quickstart/slides.md` の架空の問い合わせ改善提案 | Markdown、名前付きslot、表、Corporateテーマ | [5枚のPDF](./quickstart/exports/quickstart.pdf) |
| [レイアウトをまとめて見る](./core-layouts/README.md) | 基本10レイアウトの生成サンプル | 基本レイアウトの見た目と入力構造 | [10枚のPDF](./core-layouts/exports/core-layouts.pdf) |
| [デザインを切り替える](./editorial-variant/README.md) | 基本10レイアウトの本文は共通、テーマ設定のみ変更 | `themeConfig.variant: editorial` | [10枚のPDF](./editorial-variant/exports/editorial-variant.pdf) |
| [全レイアウトを見る](./all-layouts/README.md) | 公開17レイアウトの生成サンプル | 追加7レイアウトを含む一覧 | [17枚のPDF](./all-layouts/exports/all-layouts.pdf) |
| [独自デザインを実装する](./design-contract/README.md) | 共通interfaceに沿うデッキと `designs/acme/` | Header / Footer / PageRoot等を組み替える | [PDF](./design-contract/exports/design-contract.pdf) |

`core-layouts/` と `all-layouts/` は自動生成fixtureです。直接編集せず `npm run catalog` で再生成します。`editorial-variant/slides.md` は `node scripts/phase2/check-phase2.mjs --write` で更新します。PDFは `npm run examples:pdf` で4つの生成可能デッキを再出力できます。

## 配布・連携のチュートリアル

| チュートリアル | 入力・データ | 説明する機能 | 成果物・制約 |
|---|---|---|---|
| [デザインを複数デッキで共有する](./design-library/README.md) | `design-library/acme/` と固定タグのGitHub依存 | デザインを更新可能なpackageとして配布 | デッキから再利用する構成 |
| [複数テンプレートを配布する](./template-library/README.md) | `template.json` と `templates/corporate/slides.md` | GitHubリポジトリのテンプレートを選択して初期化 | `slidev-kit init` が生成する新規デッキ |
| [外部テンプレートを使う](./slidev-template/README.md) | 外部GitHubテンプレートと固定タグ | `--template=github:...` による取得 | 新規プロジェクト。現行上流テンプレートには互換修正が必要 |
| [旧デザイン契約を確認する](./design-contract.md) | 旧interfaceの設定・fixture | 互換性と旧APIの検証箇所 | 学習用の現行実装ではありません |

これらの配布・連携例は完成デッキではないため、PDFではなく入力と生成先・依存関係を各チュートリアルで示しています。実行例は各ページの「試す」手順を参照してください。

## PDFを再生成

```sh
npm run examples:pdf
```

公開レイアウトの状態は[レイアウト判定表](../docs/layout-inventory.md)、機能の技術的背景は[ドキュメント索引](../docs/README.md)を参照してください。
