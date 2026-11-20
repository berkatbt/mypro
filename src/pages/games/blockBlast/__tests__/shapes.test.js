import { describe, expect, it } from "vitest"
import {
  SHAPE_DEFINITIONS,
  colorForShape,
  generatePieces,
  getCategoryWeights,
  hasPlayableOrder,
  makePiece,
} from "../shapes"
import { createEmptyBoard, hasPlacement } from "../boardLogic"
import { fillRows, mostlyFullBoard, seededRng } from "./helpers"

const ALL_NAMES = Object.values(SHAPE_DEFINITIONS).flat().map((shape) => shape.name)

describe("piece generator", () => {
  it("contains every shape family required by the game", () => {
    expect(ALL_NAMES).toEqual(
      expect.arrayContaining([
        "dot",
        "h2",
        "h3",
        "h4",
        "h5",
        "v2",
        "v3",
        "v4",
        "v5",
        "sq2",
        "sq3",
        "rect23",
        "rect32",
        "c1",
        "c2",
        "c3",
        "c4",
        "l1",
        "l2",
        "l3",
        "l4",
        "t1",
        "t2",
        "t3",
        "t4",
        "bigL1",
        "bigL2",
        "bigL3",
        "bigL4",
        "s1",
        "s2",
        "z1",
        "z2",
      ])
    )
  })

  it("keeps one fixed bright color per shape type", () => {
    const rng = seededRng(9)
    const board = createEmptyBoard()
    for (let i = 0; i < 60; i++) {
      generatePieces(board, { rng, score: i * 20 }).forEach((piece) => {
        expect(piece.color.id).toBe(colorForShape(piece.name).id)
      })
    }
    expect(colorForShape("h2")).toBe(colorForShape("v2"))
    expect(colorForShape("h2").id).not.toBe(colorForShape("dot").id)
  })

  it("is deterministic when the RNG is seeded", () => {
    const board = createEmptyBoard()
    fillRows(board, [0, 1, 2])
    const first = generatePieces(board, { rng: seededRng(123), score: 500 })
    const second = generatePieces(board, { rng: seededRng(123), score: 500 })
    expect(first.map((p) => [p.name, p.color.id])).toEqual(
      second.map((p) => [p.name, p.color.id])
    )
  })

  it("always gives a set with at least one placeable piece", () => {
    const board = mostlyFullBoard(14)
    for (let seed = 1; seed <= 30; seed++) {
      const trio = generatePieces(board, { rng: seededRng(seed), score: seed * 100 })
      expect(trio).toHaveLength(3)
      expect(trio.some((piece) => hasPlacement(board, piece.matrix))).toBe(true)
    }
  })

  it("avoids three identical pieces in one set", () => {
    const board = createEmptyBoard()
    for (let seed = 1; seed <= 40; seed++) {
      const trio = generatePieces(board, { rng: seededRng(seed), score: 0 })
      expect(new Set(trio.map((p) => p.name)).size).toBeGreaterThan(1)
    }
  })

  it("falls back to a small fitting piece on a nearly full board", () => {
    const board = mostlyFullBoard(1)
    const trio = generatePieces(board, { rng: seededRng(77), score: 0 })
    expect(trio.some((piece) => piece.name === "dot")).toBe(true)
    expect(trio.some((piece) => hasPlacement(board, piece.matrix))).toBe(true)
  })

  it("prefers small pieces when the board is full and large pieces as score grows", () => {
    const empty = createEmptyBoard()
    const crowded = mostlyFullBoard(32)
    expect(getCategoryWeights(crowded, 0).small).toBeGreaterThan(
      getCategoryWeights(empty, 0).small
    )
    expect(getCategoryWeights(empty, 5000).large).toBeGreaterThan(
      getCategoryWeights(empty, 0).large
    )
  })

  it("detects whether all three pieces fit in some order", () => {
    const board = createEmptyBoard()
    const bigL = SHAPE_DEFINITIONS.large.find((shape) => shape.name === "bigL1")
    const pieces = [makePiece(bigL), makePiece(bigL), makePiece(bigL)]
    expect(hasPlayableOrder(board, pieces)).toBe(true)

    const full = mostlyFullBoard(0)
    const dot = makePiece({ name: "dot", matrix: [[1]] })
    const domino = makePiece({ name: "h2", matrix: [[1, 1]] })
    expect(hasPlayableOrder(full, [dot, domino, domino])).toBe(false)
  })
})
