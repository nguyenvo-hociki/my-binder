import { useState } from 'react'
import TiltCard from './TiltCard'
import { PokeballOutline } from './icons'

const SLOT_TYPE = 'application/x-binder-slot'
const accepts = (e) => e.dataTransfer.types.includes('Files') || e.dataTransfer.types.includes(SLOT_TYPE)

// One clear pocket. Empty: click / drop photos to fill it. Filled: click to open, drag onto another pocket to swap.
export default function Pocket({ slot, index, card, name, wish, dim, onAdd, onOpen, onDropFiles, onMove }) {
  const [over, setOver] = useState(false)

  function drop(e) {
    e.preventDefault()
    e.stopPropagation()
    setOver(false)
    const from = e.dataTransfer.getData(SLOT_TYPE)
    if (from) onMove(Number(from), slot)
    else if (e.dataTransfer.files.length) onDropFiles(e.dataTransfer.files, slot)
  }

  function key(e) {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault()
      card ? onOpen(slot) : onAdd(slot)
    }
  }

  return (
    <div
      className={`pocket ${card ? 'is-filled' : 'is-empty'} ${wish ? 'is-wish' : ''} ${dim ? 'is-dim' : ''} ${over ? 'is-over' : ''}`}
      style={{ '--i': index }}
      role="button"
      tabIndex={0}
      aria-label={card ? `Open card in pocket ${slot + 1}${name ? `: ${name}` : ''}` : `Add a photo to pocket ${slot + 1}`}
      draggable={!!card}
      onClick={() => (card ? onOpen(slot) : onAdd(slot))}
      onKeyDown={key}
      onDragStart={(e) => {
        e.dataTransfer.setData(SLOT_TYPE, String(slot))
        e.dataTransfer.effectAllowed = 'move'
      }}
      onDragOver={(e) => {
        if (!accepts(e)) return
        e.preventDefault()
        setOver(true)
      }}
      onDragLeave={() => setOver(false)}
      onDrop={drop}
    >
      <div className="pocket-well">
        {card ? (
          <TiltCard>
            <img src={card.url} alt="" draggable={false} decoding="async" />
          </TiltCard>
        ) : (
          <PokeballOutline />
        )}
      </div>
      <div className="pocket-sheen" />
      {wish && <span className="pocket-badge">Wishlist</span>}
    </div>
  )
}
