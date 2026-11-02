import { mkdirSync, renameSync, writeFileSync } from 'node:fs'
import { join } from 'node:path'
import { randomUUID } from 'node:crypto'

// Never let an interrupted or failed rerun advertise a previous run's success.
export function startVerification(base) {
  const id = `${new Date().toISOString().replaceAll(':', '-')}-${randomUUID().slice(0, 8)}`
  const output = join(base, 'runs', id)
  mkdirSync(output, { recursive: true })
  const publish = report => {
    const value = { run: id, output, ...report }
    const json = JSON.stringify(value, null, 2) + '\n'
    writeFileSync(join(output, 'status.json'), json)
    const temporary = join(base, `latest-${id}.tmp`)
    writeFileSync(temporary, json)
    renameSync(temporary, join(base, 'latest.json'))
  }
  publish({ status: 'running' })
  return {
    output,
    succeed(report) {
      writeFileSync(join(output, 'report.json'), JSON.stringify({ status: 'success', ...report }, null, 2) + '\n')
      publish({ status: 'success', report: join(output, 'report.json') })
    },
    fail(error) { publish({ status: 'failed', error: error.message }) },
  }
}
