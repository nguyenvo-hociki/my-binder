import { useEffect, useRef } from 'react'
import { PER_PAGE } from '../config'
import TiltCard from './TiltCard'

// Full-size view of one card. Arrow keys step through the filled pockets, Esc closes.
export default function Lightbox({ card, name, slot, wish, prev, next, onClose, onNav, onRename, onOwn, onRemove, onReplace }) {
  const replacer = useRef(null)

  useEffect(() => {
    const onKey = (e) => {
      if (e.key === 'Escape') onClose()
      if (e.target instanceof HTMLInputElement) return // arrows move the caret while renaming
      if (e.key === 'ArrowLeft' && prev != null) onNav(prev)
      if (e.key === 'ArrowRight' && next != null) onNav(next)
    }
    document.addEventListener('keydown', onKey)
    document.body.style.overflow = 'hidden'
    return () => {
      document.removeEventListener('keydown', onKey)
      document.body.style.overflow = ''
    }
  }, [prev, next, onClose, onNav])

  return (
    <div className="lightbox" role="dialog" aria-modal="true" aria-label="Card detail" onClick={onClose}>
      <div className="lightbox-body" onClick={(e) => e.stopPropagation()}>
        <button className="lb-nav lb-prev" disabled={prev == null} onClick={() => onNav(prev)} aria-label="Previous card">
          ‹
        </button>
        <div className="lb-stage">
          <TiltCard className="lb-card" tilt={16} scale={1.04} holo={0.34}>
            <img src={card.url} alt={name || `Card in pocket ${slot + 1}`} draggable={false} />
          </TiltCard>
        </div>
        <button className="lb-nav lb-next" disabled={next == null} onClick={() => onNav(next)} aria-label="Next card">
          ›
        </button>

        <div className="lb-panel">
          <input
            className="lb-name"
            value={name}
            placeholder="Name this card…"
            maxLength={60}
            onChange={(e) => onRename(card.id, e.target.value)}
          />
          <p className="lb-meta">
            Page {Math.floor(slot / PER_PAGE) + 1} · Pocket {(slot % PER_PAGE) + 1}
          </p>
          {wish && <p className="lb-wish">★ Wishlist — you don’t own this card yet</p>}
          <div className="lb-actions">
            {wish && (
              <button className="btn" onClick={onOwn}>
                I own it now
              </button>
            )}
            <button className="btn ghost" onClick={() => replacer.current.click()}>
              Replace photo
            </button>
            <button className="btn ghost danger" onClick={onRemove}>
              Remove
            </button>
            <button className="btn primary" onClick={onClose}>
              Done
            </button>
          </div>
        </div>
      </div>
      <input
        ref={replacer}
        type="file"
        accept="image/*"
        hidden
        onChange={(e) => {
          const file = e.target.files[0]
          e.target.value = ''
          if (file) onReplace(file)
        }}
      />
    </div>
  )
}
