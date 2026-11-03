import assert from 'node:assert/strict'
import { spawn } from 'node:child_process'
import { createServer } from 'node:net'
import { mkdirSync, readFileSync, writeFileSync } from 'node:fs'
import { join, relative } from 'node:path'
import { setTimeout as delay } from 'node:timers/promises'
import { chromium } from 'playwright-chromium'
import { PDFDocument } from 'pdf-lib'
import { registry as publicRegistry, root, sampleDeck, slideTemplate } from '../phase1/phase1-lib.mjs'

const preset = process.argv.includes('--corporate') ? 'corporate' : 'editorial'
const expansion = process.argv.includes('--expansion')
const registry = expansion ? publicRegistry : publicRegistry.slice(0, 10)
import { startVerification } from './verification-run.mjs'
import { slideTokens } from '../../packages/core/lib/deck-contract.mjs'
const verification = startVerification(join(root, `dist/${expansion ? 'phase2-expansion' : 'phase2-verification'}/${preset}`))
const outputDir = verification.output
let deckPath = `examples/${preset === 'corporate' ? 'phase1' : 'phase2'}/slides.md`
let servedPath = deckPath
const matrix = []
if (expansion) {
  const main = sampleDeck(registry).replace('theme: ../../packages/theme', `theme: ${join(root, 'packages/theme')}`).replace('variant: corporate', `variant: ${preset}`)
  deckPath = join(outputDir, 'slides.md')
  writeFileSync(deckPath, main)
  for (const layout of registry.slice(10)) for (const variant of layout.variants) for (const density of layout.density) {
    matrix.push({ layout, variant, density, markdown: slideTemplate(layout).replace('density: normal', `density: ${density}`) })
  }
  const metrics = registry.find(x => x.id === 'metrics')
  const code = registry.find(x => x.id === 'code')
  const summary = registry.find(x => x.id === 'summary')
  matrix.push({ layout: summary, variant: 'balanced', density: 'normal', legacyTitle: true, markdown: '---\nlayout: summary\nvariant: balanced\ntitle: \u65e7\u5f62\u5f0f\u306e\u30bf\u30a4\u30c8\u30eb\ntakeaway: \u65e7\u5f62\u5f0f\u306e\u8981\u70b9\n---\n\n' })
  matrix.push({ layout: metrics, variant: 'balanced', density: 'normal', boundary: true, markdown: slideTemplate(metrics).replace('36 時間', '123,456 時間') })
  const lines = Array.from({ length: 14 }, (_, i) => `const value${i} = 'retained source line ${i}'`).join('\n')
  matrix.push({ layout: code, variant: 'balanced', density: 'normal', boundary: true, markdown: slideTemplate(code).replace(/```js\n[\s\S]*?```/, '```js\n' + lines + '\n```') })
  servedPath = join(outputDir, 'matrix.md')
  writeFileSync(servedPath, main + '\n' + matrix.map(x => x.markdown).join('\n'))
}

// A dedicated server means this check does not depend on a manually started dev session.
const socket = createServer()
await new Promise(resolve => socket.listen(0, '127.0.0.1', resolve))
const port = socket.address().port
await new Promise(resolve => socket.close(resolve))
const cli = join(root, 'node_modules/@slidev/cli/bin/slidev.mjs')
mkdirSync(outputDir, { recursive: true })
mkdirSync(join(outputDir, 'previews'), { recursive: true })
let serverLog = ''
const server = spawn(process.execPath, [cli, servedPath, '--port', String(port)], { cwd: root, stdio: ['ignore', 'pipe', 'pipe'] })
server.stdout.on('data', data => { serverLog += data })
server.stderr.on('data', data => { serverLog += data })
let browser
const failures = []
const upstreamDiagnostics = new Set()
const overflowWarnings = []
const results = []
async function run(args) {
  await new Promise((resolve, reject) => {
    const child = spawn(process.execPath, [cli, ...args], { cwd: root, stdio: 'inherit' })
    child.once('error', reject)
    child.once('exit', code => code === 0 ? resolve() : reject(new Error(`slidev ${args[0]} exited ${code}`)))
  })
}
try {
  let ready = false
  for (let i = 0; i < 120; i++) {
    try { if ((await fetch(`http://localhost:${port}/`)).ok) { ready = true; break } } catch {}
    if (server.exitCode !== null) throw new Error(`Dev server exited: ${serverLog}`)
    await delay(500)
  }
  assert(ready, `Dev server timeout: ${serverLog}`)
  browser = await chromium.launch({ headless: true })
  const context = await browser.newContext({ viewport: { width: 1440, height: 900 } })
  const page = await context.newPage()
  function capture(message) {
    // Slidev 53's upstream Twoslash patch and headless wake-lock are not rendering failures.
    // Keep them visible in the report; never ignore arbitrary console errors.
    if (message.startsWith('Failed to patch FloatingVue') || message === 'Wake Lock permission request denied') upstreamDiagnostics.add(message.split('\n')[0])
    else failures.push(message)
  }
  page.on('pageerror', error => capture(error.message))
  page.on('console', message => {
    if (message.type() === 'error') capture(message.text())
    if (message.type() === 'warning' && message.text().startsWith('[slidev-kit]')) overflowWarnings.push(message.text())
  })
  page.on('response', response => { if (response.status() >= 400) failures.push(`HTTP ${response.status()}: ${response.url()}`) })
  for (const [i, layout] of registry.entries()) {
    await page.goto(`http://localhost:${port}/${i + 1}`, { waitUntil: 'networkidle' })
    const slide = page.locator(`.kit-slide[data-layout="${layout.id}"]`).filter({ visible: true })
    await slide.waitFor({ state: 'visible' })
    await page.evaluate(() => document.fonts.ready)
    if (layout.id === 'chart') await slide.locator('.mermaid svg').waitFor()
    if (layout.id === 'visual') await page.waitForFunction(() => [...document.querySelectorAll('img')].every(img => img.complete && img.naturalWidth > 0))
    await delay(400)
    assert.equal(await slide.getAttribute('data-design'), preset)
    const colors = await slide.evaluate(el => ({
      background: getComputedStyle(el).backgroundColor,
      text: getComputedStyle(el).color,
      accent: getComputedStyle(el).getPropertyValue('--kit-accent').trim(),
    }))
    assert.equal(colors.background, 'rgb(255, 255, 255)')
    assert.equal(colors.text, preset === 'corporate' ? 'rgb(23, 43, 64)' : 'rgb(37, 37, 37)')
    assert.equal(colors.accent, preset === 'corporate' ? '#007c83' : '#c43c2f')
    assert.equal(await slide.locator('h1').count(), 1, `${layout.id}: exactly one visible title`)
    assert.equal(await slide.getAttribute('data-overflow'), 'false', `${layout.id}: overflow`)
    assert.equal(await slide.locator('.kit-panel').count(), layout.slots.length, `${layout.id}: panels`)
    for (const panel of await slide.locator('.kit-panel').all()) assert((await panel.innerText()).trim().length > 0)
    if (layout.id === 'table') assert.equal(await slide.locator('tbody tr').count(), 4)
    if (layout.id === 'roadmap') assert.equal(await slide.locator('tbody tr').count(), 3)
    const text = await slide.innerText()
    assert(!text.includes('Syntax error') && !text.includes('An error occurred'), `${layout.id}: renderer error`)
    const screenshot = await slide.screenshot({ path: join(outputDir, 'previews', `${layout.id}.png`) })
    if (expansion && preset === 'corporate' && i < 10) {
      const baseline = readFileSync(join(root, 'catalog/previews', `${layout.id}.png`))
      const difference = await page.evaluate(async ({ actual, expected }) => {
        async function pixels(base64) {
          const image = new Image(); image.src = `data:image/png;base64,${base64}`; await image.decode()
          const canvas = document.createElement('canvas'); canvas.width = image.width; canvas.height = image.height
          const context = canvas.getContext('2d'); context.drawImage(image, 0, 0)
          return { width: image.width, height: image.height, data: context.getImageData(0, 0, image.width, image.height).data }
        }
        const a = await pixels(actual), b = await pixels(expected)
        if (a.width !== b.width || a.height !== b.height) return -1
        return a.data.reduce((count, value, index) => count + (value !== b.data[index] ? 1 : 0), 0)
      }, { actual: screenshot.toString('base64'), expected: baseline.toString('base64') })
      assert.equal(difference, 0, `${layout.id}: Corporate baseline pixel difference`)
    }
    if (expansion && i >= 10 && preset === 'corporate') writeFileSync(join(root, layout.preview), screenshot)
    if (expansion && i >= 10) await checkExpansion(slide, layout)

    async function checkChart() {
      if (layout.id !== 'chart') return
      const svg = await slide.locator('.mermaid svg').boundingBox()
      const title = await slide.locator('h1').boundingBox()
      const source = await slide.locator('blockquote').boundingBox()
      assert(svg && title && source, 'Chart boxes missing')
      assert(svg.y >= title.y + title.height, 'Chart overlaps title')
      assert(svg.y + svg.height <= source.y, 'Chart overlaps source')
      // Inspect rendered labels inside Mermaid's shadow root, not only its outer box.
      const labels = await slide.locator('.mermaid svg text').evaluateAll(elements => elements.map(el => {
        const rect = el.getBoundingClientRect()
        return { text: el.textContent.trim(), x: rect.x, y: rect.y, right: rect.right, bottom: rect.bottom }
      }).filter(label => label.text))
      assert(labels.length >= 6, 'Missing chart labels')
      assert.equal(new Set(labels.map(label => label.text)).size, labels.length, 'Duplicate chart labels')
      for (let a = 0; a < labels.length; a++) for (let b = a + 1; b < labels.length; b++) {
        const first = labels[a], second = labels[b]
        const overlap = Math.min(first.right, second.right) - Math.max(first.x, second.x) > 1
          && Math.min(first.bottom, second.bottom) - Math.max(first.y, second.y) > 1
        assert(!overlap, `Chart labels overlap: ${first.text}/${second.text}`)
      }
      // Mermaid uses a shadow root; document.querySelectorAll cannot inspect its SVG.
      const fill = await slide.locator('.mermaid svg rect').last().getAttribute('fill')
      assert.equal(fill?.toLowerCase(), preset === 'corporate' ? '#007c83' : '#c43c2f', 'Chart must use preset token color')
    }
    await checkChart()
    // Exercise all supported variants and densities against the real DOM with unchanged content.
    // Vue's inputs are already schema-tested; these attributes select the CSS structures directly.
    for (const variant of layout.variants) {
      for (const density of layout.density) {
        await slide.evaluate((el, values) => {
          el.dataset.variant = values.variant; el.dataset.density = values.density
        }, { variant, density })
        await delay(220)
        assert.equal(await slide.innerText(), text, `${layout.id}: content changed`)
        const outside = await slide.evaluate(el => {
          const bounds = el.getBoundingClientRect()
          return [...el.querySelectorAll('.kit-region, .kit-region *')].filter(child => {
            const rect = child.getBoundingClientRect()
            return rect.bottom > bounds.bottom + 2 || rect.right > bounds.right + 2 || rect.left < bounds.left - 2 || rect.top < bounds.top - 2
          }).map(el => el.tagName)
        })
        assert.deepEqual(outside, [], `${layout.id}/${variant}/${density}: out of bounds`)
        await checkChart()
      }
    }
    results.push({ id: layout.id, colors, chartLabels: layout.id === 'chart' ? 'unique; no pairwise overlap; title/source separated' : undefined, combinationsChecked: layout.variants.length * layout.density.length, preview: relative(root, join(outputDir, 'previews', `${layout.id}.png`)), variants: layout.variants, densities: layout.density })
  }
  async function checkExpansion(slide, layout) {
    const boxes = await slide.locator('.kit-panel').evaluateAll(elements => elements.map(el => {
      const r = el.getBoundingClientRect(); return { x: r.x, y: r.y, right: r.right, bottom: r.bottom, text: el.innerText.trim() }
    }))
    for (let a = 0; a < boxes.length; a++) for (let b = a + 1; b < boxes.length; b++) {
      const x = boxes[a], y = boxes[b]
      assert(!(Math.min(x.right, y.right) - Math.max(x.x, y.x) > 1 && Math.min(x.bottom, y.bottom) - Math.max(x.y, y.y) > 1), `${layout.id}: panels overlap`)
      assert.notEqual(x.text, y.text, `${layout.id}: duplicated slot`)
    }
    const tokens = slideTokens({ content: layout.markdown })
    const normalize = value => value.replace(/\\\s+/g, ' ').replace(/\s+/g, ' ').trim()
    for (let index = 0; index < layout.slots.length; index++) {
      assert(boxes[index].text, `${layout.id}: empty slot`)
      const start = tokens.findIndex(token => token.type === 'slot_marker' && token.meta.slotName === layout.slots[index].name)
      const end = tokens.findIndex((token, i) => i > start && token.type === 'slot_marker')
      const expected = tokens.slice(start + 1, end < 0 ? undefined : end).filter(token => ['inline', 'fence'].includes(token.type)).map(token => token.content).join(' ')
      assert.equal(normalize(boxes[index].text), normalize(expected), `${layout.id}/${layout.slots[index].name}: slot content changed`)
      if (index) assert(boxes[index].y > boxes[index - 1].y || boxes[index].x > boxes[index - 1].x, `${layout.id}: order`)
    }
    if (layout.id === 'agenda') { assert.equal(await slide.locator('ol').count(), 1); assert.equal(await slide.locator('ol > li').count(), 4) }
    if (layout.id === 'quote') assert.equal(await slide.locator('blockquote').count(), 1)
    if (layout.id === 'metrics') {
      assert.equal(await slide.locator('h2').count(), 3)
      assert(await slide.locator('h2').first().evaluate(el => parseFloat(getComputedStyle(el).fontSize) > parseFloat(getComputedStyle(el.parentElement).fontSize)))
    }
    if (layout.id === 'process') assert.deepEqual(await slide.locator('.kit-panel h2').allTextContents(), ['対象を決める', '小さく試す', '結果を判断する'])
    if (layout.id === 'code') assert.equal(await slide.locator('pre').count(), 1)
    if (!layout.slots.length) {
      const text = (await slide.innerText()).replace(/\s+/g, ' ')
      const plain = value => value.replace(/\[([^\]]+)\]\([^)]*\)/g, '$1').replace(/[*_`#>]/g, '').replace(/\\\s+/g, ' ').replace(/\s+/g, ' ').trim()
      for (const token of tokens.filter(token => token.type === 'inline')) {
        const line = plain(token.content)
        if (line.length > 3) assert(text.includes(line.slice(0, Math.min(12, line.length))), `${layout.id}: body text missing ${line.slice(0, 12)}`)
      }
    }
  }
  for (const [index, item] of matrix.entries()) {
    await page.goto(`http://localhost:${port}/${registry.length + index + 1}`, { waitUntil: 'networkidle' })
    const slide = page.locator(`.kit-slide[data-layout="${item.layout.id}"]`).filter({ visible: true })
    await slide.waitFor({ state: 'visible' }); await page.evaluate(() => document.fonts.ready); await delay(400)
    assert.equal(await slide.getAttribute('data-variant'), item.variant)
    assert.equal(await slide.getAttribute('data-density'), item.density)
    assert.equal(await slide.getAttribute('data-overflow'), 'false', `${item.layout.id}/${item.density}: frontmatter overflow`)
    const body = item.markdown.replace(/^---\n[\s\S]*?\n---\n/, '')
    if (item.legacyTitle) {
      assert(overflowWarnings.some(w => w.includes('is ignored in the kit preset')), 'kit preset did not warn about legacy frontmatter')
      const legacyText = (await slide.locator('.kit-body').innerText()).trim()
      assert.equal(legacyText, '', `legacy frontmatter rendered unexpected content: ${JSON.stringify(legacyText)}`)
    } else await checkExpansion(slide, { ...item.layout, markdown: body })
    if (item.boundary) {
      const text = await slide.innerText()
      if (item.layout.id === 'metrics') assert(text.includes('123,456 時間'))
      else for (let line = 0; line < 14; line++) assert(text.includes(`const value${line} = 'retained source line ${line}'`))
      await slide.screenshot({ path: join(outputDir, `boundary-${item.layout.id}.png`) })
    }
  }
  // Prove the runtime warning works, and that content is not silently removed/shrunk.
  await page.goto(`http://localhost:${port}/3`, { waitUntil: 'networkidle' })
  const content = page.locator('.kit-slide[data-layout="content"]')
  await content.evaluate(el => {
    const p = document.createElement('p')
    p.textContent = 'はみ出し検査のための長文。'.repeat(500)
    el.querySelector('.kit-intro').append(p)
  })
  await page.waitForFunction(() => document.querySelector('.kit-slide[data-layout="content"]')?.getAttribute('data-overflow') === 'true')
  assert((await content.innerText()).includes('はみ出し検査のための長文。'.repeat(500)))
  assert(overflowWarnings.some(w => w.includes('content overflows')), 'Missing overflow warning')
  assert.deepEqual(failures, [], 'Unexpected browser errors')
  await browser.close(); browser = undefined
  // Export with Slidev's actual PDF path, then parse the result (not just a successful exit code).
  const pdfPath = join(outputDir, 'catalog.pdf')
  await run(['export', deckPath, '--output', pdfPath, '--wait', '1000', '--timeout', '120000'])
  const pdf = await PDFDocument.load(readFileSync(pdfPath))
  assert.equal(pdf.getPageCount(), registry.length, 'PDF page count')
  for (const [index, page] of pdf.getPages().entries()) {
    const { width, height } = page.getSize()
    assert(Math.abs(width / height - 16 / 9) < .01, `PDF page ${index + 1}: aspect ratio`)
    assert(page.node.Contents(), `PDF page ${index + 1}: empty content`)
    const contents = page.node.Contents()
    const streams = (typeof contents.asArray === 'function' ? contents.asArray() : [contents]).map(ref => pdf.context.lookup(ref))
    assert(streams.some(stream => stream.getContents().length > 0), `PDF page ${index + 1}: empty content stream`)
  }
  const report = { preset, actualFrontmatterCases: matrix.length, corporateBaseline: expansion && preset === 'corporate' ? '10 slides, zero differing pixel channels' : undefined, slides: results, pdf: { path: relative(root, pdfPath), pages: pdf.getPageCount(), aspectRatio: '16:9' }, overflowWarningTest: 'passed; input preserved', unexpectedBrowserErrors: failures, upstreamDiagnostics: [...upstreamDiagnostics] }
  writeFileSync(join(outputDir, 'report.json'), JSON.stringify(report, null, 2) + '\n')
  verification.succeed(report)
  console.log(JSON.stringify(report, null, 2))
} catch (error) {
  verification.fail(error)
  throw error
} finally {
  await browser?.close()
  server.kill('SIGTERM')
  writeFileSync(join(outputDir, 'dev-server.log'), serverLog)
}
