export const BOARD_SIZE = 8

/**
 * Creates an empty 8x8 board initialized with null
 */
export function createEmptyBoard(size = BOARD_SIZE) {
  return Array.from({ length: size }, () => Array(size).fill(null))
}

/**
 * Checks if a given piece matrix can be placed at (startRow, startCol) on the board
 */
export function canPlacePiece(board, matrix, startRow, startCol) {
  if (!matrix || !matrix.length) return false
  const rows = matrix.length
  const cols = matrix[0].length

  // Quick boundary check
  if (startRow < 0 || startCol < 0) return false
  if (startRow + rows > BOARD_SIZE || startCol + cols > BOARD_SIZE) return false

  for (let r = 0; r < rows; r++) {
    for (let c = 0; c < cols; c++) {
      if (matrix[r][c] === 1) {
        const boardR = startRow + r
        const boardC = startCol + c
        if (board[boardR][boardC] !== null) {
          return false
        }
      }
    }
  }

  return true
}

/**
 * Places the piece on the board and returns a cloned new board state
 */
export function placePieceOnBoard(board, matrix, startRow, startCol, color) {
  const newBoard = board.map((row) => [...row])
  const rows = matrix.length
  const cols = matrix[0].length

  for (let r = 0; r < rows; r++) {
    for (let c = 0; c < cols; c++) {
      if (matrix[r][c] === 1) {
        newBoard[startRow + r][startCol + c] = { ...color }
      }
    }
  }

  return newBoard
}

/**
 * Checks all rows and columns to find completed lines
 */
export function findCompletedLines(board) {
  const rowsToClear = []
  const colsToClear = []

  // Check rows
  for (let r = 0; r < BOARD_SIZE; r++) {
    if (board[r].every((cell) => cell !== null)) {
      rowsToClear.push(r)
    }
  }

  // Check columns
  for (let c = 0; c < BOARD_SIZE; c++) {
    let colFull = true
    for (let r = 0; r < BOARD_SIZE; r++) {
      if (board[r][c] === null) {
        colFull = false
        break
      }
    }
    if (colFull) {
      colsToClear.push(c)
    }
  }

  return { rowsToClear, colsToClear }
}

/**
 * Clears lines from the board and returns new board
 */
export function clearLinesFromBoard(board, rowsToClear, colsToClear) {
  const newBoard = board.map((row) => [...row])

  rowsToClear.forEach((r) => {
    for (let c = 0; c < BOARD_SIZE; c++) {
      newBoard[r][c] = null
    }
  })

  colsToClear.forEach((c) => {
    for (let r = 0; r < BOARD_SIZE; r++) {
      newBoard[r][c] = null
    }
  })

  return newBoard
}

/**
 * Checks if ANY of the unused pieces can be placed anywhere on the current board
 */
export function isGameOver(board, pieces) {
  const activePieces = pieces.filter((p) => !p.used)
  if (activePieces.length === 0) return false

  for (const piece of activePieces) {
    const rows = piece.matrix.length
    const cols = piece.matrix[0].length

    for (let r = 0; r <= BOARD_SIZE - rows; r++) {
      for (let c = 0; c <= BOARD_SIZE - cols; c++) {
        if (canPlacePiece(board, piece.matrix, r, c)) {
          return false // Found a legal move!
        }
      }
    }
  }

  // No legal move for any available piece
  return true
}

/**
 * Calculate scores with line bonuses and combo multipliers
 */
export function calculateScore(blockCount, clearedLines, currentCombo) {
  const basePoints = blockCount

  if (clearedLines === 0) {
    return {
      points: basePoints,
      newCombo: 0,
      cleared: 0,
      bannerText: null,
    }
  }

  // Multi-line bonus
  let lineBonus = 100
  if (clearedLines === 2) lineBonus = 300
  else if (clearedLines === 3) lineBonus = 600
  else if (clearedLines >= 4) lineBonus = 1000 + (clearedLines - 4) * 400

  // Combo multiplier
  const nextCombo = currentCombo + 1
  const comboBonus = nextCombo > 1 ? (nextCombo - 1) * 75 : 0
  const totalScore = basePoints + lineBonus + comboBonus

  let bannerText = "LINE CLEAR! 💥"
  if (clearedLines > 1 && nextCombo === 1) {
    bannerText = `${clearedLines} LINES BLAST! ⚡`
  } else if (nextCombo === 2) {
    bannerText = "GREAT! COMBO x2 🔥"
  } else if (nextCombo === 3) {
    bannerText = "AWESOME! COMBO x3 ⚡"
  } else if (nextCombo >= 4) {
    bannerText = `UNBELIEVABLE! COMBO x${nextCombo} 🌟`
  }

  return {
    points: totalScore,
    newCombo: nextCombo,
    cleared: clearedLines,
    bannerText,
  }
}
