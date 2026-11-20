import { SCORE, PRAISE, PERFECT_PRAISE } from "./constants"

/**
 * Streak naik 1 setiap penempatan yang menghapus ≥1 garis. Kalau 3 penempatan
 * berturut-turut (satu set penuh) tidak menghapus apa pun, streak putus.
 */
export function advanceStreak(streak = 0, dryPlacements = 0, linesCleared = 0) {
  if (linesCleared > 0) {
    return { streak: streak + 1, dryPlacements: 0 }
  }

  const nextDry = dryPlacements + 1
  if (nextDry >= SCORE.comboWindow) {
    return { streak: 0, dryPlacements: 0 }
  }

  return { streak, dryPlacements: nextDry }
}

/**
 * Skor satu penempatan:
 * - +1 per sel yang dipasang
 * - clear: 10 × sel terhapus × garis terhapus × pengali streak
 * - bonus perfect clear
 */
export function calculateScore({
  blocksPlaced = 0,
  linesCleared = 0,
  cellsCleared = 0,
  streak = 0,
  dryPlacements = 0,
  isPerfectClear = false,
} = {}) {
  const placementPoints = blocksPlaced * SCORE.perPlacedCell
  const next = advanceStreak(streak, dryPlacements, linesCleared)

  if (linesCleared <= 0) {
    return {
      points: placementPoints,
      placementPoints,
      clearPoints: 0,
      perfectBonus: 0,
      multiplier: 1,
      streak: next.streak,
      dryPlacements: next.dryPlacements,
      praise: null,
      praiseLevel: 0,
      isPerfectClear: false,
    }
  }

  const multiplier = 1 + SCORE.streakStep * (next.streak - 1)
  const clearPoints = Math.round(
    SCORE.perClearedCell * cellsCleared * linesCleared * multiplier
  )
  const perfectBonus = isPerfectClear ? SCORE.perfectClearBonus : 0

  // Pujian ikut naik kalau garis banyak atau streak panjang
  const praiseLevel = Math.min(
    PRAISE.length - 1,
    Math.max(linesCleared, next.streak) - 1
  )

  return {
    points: placementPoints + clearPoints + perfectBonus,
    placementPoints,
    clearPoints,
    perfectBonus,
    multiplier,
    streak: next.streak,
    dryPlacements: next.dryPlacements,
    praise: isPerfectClear ? PERFECT_PRAISE : PRAISE[praiseLevel],
    praiseLevel,
    isPerfectClear,
  }
}

export const comboMultiplier = (streak) =>
  1 + SCORE.streakStep * Math.max(0, streak - 1)
