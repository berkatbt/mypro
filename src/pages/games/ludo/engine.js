import {
  BASE_POS,
  BASE_SLOTS,
  COLOR_CONFIG,
  COLOR_START_INDEX,
  COLORS,
  COMMON_TRACK,
  DEFAULT_SETTINGS,
  GAME_PHASES,
  HOME_CENTER,
  HOME_COLUMNS,
  HOME_POS,
  SAFE_TRACK_SET,
} from './constants'

// Unbiased Fair RNG using crypto.getRandomValues with rejection sampling
export function defaultRng() {
  if (typeof crypto !== 'undefined' && crypto.getRandomValues) {
    const buf = new Uint8Array(1)
    while (true) {
      crypto.getRandomValues(buf)
      const val = buf[0]
      if (val < 252) {
        return (val % 6) + 1
      }
    }
  }
  return Math.floor(Math.random() * 6) + 1
}

// Convert relative token pos (-1..56) to (row, col) grid coordinate
export function getTokenCoordinate(color, tokenId, pos) {
  if (pos === BASE_POS) {
    return BASE_SLOTS[color][tokenId]
  }
  if (pos >= 0 && pos <= 50) {
    const trackIdx = (COLOR_START_INDEX[color] + pos) % 52
    return COMMON_TRACK[trackIdx]
  }
  if (pos >= 51 && pos <= 55) {
    return HOME_COLUMNS[color][pos - 51]
  }
  if (pos === HOME_POS) {
    return HOME_CENTER
  }
  return HOME_CENTER
}

// Get absolute index on the 52-cell track, or null if in base/home
export function getCommonTrackIndex(color, pos) {
  if (pos >= 0 && pos <= 50) {
    return (COLOR_START_INDEX[color] + pos) % 52
  }
  return null
}

// Step-by-step path from fromPos to toPos (relative positions)
export function getPathBetweenPositions(fromPos, toPos) {
  if (fromPos === BASE_POS && toPos === 0) {
    return [0]
  }
  const path = []
  for (let p = fromPos + 1; p <= toPos; p++) {
    path.push(p)
  }
  return path
}

// Setup player list based on mode, player count, and human color choice
export function createPlayerList({
  mode = 'vsBot', // 'vsBot' | 'passAndPlay'
  playerCount = 4,
  humanColor = 'red',
  botDifficulty = 'medium',
}) {
  let activeColors = []
  if (playerCount === 2) {
    // 2 players use opposite colors
    if (humanColor === 'red' || humanColor === 'yellow') {
      activeColors = humanColor === 'red' ? ['red', 'yellow'] : ['yellow', 'red']
    } else {
      activeColors = humanColor === 'green' ? ['green', 'blue'] : ['blue', 'green']
    }
  } else if (playerCount === 3) {
    // 3 players: humanColor first, then next 2 clockwise colors
    const startIdx = COLORS.indexOf(humanColor)
    activeColors = [
      COLORS[startIdx],
      COLORS[(startIdx + 1) % 4],
      COLORS[(startIdx + 2) % 4],
    ]
  } else {
    // 4 players in standard clockwise order starting from red
    activeColors = ['red', 'green', 'yellow', 'blue']
  }

  return activeColors.map((color, index) => {
    const isHuman = mode === 'passAndPlay' ? true : color === humanColor
    return {
      id: index,
      color,
      name: isHuman
        ? mode === 'passAndPlay'
          ? `Pemain ${index + 1} (${COLOR_CONFIG[color].name})`
          : 'Kamu'
        : `Bot (${COLOR_CONFIG[color].name})`,
      isBot: !isHuman,
      botDifficulty: !isHuman ? botDifficulty : null,
      tokens: [
        { id: 0, pos: BASE_POS, stepCount: 0 },
        { id: 1, pos: BASE_POS, stepCount: 0 },
        { id: 2, pos: BASE_POS, stepCount: 0 },
        { id: 3, pos: BASE_POS, stepCount: 0 },
      ],
      tokensAtHome: 0,
      hasWon: false,
      rank: null,
    }
  })
}

// Create initial game session state
export function createInitialState(config = {}) {
  const {
    mode = 'vsBot',
    playerCount = 4,
    humanColor = 'red',
    botDifficulty = 'medium',
    options = {},
  } = config

  const players = createPlayerList({
    mode,
    playerCount,
    humanColor,
    botDifficulty,
  })

  return {
    mode,
    playerCount,
    humanColor,
    botDifficulty,
    players,
    activePlayerIndex: 0,
    phase: GAME_PHASES.WAIT_ROLL,
    currentDice: null,
    consecutiveSixes: 0,
    legalMoves: [],
    lastMove: null,
    bonusRoll: false,
    cancellationReason: null, // 'THREE_SIXES' | null
    winner: null,
    rankings: [],
    options: {
      ...DEFAULT_SETTINGS,
      ...options,
    },
    stats: {
      turnsCount: 0,
      totalRolls: 0,
      captures: 0,
    },
  }
}

// Check if a common track cell is blocked by 2+ tokens of the same opponent color
export function isCellBlocked(state, trackIdx, movingPlayerColor) {
  if (!state.options?.blockRule) return false

  // Count tokens per color on trackIdx
  const colorCounts = {}
  for (const player of state.players) {
    if (player.color === movingPlayerColor) continue
    for (const token of player.tokens) {
      if (token.pos >= 0 && token.pos <= 50) {
        const idx = getCommonTrackIndex(player.color, token.pos)
        if (idx === trackIdx) {
          colorCounts[player.color] = (colorCounts[player.color] || 0) + 1
          if (colorCounts[player.color] >= 2) {
            return true
          }
        }
      }
    }
  }
  return false
}

// Find legal token moves for the current active player with given dice value
export function getLegalMoves(state, dice) {
  if (!dice || dice < 1 || dice > 6) return []
  const player = state.players[state.activePlayerIndex]
  if (!player || player.hasWon) return []

  const legalTokenIds = []

  for (const token of player.tokens) {
    // Case 1: In base (-1)
    if (token.pos === BASE_POS) {
      if (dice === 6) {
        // Can exit to start square (pos 0)
        const startTrackIdx = COLOR_START_INDEX[player.color]
        if (!isCellBlocked(state, startTrackIdx, player.color)) {
          legalTokenIds.push(token.id)
        }
      }
      continue
    }

    // Case 2: Already at Home (56)
    if (token.pos === HOME_POS) {
      continue
    }

    // Case 3: On board or in home column (0..55)
    const targetPos = token.pos + dice

    // Exact roll required to enter home
    if (targetPos > HOME_POS) {
      continue
    }

    // If block rule is enabled, check whether path or landing cell is blocked
    if (state.options?.blockRule) {
      let blocked = false
      for (let p = token.pos + 1; p <= targetPos; p++) {
        if (p <= 50) {
          const trackIdx = getCommonTrackIndex(player.color, p)
          if (isCellBlocked(state, trackIdx, player.color)) {
            blocked = true
            break
          }
        }
      }
      if (blocked) continue
    }

    legalTokenIds.push(token.id)
  }

  return legalTokenIds
}

// Calculate player rankings on game completion or for display
export function calculateRankings(players) {
  return [...players].sort((a, b) => {
    // 1. Winner / tokens at home
    if (b.tokensAtHome !== a.tokensAtHome) {
      return b.tokensAtHome - a.tokensAtHome
    }
    // 2. Total steps traveled across all tokens
    const stepsA = a.tokens.reduce((acc, t) => acc + (t.pos >= 0 ? t.pos : 0), 0)
    const stepsB = b.tokens.reduce((acc, t) => acc + (t.pos >= 0 ? t.pos : 0), 0)
    if (stepsB !== stepsA) {
      return stepsB - stepsA
    }
    // 3. Player ID
    return a.id - b.id
  })
}

// Deterministic state transitions via action dispatch
export function gameReducer(state, action, rng = defaultRng) {
  switch (action.type) {
    case 'ROLL': {
      if (state.phase !== GAME_PHASES.WAIT_ROLL) {
        return state
      }

      const dice = action.dice != null ? action.dice : rng()
      const isSix = dice === 6
      const newConsecutiveSixes = isSix ? state.consecutiveSixes + 1 : 0

      // Rule: Three consecutive sixes forfeits the turn!
      if (newConsecutiveSixes === 3) {
        const nextIndex = getNextActivePlayerIndex(state.players, state.activePlayerIndex)
        return {
          ...state,
          phase: GAME_PHASES.WAIT_ROLL,
          currentDice: dice,
          consecutiveSixes: 0,
          legalMoves: [],
          lastMove: null,
          cancellationReason: 'THREE_SIXES',
          bonusRoll: false,
          activePlayerIndex: nextIndex,
          stats: {
            ...state.stats,
            totalRolls: state.stats.totalRolls + 1,
            turnsCount: state.stats.turnsCount + 1,
          },
        }
      }

      const legalMoves = getLegalMoves(state, dice)

      let nextPhase = GAME_PHASES.WAIT_SELECT
      if (legalMoves.length === 0) {
        nextPhase = GAME_PHASES.RESOLVE // No moves -> will skip turn
      } else if (legalMoves.length === 1) {
        nextPhase = GAME_PHASES.AUTO_MOVE
      }

      return {
        ...state,
        currentDice: dice,
        consecutiveSixes: newConsecutiveSixes,
        legalMoves,
        phase: nextPhase,
        cancellationReason: null,
        stats: {
          ...state.stats,
          totalRolls: state.stats.totalRolls + 1,
        },
      }
    }

    case 'SELECT_TOKEN': {
      if (
        state.phase !== GAME_PHASES.WAIT_SELECT &&
        state.phase !== GAME_PHASES.AUTO_MOVE
      ) {
        return state
      }

      const { tokenId } = action
      if (!state.legalMoves.includes(tokenId)) {
        return state
      }

      const activePlayer = state.players[state.activePlayerIndex]
      const token = activePlayer.tokens.find((t) => t.id === tokenId)
      if (!token) return state

      const fromPos = token.pos
      const toPos = fromPos === BASE_POS ? 0 : fromPos + state.currentDice
      const path = getPathBetweenPositions(fromPos, toPos)

      return {
        ...state,
        phase: GAME_PHASES.MOVING,
        lastMove: {
          playerId: activePlayer.id,
          color: activePlayer.color,
          tokenId,
          fromPos,
          toPos,
          path,
          captured: null,
          reachedHome: toPos === HOME_POS,
        },
      }
    }

    case 'FINISH_MOVE': {
      if (state.phase !== GAME_PHASES.MOVING || !state.lastMove) {
        return state
      }

      const { playerId, color, tokenId, toPos } = state.lastMove
      const players = state.players.map((p) => ({
        ...p,
        tokens: p.tokens.map((t) => ({ ...t })),
      }))

      const currentPlayer = players.find((p) => p.id === playerId)
      const currentToken = currentPlayer.tokens.find((t) => t.id === tokenId)
      currentToken.pos = toPos
      currentToken.stepCount += toPos === 0 && state.lastMove.fromPos === BASE_POS ? 1 : state.currentDice

      let capturedInfo = null
      let bonusRoll = state.currentDice === 6 // 6 gives another roll

      // Check capture if landed on common track (0..50)
      if (toPos >= 0 && toPos <= 50) {
        const landingTrackIdx = getCommonTrackIndex(color, toPos)
        const isSafeSquare = SAFE_TRACK_SET.has(landingTrackIdx)

        if (!isSafeSquare) {
          // Look for opponent tokens on the same track index
          for (const opp of players) {
            if (opp.id === currentPlayer.id) continue
            for (const oppToken of opp.tokens) {
              if (oppToken.pos >= 0 && oppToken.pos <= 50) {
                const oppTrackIdx = getCommonTrackIndex(opp.color, oppToken.pos)
                if (oppTrackIdx === landingTrackIdx) {
                  // Capture opponent token! Send back to base
                  oppToken.pos = BASE_POS
                  capturedInfo = {
                    playerId: opp.id,
                    color: opp.color,
                    tokenId: oppToken.id,
                  }
                  bonusRoll = true // Capturing gives bonus roll
                  break
                }
              }
            }
            if (capturedInfo) break
          }
        }
      }

      // Check if token reached Home (56)
      if (toPos === HOME_POS) {
        currentPlayer.tokensAtHome += 1
        bonusRoll = true // Entering home gives bonus roll
      }

      // Check if current player has won (all 4 tokens at home)
      let gameOver = false
      let winner = state.winner
      const rankings = [...state.rankings]

      if (currentPlayer.tokensAtHome === 4 && !currentPlayer.hasWon) {
        currentPlayer.hasWon = true
        rankings.push(currentPlayer.id)
        if (!winner) {
          winner = currentPlayer.id
        }
        // In this implementation (like Ludo King), when the first player gets 4 tokens home, game ends with rankings
        gameOver = true
      }

      if (gameOver) {
        const finalRankings = calculateRankings(players)
        return {
          ...state,
          players,
          phase: GAME_PHASES.GAME_OVER,
          winner,
          rankings: finalRankings.map((p) => p.id),
          bonusRoll: false,
          lastMove: {
            ...state.lastMove,
            captured: capturedInfo,
            reachedHome: toPos === HOME_POS,
          },
          stats: {
            ...state.stats,
            captures: state.stats.captures + (capturedInfo ? 1 : 0),
          },
        }
      }

      // If earned a bonus roll, player rolls again
      if (bonusRoll) {
        return {
          ...state,
          players,
          phase: GAME_PHASES.WAIT_ROLL,
          bonusRoll: true,
          currentDice: null,
          legalMoves: [],
          lastMove: {
            ...state.lastMove,
            captured: capturedInfo,
            reachedHome: toPos === HOME_POS,
          },
          stats: {
            ...state.stats,
            captures: state.stats.captures + (capturedInfo ? 1 : 0),
          },
        }
      }

      // Normal turn end: advance to next player
      const nextIndex = getNextActivePlayerIndex(players, state.activePlayerIndex)
      return {
        ...state,
        players,
        activePlayerIndex: nextIndex,
        phase: GAME_PHASES.WAIT_ROLL,
        bonusRoll: false,
        consecutiveSixes: 0,
        currentDice: null,
        legalMoves: [],
        lastMove: {
          ...state.lastMove,
          captured: capturedInfo,
          reachedHome: toPos === HOME_POS,
        },
        stats: {
          ...state.stats,
          turnsCount: state.stats.turnsCount + 1,
          captures: state.stats.captures + (capturedInfo ? 1 : 0),
        },
      }
    }

    case 'AUTO_PASS': {
      // Triggered when no legal moves were available
      if (state.phase !== GAME_PHASES.RESOLVE) {
        return state
      }

      const nextIndex = getNextActivePlayerIndex(state.players, state.activePlayerIndex)
      return {
        ...state,
        activePlayerIndex: nextIndex,
        phase: GAME_PHASES.WAIT_ROLL,
        bonusRoll: false,
        consecutiveSixes: 0,
        currentDice: null,
        legalMoves: [],
        lastMove: null,
        cancellationReason: null,
        stats: {
          ...state.stats,
          turnsCount: state.stats.turnsCount + 1,
        },
      }
    }

    default:
      return state
  }
}

// Get index of the next player who has not finished
export function getNextActivePlayerIndex(players, currentIndex) {
  const n = players.length
  for (let i = 1; i <= n; i++) {
    const candidateIdx = (currentIndex + i) % n
    if (!players[candidateIdx].hasWon) {
      return candidateIdx
    }
  }
  return currentIndex
}
