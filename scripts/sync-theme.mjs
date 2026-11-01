// git URLインストール（npx github:）ではリポジトリルートが slidev-kit のテーマルートになる。
// テーマ資産をルート直下へシンボリックリンクする（npm パッケージ版は packages/slidev-kit 直下に持つ）。
import { existsSync, mkdirSync, symlinkSync, rmSync } from 'node:fs'
import { join, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'

const root = resolve(fileURLToPath(new URL('..', import.meta.url)))
const source = join(root, 'packages', 'slidev-kit')
if (!existsSync(source)) process.exit(0)

for (const dir of ['layouts', 'interface', 'designs', 'components', 'composables', 'lib', 'setup', 'vite.config.ts']) {
  const target = join(root, dir)
  if (existsSync(target)) continue
  symlinkSync(join('packages', 'slidev-kit', dir), target, process.platform === 'win32' ? 'junction' : 'dir')
}
