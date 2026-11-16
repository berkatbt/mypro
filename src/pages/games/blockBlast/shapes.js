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

/**
 * Generate a trio of 3 balanced pieces so player is never hit with 3 impossible pieces
 */
export function generateThreePieces() {
  const categories = ["small", "medium", "small"]
  // 35% chance to replace one with a 'large' piece
  if (Math.random() < 0.35) {
    categories[1] = "large"
  } else if (Math.random() < 0.5) {
    categories[0] = "medium"
  }

  // Shuffle categories so large/medium isn't always in the same slot
  const shuffledCats = categories.sort(() => Math.random() - 0.5)

  return shuffledCats.map((cat, idx) => {
    const pool = SHAPE_DEFINITIONS[cat]
    const chosen = pool[Math.floor(Math.random() * pool.length)]
    const palette = BLOCK_PALETTES[Math.floor(Math.random() * BLOCK_PALETTES.length)]

    // Count number of blocks in this shape for scoring
    const blockCount = chosen.matrix.reduce(
      (sum, row) => sum + row.reduce((rSum, cell) => rSum + (cell ? 1 : 0), 0),
      0
    )

    return {
      id: `${Date.now()}-${idx}-${Math.random().toString(36).substring(2, 6)}`,
      name: chosen.name,
      matrix: chosen.matrix,
      color: palette,
      blockCount,
      used: false,
    }
  })
}
