# CLI入力契約と検証成果物管理

- Kit入力検査を `packages/core/lib/deck-contract.mjs` へ抽出し、authoringと公開CLIで共有。Corporate/EditorialのみMarkdown H1・registry契約、旧デザインは従来title/密度/slot検査を維持する。
- Slidev peerからparser/Markdown parserを解決する。検証版は53.0.0、別版のtransitive API互換性は未保証。API不在時は明示失敗する。
- 隔離tarballの実 `slidev-kit build` は両preset10枚で成功、不正layout/variant/density/assetは拒否。theme defaultsとheadmatterの優先順位を回帰検査。
- 親でも `npm run verify`（20ファイル107テスト＋型検査）、`catalog:check`（22ファイル）、`phase1:check`、`phase2:check` を再実行して成功。
- 配布・legacy・実CLIの検証はrun別出力へ保存。最新成功は `latest.json` のsuccess状態とreport参照で判断する。失敗/強制終了後に過去の成功成果物を最新と誤認しない。
- 独立レビューP2のslot構文不一致を修正。Slidev53同等のblock ruleで空白付き/空行なしのmarkerを認識し、必須slotの空判定は次markerで停止する。fence/コード内markerは無視する。CLI回帰6件とinstalled Slidev実pluginのrender照合9件を追加。
- 修正後に対象3ファイル47テスト、`npm run verify`（20ファイル122テスト＋型検査）、`catalog:check`（22ファイル）、`phase1:check`、`phase2:check`、隔離tarball実CLIを再実行して全成功。最新CLI runは `dist/phase2-cli-kit/runs/2026-11-02T16-04-00.924Z-e231bdbc/`。
- 詳細・実行コマンド・成果物・限界は [検証記録](../phase2/cli-contract-verification.md)。関連索引は接続済み。限定再レビューでslot P2解消と新規の確実なP1/P2なしを確認。親でも修正後122テスト・型検査・カタログ・両phaseチェックを再実行して成功。7ID拡充は次段階。
