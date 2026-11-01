# Slidev専用エージェント

`slidev-agent` は、`@earendil-works/pi-agent-core` の薄い基盤に、スライド専用のツールとプロンプトを載せたエージェントです。配布エンジン `slidev-kit` に同梱されています。汎用コーディングエージェントのように任意のシェルを実行せず、デッキの読み書き・検証・ビルド・PDF出力に限定しています。

## 起動

配布エンジンでは `slidev-kit agent` サブコマンドを使います。

```sh
# 1回実行
slidev-kit agent run "進捗報告のスライドを作って"

# 対話
slidev-kit agent chat

# ツール一覧
slidev-kit agent tools

# 設定確認
slidev-kit agent doctor
```

モデルは `SLIDEV_AGENT_MODEL` または `--model` で指定します。

```sh
SLIDEV_AGENT_MODEL=anthropic/claude-sonnet-4-5 slidev-kit agent run "..."
```

APIキーは `pi-ai` の通常の環境変数（`ANTHROPIC_API_KEY` など）を使います。`--thinking=off|minimal|low|medium|high`、`--cwd`、`--entry`、`--session` も指定できます。

## ref/ の参考資料

デッキ直下の `ref/` に参考資料を置くと、エージェントが執筆前に読みます。

```text
my-report/
  slides.md
  ref/
    brief.md        # 依頼内容・目的・読者
    glossary.md     # 用語集
    議事録.pdf      # 参考資料（一覧には出るが読めない）
```

- 対象: `md` / `txt` / `csv` / `pdf` / `pptx` / `docx` / `xlsx`（サブフォルダ可）
- `deck_info` が `reference` として一覧を返します
- テキスト系（md / txt / csv）を執筆前に `read_file` で読み、目的・用語・表現・禁止事項に従います
- pdf / pptx などは読めません。必要な内容はテキスト化して `ref/` に置いてください
- `ref/` はユーザ専有です。`slidev-kit init` のテンプレートからは配布されません

## piのツールとして使う

`slidev-kit/packages/slidev-agent/src/tools.mjs` をexportしているため、pi のプロジェクト拡張から `slidev_` 接頭辞付きツールとして登録できます。

```text
slidev_deck_info
slidev_list_slides
slidev_get_slide
slidev_update_slide
slidev_insert_slide
slidev_remove_slide
slidev_move_slide
slidev_read_file
slidev_write_file
slidev_list_presets
slidev_list_chart_themes
slidev_list_layouts
slidev_validate_deck
slidev_build_deck
slidev_export_pdf
```

- 対象デッキは `SLIDEV_AGENT_ENTRY`（既定 `slides.md`）で指定します。
- `/slidev-tools` でツール一覧を確認できます。
- 拡張機能はプロジェクト信頼後に読み込まれます。編集後は `/reload` してください。
- ツールは `ctx.cwd` を作業ディレクトリとして実行されます。

## アーキテクチャ

```text
CLI（src/cli.mjs）
  ↓
Agent（@earendil-works/pi-agent-core）
  ├─ model: pi-ai builtinModels()
  ├─ systemPrompt: src/system-prompt.mjs
  └─ tools: src/tools.mjs
       ├─ deck_info / list_slides / get_slide
       ├─ update_slide / insert_slide / remove_slide / move_slide
       ├─ read_file / write_file
       ├─ list_presets / list_chart_themes / list_layouts
       ├─ validate_deck → slidev-kit build --check-only（テーマのcheck）
       └─ build_deck / export_pdf → slidev-kit build / slidev-kit pdf
```

- `pi-agent-core` の `Agent` をそのまま使用し、独自のループやDSLは作りません。
- モデル解決は `pi-ai` の `builtinModels()` に任せます。
- スライド操作は `src/deck.mjs` の小さな関数に集約しています。
- システムプロンプトは `Chart`、標準レイアウト、検証・出力の順序を指示します。
- セッションは `--session` 指定時だけJSONに保存します（既定はメモリ）。

## ツール

| ツール | 内容 |
|---|---|
| `deck_info` | タイトル・テーマ・スライド数・`ref/` の参考資料一覧 |
| `list_slides` / `get_slide` | スライド一覧・本文・ノート |
| `update_slide` | 本文・ノート・frontmatterの部分更新 |
| `insert_slide` / `remove_slide` / `move_slide` | 構成変更 |
| `read_file` / `write_file` | プロジェクト内のテキストファイル |
| `list_presets` / `list_chart_themes` / `list_layouts` | 利用可能な部品 |
| `validate_deck` | 構成・パス・例文残骸の検査 |
| `build_deck` / `export_pdf` | HTML・PDF出力 |

任意のシェル実行ツールは提供しません。ファイル操作もプロジェクト外へは出られません。

## 設計上の判断

- **薄い基盤**：`pi-agent-core` のイベント、ツール実行、ステアリングをそのまま使う。
- **スライド専用**：汎用 `bash` ではなく、デッキ操作・検証・出力だけを公開する。
- **Markdownが正**：スライドはMarkdownへ直接書き戻し、独自プロジェクト形式を作らない。
- **検証を必須**：編集後は `validate_deck`、必要に応じて `build_deck` / `export_pdf`。
- **モデルは差し替え可能**：`pi-ai` のプロバイダを使い、特定モデルへ固定しない。

## 制限

- 画像の内容理解やGUI編集は行いません。
- `validate_deck` はテーマの検査ルールに依存します。
- 大きなデッキでは、まず `deck_info` / `list_slides` で対象を絞ってください。
- モデル・APIキー・利用料金は `pi-ai` の設定に従います。
