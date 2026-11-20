import { BOARD_SIZE, PIECES_PER_TURN, STORAGE_KEYS } from "./constants"
import { BLOCK_PALETTES, PALETTE_BY_ID } from "./shapes"

function read(key) {
  try {
    return window.localStorage.getItem(key)
  } catch {
    return null
  }
}

function write(key, value) {
  try {
    window.localStorage.setItem(key, value)
  } catch {}
}

function remove(key) {
  try {
    window.localStorage.removeItem(key)
  } catch {}
}

export function loadBest() {
  const raw = read(STORAGE_KEYS.best)
  const parsed = Number.parseInt(raw ?? "", 10)
  return Number.isFinite(parsed) && parsed > 0 ? parsed : 0
}

export function saveBest(score) {
  write(STORAGE_KEYS.best, String(Math.max(0, Math.round(score))))
}

export function loadSettings() {
  const raw = read(STORAGE_KEYS.settings)
  if (!raw) return null
  try {
    const parsed = JSON.parse(raw)
    if (!parsed || typeof parsed !== "object") return null
    return {
      muted: Boolean(parsed.muted),
      vibration: parsed.vibration !== false,
    }
  } catch {
    return null
  }
}

export function saveSettings(settings) {
  try {
    write(
      STORAGE_KEYS.settings,
      JSON.stringify({ muted: Boolean(settings.muted), vibration: settings.vibration !== false })
    )
  } catch {}
}

// ── Serialisasi game berjalan ────────────────────────────────────────────────
// Papan disimpan sebagai id warna (string) supaya tahan perubahan bentuk objek.

export function serializeGame(state) {
  return {
    version: 1,
    board: state.board.map((row) =>
      row.map((cell) => (cell && cell.id ? cell.id : null))
    ),
    pieces: state.pieces.map((piece) => ({
      id: piece.id,
      name: piece.name,
      matrix: piece.matrix,
      color: piece.color?.id ?? null,
      used: Boolean(piece.used),
    })),
    score: Math.max(0, Math.round(state.score ?? 0)),
    streak: Math.max(0, Math.round(state.streak ?? 0)),
    dryPlacements: Math.max(0, Math.round(state.dryPlacements ?? 0)),
    totalCleared: Math.max(0, Math.round(state.totalCleared ?? 0)),
    gameOver: Boolean(state.gameOver),
  }
}

function isMatrix(value) {
  if (!Array.isArray(value) || value.length < 1 || value.length > BOARD_SIZE) return false
  return value.every(
    (row) =>
      Array.isArray(row) &&
      row.length >= 1 &&
      row.length <= BOARD_SIZE &&
      row.every((cell) => cell === 0 || cell === 1 || cell === true || cell === false)
  )
}

export function deserializeGame(raw) {
  if (!raw || typeof raw !== "object") return null
  const { board, pieces } = raw

  if (!Array.isArray(board) || board.length !== BOARD_SIZE) return null
  const restoredBoard = []
  for (const row of board) {
    if (!Array.isArray(row) || row.length !== BOARD_SIZE) return null
    const nextRow = []
    for (const cell of row) {
      if (cell === null) {
        nextRow.push(null)
        continue
      }
      const palette = PALETTE_BY_ID[cell]
      if (!palette) return null
      nextRow.push(palette)
    }
    restoredBoard.push(nextRow)
  }

  if (!Array.isArray(pieces) || pieces.length !== PIECES_PER_TURN) return null
  const restoredPieces = []
  for (const piece of pieces) {
    if (!piece || typeof piece.id !== "string") return null
    if (!isMatrix(piece.matrix)) return null
    const palette = PALETTE_BY_ID[piece.color]
    if (!palette) return null
    const blockCount = piece.matrix.reduce(
      (sum, row) => sum + row.filter((cell) => Boolean(cell)).length,
      0
    )
    restoredPieces.push({
      id: piece.id,
      name: typeof piece.name === "string" ? piece.name : "custom",
      matrix: piece.matrix.map((row) => row.map((cell) => (cell ? 1 : 0))),
      color: palette,
      blockCount,
      used: Boolean(piece.used),
    })
  }

  const number = (value) => (Number.isFinite(Number(value)) ? Math.max(0, Math.round(Number(value))) : 0)

  return {
    board: restoredBoard,
    pieces: restoredPieces,
    score: number(raw.score),
    streak: number(raw.streak),
    dryPlacements: number(raw.dryPlacements),
    totalCleared: number(raw.totalCleared),
    gameOver: Boolean(raw.gameOver),
  }
}

export function loadGame() {
  const raw = read(STORAGE_KEYS.game)
  if (!raw) return null
  try {
    return deserializeGame(JSON.parse(raw))
  } catch {
    return null
  }
}

export function saveGame(state) {
  try {
    write(STORAGE_KEYS.game, JSON.stringify(serializeGame(state)))
  } catch {}
}

export function clearGame() {
  remove(STORAGE_KEYS.game)
}

// Dipakai test tanpa localStorage
export const PALETTES = BLOCK_PALETTES
