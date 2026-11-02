# 配布asset・旧デザイン互換確認

- Phase2第1段階後の配布懸念を隔離CLI tarballで再現。bundled core/publicにはpipeline.svgがあるがCLI root/publicがfiles whitelist外で、Corporate/Editorial各10枚のinstalled Slidev buildがENOENTになった。`packages/cli/package.json` のfilesにpublicのみ追加し修正。依存/lock/layout/registry/example/catalogは変更しない。
- 再実行: `node scripts/phase2/verify-cli-distribution.mjs --baseline` と同コマンドのflagなし。HEAD packagesをtmp展開し現在manifestを適用、隔離pack/install/build。実cwdのCLIでpackしない（prepack/postpackのコピー/削除副作用）。出力はdist/phase2-distribution。
- これはassetsとinstalled @slidev/cli buildの検証。`slidev-kit build` は旧checkerがKitのheading title / density:normal / theme画像パスを拒否する既存不整合があり、E2E成功とは扱わない。親合意で別課題。7ID追加前に入力契約整合の対応要否を検討する。
- `node scripts/phase2/verify-legacy-browser.mjs`: default/mono/dark/custom acme × cover/content/comparison/summary/endを実Chromiumで確認。旧branch・本文/slot/props・palette・custom header、予期しないerrorなし、20枚PNG。acme designsはexamples/design-contractからコピー。fixture内local package symlinkでVue型解決を満たす。成果物はdist/phase2-legacy。pixel golden比較/旧全layout網羅ではない。
- verify: 18 files / 84 tests + 型検査、catalog:check 22ファイル、phase1:check / phase2:check成功。
- 40候補と次の7IDはこの作業では未実装。registryには検証済IDだけを登録する。詳細と既存checker再現: [検証記録](../phase2/distribution-legacy-verification.md)。
