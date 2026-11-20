import { describe, expect, it } from "vitest"
import { deserializeGame, serializeGame } from "../storage"
import { createEmptyBoard } from "../boardLogic"
import { BLOCK_PALETTES, makePiece } from "../shapes"

const board = createEmptyBoard()
board[0][0] = BLOCK_PALETTES[0]
board[1][2] = BLOCK_PALETTES[5]

const pieces = [
  makePiece({ name: "h2", matrix: [[1, 1]] }, () => 0.1),
  makePiece({ name: "dot", matrix: [[1]] }, () => 0.2),
  makePiece({ name: "sq2", matrix: [[1, 1], [1, 1]] }, () => 0.3),
]
pieces[1].used = true

const state = {
  board,
  pieces,
  score: 1234,
  streak: 2,
  dryPlacements: 1,
  totalCleared: 7,
  gameOver: false,
}

describe("persistence", () => {
  it("serializes and restores a running game with colors intact", () => {
    const restored = deserializeGame(JSON.parse(JSON.stringify(serializeGame(state))))
    expect(restored).not.toBeNull()
    expect(restored.score).toBe(1234)
    expect(restored.streak).toBe(2)
    expect(restored.dryPlacements).toBe(1)
    expect(restored.totalCleared).toBe(7)
    expect(restored.board[0][0].id).toBe("blue")
    expect(restored.board[1][2].id).toBe("purple")
    expect(restored.board[3][3]).toBeNull()
    expect(restored.pieces).toHaveLength(3)
    expect(restored.pieces[1].used).toBe(true)
    expect(restored.pieces[0].color.id).toBe(BLOCK_PALETTES[1].id)
    expect(restored.pieces[0].blockCount).toBe(2)
  })

  it("rejects corrupt or unsupported saves", () => {
    expect(deserializeGame(null)).toBeNull()
    expect(deserializeGame({})).toBeNull()
    expect(deserializeGame({ board: [], pieces: [] })).toBeNull()

    const raw = serializeGame(state)
    raw.board = [[null]]
    expect(deserializeGame(raw)).toBeNull()

    const badColor = serializeGame(state)
    badColor.board[0][0] = "not-a-color"
    expect(deserializeGame(badColor)).toBeNull()

    const tooFewPieces = serializeGame(state)
    tooFewPieces.pieces = tooFewPieces.pieces.slice(0, 2)
    expect(deserializeGame(tooFewPieces)).toBeNull()

    const badMatrix = serializeGame(state)
    badMatrix.pieces[0].matrix = "nope"
    expect(deserializeGame(badMatrix)).toBeNull()
  })
})
