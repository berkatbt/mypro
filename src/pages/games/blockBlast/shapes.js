import { PIECES_PER_TURN, PIECE_GENERATION } from "./constants"
import { hasPlacement } from "./boardLogic"

// Candy-style block colors — bright top, mid tone, dark bevel edge
// (playful look like the real Block Blast, no neon glow)
export const BLOCK_PALETTES = [
  {
    id: "candy-red",
    top: "#ff8a80",
    mid: "#f05555",
    dark: "#c73e3e",
    previewBg: "rgba(240, 85, 85, 0.35)",
    previewBorder: "rgba(240, 85, 85, 0.75)",
  },
  {
    id: "candy-orange",
    top: "#ffb74d",
    mid: "#f5913e",
    dark: "#c96f2b",
    previewBg: "rgba(245, 145, 62, 0.35)",
    previewBorder: "rgba(245, 145, 62, 0.75)",
  },
  {
    id: "candy-yellow",
    top: "#ffe066",
    mid: "#f5c542",
    dark: "#c9a12e",
    previewBg: "rgba(245, 197, 66, 0.45)",
    previewBorder: "rgba(201, 161, 46, 0.9)",
  },
  {
    id: "candy-green",
    top: "#7edb8b",
    mid: "#4cbf6a",
    dark: "#379e53",
    previewBg: "rgba(76, 191, 106, 0.35)",
    previewBorder: "rgba(76, 191, 106, 0.75)",
  },
  {
    id: "candy-blue",
    top: "#74b9ff",
    mid: "#4a9df2",
    dark: "#337fd0",
    previewBg: "rgba(74, 157, 242, 0.35)",
    previewBorder: "rgba(74, 157, 242, 0.75)",
  },
  {
    id: "candy-purple",
    top: "#b79aff",
    mid: "#9a7bf2",
    dark: "#7c5cd1",
    previewBg: "rgba(154, 123, 242, 0.35)",
    previewBorder: "rgba(154, 123, 242, 0.75)",
  },
  {
    id: "candy-cyan",
    top: "#7be9e4",
    mid: "#39c8cf",
    dark: "#249ea6",
    previewBg: "rgba(57, 200, 207, 0.35)",
    previewBorder: "rgba(57, 200, 207, 0.75)",
  },
]

// Shape definitions categorized by size/difficulty
export const SHAPE_DEFINITIONS = {
  small: [
    { name: "dot", matrix: [[1]] },
    { name: "h2", matrix: [[1, 1]] },
    { name: "v2", matrix: [[1], [1]] },
    { name: "sq2", matrix: [[1, 1], [1, 1]] },
    { name: "c1", matrix: [[1, 1], [1, 0]] },
    { name: "c2", matrix: [[1, 1], [0, 1]] },
    { name: "c3", matrix: [[1, 0], [1, 1]] },
    { name: "c4", matrix: [[0, 1], [1, 1]] },
  ],
  medium: [
    { name: "h3", matrix: [[1, 1, 1]] },
    { name: "v3", matrix: [[1], [1], [1]] },
    { name: "t1", matrix: [[1, 1, 1], [0, 1, 0]] },
    { name: "t2", matrix: [[0, 1, 0], [1, 1, 1]] },
    { name: "t3", matrix: [[1, 0], [1, 1], [1, 0]] },
    { name: "t4", matrix: [[0, 1], [1, 1], [0, 1]] },
    { name: "l1", matrix: [[1, 0], [1, 0], [1, 1]] },
    { name: "l2", matrix: [[0, 1], [0, 1], [1, 1]] },
    { name: "l3", matrix: [[1, 1], [1, 0], [1, 0]] },
    { name: "l4", matrix: [[1, 1], [0, 1], [0, 1]] },
    { name: "lh1", matrix: [[1, 1, 1], [1, 0, 0]] },
    { name: "lh2", matrix: [[1, 1, 1], [0, 0, 1]] },
    { name: "lh3", matrix: [[1, 0, 0], [1, 1, 1]] },
    { name: "lh4", matrix: [[0, 0, 1], [1, 1, 1]] },
    { name: "z1", matrix: [[1, 1, 0], [0, 1, 1]] },
    { name: "z2", matrix: [[0, 1, 1], [1, 1, 0]] },
  ],
  large: [
    { name: "h4", matrix: [[1, 1, 1, 1]] },
    { name: "v4", matrix: [[1], [1], [1], [1]] },
    { name: "h5", matrix: [[1, 1, 1, 1, 1]] },
    { name: "v5", matrix: [[1], [1], [1], [1], [1]] },
    { name: "sq3", matrix: [[1, 1, 1], [1, 1, 1], [1, 1, 1]] },
    { name: "rect23", matrix: [[1, 1], [1, 1], [1, 1]] },
    { name: "rect32", matrix: [[1, 1, 1], [1, 1, 1]] },
    { name: "bigL1", matrix: [[1, 0, 0], [1, 0, 0], [1, 1, 1]] },
    { name: "bigL2", matrix: [[0, 0, 1], [0, 0, 1], [1, 1, 1]] },
    { name: "bigL3", matrix: [[1, 1, 1], [1, 0, 0], [1, 0, 0]] },
    { name: "bigL4", matrix: [[1, 1, 1], [0, 0, 1], [0, 0, 1]] },
  ],
}

const ALL_SHAPES = Object.values(SHAPE_DEFINITIONS).flat()

let pieceSeq = 0

function makePiece(shape) {
  const palette = BLOCK_PALETTES[Math.floor(Math.random() * BLOCK_PALETTES.length)]
  const blockCount = shape.matrix.reduce(
    (sum, row) => sum + row.reduce((rSum, cell) => rSum + (cell ? 1 : 0), 0),
    0
  )

  pieceSeq += 1

  return {
    id: `p${pieceSeq}-${Date.now().toString(36)}`,
    name: shape.name,
    matrix: shape.matrix,
    color: palette,
    blockCount,
    used: false,
  }
}

// Kategori dipilih berbobot: balok kecil lebih sering muncul, balok besar jarang
function randomCategory() {
  const entries = Object.entries(PIECE_GENERATION.weights)
  const total = entries.reduce((sum, [, weight]) => sum + weight, 0)
  let roll = Math.random() * total
  for (const [category, weight] of entries) {
    roll -= weight
    if (roll < 0) return category
  }
  return entries[0][0]
}

function randomPiece() {
  const pool = SHAPE_DEFINITIONS[randomCategory()]
  return makePiece(pool[Math.floor(Math.random() * pool.length)])
}

/**
 * Generate a trio of 3 pieces. Adil seperti aslinya: set yang dihasilkan selalu
 * punya minimal satu balok yang masih bisa dipasang di papan saat ini, jadi
 * permainan tidak berakhir gara-gara set mustahil.
 */
export function generateThreePieces(board) {
  for (let attempt = 0; attempt < PIECE_GENERATION.maxAttempts; attempt++) {
    const trio = Array.from({ length: PIECES_PER_TURN }, randomPiece)
    if (!board || trio.some((piece) => hasPlacement(board, piece.matrix))) {
      return trio
    }
  }

  return buildPlayableTrio(board)
}

// Jaring pengaman: pilih satu bentuk yang pasti muat dulu, sisanya acak
function buildPlayableTrio(board) {
  const fitting = board ? ALL_SHAPES.filter((shape) => hasPlacement(board, shape.matrix)) : ALL_SHAPES

  if (!fitting.length) {
    // Papan benar-benar penuh untuk semua bentuk — biarkan game over terjadi
    return Array.from({ length: PIECES_PER_TURN }, randomPiece)
  }

  const first = makePiece(fitting[Math.floor(Math.random() * fitting.length)])
  const rest = Array.from({ length: PIECES_PER_TURN - 1 }, randomPiece)
  return [first, ...rest]
}
