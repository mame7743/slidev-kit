# CLI checker / Kit入力契約整合の検証（2026-11-03）

## 変更範囲

7ID拡充前の入力契約整合だけを実施した。layout、registry/schema、catalog、examples、依存manifest/lockには変更を加えない。既存のCLI配布public whitelist修正は保持する。

- `packages/core/lib/deck-contract.mjs` に既存Phase1のKit検査を抽出し、authoring側 `scripts/phase1/phase1-lib.mjs` と公開checkerから共有する。レイアウトID、構造variant、density、必須/許可slotは同じregistryから検査する。registryのschema検証は引き続きauthoringチェックで行う。
- Slidev peerから `@slidev/parser`（境界/YAML、`resolveConfig`）と `markdown-exit`（Slidevが使用するMarkdown-it互換parser）を解決する。devDependenciesだけにあるparserへ依存しない。実検証は **@slidev/cli 53.0.0**。transitive API不在/非互換時は明示エラーで失敗し、検査を無条件にスキップしない。別Slidev版すべての互換性は未保証。
- theme package.jsonの `slidev.defaults.themeConfig` < headmatter `config.themeConfig` < headmatter直下 `themeConfig` の優先順位をSlidevの `resolveConfig` で適用する。themeはローカル相対/絶対パス、`@/`、npm theme名から検索し、不明な指定themeを自動インストールしない。**consumerの任意のpackage defaultsではなく、選択themeのdefaults**が対象。
- 有効なthemeConfig.variantが `corporate` / `editorial` のときだけKit契約（Markdown H1、layout直下の構造variant、relaxed/normal/compact密度、registry slot）を適用する。default/mono/dark/customは従来title、presentation/hybrid/reading密度、slot検査を維持する。例文検査と `--samples` 例外、Chart/coverImage検査も維持する。
- `/slidev-kit/*` は実在するtheme public配布assetの場合だけ許可する。ユーザーpublicの既存画像も通す。未知のtheme asset、存在しないユーザーpublic画像・相対画像は拒否する。KitのMarkdown画像はtoken解析し、参照形式画像も検査し、fence内の画像・slot風文字列は解釈しない。
- CLI rootの公開filesにregistryはないため、共有helperは隣接registryがなければbundled `slidev-core/registry` を使う。既存prepack/filesを変えずに必要なhelper、bundled registry、public画像がtarballに入ること、checkout/CLI root/bundled coreのregistryが同一であることをE2Eでassertする。

## 実行結果

```sh
npx vitest run packages/core/tests/phase1.test.mjs packages/core/tests/phase2.test.mjs
npx vitest run packages/core/tests/check-cli.test.mjs
npm run verify
npm run catalog:check
npm run phase1:check
npm run phase2:check
node scripts/phase2/verify-cli-kit.mjs
node scripts/phase2/verify-cli-distribution.mjs
node scripts/phase2/verify-legacy-browser.mjs
```

- slot修正後の `verify`: **20 files / 122 tests成功**、`vue-tsc --noEmit` 成功（既存84件にCLI/parser regression 35件、artifact lifecycle regression 3件を追加）。対象3ファイル（CLI/Phase1/Phase2）は47 tests成功。
- `catalog:check`: 22生成ファイル一致。Phase1/Phase2の生成サンプル・契約検査成功。
- CLI regressionは `packages/cli/bin/cli.mjs build slides.md --check-only` 経由。Corporate/Editorialサンプル、未知layout/構造variant/density/slot、重複slot、必須slot欠落/空、fence内marker、H1（ATX/setext）、YAMLエラー、画像存在/不存在/参照形式、例文/サンプル例外、default/mono/dark/acmeのaccept/reject、theme defaultsとheadmatter優先順位を確認する。

### installed tarballの実CLI E2E

新 `scripts/phase2/verify-cli-kit.mjs` は**現在の作業ツリーのpackagesをtmpへコピー**し、そこでprepack/npm pack、別consumerへ通常のnpm installを行う。実checkoutでpack/lifecycle hookを実行しない。コピー時はnode_modules/dist等を除外し、既存 `dist/phase2-distribution/` は上書きしない。fixtureの変更はtheme指定を `slidev-kit` へ置換するだけ。

slot修正後の成功run: `dist/phase2-cli-kit/runs/2026-11-02T16-04-00.924Z-e231bdbc/`。最新状態は `dist/phase2-cli-kit/latest.json` を参照。

| preset | installed実入口 | 結果 | ログ |
| --- | --- | --- | --- |
| Corporate | `node node_modules/slidev-kit/bin/cli.mjs build corporate.md --check-only` | exit 0 / 10 slides | `4-node.log` |
| Corporate | `node node_modules/slidev-kit/bin/cli.mjs build corporate.md --out dist/corporate` | exit 0 / HTML生成 | `5-node.log` |
| Editorial | `node node_modules/slidev-kit/bin/cli.mjs build editorial.md --check-only` | exit 0 / 10 slides | `10-node.log` |
| Editorial | `node node_modules/slidev-kit/bin/cli.mjs build editorial.md --out dist/editorial` | exit 0 / HTML生成 | `11-node.log` |

同runに `report.json`、`tarball-files.json`、`3-node.log`（3箇所のregistry一致）、`corporate/`・`editorial/` Web buildを保存する。両presetとも未知layout/構造variant/density/assetを入れた `slidev-kit build invalid.md` がexit 1で停止することも確認する（`6`〜`9`、`12`〜`15-node.log`）。検査回避による成功ではない。tarballとconsumerは最後にcleanupする。

consumerはroot manifestのSlidev/Vue版を使うが、transitive依存はinstall時に解決する。checkout lockの完全再現試験ではない。PDF、全OS、全旧layout/props、任意本文overflow、Slidev全peer対応版、Slidevの外部 `src` スライド読み込みは今回の追加保証に含まない。

## 検証artifactのlifecycle改善

配布レビューの追加指摘に対応し、既存の配布/legacy検証にも共有 `scripts/phase2/verification-run.mjs` を適用した。

- 各baseの `runs/<run-id>/` にログ・HTML・PNGを隔離し、開始時に `latest.json` を `running` に原子的に更新する。
- 全assert成功後だけ `report.json` と `latest.status: success` のreport参照を発行する。例外時は `latest.status: failed` とエラーを記録し、以前の成功reportを参照しない。強制終了時はrunningのままであり成功を主張しない。
- 既存成果物を一括削除しない。固定パスの古い `report.json` 等は履歴であり、最新成功の根拠にしない。
- `verification-run.test.mjs` はtmp上で一度successを生成後、各3つの実検証スクリプトを `--fail-after-start` 付きで実行する。latestがfailedとなり、最新runに古いHTML/reportがなく、過去の成果物自体は保持されることをassertする。

lifecycle更新後の実再実行も成功:

- 配布asset: `dist/phase2-distribution/fixed/runs/2026-11-02T15-52-06.188Z-acfce899/`。Corporate/Editorialのinstalled **Slidev直接build** 成功（実Kit CLI経路の証拠は上の別run）。
- legacy browser: `dist/phase2-legacy/runs/2026-11-02T15-52-06.346Z-adfd9bbd/`。default/mono/dark/acme × cover/content/comparison/summary/end = 20ページ、本文・slot・palette・旧DOM・非Kit branch、予期しないbrowser errorなし。PNGは自動取得し、今回新たな目視/ピクセルgolden判定は行っていない。

## 独立レビューP2: Slidev slot構文との整合

通常Markdownのinline完全一致では、空白付き未知slotを見逃し、空行なしの正常なslotを拒否していた。共有helperへSlidev 53の `MarkdownItSlotSugar` と同じblock ruleを導入した。正規表現 `/^::\s*([\w.\-:]+)\s*::\s*$/`、indent判定、paragraph/reference/blockquote/listの中断規則はinstalled `node_modules/@slidev/cli/dist/serve-DzvJFv6v.mjs:2517-2536` に基づく。検査ではHTMLへ変換せずmarker tokenを保持し、次のmarkerまたは末尾に達した必須slotを空と判定する。

- CLI回帰を6件追加: 空行なし・空白付き正常slot、コード内marker、空白付き/名前中のdot・colonを含む未知slot、空行なしの重複slot、途中/末尾の空必須slot。
- installed Slidev bundleの実slot pluginを抽出し、同じpeerのMarkdown parserでHTML renderする構文照合を9件追加。生成された `<template v-slot:...>` と共有helperのmarker名/順序を比較する。空白、空行なし、dot/colon/hyphen、空/重複、fence/indented/inline code、indent付き行、通常文章を確認した。独自regex同士の比較ではない。private bundle構成変更時はこのテストも明示失敗する。
- 上記targeted tests、`verify`、`catalog:check`、`phase1:check`、`phase2:check` と隔離packのinstalled実CLI E2Eを再実行して全成功。画像/H1/旧デザイン/registry同期も既存回帰で成功した。配布asset・legacy browserの実行結果は前節の既存runを保持し、今回再実行していない。

`docs/phase2/README.md`、`docs/phase2/verification.md`、`scripts/README.md`、memoryおよびその索引から本記録への接続は更新済み。独立レビューP2修正を実装・検証済みで、再レビュー待ち。7ID拡充には未着手。
