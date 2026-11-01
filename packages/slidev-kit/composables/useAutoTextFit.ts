import { nextTick, onBeforeUnmount, onMounted, type Ref } from 'vue'
import { findLargestFontSize } from '../lib/layout/fit-text'

/** Measure real wrapped content; never transform/scale the slide or its furniture. */
export function useAutoTextFit(root: Ref<HTMLElement | undefined>, enabled: () => boolean) {
  let resize: ResizeObserver | undefined
  let mutation: MutationObserver | undefined
  let frame = 0
  let disposed = false
  const fit = () => {
    const el = root.value
    if (!el || disposed) return
    el.removeAttribute('data-fit-ready')
    if (!enabled()) {
      el.removeAttribute('data-auto-fit')
      el.removeAttribute('data-fit-overflow')
      el.setAttribute('data-fit-ready', 'true')
      return
    }
    if (!el.clientWidth || !el.clientHeight) return
    // Read author-selected typography without our fitting overrides.
    el.removeAttribute('data-auto-fit')
    const cells = [...el.querySelectorAll<HTMLElement>(':scope > section > .cell-content')]
    const body = el.querySelector<HTMLElement>('p:not(:has(img)), li')
    const heading = el.querySelector<HTMLElement>('h2')
    const table = el.querySelector<HTMLElement>('table')
    const page = el.closest<HTMLElement>('.slide-page')
    const max = Math.round(parseFloat(getComputedStyle(body || page || el).fontSize))
    const min = Math.min(18, max)
    el.style.setProperty('--auto-heading', `${heading ? parseFloat(getComputedStyle(heading).fontSize) : max + 4}px`)
    el.style.setProperty('--auto-table', `${table ? parseFloat(getComputedStyle(table).fontSize) : max - 2}px`)
    el.style.setProperty('--auto-body', `${max}px`)
    el.setAttribute('data-auto-fit', 'true')
    const fits = (size: number) => {
      el.style.setProperty('--auto-scale', String(size / max))
      return cells.every(cell => {
        if (cell.scrollHeight > cell.clientHeight + 1 || cell.scrollWidth > cell.clientWidth + 1) return false
        const bounds = cell.getBoundingClientRect()
        return [...cell.children].every(child => {
          const r = child.getBoundingClientRect()
          return r.bottom <= bounds.bottom + 1 && r.right <= bounds.right + 1
        })
      })
    }
    // Also watch intrinsic child sizes (e.g. asynchronously rendered diagrams).
    for (const cell of cells) for (const child of cell.children) resize?.observe(child)
    const result = findLargestFontSize(min, max, fits)
    fits(result.size)
    el.dataset.fitSize = String(result.size)
    el.dataset.fitOverflow = String(result.overflow)
    el.dataset.fitReady = 'true'
  }
  const schedule = () => {
    cancelAnimationFrame(frame)
    if (!disposed) frame = requestAnimationFrame(fit)
  }
  onMounted(async () => {
    await nextTick()
    if (disposed) return
    resize = new ResizeObserver(schedule)
    mutation = new MutationObserver(schedule)
    if (root.value) {
      resize.observe(root.value)
      mutation.observe(root.value, { childList: true, subtree: true, characterData: true })
      const page = root.value.closest('.slide-page')
      if (page) mutation.observe(page, { attributes: true, attributeFilter: ['data-text-size', 'data-density'] })
      root.value.addEventListener('load', schedule, true)
    }
    document.fonts?.ready.then(schedule)
    document.fonts?.addEventListener('loadingdone', schedule)
    window.addEventListener('beforeprint', fit)
    schedule()
  })
  onBeforeUnmount(() => {
    disposed = true
    resize?.disconnect()
    mutation?.disconnect()
    cancelAnimationFrame(frame)
    root.value?.removeEventListener('load', schedule, true)
    document.fonts?.removeEventListener('loadingdone', schedule)
    window.removeEventListener('beforeprint', fit)
  })
  return { schedule }
}
