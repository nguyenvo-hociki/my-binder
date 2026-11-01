// Phone photos are 4-12 MB. Shrink them on import so a full binder stays small.
const MAX_EDGE = 1400
const QUALITY = 0.88

async function decode(file) {
  try {
    return await createImageBitmap(file) // applies EXIF rotation for phone photos
  } catch {
    // older Safari and some formats: fall back to an <img> element
    const url = URL.createObjectURL(file)
    try {
      const img = new Image()
      img.src = url
      await img.decode()
      return img
    } finally {
      URL.revokeObjectURL(url)
    }
  }
}

function toBlob(canvas) {
  return new Promise((resolve, reject) =>
    canvas.toBlob((b) => (b ? resolve(b) : reject(new Error('encode failed'))), 'image/jpeg', QUALITY),
  )
}

// Any image the browser can decode (jpg, png, webp, gif, avif...) -> a resized JPEG blob.
export async function processImage(file) {
  const src = await decode(file)
  const w = src.naturalWidth ?? src.width
  const h = src.naturalHeight ?? src.height
  const scale = Math.min(1, MAX_EDGE / Math.max(w, h))

  const canvas = document.createElement('canvas')
  canvas.width = Math.round(w * scale)
  canvas.height = Math.round(h * scale)
  const ctx = canvas.getContext('2d')
  ctx.fillStyle = '#fff' // JPEG has no alpha: flatten transparent PNGs onto white
  ctx.fillRect(0, 0, canvas.width, canvas.height)
  ctx.drawImage(src, 0, 0, canvas.width, canvas.height)
  src.close?.()
  return toBlob(canvas)
}

// --- placeholder cards so the binder can be previewed before importing real photos ---

const SAMPLE_TYPES = [
  ['Fire', '#ff9a5c', '#b3261e'],
  ['Water', '#5cb4ff', '#1a4fb8'],
  ['Grass', '#6fdc78', '#1f7a3a'],
  ['Electric', '#ffe85c', '#c48a00'],
  ['Psychic', '#d28dff', '#6a2ea8'],
  ['Dark', '#7a7f99', '#1b1c26'],
  ['Fairy', '#ffa8dc', '#c2478f'],
  ['Steel', '#c4ccd8', '#5b6577'],
]

function roundRect(ctx, x, y, w, h, r) {
  ctx.beginPath()
  ctx.moveTo(x + r, y)
  ctx.arcTo(x + w, y, x + w, y + h, r)
  ctx.arcTo(x + w, y + h, x, y + h, r)
  ctx.arcTo(x, y + h, x, y, r)
  ctx.arcTo(x, y, x + w, y, r)
  ctx.closePath()
}

export function makeSampleCard(n) {
  const [type, light, dark] = SAMPLE_TYPES[n % SAMPLE_TYPES.length]
  const W = 630
  const H = 880
  const canvas = document.createElement('canvas')
  canvas.width = W
  canvas.height = H
  const ctx = canvas.getContext('2d')

  const frame = ctx.createLinearGradient(0, 0, W, H)
  frame.addColorStop(0, '#ffe27a')
  frame.addColorStop(1, '#c99a1b')
  ctx.fillStyle = frame
  roundRect(ctx, 0, 0, W, H, 34)
  ctx.fill()

  const body = ctx.createLinearGradient(0, 0, 0, H)
  body.addColorStop(0, light)
  body.addColorStop(1, dark)
  ctx.fillStyle = body
  roundRect(ctx, 24, 24, W - 48, H - 48, 18)
  ctx.fill()

  ctx.fillStyle = '#fff'
  ctx.textBaseline = 'middle'
  ctx.font = '700 44px system-ui, sans-serif'
  ctx.fillText(`${type} Sample`, 54, 80)
  ctx.textAlign = 'right'
  ctx.fillText(`HP ${60 + (n % 6) * 20}`, W - 54, 80)
  ctx.textAlign = 'left'

  // art window with a pokeball-ish emblem
  const ax = 54
  const ay = 120
  const aw = W - 108
  const ah = 380
  const art = ctx.createRadialGradient(W / 2, ay + ah / 2, 10, W / 2, ay + ah / 2, 280)
  art.addColorStop(0, 'rgba(255,255,255,0.95)')
  art.addColorStop(1, light)
  ctx.fillStyle = art
  roundRect(ctx, ax, ay, aw, ah, 10)
  ctx.fill()
  ctx.strokeStyle = '#d9a82a'
  ctx.lineWidth = 8
  ctx.stroke()
  ctx.strokeStyle = 'rgba(20,20,40,0.35)'
  ctx.lineWidth = 14
  ctx.beginPath()
  ctx.arc(W / 2, ay + ah / 2, 120, 0, Math.PI * 2)
  ctx.moveTo(W / 2 - 120, ay + ah / 2)
  ctx.lineTo(W / 2 - 38, ay + ah / 2)
  ctx.moveTo(W / 2 + 38, ay + ah / 2)
  ctx.lineTo(W / 2 + 120, ay + ah / 2)
  ctx.stroke()
  ctx.beginPath()
  ctx.arc(W / 2, ay + ah / 2, 38, 0, Math.PI * 2)
  ctx.stroke()

  // text box
  ctx.fillStyle = 'rgba(255, 248, 225, 0.92)'
  roundRect(ctx, 54, 530, W - 108, 250, 12)
  ctx.fill()
  ctx.fillStyle = 'rgba(40, 30, 10, 0.55)'
  ctx.font = '600 30px system-ui, sans-serif'
  ctx.fillText('Replace me with your own photo', 78, 578)
  for (let i = 0; i < 3; i++) {
    ctx.fillStyle = 'rgba(40, 30, 10, 0.18)'
    roundRect(ctx, 78, 614 + i * 40, W - 156 - (i === 2 ? 140 : 0), 16, 8)
    ctx.fill()
  }

  ctx.fillStyle = 'rgba(255,255,255,0.85)'
  ctx.font = '600 24px system-ui, sans-serif'
  ctx.textAlign = 'right'
  ctx.fillText(`${String(n + 1).padStart(3, '0')} / 012`, W - 54, H - 54)

  return toBlob(canvas)
}
