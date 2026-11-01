import { useEffect, useRef, useState } from 'react'
import { flushSync } from 'react-dom'
import * as db from '../db'
import { fetchImageBlob } from '../cardApi'
import { makeSampleCard, processImage } from '../image'
import { COVERS, SHEET } from '../config'

const uid = () => Date.now().toString(36) + Math.random().toString(36).slice(2, 8)
const blanks = (n) => Array(n).fill(null)

const DEFAULT_BINDER = {
  title: 'My Pokémon Binder',
  cover: COVERS[0].id,
  slots: blanks(SHEET * 2), // 4 pages to start
  names: {}, // cardId -> name
  fit: 'cover', // 'cover' fills the pocket (crops edges), 'contain' shows the whole photo
  proxies: {}, // cardId -> search-result id, for downloaded cards you don't own yet (the "wishlist")
}

// Camera filenames (IMG_2031, PXL_2024...) make poor card names; real filenames are kept.
const CAMERA_NAME = /^(img|dsc|pxl|mvimg|photo|image|screenshot)?[\s_-]*\d[\d\s_-]*$/i
function nameFromFile(file) {
  const base = file.name.replace(/\.[^.]+$/, '')
  return CAMERA_NAME.test(base) ? '' : base.replace(/[_-]+/g, ' ').trim()
}

// Put ids into empty pockets starting at `start` (wrapping around), adding sheets if the binder is full.
function place(slots, ids, start) {
  const next = [...slots]
  const empties = []
  for (let i = start; i < next.length; i++) if (!next[i]) empties.push(i)
  for (let i = 0; i < start; i++) if (!next[i]) empties.push(i)

  for (const id of ids) {
    let at = empties.shift()
    if (at === undefined) {
      const base = next.length
      next.push(...blanks(SHEET))
      for (let j = 1; j < SHEET; j++) empties.push(base + j)
      at = base
    }
    next[at] = id
  }
  return next
}

export function useBinder() {
  const [binder, setBinder] = useState(null)
  const [cards, setCards] = useState({}) // id -> { id, url }
  const [saveError, setSaveError] = useState(false)
  const binderRef = useRef(null)
  const cardsRef = useRef({})
  binderRef.current = binder
  cardsRef.current = cards

  const safely = (promise) => promise.catch(() => setSaveError(true))

  useEffect(() => {
    let alive = true
    ;(async () => {
      let meta = null
      let rows = []
      try {
        ;[meta, rows] = await Promise.all([db.getMeta(), db.getCards()])
      } catch {
        setSaveError(true) // storage blocked (private window, etc.): the binder still works, it just won't persist
      }
      if (!alive) return
      const map = {}
      for (const r of rows) map[r.id] = { id: r.id, url: URL.createObjectURL(r.blob) }
      const loaded = { ...DEFAULT_BINDER, ...meta }
      loaded.slots = loaded.slots.map((id) => (id && map[id] ? id : null))
      loaded.proxies = Object.fromEntries(Object.entries(loaded.proxies).filter(([id]) => map[id]))
      setCards(map)
      setBinder(loaded)
    })()
    return () => {
      alive = false
    }
  }, [])

  useEffect(() => {
    if (!binder) return
    const t = setTimeout(() => safely(db.putMeta(binder)), 200)
    return () => clearTimeout(t)
  }, [binder])

  async function addBlob(blob) {
    const id = uid()
    await safely(db.putCard({ id, blob }))
    return { id, url: URL.createObjectURL(blob) }
  }

  // added: [{ card, name, proxy? }]. Slots are chosen inside the state updater, so several commits
  // in flight at once (clicking cards quickly in the search panel) each see the previous one's pockets.
  function commit(added, start, failed = []) {
    if (!added.length) return { placed: 0, failed, first: null }
    const ids = added.map((a) => a.card.id)
    flushSync(() => {
      setCards((c) => ({ ...c, ...Object.fromEntries(added.map((a) => [a.card.id, a.card])) }))
      setBinder((b) => ({
        ...b,
        slots: place(b.slots, ids, start),
        names: {
          ...b.names,
          ...Object.fromEntries(added.filter((a) => a.name).map((a) => [a.card.id, a.name])),
        },
        proxies: {
          ...b.proxies,
          ...Object.fromEntries(added.filter((a) => a.proxy).map((a) => [a.card.id, a.proxy])),
        },
      }))
    })
    navigator.storage?.persist?.() // ask the browser not to evict the photos under storage pressure
    return { placed: added.length, failed, first: binderRef.current.slots.indexOf(ids[0]) }
  }

  async function importFiles(files, start = 0) {
    const added = []
    const failed = []
    for (const file of files) {
      try {
        added.push({ card: await addBlob(await processImage(file)), name: nameFromFile(file) })
      } catch {
        failed.push(file.name)
      }
    }
    return commit(added, start, failed)
  }

  async function loadSamples(count = 12) {
    const added = []
    for (let i = 0; i < count; i++) {
      added.push({ card: await addBlob(await makeSampleCard(i)), name: `Sample ${i + 1}` })
    }
    return commit(added, 0)
  }

  // A card downloaded from the search panel, placed in the first empty pocket from `start`.
  async function importRemote(result, start = 0) {
    try {
      const card = await addBlob(await processImage(await fetchImageBlob(result.full)))
      const { first } = commit([{ card, name: result.name, proxy: result.id }], start)
      return { ok: true, first }
    } catch {
      return { ok: false, first: null }
    }
  }

  function markOwned(id) {
    setBinder((b) => {
      const { [id]: _was, ...proxies } = b.proxies
      return { ...b, proxies }
    })
  }

  function dropCard(id) {
    const card = cardsRef.current[id]
    if (card) URL.revokeObjectURL(card.url)
    setCards(({ [id]: _gone, ...rest }) => rest)
    setBinder((b) => {
      const { [id]: _name, ...names } = b.names
      const { [id]: _proxy, ...proxies } = b.proxies
      return { ...b, names, proxies }
    })
    safely(db.deleteCard(id))
  }

  function removeCard(slot) {
    const id = binderRef.current.slots[slot]
    if (!id) return
    setBinder((b) => ({ ...b, slots: b.slots.map((s, i) => (i === slot ? null : s)) }))
    dropCard(id)
  }

  async function replaceCard(slot, file) {
    try {
      const card = await addBlob(await processImage(file))
      const oldId = binderRef.current.slots[slot]
      setCards((c) => ({ ...c, [card.id]: card }))
      setBinder((b) => ({
        ...b,
        slots: b.slots.map((s, i) => (i === slot ? card.id : s)),
        names: oldId && b.names[oldId] ? { ...b.names, [card.id]: b.names[oldId] } : b.names,
      }))
      if (oldId) dropCard(oldId)
      return true
    } catch {
      return false
    }
  }

  function moveCard(from, to) {
    if (from === to) return
    setBinder((b) => {
      const slots = [...b.slots]
      ;[slots[from], slots[to]] = [slots[to], slots[from]]
      return { ...b, slots }
    })
  }

  function renameCard(id, name) {
    setBinder((b) => ({ ...b, names: { ...b.names, [id]: name } }))
  }

  function addSheet() {
    setBinder((b) => ({ ...b, slots: [...b.slots, ...blanks(SHEET)] }))
  }

  function removeSheet() {
    setBinder((b) =>
      b.slots.length > SHEET && b.slots.slice(-SHEET).every((s) => !s)
        ? { ...b, slots: b.slots.slice(0, -SHEET) }
        : b,
    )
  }

  function clearAll() {
    for (const card of Object.values(cardsRef.current)) URL.revokeObjectURL(card.url)
    setCards({})
    setBinder((b) => ({ ...b, slots: blanks(SHEET * 2), names: {}, proxies: {} }))
    safely(db.clearCards())
  }

  return {
    binder,
    cards,
    saveError,
    importFiles,
    loadSamples,
    importRemote,
    markOwned,
    removeCard,
    replaceCard,
    moveCard,
    renameCard,
    addSheet,
    removeSheet,
    clearAll,
    setTitle: (title) => setBinder((b) => ({ ...b, title })),
    setCover: (cover) => setBinder((b) => ({ ...b, cover })),
    setFit: (fit) => setBinder((b) => ({ ...b, fit })),
  }
}
