# slidev-charts（内部パッケージ）

CSVと短いPropsからMatplotlibのSVGを生成する、Slidev向けのビジネス図表実装です。`private: true` のため単独公開しません。`slidev-template` に同梱され、テーマの `Chart` コンポーネントとして使えます。

```md
<Chart preset="target-trend" src="data/kpi.csv" />
<Chart src="data/trend.csv" type="line" />
```

- `components/Chart.vue`: `Chart` コンポーネント
- `src/presets/`: 5種類のプリセット
- `src/schemas/`: CSVスキーマ
- `src/themes/`: 8種類のカラーテーマ
- `src/vite/`: Markdown解析・SVG生成プラグイン
- `python/render.py`: Matplotlibレンダラー
- `templates/csv/`: CSVテンプレート

テーマ側の `vite.config.ts` がプラグインを有効化し、`components/visuals/Chart.vue` がコンポーネントを公開します。利用者がaddonを追加する必要はありません。
