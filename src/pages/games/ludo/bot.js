import {
  BASE_POS,
  HOME_POS,
  SAFE_TRACK_SET,
} from './constants'
import { getCommonTrackIndex } from './engine'

// Check whether a token at a given common track index is in striking range (1..6 steps) of any opponent
export function isPositionUnderThreat(trackIdx, playerColor, allPlayers) {
  if (trackIdx == null || SAFE_TRACK_SET.has(trackIdx)) return false

  for (const opp of allPlayers) {
    if (opp.color === playerColor) continue
    for (const oppToken of opp.tokens) {
      if (oppToken.pos >= 0 && oppToken.pos <= 50) {
        const oppTrackIdx = getCommonTrackIndex(opp.color, oppToken.pos)
        // Distance from opponent to our position clockwise
        const dist = (trackIdx - oppTrackIdx + 52) % 52
        if (dist >= 1 && dist <= 6) {
          return true
        }
      }
    }
  }
  return false
}

// Evaluate score for a candidate move
export function evaluateMove(state, tokenId, dice, difficulty = 'medium') {
  const player = state.players[state.activePlayerIndex]
  const token = player.tokens.find((t) => t.id === tokenId)
  if (!token) return -Infinity

  const fromPos = token.pos
  const toPos = fromPos === BASE_POS ? 0 : fromPos + dice
  let score = 0

  // 1. Moving out of base with 6
  if (fromPos === BASE_POS && toPos === 0) {
    score += 400
    // Check if exiting lands on safe square (start squares are safe)
    return score
  }

  // 2. Entering home
  if (toPos === HOME_POS) {
    score += 900
    return score
  }

  // 3. Entering home column (safe from captures)
  if (fromPos <= 50 && toPos > 50) {
    score += 500
  }

  // 4. Capture evaluation on common track
  if (toPos >= 0 && toPos <= 50) {
    const landingTrackIdx = getCommonTrackIndex(player.color, toPos)
    const isSafe = SAFE_TRACK_SET.has(landingTrackIdx)

    if (!isSafe) {
      // Check if this move captures an opponent token
      let willCapture = false
      for (const opp of state.players) {
        if (opp.color === player.color) continue
        for (const oppToken of opp.tokens) {
          if (oppToken.pos >= 0 && oppToken.pos <= 50) {
            const oppTrackIdx = getCommonTrackIndex(opp.color, oppToken.pos)
            if (oppTrackIdx === landingTrackIdx) {
              willCapture = true
              break
            }
          }
        }
        if (willCapture) break
      }

      if (willCapture) {
        score += 1000 // Highest priority
      }
    } else {
      // Landing on safe square
      score += 250
    }

    // 5. Escaping current threat
    if (fromPos >= 0 && fromPos <= 50) {
      const currentTrackIdx = getCommonTrackIndex(player.color, fromPos)
      if (isPositionUnderThreat(currentTrackIdx, player.color, state.players)) {
        score += 220
      }
    }

    // 6. Threat / danger avoidance at target position (especially for 'hard')
    if (!isSafe && isPositionUnderThreat(landingTrackIdx, player.color, state.players)) {
      if (difficulty === 'hard') {
        score -= 320 // Hard bot avoids dangerous positions
      } else if (difficulty === 'medium') {
        score -= 100
      }
    }
  }

  // 7. General progress bonus: encourage advancing further along the board
  score += toPos * 2

  return score
}

// Select best legal move for the bot based on difficulty level
export function chooseBotMove(state, dice, difficulty = 'medium', rng = Math.random) {
  const legalMoves = state.legalMoves
  if (!legalMoves || legalMoves.length === 0) return null
  if (legalMoves.length === 1) return legalMoves[0]

  // Easy: Random legal choice
  if (difficulty === 'easy') {
    const randomIndex = Math.floor(rng() * legalMoves.length)
    return legalMoves[randomIndex]
  }

  // Medium and Hard: Score-based heuristics
  let bestTokenId = legalMoves[0]
  let bestScore = -Infinity

  for (const tokenId of legalMoves) {
    const score = evaluateMove(state, tokenId, dice, difficulty)
    if (score > bestScore) {
      bestScore = score
      bestTokenId = tokenId
    }
  }

  return bestTokenId
}
