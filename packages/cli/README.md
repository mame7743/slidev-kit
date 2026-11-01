# slidev-kit

Slidevデッキの作成・プレビュー・検査・ビルド・PDF出力と、スライド専用エージェントを1つのCLIにまとめたツールキットです。当面の配布先は GitHub リポジトリです。

```sh
# GitHub から CLI を実行してデッキを作成
npx github:mame7743/slidev-kit#main init my-report
cd my-report && npm install && npm run dev
```

```sh
slidev-kit slides.md                  # プレビュー（既定動作）
slidev-kit build slides.md            # 検査 → ビルド
slidev-kit build slides.md --check-only
slidev-kit pdf slides.md              # ビルド → PDF
slidev-kit doctor
slidev-kit agent run "進捗報告のスライドを作って"
slidev-kit agent chat
slidev-kit agent tools
```

## slidev-kit init

雛形からデッキを作成します。テンプレートは次の順で解決されます。

```text
1. `--template=github:owner/repo/path/to/template#tag` の直接指定
2. `--template=<name|path>` の直接指定
3. `slidev-kit.config.json` の `templates` ディレクトリ
4. `~/.config/slidev-kit/templates/`
5. 同梱の `templates/default/`
```

同梱テンプレートは `default`（Slidev標準テーマの2ページ雛形）です。会社標準テンプレートは別途 `~/.config/slidev-kit/templates/` や `slidev-kit.config.json` の `templates` で配布できます。GitHub 指定は `git clone` で取得するため Git とネットワークが必要です。参照には再現性のため `#v1.0.0` のような固定タグを推奨します。リポジトリ内の複数テンプレートはサブディレクトリを指定できます。

```sh
slidev-kit init                          # 対話でテンプレート選択・デッキ名・タイトルを入力
slidev-kit init report.md --title "設計レビュー"   # 指定ファイルで作成
slidev-kit init my-report                # 独立したプロジェクトを生成
slidev-kit init --list                   # ローカルテンプレート一覧（name / modes / 出所 / 説明）
slidev-kit init quarterly --template=github:acme/slidev-templates/templates/corporate#v1.0.0
```

対話の流れ（TTYのとき）:

```text
テンプレートを選択してください:
  1) corporate   会社標準の雛形
  2) default     表紙と2列本文の2ページ雛形
選択 [1]: 2
デッキ名（.md で終わると現在のディレクトリへ作成） [slides.md]: my-report
資料タイトル [my-report]: 5月進捗報告
分類 [社外秘]:
→ my-report/ を作成
```

- テンプレートが1つだけなら選択をスキップ
- 名前が `.md` なら現在地へ作成、それ以外は `name/` を生成
- `--template` / `--title` / `--define` / `--theme` 指定時はその項目をスキップ
- 非TTY（CI・パイプ）では対話せず、フラグと既定値で進む

### 標準構成（システムが用意）

`slidev-kit init` はテンプレート選択後、すぐ始められるディレクトリを必ず作ります。

```text
<name>/
  slides.md             # テンプレートのデッキ本体
  ref/                  # 空（.gitkeep。ユーザ専有の参考資料置き場）
  data/                 # 空（.gitkeep。CSV置き場）
  public/images/        # 空（.gitkeep。画像置き場）
  package.json          # システム足場（テンプレートが上書き可）
  vite.config.ts        # システム足場
  .npmrc                # システム足場
  .gitignore            # システム足場
  README.md             # システム足場
```

| 提供元 | 内容 |
|---|---|
| システム | 空フォルダ3種 + `.gitkeep`、`templates/scaffold/` の足場ファイル（テンプレートが無い場合のみ） |
| テンプレート | `slides.md` 本体、`data/` `public/` への追加コンテンツ（任意）、足場の上書き（`scaffoldFiles`） |

### テンプレートの規約

テンプレートは任意のディレクトリで、目印は `slides.md` または `template.json` です。

```text
templates/<name>/
  template.json       # manifest（生成物にはコピーされない）
  slides.md           # デッキ本体（必須。トークン置換あり）
  data/               # CSVサンプル（そのままコピー）
  public/images/      # 画像・ロゴ（そのままコピー）
```

manifest（`template.json`）:

```json
{
  "name": "quarterly",
  "description": "四半期レビュー用の雛形",
  "modes": ["inplace", "project"],
  "tokens": ["title", "date", "classification"],
  "prompts": [
    { "token": "classification", "label": "分類", "default": "社外秘" },
    { "token": "department", "label": "部署名" }
  ],
  "scaffoldFiles": ["package.json", "vite.config.ts", ".npmrc", ".gitignore", "README.md"]
}
```

| フィールド | 規則 | 省略時 |
|---|---|---|
| `name` | `--template=<name>` の検索キー | ディレクトリ名 |
| `description` | `slidev-kit init --list` に表示 | なし |
| `modes` | `inplace` / `project` の対応可否 | 両方 |
| `tokens` | **宣言したトークンだけ置換**。未宣言の `{{...}}` はそのまま残る | 置換なし |
| `prompts` | 対話で聞く項目（`token` / `label` / `default`）。`token` は `tokens` にも宣言する | なし |
| `scaffoldFiles` | projectモードでのみコピーする足場 | 上の既定リスト |

トークン:

| トークン | 値 | 形式 |
|---|---|---|
| `{{name}}` | 資料名 | 生文字列 |
| `{{title}}` | タイトル | JSON引用済み（`title: {{title}}` と書く） |
| `{{themeDep}}` | テーマ依存の指定 | 生文字列（`--theme` で上書き） |
| `{{slidevVersion}}` | `@slidev/cli` のバージョン | 生文字列（`--slidev` で上書き） |
| `{{date}}` | 作成日 `YYYY-MM-DD` | 生文字列（テンプレート側で引用） |
| 任意 | `--define key=value` / 対話の `prompts` | 生文字列 |

コピーの規則:

- `template.json` はコピーしない
- **`ref/` はユーザ専有**。テンプレートからは配布しない（含まれていてもコピーしない）
- テキストファイル（md / txt / json / ts / js / mjs / cjs / css / scss / html / vue / yaml / yml と拡張子なし）のみトークン置換。CSV・画像などはそのままコピー
- テンプレートのファイルが優先。不足する足場はシステム（`templates/scaffold/`）が補う
- 既存ファイルは上書きしない（スキップして通知）

## ref/（参考資料）

デッキ直下の `ref/` は、AI（slidev-kit agent）が資料作成時に読む参考資料の置き場です。**ユーザ専有**で、テンプレートからは配布されません。

```text
my-report/
  slides.md
  ref/
    brief.md         # 依頼内容・目的・読者
    glossary.md      # 用語集
    議事録.pdf       # 過去の議事録
    提案.pptx        # 過去の提案
```

- 対象: `md` / `txt` / `csv` / `pdf` / `pptx` / `docx` / `xlsx`（サブフォルダ可）
- `slidev-kit agent` の `deck_info` が `reference` として一覧を返し、テキスト系（md / txt / csv）を執筆前に読みます
- pdf / pptx は一覧には出ますが読めません。必要な内容はテキスト化してください
- ビルド・PDFには含まれません

## テーマ

`slidev-kit` は会社固有のテーマは含みません。レイアウトとデザイン部品を同梱し、`default` テンプレートは `theme: slidev-kit` でそれらを利用します。会社標準テンプレートや追加のテーマが必要な場合は `--template` / `--theme` で指定してください。

```yaml
---
theme: slidev-kit
title: 資料タイトル
---
```

## 内部パッケージ

公開CLIは `packages/cli/`、共有機能とSlidev資産は `packages/core/`、実行ワークフローは `packages/runner/` に分離しています。`core`・`runner`・`agent`・`charts` は内部実装として `prepack` で配布物へ同梱するため、利用者は `slidev-kit` だけをインストールします。
