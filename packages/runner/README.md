# slidev-runner（内部パッケージ）

Slidev デッキのプレビュー・ビルド・PDF出力を行うワークフローの実装です。`private: true` のため単独公開しません。通常は `slidev-kit` の `slidev-kit` コマンドがこの実装を呼び出します。

```sh
slidev-kit slides.md              # プレビュー（dev）
slidev-kit build slides.md        # 検査 → ビルド
slidev-kit pdf slides.md          # PDF
slidev-kit doctor
```

## 設定

プロジェクト直下の `slidev-kit.config.json` で既定値を変更できます（旧 `slidev-report.config.json` も読めます）。

```json
{
  "defaultDeck": "slides.md",
  "examples": ["examples/slides.md", "examples/columns.md"]
}
```

- `defaultDeck`: ファイル名を省略したときのデッキ
- `examples`: リポジトリの `npm run examples:pdf` で一括出力するデッキ
- `samples`: 例文残骸チェックの対象外にする見本デッキ（テンプレートリポジトリ用）
- `templates`: `slidev-kit init` が使うテンプレートディレクトリ（省略時は `~/.config/slidev-kit/templates/` → 同梱default）

PDF出力はPlaywright付属Chromiumを使用します。WindowsではMicrosoft Edgeを優先して自動検出し、`CHROMIUM_PATH` で明示指定もできます。
