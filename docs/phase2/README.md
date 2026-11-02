# Phase 2 第1段階: Corporate / Editorial

## 仕様・受け入れ条件

- 公開10IDと本文・slot・layout.variant・density契約はPhase1のまま。40ID化、Talk、AI/GUIは対象外。
- デッキの `themeConfig.variant: corporate | editorial` が共通KitSlide構造を選ぶ。Editorialは白地・墨色・朱色。見出し/余白/密度は共通、色と装飾はpreset別。
- `cover/content/comparison` はdefault/mono/dark/custom時の旧実装を維持。残り7IDは従来通りKitSlideを使い、未対応デザインではCorporateにフォールバックする。
- presetの判定とフォールバックを単一モジュールに集約。Mermaidも同じdata-design付きtoken参照を使う。
- Corporateの既存本文、catalog、previewは変更しない。Editorialサンプルは同じレジストリから生成する。
- 単体テスト、verify、catalog/phase1/phase2チェック、両サンプルbuild、実Chromiumの両preset全10枚と全variant/density、可能ならPDFを検証する。成果物はdist/phase2-verificationへ隔離する。

## 利用

`examples/phase2/slides.md` を参照。本文を変えず、headmatterの `themeConfig.variant` を `editorial` に設定する。スライド直下の `variant` は構造の選択（balanced/left/right等）でありデザイン名ではない。

- `npm run phase2:check`: 生成サンプルとデッキ契約を検査
- `npm run phase2:browser`: 両presetの実ブラウザ・PDF検証（既存previewは上書きしない）
