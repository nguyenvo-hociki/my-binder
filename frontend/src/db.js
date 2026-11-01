// Tiny IndexedDB wrapper. Photos are stored as Blobs (localStorage is far too small for them).
//   cards: { id, blob }            one row per photo
//   meta:  'binder' -> { title, cover, slots, names }
const DB_NAME = 'pokemon-binder'
const DB_VERSION = 1
let opened

function open() {
  opened ??= new Promise((resolve, reject) => {
    const req = indexedDB.open(DB_NAME, DB_VERSION)
    req.onupgradeneeded = () => {
      req.result.createObjectStore('cards', { keyPath: 'id' })
      req.result.createObjectStore('meta')
    }
    req.onsuccess = () => resolve(req.result)
    req.onerror = () => reject(req.error)
  })
  return opened
}

async function run(store, mode, fn) {
  const db = await open()
  return new Promise((resolve, reject) => {
    const tx = db.transaction(store, mode)
    const req = fn(tx.objectStore(store))
    tx.oncomplete = () => resolve(req.result)
    tx.onerror = () => reject(tx.error)
    tx.onabort = () => reject(tx.error)
  })
}

export const getCards = () => run('cards', 'readonly', (s) => s.getAll())
export const putCard = (card) => run('cards', 'readwrite', (s) => s.put(card))
export const deleteCard = (id) => run('cards', 'readwrite', (s) => s.delete(id))
export const clearCards = () => run('cards', 'readwrite', (s) => s.clear())
export const getMeta = () => run('meta', 'readonly', (s) => s.get('binder'))
export const putMeta = (meta) => run('meta', 'readwrite', (s) => s.put(meta, 'binder'))
