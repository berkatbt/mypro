import { describe, expect, it } from "vitest"
import { advanceStreak, calculateScore } from "../scoring"
import { SCORE } from "../constants"

describe("scoring", () => {
  it("gives 1 point per placed cell", () => {
    const result = calculateScore({ blocksPlaced: 4 })
    expect(result.points).toBe(4)
    expect(result.streak).toBe(0)
    expect(result.dryPlacements).toBe(1)
    expect(result.praise).toBeNull()
  })

  it("scores a single line as 10 × cells × lines", () => {
    const result = calculateScore({
      blocksPlaced: 1,
      linesCleared: 1,
      cellsCleared: 8,
    })
    expect(result.clearPoints).toBe(80)
    expect(result.points).toBe(81)
    expect(result.multiplier).toBe(1)
    expect(result.streak).toBe(1)
  })

  it("scores two lines at once with the cell count of both lines", () => {
    const result = calculateScore({
      blocksPlaced: 1,
      linesCleared: 2,
      cellsCleared: 15,
    })
    expect(result.clearPoints).toBe(300)
    expect(result.points).toBe(301)
  })

  it("applies the 1 + 0.5 × (streak − 1) multiplier", () => {
    const second = calculateScore({
      blocksPlaced: 1,
      linesCleared: 1,
      cellsCleared: 8,
      streak: 1,
    })
    expect(second.streak).toBe(2)
    expect(second.multiplier).toBe(1.5)
    expect(second.clearPoints).toBe(120)

    const third = calculateScore({
      blocksPlaced: 1,
      linesCleared: 1,
      cellsCleared: 8,
      streak: 2,
    })
    expect(third.multiplier).toBe(2)
    expect(third.clearPoints).toBe(160)
  })

  it("keeps the streak for up to two dry placements and breaks it on the third", () => {
    const first = advanceStreak(3, 0, 0)
    expect(first).toEqual({ streak: 3, dryPlacements: 1 })

    const second = advanceStreak(3, 1, 0)
    expect(second).toEqual({ streak: 3, dryPlacements: 2 })

    const third = advanceStreak(3, 2, 0)
    expect(third).toEqual({ streak: 0, dryPlacements: 0 })

    expect(SCORE.comboWindow).toBe(3)
  })

  it("resets the dry counter when a line clears", () => {
    expect(advanceStreak(3, 2, 1)).toEqual({ streak: 4, dryPlacements: 0 })
  })

  it("adds the perfect clear bonus and its own banner", () => {
    const result = calculateScore({
      blocksPlaced: 1,
      linesCleared: 2,
      cellsCleared: 9,
      streak: 0,
      isPerfectClear: true,
    })
    expect(result.perfectBonus).toBe(SCORE.perfectClearBonus)
    expect(result.points).toBe(1 + 180 + SCORE.perfectClearBonus)
    expect(result.praise).toBe("PERFECT!")
    expect(result.isPerfectClear).toBe(true)
  })

  it("scales praise with lines and streak", () => {
    const oneLine = calculateScore({ linesCleared: 1, cellsCleared: 8 })
    expect(oneLine.praise).toBe("Good!")

    const threeLines = calculateScore({ linesCleared: 3, cellsCleared: 22 })
    expect(threeLines.praise).toBe("Excellent!")

    const longCombo = calculateScore({
      linesCleared: 1,
      cellsCleared: 8,
      streak: 6,
    })
    expect(longCombo.praise).toBe("Unbelievable!")
  })
})
