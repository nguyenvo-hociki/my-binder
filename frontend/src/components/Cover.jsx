import { Pokeball } from './icons'

// `opening`: the cover swings away. `arriving`: it swings shut again after the binder was closed.
export default function Cover({ title, count, opening, arriving, onOpen }) {
  return (
    <button
      className={`cover${opening ? ' is-opening' : ''}${arriving ? ' is-arriving' : ''}`}
      onClick={onOpen}
      aria-label={`Open binder: ${title}`}
    >
      <span className="cover-spine" />
      <span className="cover-stitch" />
      <span className="cover-emblem">
        <Pokeball size="100%" />
      </span>
      <span className="cover-title">{title || 'My Binder'}</span>
      <span className="cover-sub">
        {count} {count === 1 ? 'card' : 'cards'} · click to open
      </span>
    </button>
  )
}
