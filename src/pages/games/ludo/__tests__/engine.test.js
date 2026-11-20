import { describe, expect, it } from 'vitest'
import {
  BASE_POS,
  COLOR_START_INDEX,
  COLORS,
  COMMON_TRACK,
  GAME_PHASES,
  HOME_COLUMNS,
  HOME_POS,
  SAFE_TRACK_INDICES,
  SAFE_TRACK_SET,
} from '../constants'
import {
  calculateRankings,
  createInitialState,
  gameReducer,
  getCommonTrackIndex,
  getLegalMoves,
  getTokenCoordinate,
} from '../engine'
import { chooseBotMove } from '../bot'

describe('Ludo Board & Track Geometry (Section B & I)', () => {
  it('has exactly 52 common track cells with no duplicates', () => {
    expect(COMMON_TRACK).toHaveLength(52)

    const keySet = new Set()
    for (const cell of COMMON_TRACK) {
      const key = `${cell.r},${cell.c}`
      expect(keySet.has(key)).toBe(false)
      keySet.add(key)
    }
    expect(keySet.size).toBe(52)
  })

  it('moves only to adjacent cells (orthogonal, or diagonal at 4 inner corners)', () => {
    // 4 inner corners according to specification:
    // (6,5) -> (5,6) : idx 4 -> 5
    // (5,8) -> (6,9) : idx 17 -> 18
    // (8,9) -> (9,8) : idx 30 -> 31
    // (9,6) -> (8,5) : idx 43 -> 44
    const allowedDiagonalTransitions = new Set([
      '6,5->5,6',
      '5,8->6,9',
      '8,9->9,8',
      '9,6->8,5',
    ])

    for (let i = 0; i < 52; i++) {
      const current = COMMON_TRACK[i]
      const next = COMMON_TRACK[(i + 1) % 52]

      const dr = Math.abs(next.r - current.r)
      const dc = Math.abs(next.c - current.c)

      if (dr + dc === 1) {
        // Orthogonal neighbor
        expect(dr + dc).toBe(1)
      } else {
        // Diagonal corner
        expect(dr).toBe(1)
        expect(dc).toBe(1)
        const transitionKey = `${current.r},${current.c}->${next.r},${next.c}`
        expect(allowedDiagonalTransitions.has(transitionKey)).toBe(true)
      }
    }
  })

  it('defines 57 distinct position indices (-1 base, 0..50 track, 51..55 home column, 56 home) for all 4 colors', () => {
    for (const color of COLORS) {
      // Base pos -1
      const baseCoord = getTokenCoordinate(color, 0, BASE_POS)
      expect(baseCoord).toHaveProperty('r')
      expect(baseCoord).toHaveProperty('c')

      // Pos 0..50
      for (let pos = 0; pos <= 50; pos++) {
        const coord = getTokenCoordinate(color, 0, pos)
        expect(coord.r).toBeGreaterThanOrEqual(0)
        expect(coord.r).toBeLessThanOrEqual(14)
        expect(coord.c).toBeGreaterThanOrEqual(0)
        expect(coord.c).toBeLessThanOrEqual(14)

        const trackIdx = getCommonTrackIndex(color, pos)
        expect(trackIdx).toBe((COLOR_START_INDEX[color] + pos) % 52)
      }

      // Home column 51..55
      for (let pos = 51; pos <= 55; pos++) {
        const coord = getTokenCoordinate(color, 0, pos)
        const homeIdx = pos - 51
        expect(coord).toEqual(HOME_COLUMNS[color][homeIdx])
      }

      // Home pos 56
      const homeCoord = getTokenCoordinate(color, 0, HOME_POS)
      expect(homeCoord).toEqual({ r: 7, c: 7 })
    }
  })

  it('verifies safe squares (4 start squares + 4 star squares = 8 safe squares)', () => {
    expect(SAFE_TRACK_INDICES).toHaveLength(8)
    // Red start: 0, Green start: 13, Yellow start: 26, Blue start: 39
    expect(SAFE_TRACK_SET.has(0)).toBe(true)
    expect(SAFE_TRACK_SET.has(13)).toBe(true)
    expect(SAFE_TRACK_SET.has(26)).toBe(true)
    expect(SAFE_TRACK_SET.has(39)).toBe(true)
    // Stars: 8, 21, 34, 47
    expect(SAFE_TRACK_SET.has(8)).toBe(true)
    expect(SAFE_TRACK_SET.has(21)).toBe(true)
    expect(SAFE_TRACK_SET.has(34)).toBe(true)
    expect(SAFE_TRACK_SET.has(47)).toBe(true)
  })
})

describe('Ludo Game Rules (Section C & I)', () => {
  it('rolls 6 to release token from base and gives another roll', () => {
    let state = createInitialState({ mode: 'passAndPlay', playerCount: 2, humanColor: 'red' })

    // Roll a 6
    state = gameReducer(state, { type: 'ROLL', dice: 6 })
    expect(state.currentDice).toBe(6)
    expect(state.legalMoves).toEqual([0, 1, 2, 3]) // All tokens in base can exit

    // Select token 0
    state = gameReducer(state, { type: 'SELECT_TOKEN', tokenId: 0 })
    expect(state.phase).toBe(GAME_PHASES.MOVING)
    expect(state.lastMove.toPos).toBe(0)

    // Finish move
    state = gameReducer(state, { type: 'FINISH_MOVE' })
    const red = state.players[0]
    expect(red.tokens[0].pos).toBe(0) // Token on start square
    expect(state.bonusRoll).toBe(true)
    expect(state.phase).toBe(GAME_PHASES.WAIT_ROLL)
    expect(state.activePlayerIndex).toBe(0) // Same player rolls again!
  })

  it('cancels turn on three consecutive sixes without moving token', () => {
    let state = createInitialState({ mode: 'passAndPlay', playerCount: 2 })

    // 1st roll: 6
    state = gameReducer(state, { type: 'ROLL', dice: 6 })
    state = gameReducer(state, { type: 'SELECT_TOKEN', tokenId: 0 })
    state = gameReducer(state, { type: 'FINISH_MOVE' })
    expect(state.activePlayerIndex).toBe(0)
    expect(state.consecutiveSixes).toBe(1)

    // 2nd roll: 6
    state = gameReducer(state, { type: 'ROLL', dice: 6 })
    state = gameReducer(state, { type: 'SELECT_TOKEN', tokenId: 0 })
    state = gameReducer(state, { type: 'FINISH_MOVE' })
    expect(state.activePlayerIndex).toBe(0)
    expect(state.consecutiveSixes).toBe(2)

    // 3rd roll: 6 -> turn forfeited!
    state = gameReducer(state, { type: 'ROLL', dice: 6 })
    expect(state.cancellationReason).toBe('THREE_SIXES')
    expect(state.consecutiveSixes).toBe(0)
    expect(state.activePlayerIndex).toBe(1) // Next player
    expect(state.phase).toBe(GAME_PHASES.WAIT_ROLL)
  })

  it('requires exact roll to enter home (pos 56)', () => {
    const state = createInitialState({ mode: 'passAndPlay', playerCount: 2 })
    // Position token at pos 54 (needs exactly 2 to enter home 56)
    state.players[0].tokens[0].pos = 54

    // Rolling 1 is legal (to 55)
    expect(getLegalMoves(state, 1)).toContain(0)

    // Rolling 2 is legal (to 56 home)
    expect(getLegalMoves(state, 2)).toContain(0)

    // Rolling 3, 4, 5, 6 is NOT legal because 54 + 3 = 57 > 56!
    expect(getLegalMoves(state, 3)).not.toContain(0)
    expect(getLegalMoves(state, 4)).not.toContain(0)
    expect(getLegalMoves(state, 5)).not.toContain(0)
    expect(getLegalMoves(state, 6)).not.toContain(0)
  })

  it('captures opponent token on normal square and grants bonus roll', () => {
    let state = createInitialState({ mode: 'passAndPlay', playerCount: 2 })
    // Red player (index 0, start idx 0). Yellow player (index 1, start idx 26).
    // Put Red token at track index 5 (Red pos 5).
    // Put Yellow token at Yellow pos 31: (26 + 31) % 52 = 57 % 52 = 5.
    // Index 5 is (5,6) which is NOT a safe square.
    state.players[0].tokens[0].pos = 1 // Red pos 1 (track idx 1)
    state.players[1].tokens[0].pos = 31 // Yellow pos 31 (track idx 5)

    // Red rolls 4: moves from pos 1 to pos 5 (track idx 5)
    state = gameReducer(state, { type: 'ROLL', dice: 4 })
    state = gameReducer(state, { type: 'SELECT_TOKEN', tokenId: 0 })
    state = gameReducer(state, { type: 'FINISH_MOVE' })

    // Yellow token must be sent back to base (-1)
    expect(state.players[1].tokens[0].pos).toBe(BASE_POS)
    // Red gets a bonus roll for capturing!
    expect(state.bonusRoll).toBe(true)
    expect(state.activePlayerIndex).toBe(0) // Still Red's turn
  })

  it('does NOT capture on a safe square (tokens co-exist safely)', () => {
    let state = createInitialState({ mode: 'passAndPlay', playerCount: 2 })
    // Star index 8 is a safe square.
    // Red start idx = 0. Red pos 8 -> track idx 8.
    // Yellow start idx = 26. Yellow pos 34: (26 + 34) % 52 = 60 % 52 = 8.
    state.players[0].tokens[0].pos = 4 // Red pos 4
    state.players[1].tokens[0].pos = 34 // Yellow pos 34 (on star index 8)

    // Red rolls 4: lands on pos 8 (star index 8)
    state = gameReducer(state, { type: 'ROLL', dice: 4 })
    state = gameReducer(state, { type: 'SELECT_TOKEN', tokenId: 0 })
    state = gameReducer(state, { type: 'FINISH_MOVE' })

    // Yellow token must NOT be sent back to base!
    expect(state.players[1].tokens[0].pos).toBe(34)
    expect(state.players[0].tokens[0].pos).toBe(8)
    // No bonus roll (dice was 4, not safe, no capture)
    expect(state.bonusRoll).toBe(false)
    expect(state.activePlayerIndex).toBe(1) // Turn passed to Yellow
  })

  it('entering home grants bonus roll and increments tokensAtHome', () => {
    let state = createInitialState({ mode: 'passAndPlay', playerCount: 2 })
    state.players[0].tokens[0].pos = 55 // Needs 1 to reach 56

    state = gameReducer(state, { type: 'ROLL', dice: 1 })
    state = gameReducer(state, { type: 'SELECT_TOKEN', tokenId: 0 })
    state = gameReducer(state, { type: 'FINISH_MOVE' })

    expect(state.players[0].tokens[0].pos).toBe(HOME_POS)
    expect(state.players[0].tokensAtHome).toBe(1)
    expect(state.bonusRoll).toBe(true)
    expect(state.activePlayerIndex).toBe(0) // Bonus roll for home
  })

  it('skips turn when there are no legal moves', () => {
    let state = createInitialState({ mode: 'passAndPlay', playerCount: 2 })
    // All tokens in base, roll 3 -> 0 legal moves
    state = gameReducer(state, { type: 'ROLL', dice: 3 })
    expect(state.legalMoves).toHaveLength(0)
    expect(state.phase).toBe(GAME_PHASES.RESOLVE)

    // AUTO_PASS advances turn
    state = gameReducer(state, { type: 'AUTO_PASS' })
    expect(state.activePlayerIndex).toBe(1)
    expect(state.phase).toBe(GAME_PHASES.WAIT_ROLL)
  })

  it('bot always picks a valid legal move across all difficulty levels', () => {
    const difficulties = ['easy', 'medium', 'hard']
    for (const diff of difficulties) {
      const state = createInitialState({ mode: 'vsBot', playerCount: 4 })
      state.players[0].tokens[0].pos = 0
      state.players[0].tokens[1].pos = 10
      state.legalMoves = [0, 1]

      const chosen = chooseBotMove(state, 4, diff)
      expect(state.legalMoves).toContain(chosen)
    }
  })

  it('calculates rankings correctly based on tokens at home then total steps', () => {
    const state = createInitialState({ mode: 'passAndPlay', playerCount: 3 })
    // Player 0: 2 at home, 1 at pos 20
    state.players[0].tokensAtHome = 2
    state.players[0].tokens[0].pos = HOME_POS
    state.players[0].tokens[1].pos = HOME_POS
    state.players[0].tokens[2].pos = 20

    // Player 1: 3 at home
    state.players[1].tokensAtHome = 3
    state.players[1].tokens[0].pos = HOME_POS
    state.players[1].tokens[1].pos = HOME_POS
    state.players[1].tokens[2].pos = HOME_POS

    // Player 2: 1 at home, 1 at pos 40
    state.players[2].tokensAtHome = 1
    state.players[2].tokens[0].pos = HOME_POS
    state.players[2].tokens[1].pos = 40

    const ranked = calculateRankings(state.players)
    expect(ranked[0].id).toBe(1) // 3 tokens home
    expect(ranked[1].id).toBe(0) // 2 tokens home
    expect(ranked[2].id).toBe(2) // 1 token home
  })
})

describe('Bot vs Bot 1,000 Games Simulation (Section I)', () => {
  it('simulates 1,000 bot-vs-bot games and all always finish with exactly one winner', () => {
    const TOTAL_SIMULATIONS = 1000
    let gamesCompleted = 0

    const fastRng = () => Math.floor(Math.random() * 6) + 1

    for (let g = 0; g < TOTAL_SIMULATIONS; g++) {
      let state = createInitialState({
        mode: 'vsBot',
        playerCount: 2,
        humanColor: 'red',
        botDifficulty: 'medium',
      })
      state.players.forEach((p) => {
        p.isBot = true
      })

      let turnsGuard = 0
      const MAX_TURNS = 5000

      while (state.phase !== GAME_PHASES.GAME_OVER && turnsGuard < MAX_TURNS) {
        turnsGuard++
        // 1. Roll
        state = gameReducer(state, { type: 'ROLL' }, fastRng)

        if (state.phase === GAME_PHASES.RESOLVE) {
          // No legal moves
          state = gameReducer(state, { type: 'AUTO_PASS' })
        } else if (
          state.phase === GAME_PHASES.AUTO_MOVE ||
          state.phase === GAME_PHASES.WAIT_SELECT
        ) {
          const botMove = chooseBotMove(state, state.currentDice, 'medium')
          state = gameReducer(state, { type: 'SELECT_TOKEN', tokenId: botMove })
          state = gameReducer(state, { type: 'FINISH_MOVE' })
        }
      }

      expect(state.phase).toBe(GAME_PHASES.GAME_OVER)
      expect(state.winner).not.toBeNull()
      expect(state.rankings.length).toBeGreaterThanOrEqual(1)
      gamesCompleted++
    }

    expect(gamesCompleted).toBe(TOTAL_SIMULATIONS)
  })
})
