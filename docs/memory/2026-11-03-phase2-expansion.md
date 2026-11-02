# Phase2 第2段階：公開17ID

- 既存10ID/順序/本文/previewを固定し、agenda/summary/end/quote/metrics/process/codeを末尾追加。次候補9/保留14はregistry未登録。[40候補仕様](../phase2/layout-expansion-plan.md)。
- 全新IDはbalancedのみ、relaxed/normal/compact。標準Markdown/slots主体。summary/endはCorporate/EditorialのみKitSlideへ分岐し旧props/slotを温存。新規5IDはKit対象。共通DOM/footer/overflow/data属性維持、panel数=named slots数。
- `sampleDeck()`は既存10件を既定に固定。`sampleDeck(registry)`で`examples/phase2-expansion/slides.md`の17件を別生成。Phase1/Phase2旧例を変えない。
- 新IDだけH1ちょうど1/slotより前/slot実本文/固有構造を検査。既存10のchecker契約を無条件強化しない。情報量超過はruntime警告、削除/省略/自動縮小しない。
- 130 tests+型検査、catalog37生成一致、両17枚実Chromium/PDF成功。各69 CSS組合せ+21新実frontmatter+2境界。Corporate既存10pixel差0、legacy20例、隔離実CLI既存両10+拡張両17成功。
- PDF Contentsは単一stream/参照/arrayいずれも有効。lookup後に非空streamを検査する。工程矢印はpanelのscrollWidthを増やさないよう親grid疑似要素に置く。
- browserは`dist/phase2-expansion/{corporate,editorial}/runs/`へ隔離しverification-runでlatest管理。新7画像だけcatalogへ保存。過去failed runは残す。[検証記録/制約/最終run](../phase2/expansion-verification.md)。全PDF頁の画質完全保証はしていない。独立レビュー待ち。
