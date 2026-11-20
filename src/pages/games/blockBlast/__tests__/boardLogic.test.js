import { describe, expect, it } from "vitest"
import {
  canPlacePiece,
  clearLinesFromBoard,
  createEmptyBoard,
  findCompletedLines,
  isGameOver,
  simulatePlacement,
} from "../boardLogic"
import { makePiece } from "../shapes"
import { color, fillCols, fillRows, seededRng } from "./helpers"

const rng = () => 0.42
const dot = makePiece({ name: "dot", matrix: [[1]] }, rng)
const domino = makePiece({ name: "h2", matrix: [[1, 1]] }, rng)

describe("board rules", () => {
  it("starts as an empty 8x8 board", () => {
    const board = createEmptyBoard()
    expect(board).toHaveLength(8)
    board.forEach((row) => {
      expect(row).toHaveLength(8)
      expect(row.every((cell) => cell === null)).toBe(true)
    })
  })

  it("clears a completed row", () => {
    const board = createEmptyBoard()
    fillRows(board, [0])
    board[0][7] = null

    const result = simulatePlacement(board, dot, 0, 7)
    expect(result.rowsToClear).toEqual([0])
    expect(result.colsToClear).toEqual([])
    expect(result.linesCleared).toBe(1)
    expect(result.cellsCleared).toBe(8)
    expect(result.clearedBoard[0].every((cell) => cell === null)).toBe(true)
  })

  it("clears a completed column", () => {
    const board = createEmptyBoard()
    fillCols(board, [5])
    board[7][5] = null

    const result = simulatePlacement(board, dot, 7, 5)
    expect(result.rowsToClear).toEqual([])
    expect(result.colsToClear).toEqual([5])
    expect(result.cellsCleared).toBe(8)
    for (let r = 0; r < 8; r++) expect(result.clearedBoard[r][5]).toBeNull()
  })

  it("clears a row and a column together and counts the intersection once", () => {
    const board = createEmptyBoard()
    fillRows(board, [3], color)
    fillCols(board, [5], color)
    // 7 + 7 filled cells, shared cell is already filled; carve the intersection
    board[3][5] = null

    const result = simulatePlacement(board, dot, 3, 5)
    expect(result.rowsToClear).toEqual([3])
    expect(result.colsToClear).toEqual([5])
    expect(result.linesCleared).toBe(2)
    expect(result.cellsCleared).toBe(15)
    expect(result.clearedBoard[3].every((cell) => cell === null)).toBe(true)
    for (let r = 0; r < 8; r++) expect(result.clearedBoard[r][5]).toBeNull()
  })

  it("does not apply gravity after a clear", () => {
    const board = createEmptyBoard()
    fillRows(board, [0])
    board[0][7] = null
    board[5][3] = color

    const result = simulatePlacement(board, dot, 0, 7)
    expect(result.clearedBoard[5][3]).toBe(color)
    expect(result.clearedBoard[1][3]).toBeNull()
    expect(result.clearedBoard[0][3]).toBeNull()
  })

  it("does not shift cells after a column clear", () => {
    const board = createEmptyBoard()
    fillCols(board, [0])
    board[7][0] = null
    board[4][4] = color

    const result = simulatePlacement(board, dot, 7, 0)
    expect(result.clearedBoard[4][4]).toBe(color)
    expect(result.clearedBoard[4][0]).toBeNull()
  })

  it("detects a perfect clear", () => {
    const board = createEmptyBoard()
    fillRows(board, [0])
    board[0][7] = null

    const result = simulatePlacement(board, dot, 0, 7)
    expect(result.isAllClear).toBe(true)
  })

  it("rejects placements outside the board or on filled cells", () => {
    const board = createEmptyBoard()
    board[2][2] = color
    expect(canPlacePiece(board, dot.matrix, -1, 0)).toBe(false)
    expect(canPlacePiece(board, dot.matrix, 0, 8)).toBe(false)
    expect(canPlacePiece(board, dot.matrix, 2, 2)).toBe(false)
    expect(canPlacePiece(board, domino.matrix, 0, 7)).toBe(false)
    expect(canPlacePiece(board, domino.matrix, 0, 6)).toBe(true)
  })

  it("reports game over only when no remaining piece fits", () => {
    const board = createEmptyBoard()
    for (let r = 0; r < 8; r++) {
      for (let c = 0; c < 8; c++) board[r][c] = color
    }
    board[7][7] = null

    expect(isGameOver(board, [dot])).toBe(false)
    expect(isGameOver(board, [domino])).toBe(true)
    expect(isGameOver(board, [domino, makePiece({ name: "v2", matrix: [[1], [1]] }, rng)])).toBe(true)
    // Blok yang sudah dipakai bukan bagian tray
    expect(isGameOver(board, [{ ...domino, used: true }])).toBe(false)
  })

  it("clears rows and columns in one pass", () => {
    const board = createEmptyBoard()
    fillRows(board, [2, 6])
    fillCols(board, [1, 4])
    board[5][5] = color

    const { rowsToClear, colsToClear } = findCompletedLines(board)
    expect(rowsToClear).toEqual([2, 6])
    expect(colsToClear).toEqual([1, 4])

    const cleared = clearLinesFromBoard(board, rowsToClear, colsToClear)
    for (let c = 0; c < 8; c++) {
      expect(cleared[2][c]).toBeNull()
      expect(cleared[6][c]).toBeNull()
    }
    for (let r = 0; r < 8; r++) {
      expect(cleared[r][1]).toBeNull()
      expect(cleared[r][4]).toBeNull()
    }
    expect(cleared[5][5]).toBe(color)
    expect(cleared[0][0]).toBeNull()
  })

  it("is deterministic and pure (does not mutate the input)", () => {
    const board = createEmptyBoard()
    fillRows(board, [0])
    board[0][7] = null
    const snapshot = board.map((row) => [...row])
    const first = simulatePlacement(board, dot, 0, 7)
    const second = simulatePlacement(board, dot, 0, 7)
    expect(first.clearedBoard).toEqual(second.clearedBoard)
    expect(board).toEqual(snapshot)
  })
})
