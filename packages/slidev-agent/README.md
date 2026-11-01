# slidev-agent（内部パッケージ）

`@earendil-works/pi-agent-core` の薄い基盤に、Slidev専用のツールとプロンプトを載せたエージェントです。汎用コーディングエージェントではなく、スライドの読み書き・検証・ビルド・PDF出力に限定しています。

`private: true` のため単独公開しません。利用者は `slidev-kit` の `agent` サブコマンドを使ってください。

## 起動

```sh
slidev-kit agent run "進捗報告のスライドを作って"
slidev-kit agent chat
slidev-kit agent tools
```

このリポジトリ内では従来通り `npm run agent -- ...` も使えます。

モデルは `SLIDEV_AGENT_MODEL` または `--model` で指定します。

```sh
SLIDEV_AGENT_MODEL=anthropic/claude-sonnet-4-5 slidev-kit agent run "..."
```

APIキーは `pi-ai` の通常の環境変数（`ANTHROPIC_API_KEY` など）を使います。

## ツール

| ツール | 内容 |
|---|---|
| `deck_info` / `list_slides` / `get_slide` | デッキの確認 |
| `update_slide` / `insert_slide` / `remove_slide` / `move_slide` | スライド編集 |
| `read_file` / `write_file` | プロジェクト内ファイル |
| `list_presets` / `list_chart_themes` / `list_layouts` | 利用可能な部品 |
| `validate_deck` | `slidev-kit build --check-only` |
| `build_deck` / `export_pdf` | ビルド・PDF出力 |

`list_presets` / `list_chart_themes` は `slidev-charts` を直接解決し、見つからない場合はテーマ（`slidev-template`）に同梱された実装へフォールバックします。

## 設計

- `pi-agent-core` の `Agent` をそのまま使用
- モデルは `pi-ai` の `builtinModels()` から解決
- ツールはスライド専用。任意のシェル実行は提供しない
- システムプロンプトは `src/system-prompt.mjs`
- スライド操作は `src/deck.mjs`
- ツール定義は `src/tools.mjs`
- CLIは `src/cli.mjs`

`--session` で会話履歴をJSONに保存できます。

## piのツールとして使う

`.pi/extensions/slidev-agent.ts` を同梱しています。プロジェクト信頼後、`slidev_` 接頭辞付きのツールとして利用できます。`/slidev-tools` で一覧を表示します。
