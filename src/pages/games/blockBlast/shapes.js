import { BOARD_SIZE, DIFFICULTY, PIECES_PER_TURN } from "./constants"
import {
  countBlocks,
  countFilledCells,
  findFittingAnchors,
  hasPlacement,
  simulatePlacement,
} from "./boardLogic"

// Candy-style block colors — bright top, mid tone, dark bevel edge.
// 8 warna jenuh ala permen, dipakai tetap per jenis bentuk.
export const BLOCK_PALETTES = [
  {
    id: "blue",
    top: "#74b9ff",
    mid: "#4a9df2",
    dark: "#2f74c8",
    previewBg: "rgba(74, 157, 242, 0.35)",
    previewBorder: "rgba(74, 157, 242, 0.8)",
  },
  {
    id: "green",
    top: "#7edb8b",
    mid: "#4cbf6a",
    dark: "#329450",
    previewBg: "rgba(76, 191, 106, 0.35)",
    previewBorder: "rgba(76, 191, 106, 0.8)",
  },
  {
    id: "red",
    top: "#ff8a80",
    mid: "#f05555",
    dark: "#bf3636",
    previewBg: "rgba(240, 85, 85, 0.35)",
    previewBorder: "rgba(240, 85, 85, 0.8)",
  },
  {
    id: "orange",
    top: "#ffc46b",
    mid: "#f5913e",
    dark: "#c2661f",
    previewBg: "rgba(245, 145, 62, 0.35)",
    previewBorder: "rgba(245, 145, 62, 0.8)",
  },
  {
    id: "yellow",
    top: "#ffe066",
    mid: "#f5c542",
    dark: "#c39a22",
    previewBg: "rgba(245, 197, 66, 0.45)",
    previewBorder: "rgba(201, 161, 46, 0.9)",
  },
  {
    id: "purple",
    top: "#b79aff",
    mid: "#9a7bf2",
    dark: "#7253c9",
    previewBg: "rgba(154, 123, 242, 0.35)",
    previewBorder: "rgba(154, 123, 242, 0.8)",
  },
  {
    id: "cyan",
    top: "#7be9e4",
    mid: "#39c8cf",
    dark: "#1f9aa0",
    previewBg: "rgba(57, 200, 207, 0.35)",
    previewBorder: "rgba(57, 200, 207, 0.8)",
  },
  {
    id: "pink",
    top: "#ffa3d1",
    mid: "#f070b8",
    dark: "#bd4a8b",
    previewBg: "rgba(240, 112, 184, 0.35)",
    previewBorder: "rgba(240, 112, 184, 0.8)",
  },
]

export const PALETTE_BY_ID = Object.fromEntries(
  BLOCK_PALETTES.map((palette) => [palette.id, palette])
)

// ── Pustaka bentuk ───────────────────────────────────────────────────────────
// Setiap family punya satu warna tetap; bentuk tidak bisa diputar/dibalik.
const SHAPE_FAMILIES = [
  { id: "dot", color: "yellow", size: "small", shapes: [["dot", [[1]]]] },
  {
    id: "line2",
    color: "green",
    size: "small",
    shapes: [
      ["h2", [[1, 1]]],
      ["v2", [[1], [1]]],
    ],
  },
  {
    id: "line3",
    color: "blue",
    size: "medium",
    shapes: [
      ["h3", [[1, 1, 1]]],
      ["v3", [[1], [1], [1]]],
    ],
  },
  {
    id: "line4",
    color: "purple",
    size: "large",
    shapes: [
      ["h4", [[1, 1, 1, 1]]],
      ["v4", [[1], [1], [1], [1]]],
    ],
  },
  {
    id: "line5",
    color: "cyan",
    size: "large",
    shapes: [
      ["h5", [[1, 1, 1, 1, 1]]],
      ["v5", [[1], [1], [1], [1], [1]]],
    ],
  },
  {
    id: "square2",
    color: "orange",
    size: "small",
    shapes: [["sq2", [[1, 1], [1, 1]]]],
  },
  {
    id: "square3",
    color: "red",
    size: "large",
    shapes: [["sq3", [[1, 1, 1], [1, 1, 1], [1, 1, 1]]]],
  },
  {
    id: "rect23",
    color: "pink",
    size: "large",
    shapes: [
      ["rect23", [[1, 1], [1, 1], [1, 1]]],
      ["rect32", [[1, 1, 1], [1, 1, 1]]],
    ],
  },
  {
    id: "corner",
    color: "pink",
    size: "small",
    shapes: [
      ["c1", [[1, 1], [1, 0]]],
      ["c2", [[1, 1], [0, 1]]],
      ["c3", [[1, 0], [1, 1]]],
      ["c4", [[0, 1], [1, 1]]],
    ],
  },
  {
    id: "t",
    color: "cyan",
    size: "medium",
    shapes: [
      ["t1", [[1, 1, 1], [0, 1, 0]]],
      ["t2", [[0, 1, 0], [1, 1, 1]]],
      ["t3", [[1, 0], [1, 1], [1, 0]]],
      ["t4", [[0, 1], [1, 1], [0, 1]]],
    ],
  },
  {
    id: "ltetromino",
    color: "purple",
    size: "medium",
    shapes: [
      ["l1", [[1, 0], [1, 0], [1, 1]]],
      ["l2", [[0, 1], [0, 1], [1, 1]]],
      ["l3", [[1, 1], [1, 0], [1, 0]]],
      ["l4", [[1, 1], [0, 1], [0, 1]]],
    ],
  },
  {
    id: "bigL",
    color: "orange",
    size: "large",
    shapes: [
      ["bigL1", [[1, 0, 0], [1, 0, 0], [1, 1, 1]]],
      ["bigL2", [[0, 0, 1], [0, 0, 1], [1, 1, 1]]],
      ["bigL3", [[1, 1, 1], [1, 0, 0], [1, 0, 0]]],
      ["bigL4", [[1, 1, 1], [0, 0, 1], [0, 0, 1]]],
    ],
  },
  {
    id: "s",
    color: "green",
    size: "medium",
    shapes: [
      ["s1", [[1, 1, 0], [0, 1, 1]]],
      ["s2", [[0, 1], [1, 1], [1, 0]]],
    ],
  },
  {
    id: "z",
    color: "red",
    size: "medium",
    shapes: [
      ["z1", [[0, 1, 1], [1, 1, 0]]],
      ["z2", [[1, 0], [1, 1], [0, 1]]],
    ],
  },
]

// Bentuk rata per kategori (dipakai generator berbobot)
export const SHAPE_DEFINITIONS = { small: [], medium: [], large: [] }
export const SHAPE_COLOR_BY_NAME = {}

SHAPE_FAMILIES.forEach((family) => {
  const palette = PALETTE_BY_ID[family.color]
  family.shapes.forEach(([name, matrix]) => {
    SHAPE_DEFINITIONS[family.size].push({ name, matrix })
    SHAPE_COLOR_BY_NAME[name] = palette
  })
})

const ALL_SHAPES = Object.values(SHAPE_DEFINITIONS).flat()

export function colorForShape(name) {
  return SHAPE_COLOR_BY_NAME[name] ?? BLOCK_PALETTES[0]
}

function pick(list, rng) {
  return list[Math.floor(rng() * list.length) % list.length]
}

/**
 * Bobot kategori dinamis ringan:
 * - papan makin penuh → blok kecil makin sering
 * - skor makin tinggi → blok besar makin sering
 */
export function getCategoryWeights(board, score = 0) {
  const fill = board ? countFilledCells(board) / (BOARD_SIZE * BOARD_SIZE) : 0
  const scoreFactor = Math.min(Math.max(score, 0) / DIFFICULTY.scoreReference, 1)

  return {
    small: DIFFICULTY.baseWeights.small * (1 + fill * DIFFICULTY.fillInfluence),
    medium: DIFFICULTY.baseWeights.medium,
    large: DIFFICULTY.baseWeights.large * (1 + scoreFactor * DIFFICULTY.scoreInfluence),
  }
}

function randomCategory(board, score, rng) {
  const weights = getCategoryWeights(board, score)
  const total = weights.small + weights.medium + weights.large
  let roll = rng() * total
  if ((roll -= weights.small) < 0) return "small"
  if ((roll -= weights.medium) < 0) return "medium"
  return "large"
}

export function makePiece(shape, rng = Math.random) {
  return {
    id: `${shape.name}-${Math.floor(rng() * 1e9).toString(36)}`,
    name: shape.name,
    matrix: shape.matrix,
    color: colorForShape(shape.name),
    blockCount: countBlocks(shape.matrix),
    used: false,
  }
}

function randomPiece(board, { rng = Math.random, score = 0 } = {}) {
  const category = randomCategory(board, score, rng)
  return makePiece(pick(SHAPE_DEFINITIONS[category], rng), rng)
}

/**
 * Apakah ketiga blok bisa dipasang dalam setidaknya satu urutan? Papan ikut
 * di-clear tiap langkah supaya urutannya realistis. Kalau budget habis, anggap
 * bisa (lebih baik memberi set yang mungkin daripada menolak set adil).
 */
export function hasPlayableOrder(board, pieces, budget = DIFFICULTY.orderSearchBudget) {
  if (!board || !pieces.length) return true
  const state = { nodes: budget }
  const used = new Array(pieces.length).fill(false)

  const search = (currentBoard, remaining) => {
    if (remaining === 0) return true
    if (state.nodes <= 0) return true
    state.nodes -= 1

    for (let i = 0; i < pieces.length; i++) {
      if (used[i]) continue
      used[i] = true
      const anchors = findFittingAnchors(currentBoard, pieces[i].matrix, 20)
      for (const anchor of anchors) {
        const { clearedBoard } = simulatePlacement(
          currentBoard,
          pieces[i],
          anchor.r,
          anchor.c
        )
        if (search(clearedBoard, remaining - 1)) {
          used[i] = false
          return true
        }
        if (state.nodes <= 0) {
          used[i] = false
          return true
        }
      }
      used[i] = false
    }
    return false
  }

  return search(board, pieces.length)
}

function allSameShape(pieces) {
  return pieces.every((piece) => piece.name === pieces[0].name)
}

/**
 * Generator set 3 blok. Fungsi murni: RNG bisa di-inject untuk testing.
 * Jaminan: minimal satu blok muat (selama papan masih punya ruang), dan
 * sebisa mungkin ketiganya bisa dimainkan dalam satu urutan.
 */
export function generatePieces(board, options = {}) {
  const { rng = Math.random, score = 0, count = PIECES_PER_TURN } = options
  const hasBoard = Boolean(board)

  const randomTrio = () => Array.from({ length: count }, () => randomPiece(board, { rng, score }))

  for (let attempt = 0; attempt < DIFFICULTY.maxAttempts; attempt++) {
    const trio = randomTrio()
    if (allSameShape(trio)) continue
    if (!hasBoard) return trio
    if (!trio.some((piece) => hasPlacement(board, piece.matrix))) continue
    if (hasPlayableOrder(board, trio)) return trio
  }

  // Longgar: cukup satu blok yang muat
  if (hasBoard) {
    for (let attempt = 0; attempt < DIFFICULTY.maxAttempts; attempt++) {
      const trio = randomTrio()
      if (allSameShape(trio)) continue
      if (trio.some((piece) => hasPlacement(board, piece.matrix))) return trio
    }
  }

  return buildFallbackTrio(board, { rng, count })
}

// Jaring pengaman: satu bentuk kecil yang pasti muat, sisanya acak
function buildFallbackTrio(board, { rng = Math.random, count = PIECES_PER_TURN } = {}) {
  const fitting = board
    ? ALL_SHAPES.filter((shape) => hasPlacement(board, shape.matrix))
    : ALL_SHAPES
  const pool = fitting.length ? fitting : ALL_SHAPES
  const first = makePiece(pick(pool, rng), rng)
  const trio = [first]
  let guard = 0

  while (trio.length < count && guard < 40) {
    guard += 1
    const piece = randomPiece(board, { rng, score: 0 })
    if (trio.some((existing) => existing.name === piece.name)) continue
    trio.push(piece)
  }

  while (trio.length < count) {
    trio.push(randomPiece(board, { rng, score: 0 }))
  }

  return trio
}

// Alias lama; dipertahankan supaya import lama tetap jalan saat transisi UI.
export function generateThreePieces(board) {
  return generatePieces(board)
}

export const SHAPE_FAMILY_COUNT = SHAPE_FAMILIES.length
