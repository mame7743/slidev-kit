import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { join } from 'node:path'
import { root, registry, sampleDeck, checkDeck } from '../phase1/phase1-lib.mjs'

assert.equal(registry.length, 17)
assert.deepEqual(registry.slice(10).map(x => x.id), ['agenda', 'summary', 'end', 'quote', 'metrics', 'process', 'code'])
const source = readFileSync(join(root, 'examples/phase2-expansion/slides.md'), 'utf8')
assert.equal(source, sampleDeck(registry))
for (const preset of ['corporate', 'editorial']) {
  assert.deepEqual(await checkDeck(source.replace('variant: corporate', `variant: ${preset}`)), [])
}
console.log('Phase2 expansion: 17 layouts × 2 presets; generated sample and contracts passed.')
