import { COVERS } from '../config'
import { Pokeball } from './icons'

export default function SiteNav({ mode, coverId, touch, searching, picking, onMode, onFind, onAdd, onCamera, onCover }) {
  // `active` draws the underline; `aria` says what kind of "active" it is (a current view vs. an open panel)
  const link = (label, onClick, active = false, aria = {}) => (
    <button key={label} className={`nav-link${active ? ' is-active' : ''}`} onClick={onClick} {...aria}>
      {label}
    </button>
  )
  const view = (on) => ({ 'aria-current': on ? 'true' : undefined })

  return (
    <header className="nav">
      <i className="nav-ring nav-ring-1" aria-hidden="true" />
      <i className="nav-ring nav-ring-2" aria-hidden="true" />
      <i className="nav-ring nav-ring-3" aria-hidden="true" />
      <i className="nav-ring nav-ring-4" aria-hidden="true" />
      <a className="nav-brand" href="#top" aria-label="Card Binder, back to top">
        <Pokeball size={44} />
        <span className="nav-wordmark">
          <b>Card</b>Binder
        </span>
      </a>
      <nav className="nav-links" aria-label="Main">
        {link('My Binder', () => onMode('binder'), mode === 'binder', view(mode === 'binder'))}
        {link('Card Gallery', () => onMode('grid'), mode === 'grid', view(mode === 'grid'))}
        {link('Find Cards', onFind, searching, { 'aria-expanded': !!searching })}
        {link('Add Photos', onAdd, picking === 'add')}
        {touch && link('Camera', onCamera, picking === 'camera')}
      </nav>
      <div className="swatches" role="group" aria-label="Binder cover color">
        {COVERS.map((c) => (
          <button
            key={c.id}
            className="swatch"
            style={{ '--a': c.a, '--b': c.b }}
            title={c.name}
            aria-label={c.name}
            aria-pressed={c.id === coverId}
            onClick={() => onCover(c.id)}
          />
        ))}
      </div>
    </header>
  )
}
