import { useEffect } from 'react'

const LINE_PX = 40 // deltaMode 1 (Firefox with a mouse wheel): one "line" in pixels

// Anything inside a scrollable box that can still move in this direction (the search results, a select list)
// keeps its native speed, so only the page itself is slowed.
function insideScroller(el, dy) {
  for (; el && el !== document.body && el !== document.documentElement; el = el.parentElement) {
    const { overflowY } = getComputedStyle(el)
    if ((overflowY === 'auto' || overflowY === 'scroll') && el.scrollHeight > el.clientHeight) {
      const atTop = el.scrollTop <= 0
      const atBottom = el.scrollTop + el.clientHeight >= el.scrollHeight - 1
      if (dy < 0 ? !atTop : !atBottom) return true
    }
  }
  return false
}

// Takes over mouse-wheel / trackpad scrolling of the whole page. Wheel distance is scaled by `speed` and queued;
// a frame loop then drains the queue at no more than `maxSpeed` px/s, and the queue holds at most `maxGlide` px,
// so a hard flick (trackpad momentum, a fast wheel spin) is slowed and shortened while gentle scrolling stays
// responsive. Keyboard, scrollbar-drag and touch scrolling are untouched.
export function useSlowScroll({ speed = 1, maxSpeed = Infinity, maxGlide = Infinity } = {}) {
  useEffect(() => {
    if (speed >= 1 && maxSpeed === Infinity) return
    let queued = 0 // px waiting to be scrolled; a sub-pixel remainder stays here until it adds up
    let raf = 0
    let last = 0

    const tick = (now) => {
      const dt = Math.min(now - last, 50) / 1000 // a stalled tab must not release a big burst
      last = now
      const budget = Math.max(1, maxSpeed * dt)
      const step = Math.trunc(Math.max(-budget, Math.min(budget, queued)))
      if (step) {
        const before = window.scrollY
        // 'instant': the page sets scroll-behavior: smooth, which would restart an animation every frame
        window.scrollBy({ top: step, behavior: 'instant' })
        queued = window.scrollY === before ? 0 : queued - step // 0 = hit the top or bottom
      }
      raf = Math.abs(queued) >= 1 ? requestAnimationFrame(tick) : 0
    }

    const onWheel = (e) => {
      if (e.defaultPrevented || e.ctrlKey || e.shiftKey || e.deltaY === 0) return // pinch/ctrl zoom, sideways
      if (Math.abs(e.deltaX) > Math.abs(e.deltaY)) return
      if (insideScroller(e.target, e.deltaY)) return

      const px = e.deltaMode === 1 ? e.deltaY * LINE_PX : e.deltaMode === 2 ? e.deltaY * innerHeight : e.deltaY
      e.preventDefault()
      const add = px * speed
      if (Math.sign(add) !== Math.sign(queued)) queued = 0 // reversing direction: drop what was still gliding
      queued = Math.max(-maxGlide, Math.min(maxGlide, queued + add))
      if (!raf && Math.abs(queued) >= 1) {
        last = performance.now()
        raf = requestAnimationFrame(tick)
      }
    }

    window.addEventListener('wheel', onWheel, { passive: false })
    return () => {
      window.removeEventListener('wheel', onWheel)
      cancelAnimationFrame(raf)
    }
  }, [speed, maxSpeed, maxGlide])
}
