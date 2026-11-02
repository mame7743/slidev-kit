import assert from 'node:assert/strict'
import { readFileSync, writeFileSync, mkdirSync } from 'node:fs'
import { join } from 'node:path'
import { root, sampleDeck, checkDeck } from '../phase1/phase1-lib.mjs'

export function editorialDeck() {
  return sampleDeck().replace('variant: corporate', 'variant: editorial')
}
const path = join(root, 'examples/phase2/slides.md')
if (process.argv.includes('--write')) {
  mkdirSync(join(root, 'examples/phase2'), { recursive: true })
  writeFileSync(path, editorialDeck())
}
assert.equal(readFileSync(path, 'utf8'), editorialDeck(), 'Regenerate with node scripts/phase2/check-phase2.mjs --write')
assert.deepEqual(await checkDeck(readFileSync(path, 'utf8'), path), [])
console.log('Phase2: Editorial sample matches the original ten-layout fixture; deck contract passed.')
