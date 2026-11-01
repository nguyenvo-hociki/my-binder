import { COLS, PER_PAGE } from '../config'
import Pocket from './Pocket'

export default function Page({ index, slots, cards, names, proxies, dim, ...handlers }) {
  const start = index * PER_PAGE
  return (
    <section className="page" aria-label={`Page ${index + 1}`} style={{ '--cols': COLS }}>
      <div className="page-grid">
        {slots.slice(start, start + PER_PAGE).map((id, i) => (
          <Pocket
            key={start + i}
            slot={start + i}
            index={i}
            card={id ? cards[id] : null}
            name={id ? names[id] : ''}
            wish={!!(id && proxies[id])}
            dim={!!(id && dim?.has(id))}
            {...handlers}
          />
        ))}
      </div>
      <span className="page-num">{index + 1}</span>
    </section>
  )
}
