import { PER_PAGE } from '../config'
import TiltCard from './TiltCard'

// One card in the flat gallery view: a translucent display tray, then name / position / status underneath.
export default function GalleryCard({ card, name, slot, wish, index, onOpen }) {
  const open = () => onOpen(slot)
  return (
    <article className={`gc${wish ? ' is-wish' : ''}`} style={{ '--i': Math.min(index, 12) }}>
      <div
        className="gc-display"
        role="button"
        tabIndex={0}
        aria-label={`Open ${name || 'card'} full size`}
        onClick={open}
        onKeyDown={(e) => {
          if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault()
            open()
          }
        }}
      >
        <div className="gc-art">
          <TiltCard>
            <img src={card.url} alt="" draggable={false} loading="lazy" decoding="async" />
          </TiltCard>
        </div>
        {wish && <span className="pocket-badge gc-badge">Wishlist</span>}
      </div>
      <div className="gc-details">
        <div className="gc-row">
          <span className="gc-name">{name || 'Untitled card'}</span>
          <span className="gc-num">
            P{Math.floor(slot / PER_PAGE) + 1} · #{(slot % PER_PAGE) + 1}
          </span>
        </div>
        <div className="gc-row">
          <span className="gc-cat">{wish ? 'Wishlist, not owned yet' : 'In your collection'}</span>
          <span className="gc-enlarge" aria-hidden="true">
            ⤢
          </span>
        </div>
      </div>
    </article>
  )
}
