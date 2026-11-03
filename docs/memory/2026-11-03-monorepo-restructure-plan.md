# monorepo再構成：引き継ぎ計画

## 状態と依頼

- 2026-11-03記録。ユーザーからmonorepo構成の見直しと、計画を後続セッションへ引き継げる形での保存を依頼された。
- **2026-11-03更新：ユーザー承認によりmonorepo再構成へ着手済み。配布方針はGitHub Release asset配布で確定した（「確定した配布方針」参照）。さらに同日、二重管理を解消する単一ソース化（「単一ソース構成（2026-11-03 実装完了）」参照）を実装した。** パッケージ名・互換性範囲・AI/MCP移行は引き続き未決。
- **現状（2026-11-03 実装完了時点）：テーマ資産と図表コードの実体は `packages/theme/` のみ。ルートは開発専用のprivate workspace（`slidev-kit-workspace`）。配布物は `packages/cli/` の `slidev-kit` だけ。ルートsymlink・`packages/core`/`packages/charts` の互換symlink・`scripts/sync-theme.mjs`/postinstall は削除済み。**
- 目的はルートの見かけ上の二重配置をなくし、Slidev表示資産と制作支援コードの責務・依存・配布経路を明確化すること。全機能の再実装や新機能追加ではない。
- 現時点の作業ツリーには未コミット変更（`git status --short` に追加・移動・型変更が多数）がある。後続セッションでも必ず再確認し、ユーザーの変更を上書きしない。

## 確定した配布方針（2026-11-03 ユーザー決定）

- 配布チャネルはnpmレジストリではなくGitHub Release assets。バージョンごとに `.tgz` を添付する。
- 利用側はバージョン固定URLから導入する。例：`https://github.com/mame7743/slidev-kit/releases/download/v0.2.2/slidev-kit-0.2.2.tgz`。
- この承認は配布方針に対するものであり、公開GitHub Releaseの作成・uploadの承認ではない。公開リリースは未作成で、作成・公開はユーザーの明示指示があるまで行わない。
- ローカルでpackしたCLI/themeのtarballは検証用の私的成果物。リポジトリへコミットせず、配布物として公開もしない。
- GitHub Release経由の導入検証（release URLからのinstall/build）はまだ実施していない。

## 単一ソース構成（2026-11-03 実装完了）

二重管理を解消するため、以下を実装した。

- **テーマの唯一の実体は `packages/theme/`**：layouts / components / composables / designs / interface / registry / setup / public / scripts / lib / vite.config.ts と、図表コード `packages/theme/charts/` を保持する。
- **charts の manifest を `packages/theme/charts/package.json` へ移動**：`packages/charts/` は削除した。root 依存・lockfile・CLI prepack・agent/mcp のパス解決は `packages/theme/charts` を参照する。
- **ルートは開発専用 workspace**：`package.json` の name を `slidev-kit-workspace` に変更し、`workspaces: ["packages/*", "packages/theme/charts"]` を設定。ルートの `bin` / `exports` / `postinstall` / `slidev` 設定 / テーマsymlink を削除した。`slidev` の defaults は `packages/theme/package.json` へ移した。
- **配布物は `packages/cli/` の `slidev-kit` のみ**：prepack が `packages/theme` と `packages/core` からテーマ資産・Node資産を CLI ルートへ、兄弟パッケージを `node_modules/` へ同梱する。postpack が生成コピーを削除する。
- **`packages/core/` は Node.js コアのみ**：`check.mjs` / `init.mjs` / `deck.mjs` / `lib/deck-contract.mjs` / `templates/` / `tests/` を保持。テーマ互換symlink（components 等、lib/gantt・layout・kit-presets）は削除。unit test は `packages/theme` の正規ファイルを直接参照する。
- **examples / scripts / docs / tests の参照先を `packages/theme` へ更新**：例の先頭frontmatterは `theme: ../../packages/theme`。catalog / inventory は公式スクリプトで再生成済み。
- **公式インストール経路はバージョン付き GitHub Release tarball**：`init` の既定 `kitDep` / `themeDep` は実行中CLIのバージョンから `https://github.com/mame7743/slidev-kit/releases/download/vX.Y.Z/slidev-kit-X.Y.Z.tgz` を組み立てる。
- **退職した互換挙動**：リポジトリルートからの直接導入（`npx github:mame7743/slidev-kit#main`）と、root をテーマとして解決する `theme: ../../` はサポート外。Release の作成・upload・tag は未実施。

## 実装済みの進捗（2026-11-03）

- 単一ソース化（上記「単一ソース構成」）を実装。ルート/互換symlink・`packages/charts`・`sync-theme.mjs`/postinstall を削除した。
- `npm test`（21ファイル・130テスト）と `npm run typecheck` が成功。`catalog:check` / `inventory:check` / `phase1:check` / `phase2:check` / `phase2:expansion:check` が成功。
- `node scripts/phase2/verify-cli-distribution.mjs` は HEAD アーカイブではなく現在の作業ツリーをコピーして検証するよう変更し、成功。`node scripts/phase2/verify-cli-kit.mjs` も成功。
- 実 Slidev での `examples/phase1/slides.md` build（`theme: ../../packages/theme`）が成功。

以下は単一ソース化前の経緯（履歴）：

- theme資産を `packages/core/` から `packages/theme/` へ移動。
- chartsのsource/testsを `packages/theme/charts/` へ移動し、旧 `packages/charts/` は互換シンボリックリンクとして残置。
- `packages/cli/scripts/prepack.mjs` の同梱対象をcharts（実体 `theme/charts`）と配布asset（`public/slidev-kit/pipeline.svg` を含む `public`）まで広げ、互換リンクを実体へ展開して同梱するよう修正。`packages/cli/scripts/postpack.mjs` の後始末も修正（`scripts/vite-plugin-charts.mjs` とroot側のコピー生成物を削除し、追跡済みファイルは残す）。
- CLI/themeのtarballをローカルでpack。初回のCLI tarballはregistryと入れ子のslidev-core assetが欠落していたため、`files` と同梱manifestを修正。
- 修正後 `node scripts/phase2/verify-cli-distribution.mjs` が成功。隔離pack/install環境でCorporate / Editorial各10枚のbuildが通り、必須tarballパス（`public/slidev-kit/pipeline.svg` と `node_modules/slidev-core/public/slidev-kit/pipeline.svg`）の存在を確認。成果物は `dist/phase2-distribution/fixed/`。
- 上記はCLI tarball assetとinstalled Slidev buildの検証であり、`slidev-kit build` のE2EやRelease URL経由の導入検証ではない。

## 調査済みの現状（2026-11-03 着手前の記録。パス移動後は上記「実装済みの進捗」を優先する）

- 実体は `packages/core/components/`。ルート `components/` はそこへのシンボリックリンク。他のテーマ資産も `scripts/sync-theme.mjs` がpostinstallでリンクする。
- ルート `package.json` は開発環境・GitHub経由のCLI入口・Slidevテーマを兼ねる。名前は `slidev-kit`、private。`packages/cli/package.json` も同名。npm workspacesは未設定。
- ルートは内部パッケージを `file:packages/...` で参照し、PiとMCP SDKにも直接依存する。
- `packages/core/` はVueレイアウト・デザイン・レジストリ・Vite設定と、Node.jsのinit・検査・雛形を混在させている。
- `packages/cli/scripts/prepack.mjs` は兄弟パッケージをCLI配下 `node_modules/` へコピーし、coreのテーマ資産をCLI直下にもコピーする。
- `packages/cli/bin/cli.mjs` と `packages/core/vite.config.ts` は、開発・GitHub・同梱配布の配置差を吸収するフォールバックやパス探索を持つ。
- `packages/runner/` はSlidev起動・設定・PDFなどのCLIワークフロー。`packages/charts/` はVue部品とViteプラグイン。
- 現在はPhase 1直後ではない。公開レイアウトは17 ID、Corporate / Editorial、共有入力契約など後続変更が入っている。移行対象は最新コードを基準にする。

## 提案：4パッケージへ整理（2026-11-03 着手前の提案。履歴として保持）

以下は着手前の提案であり、現行構成は「単一ソース構成」「実装済みの進捗」を正とする。実装との差分は、`packages/core` に Node 側機能（init / 検査 / 雛形）が残ること、`packages/runner` が独立して残ること、ルートが Pi/MCP へ直接依存したままであること。

```text
slidev-kit/
├── package.json                 # 開発専用private + npm workspaces
├── package-lock.json
├── packages/
│   ├── theme/                   # Slidev表示機能
│   │   ├── package.json         # slidev-theme-kit は名称案
│   │   ├── layouts/
│   │   ├── components/
│   │   ├── composables/
│   │   ├── designs/
│   │   ├── styles/              # 必要な場合のみ。無意味な再配置はしない
│   │   ├── registry/
│   │   ├── setup/
│   │   ├── public/
│   │   └── vite.config.ts
│   ├── cli/                     # slidev-kit：init/check/preview/build/export
│   │   ├── bin/
│   │   ├── src/
│   │   │   ├── init/
│   │   │   ├── check/
│   │   │   └── workflow/
│   │   └── templates/
│   ├── agent/                   # オプションAI支援
│   └── mcp/                     # オプションMCP連携
├── catalog/
├── examples/
├── scripts/                     # 開発用生成・検証のみ
└── docs/
```

### 移動の考え方

| 現在 | 移行先案 |
|---|---|
| coreの表示資産・レジストリ・デザイン契約 | theme |
| coreのinit・Node側検査・雛形 | cli |
| runner | cli/src/workflow/へ統合 |
| charts | 当面theme内の機能へ統合 |
| agent / mcp | オプションとして独立維持 |
| ルートのテーマ用リンク | 利用先切替と互換確認後に廃止 |

- chartsは現状テーマとの結合が強く、独立配布の要件が確認できていないため統合を提案。実際の外部利用があれば再検討する。
- rootとcliの同名workspace衝突を避け、ルート名を開発用の別名へ変更する必要がある。
- themeはCLI・AI・MCPへ依存しない。通常のSlidevだけで表示・PDFができることを維持する。
- CLIはthemeの公開レジストリを参照。agent/mcpは必要なCLI公開APIへ依存し、CLIからAI/MCPへの必須依存をなくす。公開API境界は移行前に棚卸しする。
- workspace内も公開exports経由の依存とし、兄弟ディレクトリへの実装直接参照は段階的に解消する。
- 共通スキーマだけの新パッケージなど、先行した細分化はしない。

## 未決事項（配布方針は確定済み。以下は引き続き要確認）

1. **公開名とバージョン運用**：`slidev-theme-kit` 等の名称、公開範囲、バージョン管理。Release tag（`v0.2.2` 形式）とtarball名の運用も未確定。themeは現状 `slidev-theme-workspace`（private, 0.1.0）のままで、名前の空きや公開権限も未確認。
2. **互換性**：既存 `slidev-kit/components/*` 等のexports、theme/addonの利用方法、外部デザイン、GitHubテンプレート、agent/mcpの起動方法をどこまで維持するか。
3. **charts独立性**：他プロジェクトの直接利用がないか。現状は `packages/theme/charts` に実体があり、CLI tarball には `node_modules/slidev-charts` として同梱する。独立配布する要件は未確認。
4. **AI/MCP移行**：オプションパッケージのインストール・発見・未導入時の案内と、既存CLIサブコマンドの互換入口。
5. **リリース運用**：GitHub Releaseの作成手順・自動化・承認フロー。公開リリースの作成・upload・tagは未実施（方針決定とローカルpack検証まで）。
6. **未実行の検証**：実ブラウザ・PDFの全検証（`phase1:browser` / `phase2:browser` / `phase2:expansion:browser` / `verify-legacy-browser`）は未実行（パス参照は `packages/theme` へ更新済み）。GitHub Release URL からの実導入検証（release の `.tgz` を使った install / build）も未実施。

未実行の検証と未決の判断は区別して扱う。未実行は「実ブラウザ・PDFの全検証」「GitHub Release URL からの導入検証」「リリース作成・upload・tag」の3点。未決は上記1〜5の公開前判断事項。

これらを勝手に確定せず、まずユーザーと合意する。リンク廃止・コピー生成物削除などの破壊的操作は影響を説明して確認する。リリース作成・公開も同様に明示承認を得る。

## 段階的な移行案

### 0. ベースラインと公開契約を固定

- 最新のmanifest、exports、import、テーマ設定、配布スクリプト、生成スクリプト、テストの依存を棚卸し。
- README、examples、docs、スキル等に残る旧パスも調査する。
- 現行の単体/型/カタログ/インベントリ/各phase/配布/旧デザイン検証を実行し、結果を保存。
- 配布方針は確定済み（GitHub Release asset）。互換性範囲の確認は継続する。

### 1. テーマの実体を独立

- coreから表示資産とレジストリをthemeへ分離。
- デッキのテーマ参照、Viteの解決、tsconfig、生成・検証スクリプトを更新。
- rootリンクをいきなり消さず、参照先の移行と実表示・PDF・外部デザインを確認。
- 進捗：表示資産・レジストリ・chartsの `packages/theme` 移動は完了し、ルート/互換リンクも削除済み（「単一ソース構成」参照）。実ブラウザ・PDFでの全検証は未実行。

### 2. Node.js側をCLIへ集約

- init・検査・雛形・runnerをCLIへ集約。
- 現在共有されている入力契約を保ち、検査を二重実装しない。
- CLIからPi/MCPの必須依存を切り離し、agent/mcp側へ移す。
- 旧デッキ・現行Kitデッキ・各CLIコマンドの互換検証を実施。
- 進捗：未実施。init・検査・雛形は `packages/core` に残り、`packages/runner` も独立、Pi/MCPへの依存もルートに残る。

### 3. workspaceと配布を整備

- ルートを開発専用へ変更し、workspaceとlockfileを正規化。
- 確定したGitHub Release asset配布（バージョン付き `.tgz`）に合わせてコピー式prepackとパス探索を置換。置換先が動く前に旧経路を削除しない。
- リポジトリのリンクで偶然動く状態を避け、隔離pack/install環境で確認。
- 進捗：prepack/postpackの同梱対象と後始末を修正し、隔離pack/installでCLI tarballのCorporate / Editorial buildを確認済み。ルートのworkspace化（`slidev-kit-workspace`、`workspaces: ["packages/*", "packages/theme/charts"]`）とlockfile正規化も完了。GitHub Release URL からの導入検証は未実施。

### 4. 互換入口の廃止とドキュメント更新

- 合意した互換期間・範囲に従って旧リンク・フォールバックを削除。
- README・カタログ・examples・CI・開発メモリを更新。
- 段階ごとに変更ファイル・実行結果・残る互換リスクを報告する。
- 進捗：ルート/互換リンク・`packages/charts`・`scripts/sync-theme.mjs`・postinstall を削除し、リポジトリルートからの直接導入と `theme: ../../` の root 解決はサポート外とした。README・カタログ・examples・docs・開発メモリは `packages/theme` 基準へ更新済み。

## 必須の検証・完了条件

- rootにテーマ資産のリンクやコピーを置かず、通常のSlidevプロジェクトとしてプレビュー・ビルド・PDFが動く。
- Markdownのみの執筆、現在の公開17 ID、Corporate / Editorial、旧デザインと外部デザインを壊さない。
- AI/MCP未導入で基本機能が動作し、不要なAI依存が通常利用へ入らない。
- `npm run verify`、`catalog:check`、`inventory:check`、各phaseの入力検査を維持。実行対象は最新package.jsonで確認。
- 実ブラウザ・PDF・配布tarball・既存init/build/MCPのE2Eを用途に応じて実行。生成成功だけで検証済みにしない。
- 検証のassertや対象を弱めて移行を通さない。失敗・未実施・既知の診断を明記する。
- 配布検証は隔離環境で実行。実作業ツリー内のCLI prepack/postpackはコピー・削除副作用があるため注意。
- 検証成果物の最新判定はrun別のreportとlatest.jsonの成功状態で行い、過去成功を流用しない。

## 関連する確定事項と読み始める場所

- [レイアウトフォルダ再編](2026-11-03-folder-restructure.md)：公開17 ID、extras、KitSlideの現行配置。ここでの「ルートリンク維持」は当時の再編範囲における判断で、互換リンクは単一ソース化（2026-11-03）で削除済み。
- [CLI入力契約](2026-11-03-cli-contract.md)：Corporate / Editorialと旧デザインの検査互換、slot構文、検証成果物管理。維持する。
- [配布・旧デザイン](2026-11-03-distribution-legacy.md)：画像同梱やprepackの注意点。記載の旧CLI不整合は後続CLI契約作業で修正済みのため、両記録を読む。
- `package.json` と `packages/*/package.json`
- （削除済み）`scripts/sync-theme.mjs`、ルートsymlink、`packages/core` / `packages/charts` の互換リンク
- `packages/cli/scripts/prepack.mjs` / `packages/cli/scripts/postpack.mjs`
- `packages/cli/bin/cli.mjs`
- `packages/theme/vite.config.ts`
- `packages/theme/package.json` / `packages/theme/charts/`
- `packages/core/lib/deck-contract.mjs`
- `scripts/e2e.mjs` と `scripts/phase2/` の配布・旧デザイン・CLI検証。配布検証は `scripts/phase2/verify-cli-distribution.mjs`

**次セッションの最初の作業**：未コミット差分と上記文書を確認する。単一ソース化・workspace化・互換入口の削除は実装・検証済みのため再計画しない。残るのは、未決の公開前判断事項（公開名とバージョン運用・互換性範囲・charts独立性・AI/MCP移行・リリース運用）の合意と、未実行の検証（実ブラウザ・PDFの全検証、GitHub Release URL からの導入検証）、および未実施のリリース作成・upload・tag である。配布方針（GitHub Release asset）と単一ソース構成は確定済みだが、公開リリースの作成・upload・tag はユーザーの明示指示があるまで行わない。
