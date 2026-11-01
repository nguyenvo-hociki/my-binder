import { Pokeball } from './icons'

export default function Footer() {
  return (
    <footer className="footer">
      <i className="footer-ring" aria-hidden="true" />
      <i className="footer-shimmer" aria-hidden="true" />
      <div className="footer-nav">
        <div className="footer-brand">
          <Pokeball size={44} />
          <span>Your cards, your binder.</span>
        </div>
        <nav className="footer-links" aria-label="Card data sources">
          <a href="https://tcgdex.dev" target="_blank" rel="noreferrer">
            TCGdex
          </a>
          <a href="https://pokemontcg.io" target="_blank" rel="noreferrer">
            Pokémon TCG API
          </a>
        </nav>
        <a className="to-top" href="#top">
          Back to top ↑
        </a>
      </div>
      <div className="footer-legal">
        <span>
          Pokémon and its trademarks are © Nintendo, Creatures Inc. and GAME FREAK inc. This is an unofficial fan
          project and is not affiliated with or endorsed by The Pokémon Company.
        </span>
        <span className="footer-credit">Made by Nguyen Vo · © {new Date().getFullYear()}</span>
      </div>
    </footer>
  )
}
