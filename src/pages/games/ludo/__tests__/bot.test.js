import { describe, expect, it } from 'vitest'
import {
  BASE_POS,
  COLOR_START_INDEX,
  HOME_POS,
  SAFE_TRACK_SET,
} from '../constants'
import { createInitialState } from '../engine'
import { chooseBotMove, evaluateMove, isPositionUnderThreat } from '../bot'

describe('Bot AI Heuristics (Section E & I)', () => {
  it('prioritizes capture over other regular moves', () => {
    const state = createInitialState({ mode: 'vsBot', playerCount: 2 })
    // Active player is Red (index 0, start 0)
    // Token 0: pos 1 -> pos 5 (captures Yellow at track 5)
    // Token 1: pos 10 -> pos 14 (normal move)
    state.players[0].tokens[0].pos = 1
    state.players[0].tokens[1].pos = 10
    // Put Yellow token at Yellow pos 31: (26 + 31) % 52 = 5
    state.players[1].tokens[0].pos = 31

    state.legalMoves = [0, 1]

    const chosen = chooseBotMove(state, 4, 'medium')
    expect(chosen).toBe(0) // Token 0 makes the capture!
  })

  it('prioritizes entering home over a normal safe move', () => {
    const state = createInitialState({ mode: 'vsBot', playerCount: 2 })
    // Token 0: pos 53 -> rolls 3 -> pos 56 (enters home)
    // Token 1: pos 1 -> rolls 3 -> pos 4
    state.players[0].tokens[0].pos = 53
    state.players[0].tokens[1].pos = 1

    state.legalMoves = [0, 1]

    const chosen = chooseBotMove(state, 3, 'medium')
    expect(chosen).toBe(0) // Reaching home
  })

  it('prioritizes releasing token from base with a 6 when applicable', () => {
    const state = createInitialState({ mode: 'vsBot', playerCount: 2 })
    // Token 0: in base (-1)
    // Token 1: pos 3 (not in danger, no capture)
    state.players[0].tokens[0].pos = BASE_POS
    state.players[0].tokens[1].pos = 3

    state.legalMoves = [0, 1]

    const chosen = chooseBotMove(state, 6, 'medium')
    expect(chosen).toBe(0) // Release from base
  })

  it('hard bot avoids landing in danger zone (1..6 steps ahead of enemy)', () => {
    const state = createInitialState({ mode: 'vsBot', playerCount: 2 })
    // Red active. Yellow enemy at Yellow pos 0 (track idx 26).
    // Token 0 at Red pos 23 (track idx 23): rolling 5 lands on track idx 28 (which is 2 steps ahead of Yellow at 26 -> DANGER!).
    // Token 1 at Red pos 10 (track idx 10): rolling 5 lands on track idx 15 (safe from enemy).
    state.players[0].tokens[0].pos = 23
    state.players[0].tokens[1].pos = 10
    state.players[1].tokens[0].pos = 0 // Track idx 26

    state.legalMoves = [0, 1]

    const chosenHard = chooseBotMove(state, 5, 'hard')
    // Hard bot should avoid moving Token 0 into Yellow's attack range
    expect(chosenHard).toBe(1)
  })

  it('detects threat correctly with isPositionUnderThreat', () => {
    const state = createInitialState({ mode: 'vsBot', playerCount: 2 })
    // Yellow token at Yellow pos 0 = track idx 26
    state.players[1].tokens[0].pos = 0

    // Track idx 28 is 2 steps in front of Yellow (under threat)
    expect(isPositionUnderThreat(28, 'red', state.players)).toBe(true)

    // Track idx 35 is 9 steps in front of Yellow (not under threat)
    expect(isPositionUnderThreat(35, 'red', state.players)).toBe(false)

    // Star square (idx 34) is safe square -> never under threat
    expect(isPositionUnderThreat(34, 'red', state.players)).toBe(false)
  })
})
