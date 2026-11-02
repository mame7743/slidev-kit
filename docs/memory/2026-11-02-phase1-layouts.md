# Phase 1：Markdownファーストの基本レイアウト

## 確定した設計

- Slidev 53.0.0の標準テーマ・Vue slot・Markdown表・Mermaidを利用。独自Markdown変換・図表レンダラー・GUIは追加しない。
- 既存monorepoとCLI/AI機能は維持。Phase 1は通常のSlidev CLIだけで利用可能で、AI設定は不要。既存のAI依存そのものは削除していない。
- 公開10 IDは `cover / section / content / split / comparison / cards / visual / chart / table / roadmap`。唯一の仕様は `packages/core/registry/layouts.json`、検証は同ディレクトリのJSON Schema。
- 共通DOMは現在 `packages/core/components/kit/KitSlide.vue`。`themeConfig.variant: corporate` とスライドの配置 `variant` を分離。既存cover/content/comparisonは非Corporate時に旧実装を維持。
- `npm run catalog` で説明・テンプレート・デッキを生成。`npm run catalog:check` で不一致を検出。
- Mermaid SVGはshadow DOM内にある。外側CSSではなく標準 `setup/mermaid.ts` で共通CSSトークンと寸法を設定。SVG data URLはMarkdownの安全なURL判定で拒否されるため、テーマ同梱画像 `/slidev-kit/` を使用。
- VueはSlidevの依存範囲に揃う3.5.44に固定。

## 検証と運用

- `npm run verify`: 17ファイル79テストと型検査成功。
- `npm run catalog:check`、`npm run phase1:check`、`npm run build`、`npm run export`、`npm run phase1:browser` 成功。
- 実ブラウザの10枚とvariant/densityのCSS組み合わせ、長文時の警告と本文保持を検査。PDFは10ページ16:9・内容ストリームを検査し、PDFKitで画像化・文字抽出して目視確認。
- 検証詳細・上流診断・未検証範囲は `docs/phase1/phase1-verification.md`。依存監査は未解決（8件、critical 1を含む）。Slidevの強制ダウングレードは行わない。
- `dist/` はGit管理外。カタログ画像は `catalog/previews/`。初回導入と操作はREADMEと `docs/phase1/phase1-usage.md`。
