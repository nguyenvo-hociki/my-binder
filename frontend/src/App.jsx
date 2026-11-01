import { useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react'
import { COVERS, PER_PAGE, SCROLL, SHEET } from './config'
import { useBinder } from './hooks/useBinder'
import { useMedia } from './hooks/useMedia'
import { useSlowScroll } from './hooks/useSlowScroll'
import BinderTitle from './components/BinderTitle'
import CardSearch from './components/CardSearch'
import Cover from './components/Cover'
import Footer from './components/Footer'
import GalleryCard from './components/GalleryCard'
import Hero from './components/Hero'
import Lightbox from './components/Lightbox'
import ManageCallout from './components/ManageCallout'
import MoreCta from './components/MoreCta'
import Page from './components/Page'
import SiteNav from './components/SiteNav'
import {
  BookIcon,
  ChevronIcon,
  ChevronLeftIcon,
  ChevronRightIcon,
  GridIcon,
  Pokeball,
  SearchIcon,
} from './components/icons'

const DRAWER_EXIT_MS = 320 // matches `.search.is-closing` in styles.css
const CLOSE_DELAY_MS = 150 // after the jump to the binder, a beat before the closing animation starts
const BOOK_EXIT_MS = 450 // matches `.book.is-closing` in styles.css
const COVER_SHUT_MS = 600 // matches `.cover.is-arriving` in styles.css
const BOOK_GAP = 4 // px between the header and the open book's top edge after the jump

const IMAGE_EXT = /\.(jpe?g|png|webp|gif|avif|bmp|heic|heif)$/i
const isImage = (f) => f.type.startsWith('image/') || IMAGE_EXT.test(f.name)
const hasFiles = (e) => e.dataTransfer?.types.includes('Files')
const plural = (n, word) => `${n} ${word}${n === 1 ? '' : 's'}`

function scrollToGallery() {
  const calm = window.matchMedia('(prefers-reduced-motion: reduce)').matches
  document.getElementById('gallery-top')?.scrollIntoView({ behavior: calm ? 'instant' : 'smooth', block: 'start' })
}

// Jump (no scrolling animation) so the open book's top edge sits just under the sticky header.
function jumpToBook() {
  const book = document.querySelector('.book')
  const nav = document.querySelector('.nav')
  if (!book || !nav) return
  const top = book.getBoundingClientRect().top + window.scrollY - nav.getBoundingClientRect().bottom - BOOK_GAP
  window.scrollTo({ top: Math.max(0, top), behavior: 'instant' }) // 'instant' because the page sets scroll-behavior: smooth
}

export default function App() {
  const b = useBinder()
  const { binder, cards } = b
  const wide = useMedia('(min-width: 900px)')
  const touch = useMedia('(pointer: coarse)')
  useSlowScroll(SCROLL)

  const [phase, setPhase] = useState('closed') // closed -> opening -> open -> closing -> closed
  const [coverIn, setCoverIn] = useState(false) // the cover swings shut after a close, but not on a fresh page load
  const [mode, setMode] = useState('binder') // 'binder' (pages) | 'grid' (flat gallery)
  const [cat, setCat] = useState('all') // all | owned | wish
  const [query, setQuery] = useState('')
  const [sort, setSort] = useState('order') // order | name | new  (gallery view only)
  const [page, setPage] = useState(0)
  const [dir, setDir] = useState('next')
  const [openSlot, setOpenSlot] = useState(null)
  const [searching, setSearching] = useState(false)
  const [drawer, setDrawer] = useState(false) // keeps the search drawer mounted while its closing animation plays
  const toggleSearch = useCallback(() => setSearching((open) => !open), []) // every "find cards" button shares this
  const closeTimer = useRef(0)
  const closing = useRef(false) // a close is in progress: from the click until the cover has finished swinging shut
  const bodyTopBefore = useRef(null) // where the binder area started on screen just before the book was swapped for the cover

  // Closing also removes the "Fill pocket / Whole photo" controls, which on a phone wrap onto their own row, so the
  // area below them would slide up by that row's height. Scroll by the same amount before the page paints, so the
  // cover appears exactly where the book was.
  useLayoutEffect(() => {
    if (phase !== 'closed' || bodyTopBefore.current == null) return
    const now = document.querySelector('.g-body')?.getBoundingClientRect().top
    if (now != null) window.scrollBy({ top: now - bodyTopBefore.current, behavior: 'instant' })
    bodyTopBefore.current = null
  }, [phase])

  // Closing: jump to the binder right away (no animation), pause a beat so the eye catches up, then play the
  // opening backwards. The open book fades for BOOK_EXIT_MS, the page swaps to the cover, and the cover swings shut
  // for COVER_SHUT_MS. The jump comes first because the open binder is much taller than the cover: the page shrinks
  // at the swap, and the browser would otherwise drop the scroll position down near the footer.
  const closeBinder = useCallback(() => {
    if (closing.current) return // a second click must not restart it
    closing.current = true
    setOpenSlot(null)
    jumpToBook()
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      setPhase('closed')
      closing.current = false
      return
    }
    closeTimer.current = setTimeout(() => {
      setPhase('closing')
      closeTimer.current = setTimeout(() => {
        bodyTopBefore.current = document.querySelector('.g-body')?.getBoundingClientRect().top ?? null
        setCoverIn(true)
        setPhase('closed')
        closeTimer.current = setTimeout(() => {
          setCoverIn(false)
          closing.current = false
        }, COVER_SHUT_MS)
      }, BOOK_EXIT_MS)
    }, CLOSE_DELAY_MS)
  }, [])

  // Anything that wants the binder open (a nav link, adding photos, loading samples) cancels a close still running.
  const keepOpen = useCallback(() => {
    clearTimeout(closeTimer.current)
    closing.current = false
    setCoverIn(false)
    setPhase((p) => (p === 'opening' ? p : 'open')) // an opening swing in progress finishes by itself
  }, [])
  const [picking, setPicking] = useState(null) // 'add' | 'camera' while the file dialog opened from the nav is up
  const [toast, setToast] = useState('')
  const [dragging, setDragging] = useState(false)
  const spread = wide // two pages side by side; the search drawer slides over them rather than squeezing the layout

  const pickStart = useRef(0)
  const fileInput = useRef(null)
  const cameraInput = useRef(null)
  const toastTimer = useRef(0)
  const openTimer = useRef(0)
  const dragDepth = useRef(0)
  const live = useRef({}) // latest values for the window-level listeners below

  const slots = binder?.slots
  const total = slots ? Math.ceil(slots.length / PER_PAGE) : 0
  const filledSlots = useMemo(() => (slots ?? []).flatMap((id, i) => (id ? [i] : [])), [slots])
  const clamped = Math.max(0, Math.min(page, total - 1))
  const view = spread ? clamped - (clamped % 2) : clamped // first visible page

  useEffect(() => () => {
    clearTimeout(toastTimer.current)
    clearTimeout(openTimer.current)
    clearTimeout(closeTimer.current)
  }, [])

  const notify = useCallback((msg, ms = 3400) => {
    setToast(msg)
    clearTimeout(toastTimer.current)
    if (ms) toastTimer.current = setTimeout(() => setToast(''), ms)
  }, [])

  const go = useCallback(
    (delta) => {
      const next = Math.max(0, Math.min(view + delta * (spread ? 2 : 1), total - 1))
      setDir(delta > 0 ? 'next' : 'prev')
      setPage(next)
    },
    [view, spread, total],
  )

  function showSlot(slot) {
    const p = Math.floor(slot / PER_PAGE)
    setDir(p >= view ? 'next' : 'prev')
    setPage(p)
  }

  function openBinder() {
    clearTimeout(closeTimer.current)
    closing.current = false
    setCoverIn(false)
    setPhase('opening')
    openTimer.current = setTimeout(() => setPhase('open'), 520)
  }

  function showMode(next) {
    // choosing "My Binder" while it is closing means they changed their mind: stay open
    if (closing.current && phase !== 'closed') keepOpen()
    setMode(next)
    scrollToGallery()
  }

  function browse() {
    setMode('binder')
    if (phase === 'closed') openBinder()
    else if (closing.current) keepOpen()
    scrollToGallery()
  }

  async function addFiles(fileList, start) {
    const files = [...fileList].filter(isImage) // copy now: a FileList is cleared when its input resets
    if (!files.length) return notify('Those files aren’t images.')
    keepOpen()
    notify(`Adding ${plural(files.length, 'photo')}…`, 0)
    const { placed, failed, first } = await b.importFiles(files, start)
    if (first != null) showSlot(first)
    const heic = failed.some((n) => /\.hei[cf]$/i.test(n))
    const parts = []
    if (placed) parts.push(`Added ${plural(placed, 'card')}`)
    if (failed.length) {
      parts.push(
        `Couldn’t read ${plural(failed.length, 'file')}${heic ? ' (HEIC isn’t supported here — export as JPG or PNG)' : ''}`,
      )
    }
    notify(parts.join(' · '), failed.length ? 6500 : 3400)
  }

  const pick = useCallback((slot, camera = false) => {
    pickStart.current = slot
    ;(camera ? cameraInput : fileInput).current.click()
  }, [])

  function onPicked(e) {
    setPicking(null)
    const files = [...e.target.files]
    e.target.value = '' // lets the same photo be chosen again
    if (files.length) addFiles(files, pickStart.current)
  }

  // Add a card from the search drawer. The drawer stays open so several cards can be added in a row.
  async function addRemote(card) {
    keepOpen()
    const { ok, first } = await b.importRemote(card, view * PER_PAGE)
    if (!ok) return notify(`Couldn’t download ${card.name}. Try again.`)
    notify(`Added ${card.name} to page ${Math.floor(first / PER_PAGE) + 1}`, 2200)
  }

  async function loadSamples() {
    keepOpen()
    notify('Dealing cards…', 0)
    await b.loadSamples(12)
    showSlot(0)
    notify('Loaded 12 sample cards — swap them for your own photos')
  }

  live.current = { addFiles, view, go, openSlot, phase, mode }

  // Unmount the drawer only after its slide-out has finished.
  useEffect(() => {
    if (searching) {
      setDrawer(true)
      return
    }
    const t = setTimeout(() => setDrawer(false), DRAWER_EXIT_MS)
    return () => clearTimeout(t)
  }, [searching])

  // Clear the nav underline when the file dialog closes without a choice. Browsers fire `cancel` on the input;
  // the window regaining focus is the fallback for those that don't.
  useEffect(() => {
    if (!picking) return
    const done = () => setPicking(null)
    const inputs = [fileInput.current, cameraInput.current]
    const onFocus = () => setTimeout(done, 400) // `change` fires just after focus returns, so give it a moment
    for (const i of inputs) i?.addEventListener('cancel', done)
    window.addEventListener('focus', onFocus, { once: true })
    return () => {
      for (const i of inputs) i?.removeEventListener('cancel', done)
      window.removeEventListener('focus', onFocus)
    }
  }, [picking])

  // Paste an image (copied from a website or a screenshot), drop files anywhere, and arrow-key paging.
  useEffect(() => {
    const onPaste = (e) => {
      const files = [...(e.clipboardData?.files ?? [])].filter(isImage)
      if (!files.length) return
      e.preventDefault()
      live.current.addFiles(files, live.current.view * PER_PAGE)
    }
    const onEnter = (e) => {
      if (!hasFiles(e)) return
      dragDepth.current++
      setDragging(true)
    }
    const onLeave = (e) => {
      if (!hasFiles(e)) return
      if (--dragDepth.current <= 0) {
        dragDepth.current = 0
        setDragging(false)
      }
    }
    const onOver = (e) => {
      if (hasFiles(e)) e.preventDefault() // allow dropping; never let the browser navigate to the file
    }
    const onDrop = (e) => {
      if (hasFiles(e)) e.preventDefault()
      dragDepth.current = 0
      setDragging(false)
    }
    const onKey = (e) => {
      const s = live.current
      if (s.openSlot != null || s.phase !== 'open' || s.mode !== 'binder') return
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLSelectElement) return
      if (e.key === 'ArrowLeft') s.go(-1)
      if (e.key === 'ArrowRight') s.go(1)
    }
    document.addEventListener('paste', onPaste)
    document.addEventListener('dragenter', onEnter)
    document.addEventListener('dragleave', onLeave)
    document.addEventListener('dragover', onOver)
    document.addEventListener('drop', onDrop, true) // capture: still runs when a pocket stops propagation
    document.addEventListener('dragend', onDrop)
    document.addEventListener('keydown', onKey)
    return () => {
      document.removeEventListener('paste', onPaste)
      document.removeEventListener('dragenter', onEnter)
      document.removeEventListener('dragleave', onLeave)
      document.removeEventListener('dragover', onOver)
      document.removeEventListener('drop', onDrop, true)
      document.removeEventListener('dragend', onDrop)
      document.removeEventListener('keydown', onKey)
    }
  }, [])

  if (!binder) {
    return (
      <div className="loading">
        <Pokeball size={64} spin />
      </div>
    )
  }

  const cover = COVERS.find((c) => c.id === binder.cover) ?? COVERS[0]
  const filled = filledSlots.length
  const inBinder = new Set(Object.values(binder.proxies)) // search results already in the binder
  const wishCount = Object.keys(binder.proxies).length
  const ownedCount = filled - wishCount

  // Category + text filter. In the binder it dims the pockets that don't match; in the gallery it hides them.
  const q = query.trim().toLowerCase()
  const filtering = cat !== 'all' || q !== ''
  const matches = (id) => {
    const isWish = !!binder.proxies[id]
    if (cat === 'owned' && isWish) return false
    if (cat === 'wish' && !isWish) return false
    return !q || (binder.names[id] ?? '').toLowerCase().includes(q)
  }
  const dim = filtering ? new Set(slots.filter((id) => id && !matches(id))) : null
  const shown = filtering ? filledSlots.filter((s) => matches(slots[s])) : filledSlots

  let gridSlots = shown.filter((s) => cards[slots[s]])
  if (sort === 'name') {
    const nameOf = (s) => binder.names[slots[s]] ?? ''
    gridSlots = [...gridSlots].sort((x, y) => {
      if (!nameOf(x) !== !nameOf(y)) return nameOf(x) ? -1 : 1 // unnamed cards last
      return nameOf(x).localeCompare(nameOf(y))
    })
  } else if (sort === 'new') {
    gridSlots = [...gridSlots].sort((x, y) => (slots[y] < slots[x] ? -1 : slots[y] > slots[x] ? 1 : 0))
  }

  const featured = filledSlots
    .slice(0, 2)
    .map((slot) => ({ slot, card: cards[slots[slot]], name: binder.names[slots[slot]] ?? '' }))
    .filter((f) => f.card)

  const visible = (spread ? [view, view + 1] : [view]).filter((p) => p < total)
  const canRemoveSheet = slots.length > SHEET && slots.slice(-SHEET).every((s) => !s)
  const pageLabel =
    visible.length > 1 ? `Pages ${view + 1}–${view + 2} of ${total}` : `Page ${view + 1} of ${total}`

  const lbCard = openSlot != null ? cards[slots[openSlot]] : null
  const at = filledSlots.indexOf(openSlot)
  const prevSlot = at > 0 ? filledSlots[at - 1] : null
  const nextSlot = at >= 0 && at < filledSlots.length - 1 ? filledSlots[at + 1] : null

  const cats = [
    ['all', `All cards (${filled})`],
    ['owned', `Owned (${ownedCount})`],
    ['wish', `Wishlist (${wishCount})`],
  ]

  return (
    <div
      id="top"
      className="app"
      style={{ '--cover-a': cover.a, '--cover-b': cover.b }}
      onDrop={(e) => {
        if (!hasFiles(e)) return
        e.preventDefault()
        addFiles(e.dataTransfer.files, view * PER_PAGE)
      }}
    >
      <SiteNav
        mode={mode}
        coverId={cover.id}
        touch={touch}
        searching={searching}
        picking={picking}
        onMode={showMode}
        onFind={toggleSearch}
        onAdd={() => {
          setPicking('add')
          pick(view * PER_PAGE)
        }}
        onCamera={() => {
          setPicking('camera')
          pick(view * PER_PAGE, true)
        }}
        onCover={b.setCover}
      />

      {b.saveError && (
        <div className="banner" role="alert">
          Your browser is blocking storage, so this binder won’t be saved when you close the tab.
        </div>
      )}

      <Hero
        filled={filled}
        wish={wishCount}
        featured={featured}
        onBrowse={browse}
        onFind={toggleSearch}
        searching={searching}
        onOpenCard={setOpenSlot}
      />

      <section id="gallery" className="gallery-sec on-light" aria-label="Your binder">
        <i className="g-ring g-ring-1" aria-hidden="true" />
        <i className="g-ring g-ring-2" aria-hidden="true" />
        <i className="g-ring g-ring-3" aria-hidden="true" />
        <i className="g-ring g-ring-4" aria-hidden="true" />
        <i className="g-ring g-ring-5" aria-hidden="true" />

        <div className="g-head">
          <div className="g-title" id="gallery-top">
            <BinderTitle label={mode === 'binder' ? 'Binder view' : 'Gallery view'} title={binder.title} onSave={b.setTitle} />
          </div>
          <ul className="g-guide" aria-label="How to use this view">
            {(mode === 'binder'
              ? ['Click a pocket to add a photo', 'Drag a card onto another pocket to swap them', 'Open a card to see it full size']
              : ['Every card in your binder at a glance', 'Click a card to enlarge it', 'Name it or replace its photo there']
            ).map((tip) => (
              <li key={tip}>{tip}</li>
            ))}
          </ul>
        </div>

        <div className="cats" role="group" aria-label="Filter cards">
          {cats.map(([key, label]) => (
            <button key={key} className="cat" aria-pressed={cat === key} onClick={() => setCat(key)}>
              {label}
            </button>
          ))}
        </div>

        <div className="g-controls">
          <label className="g-search">
            <SearchIcon />
            <input
              type="search"
              value={query}
              placeholder="Search your binder"
              aria-label="Search your binder by card name"
              autoComplete="off"
              onChange={(e) => setQuery(e.target.value)}
            />
          </label>

          <div className="g-view">
            <span className="g-count" aria-live="polite">
              {filtering ? `Showing ${shown.length} of ${filled}` : plural(filled, 'card')}
            </span>

            {mode === 'binder' && (phase === 'open' || phase === 'closing') && (
              <div className="seg" role="group" aria-label="Photo fit">
                <button aria-pressed={binder.fit === 'cover'} onClick={() => b.setFit('cover')}>
                  Fill pocket
                </button>
                <button aria-pressed={binder.fit === 'contain'} onClick={() => b.setFit('contain')}>
                  Whole photo
                </button>
              </div>
            )}

            {mode === 'grid' && (
              <label className="g-sort">
                <select value={sort} aria-label="Sort cards" onChange={(e) => setSort(e.target.value)}>
                  <option value="order">Binder order</option>
                  <option value="name">Name A–Z</option>
                  <option value="new">Newest first</option>
                </select>
                <ChevronIcon size={16} />
              </label>
            )}

            <div className="view-toggle" role="group" aria-label="View">
              <button aria-pressed={mode === 'binder'} aria-label="Binder view" data-tip="Binder view" onClick={() => setMode('binder')}>
                <BookIcon size={20} />
              </button>
              <button aria-pressed={mode === 'grid'} aria-label="Gallery view" data-tip="Gallery view" onClick={() => setMode('grid')}>
                <GridIcon size={20} />
              </button>
            </div>
          </div>
        </div>

        <div className="g-body">
          {mode === 'grid' ? (
            gridSlots.length ? (
              <div className="gc-grid">
                {gridSlots.map((slot, i) => {
                  const id = slots[slot]
                  return (
                    <GalleryCard
                      key={id}
                      card={cards[id]}
                      name={binder.names[id] ?? ''}
                      slot={slot}
                      wish={!!binder.proxies[id]}
                      index={i}
                      onOpen={setOpenSlot}
                    />
                  )
                })}
              </div>
            ) : (
              <div className="g-empty">
                {filled === 0 ? (
                  <>
                    <p>Your binder is empty. Add your own photos, or look up cards you’re still hunting for.</p>
                    <div className="g-empty-actions">
                      <button className="btn primary" onClick={() => pick(0)}>
                        ＋ Add photos
                      </button>
                      <button className="btn" aria-expanded={searching} onClick={toggleSearch}>
                        Find cards online
                      </button>
                      <button className="btn" onClick={loadSamples}>
                        Load 12 sample cards
                      </button>
                    </div>
                  </>
                ) : (
                  <>
                    <p>No cards match that filter.</p>
                    <div className="g-empty-actions">
                      <button
                        className="btn"
                        onClick={() => {
                          setCat('all')
                          setQuery('')
                        }}
                      >
                        Clear filters
                      </button>
                    </div>
                  </>
                )}
              </div>
            )
          ) : phase === 'closed' || phase === 'opening' ? (
            <div className="cover-wrap">
              <Cover
                title={binder.title}
                count={filled}
                opening={phase === 'opening'}
                arriving={coverIn && phase === 'closed'}
                onOpen={openBinder}
              />
            </div>
          ) : (
            <>
              {filled === 0 && (
                <p className="hint">
                  <span>Drop photos anywhere, paste an image (Ctrl+V), or click a pocket.</span>
                  <button className="btn small" aria-expanded={searching} onClick={toggleSearch}>
                    Find cards online
                  </button>
                  <button className="btn small" onClick={loadSamples}>
                    Load 12 sample cards
                  </button>
                </p>
              )}

              <div
                className={`book ${spread ? 'is-spread' : 'is-single'} fit-${binder.fit}${phase === 'closing' ? ' is-closing' : ''}`}
              >
                <div className="rings" aria-hidden="true">
                  <i />
                  <i />
                  <i />
                </div>
                <div key={view} className={`spread dir-${dir}`}>
                  {visible.map((p) => (
                    <Page
                      key={p}
                      index={p}
                      slots={slots}
                      cards={cards}
                      names={binder.names}
                      proxies={binder.proxies}
                      dim={dim}
                      onAdd={pick}
                      onOpen={setOpenSlot}
                      onDropFiles={addFiles}
                      onMove={b.moveCard}
                    />
                  ))}
                </div>
                <nav className="pager" aria-label="Binder pages">
                  <button
                    className="btn page-nav prev"
                    disabled={view === 0}
                    onClick={() => go(-1)}
                    aria-label="Previous pages"
                  >
                    <ChevronLeftIcon size={20} />
                  </button>
                  <span className="sr-only" aria-live="polite">
                    {pageLabel}
                  </span>
                  <button
                    className="btn page-nav next"
                    disabled={view + (spread ? 2 : 1) >= total}
                    onClick={() => go(1)}
                    aria-label="Next pages"
                  >
                    <ChevronRightIcon size={20} />
                  </button>
                </nav>
              </div>
            </>
          )}
        </div>
      </section>

      <ManageCallout
        filled={filled}
        total={slots.length}
        wish={wishCount}
        // "closing" counts as open, so the pink box keeps its Close button and the page doesn't shrink during the fade
        isOpen={(phase === 'open' || phase === 'closing') && mode === 'binder'}
        canRemoveSheet={canRemoveSheet}
        onAddSheet={() => {
          b.addSheet()
          showSlot(slots.length)
          notify(`Added a sheet · ${SHEET} more pockets`, 2400)
        }}
        onRemoveSheet={b.removeSheet}
        onClear={() => {
          if (window.confirm('Remove every card and photo from this binder?')) {
            b.clearAll()
            setOpenSlot(null)
            setPage(0)
          }
        }}
        onClose={closeBinder}
      />

      <MoreCta searching={searching} onFind={toggleSearch} onAdd={() => pick(view * PER_PAGE)} />
      <Footer />

      {lbCard && (
        <Lightbox
          card={lbCard}
          name={binder.names[lbCard.id] ?? ''}
          slot={openSlot}
          wish={!!binder.proxies[lbCard.id]}
          prev={prevSlot}
          next={nextSlot}
          onClose={() => setOpenSlot(null)}
          onNav={(slot) => {
            setOpenSlot(slot)
            showSlot(slot)
          }}
          onRename={b.renameCard}
          onOwn={() => {
            b.markOwned(lbCard.id)
            notify('Nice — marked as owned')
          }}
          onRemove={() => {
            b.removeCard(openSlot)
            setOpenSlot(null)
            notify('Card removed')
          }}
          onReplace={async (file) => {
            const ok = await b.replaceCard(openSlot, file)
            notify(ok ? 'Photo replaced' : 'Couldn’t read that image.')
          }}
        />
      )}

      {(searching || drawer) && (
        <CardSearch open={searching} added={inBinder} onAdd={addRemote} onClose={() => setSearching(false)} />
      )}

      {dragging && (
        <div className="drop-overlay" aria-hidden="true">
          <span>Drop photos to add them to your binder</span>
        </div>
      )}
      <div className="toast-region" aria-live="polite">
        {toast && <div className="toast">{toast}</div>}
      </div>

      <input ref={fileInput} type="file" accept="image/*,.heic,.heif" multiple hidden onChange={onPicked} />
      <input ref={cameraInput} type="file" accept="image/*" capture="environment" hidden onChange={onPicked} />
    </div>
  )
}
