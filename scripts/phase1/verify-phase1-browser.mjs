import assert from 'node:assert/strict'
import { spawn } from 'node:child_process'
import { createServer } from 'node:net'
import { mkdirSync, readFileSync, writeFileSync } from 'node:fs'
import { join } from 'node:path'
import { setTimeout as delay } from 'node:timers/promises'
import { chromium } from 'playwright-chromium'
import { PDFDocument } from 'pdf-lib'
import { phase1Registry as registry, root } from './phase1-lib.mjs'

// A dedicated server means this check does not depend on a manually started dev session.
const socket = createServer()
await new Promise(resolve => socket.listen(0, '127.0.0.1', resolve))
const port = socket.address().port
await new Promise(resolve => socket.close(resolve))
const cli = join(root, 'node_modules/@slidev/cli/bin/slidev.mjs')
const outputDir = join(root, 'dist/phase1-verification')
mkdirSync(outputDir, { recursive: true })
mkdirSync(join(root, 'catalog/previews'), { recursive: true })
let serverLog = ''
const server = spawn(process.execPath, [cli, 'examples/phase1/slides.md', '--port', String(port)], { cwd: root, stdio: ['ignore', 'pipe', 'pipe'] })
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
    const slide = page.locator(`.kit-slide[data-layout="${layout.id}"]`)
    await slide.waitFor({ state: 'visible' })
    await page.evaluate(() => document.fonts.ready)
    if (layout.id === 'chart') await slide.locator('.mermaid svg').waitFor()
    if (layout.id === 'visual') await page.waitForFunction(() => [...document.querySelectorAll('img')].every(img => img.complete && img.naturalWidth > 0))
    await delay(400)
    assert.equal(await slide.locator('h1').count(), 1, `${layout.id}: exactly one visible title`)
    assert.equal(await slide.getAttribute('data-overflow'), 'false', `${layout.id}: overflow`)
    assert.equal(await slide.locator('.kit-panel').count(), layout.slots.length, `${layout.id}: panels`)
    for (const panel of await slide.locator('.kit-panel').all()) assert((await panel.innerText()).trim().length > 0)
    if (layout.id === 'table') assert.equal(await slide.locator('tbody tr').count(), 4)
    if (layout.id === 'roadmap') assert.equal(await slide.locator('tbody tr').count(), 3)
    const text = await slide.innerText()
    assert(!text.includes('Syntax error') && !text.includes('An error occurred'), `${layout.id}: renderer error`)
    await slide.screenshot({ path: join(root, layout.preview) })
    async function checkChart() {
      if (layout.id !== 'chart') return
      const svg = await slide.locator('.mermaid svg').boundingBox()
      const title = await slide.locator('h1').boundingBox()
      const source = await slide.locator('blockquote').boundingBox()
      assert(svg && title && source, 'Chart boxes missing')
      assert(svg.y >= title.y + title.height, 'Chart overlaps title')
      assert(svg.y + svg.height <= source.y, 'Chart overlaps source')
      // Mermaid uses a shadow root; document.querySelectorAll cannot inspect its SVG.
      const fill = await slide.locator('.mermaid svg rect').last().getAttribute('fill')
      assert.equal(fill?.toLowerCase(), '#007c83', 'Chart must use Corporate token color')
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
    results.push({ id: layout.id, preview: layout.preview, variants: layout.variants, densities: layout.density })
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
  await run(['export', 'examples/phase1/slides.md', '--output', pdfPath, '--wait', '1000', '--timeout', '120000'])
  const pdf = await PDFDocument.load(readFileSync(pdfPath))
  assert.equal(pdf.getPageCount(), registry.length, 'PDF page count')
  for (const [index, page] of pdf.getPages().entries()) {
    const { width, height } = page.getSize()
    assert(Math.abs(width / height - 16 / 9) < .01, `PDF page ${index + 1}: aspect ratio`)
    assert(page.node.Contents(), `PDF page ${index + 1}: empty content`)
  }
  const report = { slides: results, pdf: { path: 'dist/phase1-verification/catalog.pdf', pages: pdf.getPageCount(), aspectRatio: '16:9' }, overflowWarningTest: 'passed; input preserved', unexpectedBrowserErrors: failures, upstreamDiagnostics: [...upstreamDiagnostics] }
  writeFileSync(join(outputDir, 'report.json'), JSON.stringify(report, null, 2) + '\n')
  console.log(JSON.stringify(report, null, 2))
} finally {
  await browser?.close()
  server.kill('SIGTERM')
  writeFileSync(join(outputDir, 'dev-server.log'), serverLog)
}
