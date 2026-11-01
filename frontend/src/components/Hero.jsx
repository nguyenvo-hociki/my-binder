import { Pokeball } from './icons'
import TiltCard from './TiltCard'

function CardBack() {
  return (
    <div className="cardback" aria-hidden="true">
      <div className="cardback-in">
        <Pokeball size="100%" />
      </div>
    </div>
  )
}

// One of the two tilted showcase cards: a real card from the binder, or a card back until there is one.
function Featured({ item, tone, onOpen }) {
  if (!item) {
    return (
      <div className={`hero-card ${tone} is-ghost`} aria-hidden="true">
        <CardBack />
      </div>
    )
  }
  const open = () => onOpen(item.slot)
  return (
    <div
      className={`hero-card ${tone}`}
      role="button"
      tabIndex={0}
      aria-label={`Open ${item.name || 'card'}`}
      onClick={open}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault()
          open()
        }
      }}
    >
      <TiltCard tilt={10} scale={1.05} holo={0.3}>
        <img src={item.card.url} alt="" draggable={false} />
      </TiltCard>
    </div>
  )
}

export default function Hero({ filled, wish, featured, searching, onBrowse, onFind, onOpenCard }) {
  return (
    <section className="hero on-light" aria-labelledby="hero-title">
      <div className="hero-ball" aria-hidden="true">
        <i className="hb-outer" />
        <i className="hb-inner" />
        <i className="hb-band" />
        <i className="hb-button" />
      </div>

      <div className="hero-story">
        <div className="hero-identity">
          <div className="hero-mark">
            <Pokeball size="100%" />
          </div>
          <div className="hero-series">
            <span>MY COLLECTION</span>
            <b>CARD BINDER</b>
          </div>
        </div>
        <h1 id="hero-title" className="hero-title">
          Build your dream binder
        </h1>
        <p className="hero-desc">
          Import photos of the cards you own, or find the ones you’re still hunting in the Pokémon TCG database and
          keep them on a wishlist. Collect them, flip them, show them off.
        </p>
        <div className="hero-actions">
          <button className="action action-dark" onClick={onBrowse}>
            <span>Open my binder</span>
            <i aria-hidden="true">→</i>
          </button>
          <button className="action action-light" aria-expanded={searching} onClick={onFind}>
            <span>Find cards online</span>
            <i aria-hidden="true">→</i>
          </button>
          <span className="hero-meta">
            {filled} {filled === 1 ? 'card' : 'cards'} in your binder
            {wish > 0 && ` · ${wish} on your wishlist`}
          </span>
        </div>
      </div>

      <div className="hero-feature">
        <i className="hf-orbit hf-orbit-1" aria-hidden="true" />
        <i className="hf-orbit hf-orbit-2" aria-hidden="true" />
        <i className="hf-core" aria-hidden="true" />
        <i className="hf-slash" aria-hidden="true" />
        <Featured item={featured[0]} tone="is-a" onOpen={onOpenCard} />
        <Featured item={featured[1]} tone="is-b" onOpen={onOpenCard} />
        <div className="spotlight">
          <p className="spot-line">
            <i aria-hidden="true" />
            <span>{featured.length ? 'Featured from your binder' : 'Your first cards will appear here'}</span>
          </p>
          <p className="spot-note">
            <i aria-hidden="true" />
            <span>
              Multiple binders and more <span className="note-b">features are coming soon.</span>
            </span>
          </p>
        </div>
      </div>
    </section>
  )
}
