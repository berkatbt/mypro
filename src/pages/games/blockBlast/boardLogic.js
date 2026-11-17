import { BOARD_SIZE, SCORE, PRAISE, ALL_CLEAR_PRAISE } from "./constants"

// Re-export supaya import lama `from "./boardLogic"` tetap jalan
export { BOARD_SIZE }

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
        newBoard[startRow + r][startCol + c] = color
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

  for (let r = 0; r < BOARD_SIZE; r++) {
    if (board[r].every((cell) => cell !== null)) {
      rowsToClear.push(r)
    }
  }

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
 * Number of filled cells in a piece matrix
 */
export function countBlocks(matrix) {
  let total = 0
  for (let r = 0; r < matrix.length; r++) {
    for (let c = 0; c < matrix[r].length; c++) {
      if (matrix[r][c]) total++
    }
  }
  return total
}

/**
 * True if the piece fits anywhere on the board (stops at the first legal spot)
 */
export function hasPlacement(board, matrix) {
  const rows = matrix.length
  const cols = matrix[0].length

  for (let r = 0; r <= BOARD_SIZE - rows; r++) {
    for (let c = 0; c <= BOARD_SIZE - cols; c++) {
      if (canPlacePiece(board, matrix, r, c)) return true
    }
  }
  return false
}

export function isBoardEmpty(board) {
  return board.every((row) => row.every((cell) => cell === null))
}

/**
 * Simulates a placement without mutating state: board after the piece lands,
 * which lines complete, how many cells disappear, whether the board ends empty.
 * Used both by the real move and by the drag preview highlight.
 */
export function simulatePlacement(board, piece, startRow, startCol) {
  const placed = placePieceOnBoard(board, piece.matrix, startRow, startCol, piece.color)
  const { rowsToClear, colsToClear } = findCompletedLines(placed)
  const linesCleared = rowsToClear.length + colsToClear.length
  const cellsCleared =
    rowsToClear.length * BOARD_SIZE +
    colsToClear.length * BOARD_SIZE -
    rowsToClear.length * colsToClear.length

  const clearedBoard =
    linesCleared > 0 ? clearLinesFromBoard(placed, rowsToClear, colsToClear) : placed

  return {
    placed,
    clearedBoard,
    rowsToClear,
    colsToClear,
    linesCleared,
    cellsCleared,
    isAllClear: linesCleared > 0 && isBoardEmpty(clearedBoard),
  }
}

/**
 * Checks if ANY of the unused pieces can be placed anywhere on the current board
 */
export function isGameOver(board, pieces) {
  const activePieces = pieces.filter((p) => !p.used)
  if (activePieces.length === 0) return false

  for (const piece of activePieces) {
    if (hasPlacement(board, piece.matrix)) {
      return false // Found a legal move!
    }
  }

  return true
}

function multiLineBonus(lines) {
  const table = SCORE.multiLineBonus
  if (lines < table.length) return table[lines]
  return table[table.length - 1] + (lines - (table.length - 1)) * SCORE.extraLineBonus
}

/**
 * Score for one placement: poin per kotak + poin per kotak terhapus + bonus
 * garis sekaligus, dikali pengali combo beruntun, plus bonus all clear.
 */
export function calculateScore({
  blocksPlaced = 0,
  linesCleared = 0,
  cellsCleared = 0,
  combo = 0,
  isAllClear = false,
}) {
  const blockPoints = blocksPlaced * SCORE.perBlock

  if (linesCleared <= 0) {
    return {
      points: blockPoints,
      newCombo: 0,
      label: null,
      comboText: null,
      lineBonus: 0,
      multiplier: 1,
    }
  }

  const newCombo = combo + 1
  const lineBonus = multiLineBonus(linesCleared)
  const multiplier = Math.min(1 + (newCombo - 1) * SCORE.comboStep, SCORE.maxComboMultiplier)
  const base = blockPoints + cellsCleared * SCORE.perClearedCell + lineBonus

  let points = Math.round(base * multiplier)
  if (isAllClear) points += SCORE.allClearBonus

  const praiseIndex = Math.min(PRAISE.length, Math.max(linesCleared, newCombo)) - 1

  return {
    points,
    newCombo,
    label: isAllClear ? ALL_CLEAR_PRAISE : PRAISE[praiseIndex],
    comboText: newCombo >= 2 ? `COMBO ×${newCombo}` : null,
    lineBonus,
    multiplier,
  }
}
