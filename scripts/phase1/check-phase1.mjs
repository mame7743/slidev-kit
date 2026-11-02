import { readFileSync } from 'node:fs'
import { checkDeck } from './phase1-lib.mjs'

const files = process.argv.slice(2)
if (!files.length) files.push('examples/phase1/slides.md')
for (const file of files) {
  const errors = await checkDeck(readFileSync(file, 'utf8'), file)
  if (errors.length) { console.error(errors.join('\n')); process.exitCode = 1 }
  else console.log(`${file}: OK`)
}
