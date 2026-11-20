import { BOARD_SIZE } from "./constants"

export const cellKeyOf = (r, c) => `${r}-${c}`

/**
 * Delay tiap sel saat pecah, dihitung dari jarak ke titik penempatan supaya
 * efeknya bergelombang dari blok yang baru diletakkan.
 */
export function buildClearCells(board, rowsToClear, colsToClear, origin, stagger) {
  const cells = new Map()
  const push = (r, c) => {
    const key = cellKeyOf(r, c)
    if (cells.has(key)) return
    const distance = Math.hypot(r - origin.r, c - origin.c)
    cells.set(key, {
      r,
      c,
      delay: distance * stagger,
      colorId: board[r]?.[c]?.id ?? null,
    })
  }

  rowsToClear.forEach((r) => {
    for (let c = 0; c < board.length; c++) push(r, c)
  })
  colsToClear.forEach((c) => {
    for (let r = 0; r < board.length; r++) push(r, c)
  })

  return cells
}

export function maxClearDelay(cells) {
  let max = 0
  cells.forEach((value) => {
    if (value.delay > max) max = value.delay
  })
  return max
}

/**
 * Partikel kotak kecil berwarna tile yang pecah. Deterministik supaya render
 * tetap pure; posisi & arah dari indeks sel.
 */
export function buildParticles(cells, perCell = 2) {
  const particles = []
  cells.forEach(({ r, c, delay, colorId }, key) => {
    for (let i = 0; i < perCell; i++) {
      const seed = (r * 31 + c * 17 + i * 53 + key.length) % 97
      const angle = ((seed / 97) * Math.PI * 2 + i * 1.7) % (Math.PI * 2)
      const speed = 16 + ((seed * 7) % 22)
      particles.push({
        key: `${key}-${i}`,
        x: ((c + 0.5) / BOARD_SIZE) * 100,
        y: ((r + 0.5) / BOARD_SIZE) * 100,
        dx: Math.cos(angle) * speed,
        dy: Math.sin(angle) * speed - 12,
        size: 3 + ((seed * 13) % 4),
        delay: delay + i * 25,
        colorId,
      })
    }
  })
  return particles
}
