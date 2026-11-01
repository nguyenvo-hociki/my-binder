// Card lookup. TCGdex is the main source; pokemontcg.io is the fallback (it answers 5xx now and then).
// Both send CORS headers, so the browser can call them directly and read the image bytes.
//
// Every source returns { source, cards, more } with cards shaped like:
//   { id: 'tcgdex:base1-4', name, set, number, thumb, full }
const PAGE_SIZE = 24

const TCGDEX = 'https://api.tcgdex.net/v2/en'
const PTCG = 'https://api.pokemontcg.io/v2'

async function getJson(url, { signal, retries = 0 } = {}) {
  for (let attempt = 0; ; attempt++) {
    let res
    try {
      res = await fetch(url, { signal })
    } catch (e) {
      if (signal?.aborted || attempt >= retries) throw e
      continue
    }
    if (res.ok) return res.json()
    if (res.status < 500 || attempt >= retries) throw new Error(`HTTP ${res.status}`)
  }
}

async function tcgdex(term, page, signal) {
  const url =
    `${TCGDEX}/cards?name=${encodeURIComponent(term)}` +
    `&pagination:page=${page}&pagination:itemsPerPage=${PAGE_SIZE}`
  const raw = await getJson(url, { signal })
  return {
    source: 'tcgdex',
    more: raw.length === PAGE_SIZE,
    cards: raw
      .filter((c) => c.image) // some cards have no scan
      .map((c) => ({
        id: `tcgdex:${c.id}`,
        name: c.name,
        set: c.id.slice(0, c.id.lastIndexOf('-')),
        number: c.localId,
        thumb: `${c.image}/low.webp`,
        full: `${c.image}/high.webp`,
      })),
  }
}

async function ptcg(term, page, signal) {
  const q = `name:"${term.replace(/["\\]/g, '')}*"`
  const url =
    `${PTCG}/cards?q=${encodeURIComponent(q)}&page=${page}&pageSize=${PAGE_SIZE}` +
    `&select=id,name,number,images,set`
  const res = await getJson(url, { signal, retries: 2 })
  return {
    source: 'ptcg',
    more: res.page * res.pageSize < res.totalCount,
    cards: res.data.map((c) => ({
      id: `ptcg:${c.id}`,
      name: c.name,
      set: c.set?.name ?? '',
      number: c.number,
      thumb: c.images.small,
      full: c.images.large,
    })),
  }
}

const SOURCES = { tcgdex, ptcg }

// `source` pins the lookup to one API (used for "load more", so pages don't mix sources).
export async function searchCards(term, page = 1, { signal, source } = {}) {
  let failure
  for (const name of source ? [source] : ['tcgdex', 'ptcg']) {
    try {
      return await SOURCES[name](term, page, signal)
    } catch (e) {
      if (signal?.aborted) throw e
      failure = e
    }
  }
  throw failure
}

export async function fetchImageBlob(url) {
  const res = await fetch(url, { signal: AbortSignal.timeout(25000) })
  if (!res.ok) throw new Error(`HTTP ${res.status}`)
  return res.blob()
}
