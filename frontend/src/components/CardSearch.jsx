import { useEffect, useRef, useState } from 'react'
import { searchCards } from '../cardApi'

const SUGGESTIONS = ['Pikachu', 'Charizard', 'Eevee', 'Mewtwo', 'Gengar', 'Snorlax']
const SOURCE_NAME = { tcgdex: 'TCGdex', ptcg: 'Pokémon TCG API' }
const IDLE = { term: '', status: 'idle', cards: [], more: false, page: 1, source: null }

const mergeById = (a, b) => {
  const seen = new Set(a.map((c) => c.id))
  return [...a, ...b.filter((c) => !seen.has(c.id))]
}

// Side drawer (bottom sheet on phones): search cards online, click one to add it to the binder.
export default function CardSearch({ open = true, added, onAdd, onClose }) {
  const [q, setQ] = useState('')
  const [s, setS] = useState(IDLE)
  const [busy, setBusy] = useState(() => new Set())
  const ran = useRef('') // the term last sent to the API, so typing + Enter doesn't search twice
  const ctl = useRef(null)
  const input = useRef(null)

  useEffect(() => () => ctl.current?.abort(), [])

  // Focus the box whenever the drawer opens, including a reopen during its closing fade (it never remounted).
  useEffect(() => {
    if (open && window.matchMedia('(pointer: fine)').matches) input.current?.focus() // don't pop a phone keyboard
  }, [open])

  async function load(term, page = 1, source) {
    ctl.current?.abort()
    const c = (ctl.current = new AbortController())
    setS((p) => ({ ...p, term, status: 'loading', ...(page === 1 ? { cards: [], more: false } : {}) }))
    try {
      const r = await searchCards(term, page, { signal: c.signal, source })
      if (c.signal.aborted) return
      setS((p) => ({
        term,
        status: 'done',
        page,
        source: r.source,
        more: r.more,
        cards: page === 1 ? r.cards : mergeById(p.cards, r.cards),
      }))
    } catch {
      if (!c.signal.aborted) setS((p) => ({ ...p, status: 'error' }))
    }
  }

  function search(term) {
    term = term.trim()
    if (term.length < 2) return
    setQ(term)
    ran.current = term
    load(term)
  }

  useEffect(() => {
    const term = q.trim()
    if (term.length < 2) {
      ctl.current?.abort()
      ran.current = ''
      setS(IDLE)
      return
    }
    if (term === ran.current) return
    const t = setTimeout(() => {
      ran.current = term
      load(term)
    }, 400)
    return () => clearTimeout(t)
  }, [q])

  async function add(card) {
    setBusy((b) => new Set(b).add(card.id))
    await onAdd(card)
    setBusy((b) => {
      const next = new Set(b)
      next.delete(card.id)
      return next
    })
  }

  const loading = s.status === 'loading'
  const first = loading && s.cards.length === 0

  return (
    <aside
      className={`search${open ? '' : ' is-closing'}`}
      aria-label="Find cards"
      aria-hidden={open ? undefined : true}
      onKeyDown={(e) => e.key === 'Escape' && onClose()}
    >
      <div className="search-head">
        <h2>Find cards</h2>
        <button className="btn small" onClick={onClose}>
          Close
        </button>
      </div>

      <form
        role="search"
        onSubmit={(e) => {
          e.preventDefault()
          if (q.trim() !== ran.current || s.status === 'error') search(q)
        }}
      >
        <input
          ref={input}
          className="search-input"
          type="search"
          value={q}
          placeholder="Search a Pokémon, e.g. Charizard"
          aria-label="Search cards by name"
          autoComplete="off"
          enterKeyHint="search"
          onChange={(e) => setQ(e.target.value)}
        />
      </form>

      <p className="search-note">
        Cards you add are marked <b>Wishlist</b> until you tap “I own it now” or swap in a photo of the real card.
      </p>

      <div className="search-results" role="status" aria-live="polite" aria-busy={loading}>
        {s.status === 'idle' && (
          <div className="search-empty">
            <p>Type at least 2 letters, or try one of these:</p>
            <div className="chips">
              {SUGGESTIONS.map((n) => (
                <button key={n} className="chip" onClick={() => search(n)}>
                  {n}
                </button>
              ))}
            </div>
          </div>
        )}

        {first &&
          Array.from({ length: 9 }, (_, i) => (
            <div key={i} className="rc rc-sk" aria-hidden="true">
              <div className="rc-art" />
              <span className="rc-name">&nbsp;</span>
            </div>
          ))}

        {s.cards.map((c) => {
          const isBusy = busy.has(c.id)
          const isAdded = added.has(c.id)
          return (
            <button
              key={c.id}
              className={`rc ${isAdded ? 'is-added' : ''}`}
              disabled={isBusy}
              onClick={() => add(c)}
              title={isAdded ? 'Already in your binder — click to add another copy' : `Add ${c.name} to your binder`}
            >
              <span className="rc-art">
                <img src={c.thumb} alt="" loading="lazy" onError={(e) => (e.currentTarget.style.visibility = 'hidden')} />
                {isBusy ? (
                  <span className="rc-busy" />
                ) : (
                  <span className="rc-state">{isAdded ? '✓ Added' : '＋ Add'}</span>
                )}
              </span>
              <span className="rc-name">{c.name}</span>
              <span className="rc-set">
                {c.set}
                {c.number ? ` · #${c.number}` : ''}
              </span>
            </button>
          )
        })}

        {s.status === 'done' && s.cards.length === 0 && !s.more && (
          <div className="search-empty">
            <p>No cards with an image found for “{s.term}”. Check the spelling, or try a shorter name.</p>
          </div>
        )}

        {s.status === 'error' && (
          <div className="search-empty">
            <p>Couldn’t reach the card databases. Check your connection and try again.</p>
            <button className="btn small" onClick={() => load(s.term, s.page > 1 && s.cards.length ? s.page + 1 : 1, s.cards.length ? s.source : undefined)}>
              Retry
            </button>
          </div>
        )}

        {s.more && s.status !== 'error' && (
          <button
            className="btn small more"
            disabled={loading}
            onClick={() => load(s.term, s.page + 1, s.source)}
          >
            {loading ? 'Loading…' : 'Load more'}
          </button>
        )}
      </div>

      <p className="search-foot">
        {s.source ? `Card data: ${SOURCE_NAME[s.source]}. ` : ''}Card art © Nintendo / Creatures / GAME FREAK — for your personal binder.
      </p>
    </aside>
  )
}
