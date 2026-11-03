import assert from 'node:assert/strict'
import { spawnSync } from 'node:child_process'
import { cpSync, mkdirSync, mkdtempSync, readFileSync, realpathSync, rmSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { fileURLToPath } from 'node:url'
import { startVerification } from './verification-run.mjs'

const root = fileURLToPath(new URL('../../', import.meta.url))
const verification = startVerification(join(root, 'dist/phase2-cli-kit'))
const { output } = verification
const work = realpathSync(mkdtempSync(join(tmpdir(), 'slidev-kit-contract-')))
let sequence = 0
function run(command, args, cwd = work, expected = 0) {
  const result = spawnSync(command, args, { cwd, encoding: 'utf8', timeout: 240_000 })
  const log = `${++sequence}-${command.split('/').at(-1)}.log`
  writeFileSync(join(output, log), `${result.stdout ?? ''}\n${result.stderr ?? ''}`)
  assert.ifError(result.error)
  assert.equal(result.status, expected, `${command} ${args.join(' ')}: see ${log}\n${result.stdout}\n${result.stderr}`)
  return { ...result, log }
}
try {
  if (process.argv.includes('--fail-after-start')) throw new Error('Intentional verification failure')
  // Current working-tree sources, including uncommitted fixes. Never pack in the checkout.
  cpSync(join(root, 'packages'), join(work, 'packages'), {
    recursive: true,
    filter: path => !path.split('/').some(part => ['node_modules', '.slidev', 'dist', '__pycache__'].includes(part)),
  })
  const packedOutput = run('npm', ['pack', '--json', '--pack-destination', work], join(work, 'packages/cli')).stdout
  const packed = JSON.parse(packedOutput.slice(packedOutput.lastIndexOf('\n[') + 1))[0]
  const files = packed.files.map(file => file.path)
  for (const path of ['lib/deck-contract.mjs', 'node_modules/slidev-core/lib/deck-contract.mjs', 'node_modules/slidev-core/registry/layouts.json', 'public/slidev-kit/pipeline.svg', 'node_modules/slidev-core/public/slidev-kit/pipeline.svg']) assert(files.includes(path), `Missing published ${path}`)
  assert(!files.includes('registry/layouts.json'), 'Exercise the CLI-root registry fallback')
  writeFileSync(join(output, 'tarball-files.json'), JSON.stringify(files, null, 2) + '\n')
  const project = join(work, 'consumer')
  mkdirSync(project)
  const manifest = JSON.parse(readFileSync(join(root, 'package.json'), 'utf8'))
  writeFileSync(join(project, 'package.json'), JSON.stringify({ private: true, type: 'module', dependencies: {
    'slidev-kit': `file:${join(work, packed.filename)}`, '@slidev/cli': manifest.devDependencies['@slidev/cli'], vue: manifest.devDependencies.vue,
  } }))
  run('npm', ['install', '--no-audit', '--no-fund'], project)
  // Both copies of the shared checker must load the exact bundled registry.
  const registryProbe = `import assert from 'node:assert/strict';
    import { registry as rootRegistry } from './node_modules/slidev-kit/lib/deck-contract.mjs';
    import { registry as coreRegistry } from './node_modules/slidev-kit/node_modules/slidev-core/lib/deck-contract.mjs';
    assert.deepEqual(rootRegistry, coreRegistry);
    assert.deepEqual(rootRegistry, ${JSON.stringify(JSON.parse(readFileSync(join(root, 'packages/theme/registry/layouts.json'), 'utf8')))});
    console.log('checkout / CLI root / bundled core registries identical');`
  writeFileSync(join(project, 'registry-probe.mjs'), registryProbe)
  const probe = run(process.execPath, ['registry-probe.mjs'], project)
  const cli = join(project, 'node_modules/slidev-kit/bin/cli.mjs')
  const results = []
  for (const [preset, phase, count] of [['corporate', 'phase1', 10], ['editorial', 'phase2', 10], ['corporate-expansion', 'phase2-expansion', 17], ['editorial-expansion', 'phase2-expansion', 17]]) {
    const source = readFileSync(join(root, `examples/${phase}/slides.md`), 'utf8').replace('theme: ../../packages/theme', 'theme: slidev-kit').replace('variant: corporate', `variant: ${preset.startsWith('editorial') ? 'editorial' : 'corporate'}`)
    writeFileSync(join(project, `${preset}.md`), source)
    const check = run(process.execPath, [cli, 'build', `${preset}.md`, '--check-only'], project)
    assert.match(check.stdout, new RegExp(`${count} slides`))
    const build = run(process.execPath, [cli, 'build', `${preset}.md`, '--out', `dist/${preset}`], project)
    assert.match(build.stdout, new RegExp(`${count} slides`))
    assert(readFileSync(join(project, 'dist', preset, 'index.html'), 'utf8').includes('<html'))
    cpSync(join(project, 'dist', preset), join(output, preset), { recursive: true })
    const rejected = []
    for (const [kind, broken] of [
      ['layout', source.replace('layout: cover', 'layout: missing')],
      ['variant', source.replace('variant: balanced', 'variant: missing')],
      ['density', source.replace('density: normal', 'density: missing')],
      ['asset', source.replace('/slidev-kit/pipeline.svg', '/slidev-kit/missing.svg')],
    ]) {
      writeFileSync(join(project, 'invalid.md'), broken)
      const rejection = run(process.execPath, [cli, 'build', 'invalid.md'], project, 1)
      rejected.push({ kind, exitCode: rejection.status, log: rejection.log })
    }
    results.push({ preset, slides: count, checkExitCode: check.status, checkLog: check.log, buildExitCode: build.status, buildLog: build.log, rejected })
  }
  verification.succeed({ scope: 'Installed tarball, real slidev-kit build/check entry; isolated current-source pack', slidev: manifest.devDependencies['@slidev/cli'], registryProbe: probe.log, results })
  console.log(`CLI Kit contract passed: ${output}`)
} catch (error) {
  verification.fail(error)
  throw error
} finally {
  rmSync(work, { recursive: true, force: true })
}
