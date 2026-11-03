# slidev-charts（内部パッケージ）

CSVとプリセットからJavaScriptでSVGを生成する、Slidev向けのビジネス図表実装です。`private: true` のため単独公開せず、`slidev-kit` に同梱します。図表の生成にPythonや外部のグラフ描画サービスは必要ありません。

```md
<Chart preset="target-trend" src="data/kpi.csv" />
<Chart src="data/trend.csv" type="line" />
```

- `components/Chart.vue`: `Chart` コンポーネント
- `src/presets/`: 5種類のプリセット
- `src/schemas/`: CSVスキーマ
- `src/themes/`: カラーテーマ
- `src/vite/`: Markdown解析・JavaScript SVG生成プラグイン
- `src/vite/render.mjs`: ビルド時のSVGレンダラー
- `templates/csv/`: CSVテンプレート

テーマの `vite.config.ts` がプラグインを有効化し、`components/visuals/Chart.vue` がコンポーネントを公開します。利用者がaddonを追加する必要はありません。
