# Phase2第1段階：Corporate / Editorial

## 確定設計

- 対象は既存10IDのみ。40ID化、Talk、AI/GUIは非対象。
- `packages/core/designs/shared/{tokens,structure}.css` に寸法・密度・全構造、各presetにsemantic colors/font/radius/borderと装飾を配置。Corporateの全宣言を保持し、Editorialは白/墨/朱・二重罫線・角パネル。
- `packages/core/lib/kit-presets.mjs` が判定とCorporate fallbackの単一入口。`themeConfig.variant` はデザイン、スライドfrontmatter.variantは配置。
- cover/content/comparisonだけ旧実装との分岐あり、default/mono/dark/customは従来通り。残り7IDはKitSlide専用で両preset以外はCorporate fallbackを維持。
- useKitContextのreactiveなthemeConfigをそのままcomputed/テンプレートから参照。Designレジストリに両presetを追加、projectDesigns優先のVite検出は変更なし。Mermaid probeはdata-designを付け同tokenを取得する。

## 運用

- `examples/phase2/slides.md` はPhase1レジストリから生成する。同本文/slotでheadmatterのみEditorialに変更。
- 再生成: `node scripts/phase2/check-phase2.mjs --write`。検査: `npm run phase2:check`。
- `npm run phase2:browser` は両presetの成果物を `dist/phase2-verification/` 配下に隔離。既存 `phase1:browser` はcatalog previewを更新するため混同しない。
- ルートdesigns/components等はpackages/coreへのsymlinkであり、複製ではない。

## 検証確定値

- verify: 18ファイル84 tests・型検査成功。targeted12 tests、catalog22件、phase1/phase2 check、両build成功。
- Chromium両preset20枚・96構造/密度組、実SVGラベル非重複/色/境界、意図的overflow警告/入力保持成功。予期しないbrowser errorは0。
- PDFは両preset10ページ/16:9/content streamあり。Corporate全10枚は既存previewとRGBA完全一致（全て変更pixel 0）。
- 既存のSlidev FloatingVue/PopperとWake Lock診断のみ記録。許可リスト拡大なし。
- 代表Editorial cover/chart、Corporate comparisonを目視済み。詳細は [検証結果](../phase2/verification.md)。成果物はgit管理外。
- 独立レビューで今回差分に起因する修正必須の新規不具合なし。公開CLIのルートpublic収録と画像aliasの整合は既存の懸念として公開前のtarball/隔離build確認が必要。同一マウント後のpreset切替・Mermaid再描画、旧デザイン全体のブラウザ互換性は未検証。
