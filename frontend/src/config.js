// Pockets per page. Change COLS/ROWS for a 4x3 (12-pocket) binder, then use
// "Clear all" once: saved binders keep the slot layout they were created with.
export const COLS = 3
const ROWS = 3
export const PER_PAGE = COLS * ROWS
export const SHEET = PER_PAGE * 2 // one physical sheet = a front page and a back page

// Wheel / trackpad scrolling of the page.
//   speed:    distance as a fraction of normal (1 = browser default, 0.5 = half).
//   maxSpeed: ceiling in px per second, so a hard flick can't make the page fly.
//   maxGlide: most distance (px) one flick can have waiting to scroll; the rest of a long flick is dropped.
export const SCROLL = { speed: 0.5, maxSpeed: 900, maxGlide: 150 }

export const COVERS = [
  { id: 'poke', name: 'Poké Red', a: '#e11d2e', b: '#7a0a14' },
  { id: 'ultra', name: 'Ultra Blue', a: '#2f6bff', b: '#0b1f6b' },
  { id: 'master', name: 'Master Black', a: '#42465a', b: '#0d0e14' },
  { id: 'electric', name: 'Electric Yellow', a: '#ffd23a', b: '#a8740a' },
  { id: 'leaf', name: 'Leaf Green', a: '#2fbf71', b: '#0c5a36' },
  { id: 'psychic', name: 'Psychic Purple', a: '#a259ff', b: '#3b1677' },
]
