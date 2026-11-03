import assert from 'node:assert/strict'
import { spawnSync } from 'node:child_process'
import { cpSync, mkdirSync, mkdtempSync, readFileSync, realpathSync, rmSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { fileURLToPath } from 'node:url'
import { parse } from '@slidev/parser'
import { startVerification } from './verification-run.mjs'

const root = fileURLToPath(new URL('../../', import.meta.url))
const baseline = process.argv.includes('--baseline')
const verification = startVerification(join(root, 'dist/phase2-distribution', baseline ? 'baseline' : 'fixed'))
const { output } = verification
// macOS /var is a symlink; Vite/Rolldown need consistent real paths for HTML emission.
const work = realpathSync(mkdtempSync(join(tmpdir(), 'slidev-kit-distribution-')))
let sequence = 0
function run(command, args, cwd = work, expected = 0) {
  const result = spawnSync(command, args, { cwd, encoding: 'utf8', timeout: 240_000 })
  writeFileSync(join(output, `${++sequence}-${command.replaceAll('/', '_')}.log`), `${result.stdout ?? ''}\n${result.stderr ?? ''}`)
  assert.ifError(result.error)
  if (expected === 0) assert.equal(result.status, 0, `${command} ${args.join(' ')} failed: ${result.stderr}\n${result.stdout}`)
  return result
}
try {
  if (process.argv.includes('--fail-after-start')) throw new Error('Intentional verification failure')
  // Never execute lifecycle hooks in the real checkout: postpack deletes copied directories.
  // Test the current worktree sources (including uncommitted migration changes).
  cpSync(join(root, 'packages'), join(work, 'packages'), {
    recursive: true,
    filter: path => !path.split('/').some(part => ['node_modules', '.slidev', 'dist', '__pycache__'].includes(part)),
  })
  const cli = join(work, 'packages/cli')
  // Test the current whitelist fix against current sources, without untracked/generated files.
  const manifest = JSON.parse(readFileSync(join(root, 'packages/cli/package.json'), 'utf8'))
  if (baseline) manifest.files = manifest.files.filter(entry => entry !== 'public')
  writeFileSync(join(cli, 'package.json'), JSON.stringify(manifest, null, 2))
  const packOutput = run('npm', ['pack', '--json', '--pack-destination', work], cli).stdout
  const packed = JSON.parse(packOutput.slice(packOutput.lastIndexOf('\n[') + 1))[0]
  const files = packed.files.map(file => file.path)
  const asset = 'public/slidev-kit/pipeline.svg'
  assert.equal(files.includes(asset), !baseline, 'CLI root asset whitelist')
  assert(files.includes(`node_modules/slidev-core/${asset}`), 'Bundled core asset must exist')
  writeFileSync(join(output, 'tarball-files.json'), JSON.stringify(files, null, 2) + '\n')
  const project = join(work, 'consumer')
  mkdirSync(project)
  const rootPackage = JSON.parse(readFileSync(join(root, 'package.json'), 'utf8'))
  writeFileSync(join(project, 'package.json'), JSON.stringify({ private: true, type: 'module', dependencies: {
    'slidev-kit': `file:${join(work, packed.filename)}`,
    '@slidev/cli': rootPackage.devDependencies['@slidev/cli'], vue: rootPackage.devDependencies.vue,
  } }, null, 2))
  run('npm', ['install', '--no-audit', '--no-fund'], project)
  const results = []
  for (const preset of ['corporate', 'editorial']) {
    const source = readFileSync(join(root, `examples/${preset === 'corporate' ? 'phase1' : 'phase2'}/slides.md`), 'utf8')
    assert(source.includes('/slidev-kit/pipeline.svg'), 'Fixture must exercise the distributed image')
    const deck = source.replace('theme: ../../packages/theme', 'theme: slidev-kit')
    assert.equal((await parse(deck)).slides.length, 10, 'Distribution fixture must contain ten slides')
    const path = join(project, `${preset}.md`)
    writeFileSync(path, deck)
    // Deliberately test distributed theme assets via installed Slidev, not the legacy CLI checker.
    // See docs/phase2/distribution-legacy-verification.md for the separate checker contract mismatch.
    const build = run(process.execPath, [join(project, 'node_modules/@slidev/cli/bin/slidev.mjs'), 'build', `${preset}.md`, '--out', `dist/${preset}`], project, baseline ? 1 : 0)
    if (baseline) {
      assert.notEqual(build.status, 0, 'Missing root asset should break build')
      assert.match(build.stdout + build.stderr, /ENOENT[^\n]*public\/slidev-kit\/pipeline\.svg/, 'Failure must identify the missing fixture asset')
    } else {
      assert(readFileSync(join(project, 'dist', preset, 'index.html'), 'utf8').includes('<html'), 'Build must emit HTML')
      cpSync(join(project, 'dist', preset), join(output, preset), { recursive: true })
    }
    results.push({ preset, slides: 10, expectedFailure: baseline, exitCode: build.status })
  }
  verification.succeed({ scope: 'CLI tarball assets + installed Slidev build; not slidev-kit build E2E', baseline, asset, rootAssetPresent: files.includes(asset), results })
  console.log(`CLI distribution ${baseline ? 'baseline reproduced' : 'passed'}: ${output}`)
} catch (error) {
  verification.fail(error)
  throw error
} finally {
  rmSync(work, { recursive: true, force: true })
}
