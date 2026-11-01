import { Pokeball } from './icons'

export default function MoreCta({ searching, onFind, onAdd }) {
  return (
    <section className="cta" aria-labelledby="cta-title">
      <div className="cta-ball" aria-hidden="true">
        <i className="cb-ring" />
        <i className="cb-band" />
      </div>
      <i className="cta-slash cs-1" aria-hidden="true" />
      <i className="cta-slash cs-2" aria-hidden="true" />

      <div className="cta-copy">
        <span className="overline">Ready to fill more pockets?</span>
        <h2 id="cta-title">Find the cards you’re still hunting</h2>
        <div className="cta-actions">
          <button className="action action-gold" aria-expanded={searching} onClick={onFind}>
            <span>Search the card database</span>
            <i aria-hidden="true">→</i>
          </button>
          <button className="action action-rose" onClick={onAdd}>
            <span>Add my photos</span>
            <i aria-hidden="true">→</i>
          </button>
        </div>
      </div>
      <div className="cta-art" aria-hidden="true">
        <Pokeball size="100%" />
      </div>
    </section>
  )
}
