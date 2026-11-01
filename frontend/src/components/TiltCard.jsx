import { useRef } from 'react'

// Wraps a card image: it tilts toward the pointer and shows a holographic sheen + glare.
// Pointer position is written straight to CSS variables (no React re-render per mouse move).
export default function TiltCard({ children, className = '', tilt = 12, scale = 1.06, holo = 0.28 }) {
  const root = useRef(null)
  const raf = useRef(0)

  function move(e) {
    const el = root.current
    const rect = el.getBoundingClientRect() // measured on the wrapper, which never rotates
    const x = (e.clientX - rect.left) / rect.width
    const y = (e.clientY - rect.top) / rect.height
    cancelAnimationFrame(raf.current)
    raf.current = requestAnimationFrame(() => {
      el.style.setProperty('--mx', `${(x * 100).toFixed(1)}%`)
      el.style.setProperty('--my', `${(y * 100).toFixed(1)}%`)
      el.style.setProperty('--rx', ((x - 0.5) * 2).toFixed(3))
      el.style.setProperty('--ry', ((y - 0.5) * 2).toFixed(3))
    })
  }

  function enter() {
    root.current.classList.add('is-active')
  }

  function leave() {
    cancelAnimationFrame(raf.current)
    const el = root.current
    el.classList.remove('is-active')
    for (const v of ['--mx', '--my', '--rx', '--ry']) el.style.removeProperty(v)
  }

  return (
    <div
      ref={root}
      className={`tilt ${className}`}
      style={{ '--tilt': tilt, '--scale': scale, '--holo': holo }}
      onPointerEnter={enter}
      onPointerMove={move}
      onPointerLeave={leave}
      onPointerCancel={leave}
    >
      <div className="tilt-inner">
        {children}
        <span className="tilt-holo" />
        <span className="tilt-glare" />
      </div>
    </div>
  )
}
