import { createEmptyBoard } from "../boardLogic"
import { BLOCK_PALETTES } from "../shapes"

// Deterministic mulberry32 RNG for generator tests
export function seededRng(seed) {
  let state = seed >>> 0
  return function next() {
    state = (state + 0x6d2b79f5) >>> 0
    let t = state
    t = Math.imul(t ^ (t >>> 15), t | 1)
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61)
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}

export const color = BLOCK_PALETTES[0]

export function fillRows(board, rows, palette = color) {
  rows.forEach((row) => {
    for (let c = 0; c < board[row].length; c++) board[row][c] = palette
  })
  return board
}

export function fillCols(board, cols, palette = color) {
  cols.forEach((col) => {
    for (let r = 0; r < board.length; r++) board[r][col] = palette
  })
  return board
}

// Board penuh dengan `emptyCells` lubang di ujung kanan-bawah
export function mostlyFullBoard(emptyCells = 0) {
  const board = createEmptyBoard()
  for (let r = 0; r < board.length; r++) {
    for (let c = 0; c < board.length; c++) board[r][c] = color
  }

  const size = board.length
  const holes = Math.min(emptyCells, size * size)
  for (let i = 0; i < holes; i++) {
    const index = size * size - 1 - i
    board[Math.floor(index / size)][index % size] = null
  }
  return board
}
