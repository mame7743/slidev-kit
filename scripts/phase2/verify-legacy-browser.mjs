import assert from 'node:assert/strict'
import { spawn } from 'node:child_process'
import { createServer } from 'node:net'
import { cpSync, existsSync, mkdirSync, symlinkSync, writeFileSync } from 'node:fs'
import { join } from 'node:path'
import { fileURLToPath } from 'node:url'
import { setTimeout as delay } from 'node:timers/promises'
import { chromium } from 'playwright-chromium'
import { startVerification } from './verification-run.mjs'

const root = fileURLToPath(new URL('../../', import.meta.url))
const verification = startVerification(join(root, 'dist/phase2-legacy'))
const { output } = verification
let browser
const results = []
try {
  if (process.argv.includes('--fail-after-start')) throw new Error('Intentional verification failure')
  browser = await chromium.launch({ headless: true })
  for (const variant of ['default', 'mono', 'dark', 'acme']) {
    const cwd = join(output, variant)
    mkdirSync(cwd, { recursive: true })
    // Vue's SFC type resolver uses Node package resolution, not only Vite aliases.
    mkdirSync(join(cwd, 'node_modules'), { recursive: true })
    if (!existsSync(join(cwd, 'node_modules/slidev-kit'))) symlinkSync(root, join(cwd, 'node_modules/slidev-kit'), 'dir')
    if (variant === 'acme') cpSync(join(root, 'examples/design-contract/designs'), join(cwd, 'designs'), { recursive: true })
    writeFileSync(join(cwd, 'package.json'), JSON.stringify({ private: true, type: 'module' }))
    writeFileSync(join(cwd, 'slides.md'), `---
theme: ${root}
themeConfig:
  variant: ${variant}
  organization: Legacy Example
layout: cover
title: Legacy cover
subtitle: Legacy subtitle
fonts:
  sans: Arial
  local: Arial
---

Cover body preserved

---
layout: content
title: Legacy content
columns: 2
---

## Main body

Main content preserved

::second::

## Second slot

Second content preserved

---
layout: comparison
title: Legacy comparison
---

::left::

## Left slot

Left content preserved

::right::

## Right slot

Right content preserved

---
layout: summary
title: Legacy summary
takeaway: Legacy takeaway
---

Summary lead preserved

::evidence::

Evidence content preserved

::request::

Request content preserved

---
layout: end
title: Legacy end
subtitle: End subtitle preserved
note: End note preserved
---

End body preserved
`)
    const socket = createServer()
    await new Promise(resolve => socket.listen(0, '127.0.0.1', resolve))
    const port = socket.address().port
    await new Promise(resolve => socket.close(resolve))
    let log = ''
    const server = spawn(process.execPath, [join(root, 'node_modules/@slidev/cli/bin/slidev.mjs'), 'slides.md', '--port', String(port)], { cwd, stdio: ['ignore', 'pipe', 'pipe'] })
    server.stdout.on('data', data => { log += data })
    server.stderr.on('data', data => { log += data })
    const context = await browser.newContext({ viewport: { width: 1440, height: 900 } })
    try {
      let ready = false
      for (let i = 0; i < 120; i++) {
        try { if ((await fetch(`http://localhost:${port}/`)).ok) { ready = true; break } } catch {}
        assert.equal(server.exitCode, null, log)
        await delay(500)
      }
      assert(ready, `Server timeout: ${log}`)
      const page = await context.newPage()
      const errors = [], upstream = new Set(), slides = []
      function capture(message) {
        if (message.startsWith('Failed to patch FloatingVue') || message === 'Wake Lock permission request denied') upstream.add(message.split('\n')[0])
        else errors.push(message)
      }
      page.on('pageerror', error => capture(error.message))
      page.on('console', message => { if (message.type() === 'error') capture(message.text()) })
      page.on('response', response => { if (response.status() >= 400) errors.push(`HTTP ${response.status()}: ${response.url()}`) })
      const expected = [
        ['cover', 'Legacy cover', 'Legacy subtitle', 'Cover body preserved'],
        ['content', 'Legacy content', 'Main content preserved', 'Second content preserved'],
        ['comparison', 'Legacy comparison', 'Left content preserved', 'Right content preserved'],
        ['summary', 'Legacy summary', 'Legacy takeaway', 'Summary lead preserved', 'Evidence content preserved', 'Request content preserved'],
        ['end', 'Legacy end', 'End subtitle preserved', 'End note preserved', 'End body preserved'],
      ]
      for (const [index, [id, ...texts]] of expected.entries()) {
        await page.goto(`http://localhost:${port}/${index + 1}`, { waitUntil: 'networkidle' })
        const slide = page.locator(`.slide-page.theme-${variant}`).filter({ visible: true })
        await slide.waitFor({ state: 'visible' })
        await page.evaluate(() => document.fonts.ready)
        assert.equal(await page.locator('.kit-slide').filter({ visible: true }).count(), 0, `${variant}/${id}: legacy branch required`)
        for (const text of texts) assert((await slide.innerText()).includes(text), `${variant}/${id}: missing ${text}`)
        if (id === 'cover') assert.equal(await slide.locator('.cover-content').count(), 1)
        if (id === 'comparison' || id === 'summary') assert.equal(await slide.locator('.two-col > section').count(), 2)
        if (id === 'summary') assert.equal(await slide.locator('.summary-lead').count(), 1)
        if (id === 'end') assert.equal(await slide.locator('.end-content').count(), 1)
        if (variant === 'acme' && id !== 'cover' && id !== 'end') assert.equal(await slide.locator('.acme-header').count(), 1)
        const colors = await slide.evaluate(el => ({ background: getComputedStyle(el).backgroundColor, accent: getComputedStyle(el).getPropertyValue('--theme-accent').trim() }))
        const expectedColors = {
          default: ['rgb(255, 255, 255)', '#005c97'], mono: ['rgb(255, 255, 255)', '#374151'],
          dark: ['rgb(15, 24, 32)', '#7cc4ff'], acme: ['rgb(255, 253, 253)', '#a83a53'],
        }
        assert.deepEqual([colors.background, colors.accent], expectedColors[variant], `${variant}/${id}: design palette`)
        assert(!(await slide.innerText()).includes('An error occurred'), `${variant}/${id}: renderer error`)
        await slide.screenshot({ path: join(cwd, `${id}.png`) })
        slides.push({ id, texts, colors, screenshot: join(cwd, `${id}.png`) })
      }
      assert.deepEqual(errors, [], 'Unexpected browser errors')
      results.push({ variant, slides, unexpectedErrors: errors, upstreamDiagnostics: [...upstream] })
    } finally {
      await context.close()
      server.kill('SIGTERM')
      await new Promise(resolve => server.exitCode !== null ? resolve() : server.once('exit', resolve))
      writeFileSync(join(cwd, 'dev-server.log'), log)
    }
  }
  verification.succeed({ results })
  console.log(`Legacy browser passed: ${results.length} designs × 5 layouts; ${output}`)
} catch (error) {
  verification.fail(error)
  throw error
} finally {
  await browser?.close()
}
