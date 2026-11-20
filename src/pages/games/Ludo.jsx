import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { Link } from 'react-router-dom'
import { motion, AnimatePresence, useReducedMotion } from 'motion/react'
import {
  ArrowLeft,
  HelpCircle,
  Settings2,
  Users,
  Trophy,
} from 'lucide-react'

import {
  GAME_PHASES,
} from './ludo/constants'
import {
  createInitialState,
  gameReducer,
} from './ludo/engine'
import { chooseBotMove } from './ludo/bot'
import { ludoAudio } from './ludo/audio'
import { ludoHaptics } from './ludo/haptics'
import {
  clearSavedGame,
  loadSavedGame,
  loadSettings,
  loadStats,
  saveCurrentGame,
  saveSettings,
  updateStats,
} from './ludo/storage'
import LudoBoard from './ludo/LudoBoard'
import PlayerPanel from './ludo/PlayerPanel'
import Confetti from './ludo/Confetti'
import { GameOverModal, HelpModal, SettingsModal, SetupModal } from './ludo/Modals'
import './ludo/ludo.css'

export default function Ludo() {
  const reduceMotion = useReducedMotion()

  // ── Settings & Stats State ──────────────────────────────────────────
  const [settings, setSettings] = useState(() => loadSettings())
  const [stats, setStats] = useState(() => loadStats())

  // ── Game State ──────────────────────────────────────────────────────
  const [state, setState] = useState(() => {
    const saved = loadSavedGame()
    if (saved && saved.phase !== GAME_PHASES.GAME_OVER) {
      return saved
    }
    return createInitialState({
      mode: 'vsBot',
      playerCount: 2,
      humanColor: 'red',
      botDifficulty: 'medium',
      options: loadSettings(),
    })
  })

  // ── UI / Animation State ────────────────────────────────────────────
  const [isRolling, setIsRolling] = useState(false)
  const [animatingToken, setAnimatingToken] = useState(null)
  const [banner, setBanner] = useState(null)
  const [timerSeconds, setTimerSeconds] = useState(null)

  // Modals
  const [isHelpOpen, setIsHelpOpen] = useState(false)
  const [isSettingsOpen, setIsSettingsOpen] = useState(false)
  const [isSetupOpen, setIsSetupOpen] = useState(false)
  const [isGameOverOpen, setIsGameOverOpen] = useState(false)

  // Refs for timers & cleanup
  const timersRef = useRef(new Set())
  const botThinkingRef = useRef(false)
  const stateRef = useRef(state)

  useEffect(() => {
    stateRef.current = state
  }, [state])

  const schedule = useCallback((fn, ms) => {
    const id = setTimeout(() => {
      timersRef.current.delete(id)
      fn()
    }, ms)
    timersRef.current.add(id)
    return id
  }, [])

  const clearAllTimers = useCallback(() => {
    timersRef.current.forEach((id) => clearTimeout(id))
    timersRef.current.clear()
  }, [])

  useEffect(() => {
    return () => clearAllTimers()
  }, [clearAllTimers])

  // Sync audio & haptics with settings
  useEffect(() => {
    ludoAudio.muted = settings.muted
    ludoHaptics.enabled = settings.vibration
    saveSettings(settings)
  }, [settings])

  // Audio unlock on first pointerdown gesture
  useEffect(() => {
    const handleGesture = () => ludoAudio.unlock()
    window.addEventListener('pointerdown', handleGesture, { once: true })
    return () => window.removeEventListener('pointerdown', handleGesture)
  }, [])

  // Auto-save game state
  useEffect(() => {
    if (state.phase === GAME_PHASES.GAME_OVER) {
      clearSavedGame()
    } else {
      saveCurrentGame(state)
    }
  }, [state])

  // Show Toast Banner
  const showBanner = useCallback(
    (text, type = 'info', duration = 2200) => {
      setBanner({ text, type, id: Date.now() })
      schedule(() => setBanner(null), duration)
    },
    [schedule]
  )

  // Handle Game Over
  useEffect(() => {
    if (state.phase === GAME_PHASES.GAME_OVER) {
      setIsGameOverOpen(true)
      ludoAudio.victory()
      ludoHaptics.victory()

      const isHumanWinner =
        state.winner != null && !state.players[state.winner]?.isBot
      setStats(
        updateStats({
          gamesPlayed: 1,
          gamesWon: isHumanWinner ? 1 : 0,
          totalCaptures: state.stats.captures,
          totalHome: state.players.reduce((sum, p) => sum + p.tokensAtHome, 0),
        })
      )
    }
  }, [state.phase, state.winner, state.players, state.stats.captures])

  // ── Actions ─────────────────────────────────────────────────────────

  // Roll Dice Action
  const handleRollDice = useCallback(() => {
    const currentState = stateRef.current
    if (currentState.phase !== GAME_PHASES.WAIT_ROLL || isRolling) return

    setIsRolling(true)
    ludoAudio.diceRoll()

    const rollDuration = reduceMotion ? 100 : 700 / settings.animationSpeed

    schedule(() => {
      setIsRolling(false)
      const nextState = gameReducer(currentState, { type: 'ROLL' })

      if (nextState.cancellationReason === 'THREE_SIXES') {
        showBanner('Tiga angka 6 berturut-turut! Giliran batal ❌', 'warning')
        ludoAudio.turnCancelled()
      } else if (nextState.currentDice === 6) {
        showBanner('Dadu 6! Dapat lemparan lagi 🎲', 'success', 1600)
      }

      setState(nextState)
    }, rollDuration)
  }, [isRolling, reduceMotion, settings.animationSpeed, schedule, showBanner])

  // Select Token Move Action
  const handleSelectToken = useCallback(
    (tokenId) => {
      const currentState = stateRef.current
      if (
        currentState.phase !== GAME_PHASES.WAIT_SELECT &&
        currentState.phase !== GAME_PHASES.AUTO_MOVE
      ) {
        return
      }

      const activePlayer = currentState.players[currentState.activePlayerIndex]
      const nextState = gameReducer(currentState, { type: 'SELECT_TOKEN', tokenId })
      if (!nextState.lastMove) return

      setState(nextState)

      // Animate Movement along path
      const path = nextState.lastMove.path
      const fromPos = nextState.lastMove.fromPos
      const isExitingBase = fromPos === -1

      if (isExitingBase) {
        ludoAudio.releaseFromBase()
      }

      if (reduceMotion || settings.animationSpeed >= 2) {
        // Direct finish for reduced motion
        const finishedState = gameReducer(nextState, { type: 'FINISH_MOVE' })
        if (finishedState.lastMove?.captured) {
          showBanner(
            `⚔️ Pion ${finishedState.lastMove.captured.color} berhasil ditangkap! Bonus lemparan!`,
            'success'
          )
          ludoAudio.capture()
          ludoHaptics.capture()
        } else if (finishedState.lastMove?.reachedHome) {
          showBanner('👑 Pion masuk ke Home! Bonus lemparan!', 'success')
          ludoAudio.home()
          ludoHaptics.home()
        }
        setAnimatingToken(null)
        setState(finishedState)
        return
      }

      // Step-by-step hopping animation
      const stepInterval = Math.max(80, 150 / settings.animationSpeed)
      let stepIdx = 0

      const hopStep = () => {
        if (stepIdx < path.length) {
          const currentPos = path[stepIdx]
          setAnimatingToken({
            playerId: activePlayer.id,
            tokenId,
            currentPos,
            hopIndex: stepIdx,
          })
          ludoAudio.step(stepIdx)
          stepIdx++
          schedule(hopStep, stepInterval)
        } else {
          // Finished steps
          schedule(() => {
            setAnimatingToken(null)
            const finishedState = gameReducer(nextState, { type: 'FINISH_MOVE' })

            if (finishedState.lastMove?.captured) {
              showBanner(
                `⚔️ Pion ${finishedState.lastMove.captured.color} tertangkap! Bonus lemparan!`,
                'success'
              )
              ludoAudio.capture()
              ludoHaptics.capture()
            } else if (finishedState.lastMove?.reachedHome) {
              showBanner('👑 Pion masuk ke Home! Bonus lemparan!', 'success')
              ludoAudio.home()
              ludoHaptics.home()
            }

            setState(finishedState)
          }, 100)
        }
      }

      hopStep()
    },
    [reduceMotion, settings.animationSpeed, schedule, showBanner]
  )

  // ── Automation & Turn Cycle ─────────────────────────────────────────

  // Auto-move when exactly 1 legal move exists
  useEffect(() => {
    if (state.phase === GAME_PHASES.AUTO_MOVE && !animatingToken && !isRolling) {
      const singleMove = state.legalMoves[0]
      const delay = Math.max(300, 500 / settings.animationSpeed)
      const id = schedule(() => {
        handleSelectToken(singleMove)
      }, delay)
      return () => clearTimeout(id)
    }
  }, [
    state.phase,
    state.legalMoves,
    animatingToken,
    isRolling,
    settings.animationSpeed,
    handleSelectToken,
    schedule,
  ])

  // Skip turn when no legal moves available
  useEffect(() => {
    if (state.phase === GAME_PHASES.RESOLVE && !isRolling) {
      showBanner('Tidak ada langkah legal. Giliran dilewati ⏩', 'info', 1600)
      const delay = Math.max(600, 800 / settings.animationSpeed)
      const id = schedule(() => {
        setState((prev) => gameReducer(prev, { type: 'AUTO_PASS' }))
      }, delay)
      return () => clearTimeout(id)
    }
  }, [state.phase, isRolling, settings.animationSpeed, schedule, showBanner])

  // Bot Turn Automation (Natural Thinking Delay)
  useEffect(() => {
    const activePlayer = state.players[state.activePlayerIndex]
    if (!activePlayer || !activePlayer.isBot || animatingToken || isRolling) {
      botThinkingRef.current = false
      return
    }

    if (state.phase === GAME_PHASES.WAIT_ROLL && !botThinkingRef.current) {
      botThinkingRef.current = true
      const thinkTime = 700 + Math.random() * 500
      const id = schedule(() => {
        botThinkingRef.current = false
        handleRollDice()
      }, thinkTime / settings.animationSpeed)
      return () => clearTimeout(id)
    }

    if (state.phase === GAME_PHASES.WAIT_SELECT && !botThinkingRef.current) {
      botThinkingRef.current = true
      const thinkTime = 600 + Math.random() * 500
      const id = schedule(() => {
        botThinkingRef.current = false
        const chosenToken = chooseBotMove(
          state,
          state.currentDice,
          activePlayer.botDifficulty
        )
        if (chosenToken != null) {
          handleSelectToken(chosenToken)
        }
      }, thinkTime / settings.animationSpeed)
      return () => clearTimeout(id)
    }
  }, [
    state,
    animatingToken,
    isRolling,
    settings.animationSpeed,
    schedule,
    handleRollDice,
    handleSelectToken,
  ])

  // Turn Timer (if enabled in settings)
  useEffect(() => {
    if (!settings.turnTimer) {
      setTimerSeconds(null)
      return
    }

    const activePlayer = state.players[state.activePlayerIndex]
    if (!activePlayer || activePlayer.isBot || state.phase === GAME_PHASES.GAME_OVER) {
      setTimerSeconds(null)
      return
    }

    if (
      state.phase !== GAME_PHASES.WAIT_ROLL &&
      state.phase !== GAME_PHASES.WAIT_SELECT
    ) {
      setTimerSeconds(null)
      return
    }

    let remaining = 15
    setTimerSeconds(remaining)

    const interval = setInterval(() => {
      remaining -= 1
      setTimerSeconds(remaining)

      if (remaining <= 0) {
        clearInterval(interval)
        setTimerSeconds(null)
        // Auto-play best move
        const curr = stateRef.current
        if (curr.phase === GAME_PHASES.WAIT_ROLL) {
          handleRollDice()
        } else if (curr.phase === GAME_PHASES.WAIT_SELECT) {
          const fallbackToken = chooseBotMove(curr, curr.currentDice, 'medium')
          if (fallbackToken != null) {
            handleSelectToken(fallbackToken)
          }
        }
      }
    }, 1000)

    return () => clearInterval(interval)
  }, [
    settings.turnTimer,
    state.activePlayerIndex,
    state.phase,
    state.players,
    handleRollDice,
    handleSelectToken,
  ])

  // Start New Game Handler
  const handleStartNewGame = useCallback(
    ({ mode, playerCount, humanColor, botDifficulty }) => {
      clearAllTimers()
      clearSavedGame()
      const newState = createInitialState({
        mode,
        playerCount,
        humanColor,
        botDifficulty,
        options: settings,
      })
      setState(newState)
      setIsSetupOpen(false)
      setIsGameOverOpen(false)
      showBanner('Permainan Ludo dimulai! Selamat bermain 🎲', 'success', 2000)
    },
    [clearAllTimers, settings, showBanner]
  )

  // Reset Current Round
  const handleResetGame = useCallback(() => {
    clearAllTimers()
    clearSavedGame()
    setState((prev) =>
      createInitialState({
        mode: prev.mode,
        playerCount: prev.playerCount,
        humanColor: prev.humanColor,
        botDifficulty: prev.botDifficulty,
        options: settings,
      })
    )
    showBanner('Permainan diulang dari awal.', 'info', 1800)
  }, [clearAllTimers, settings, showBanner])

  // ── Layout Players by Corner ────────────────────────────────────────
  // Red = Top-Left (0), Green = Top-Right (1), Yellow = Bottom-Right (2), Blue = Bottom-Left (3)
  const playerByColor = useMemo(() => {
    const map = {}
    for (const p of state.players) {
      map[p.color] = p
    }
    return map
  }, [state.players])

  return (
    <main className="relative min-h-[100svh] w-full overflow-hidden bg-slate-950 text-slate-100 flex flex-col items-center">
      {/* Background ambient lighting */}
      <div className="pointer-events-none fixed inset-0 overflow-hidden">
        <div className="absolute top-1/4 -left-40 h-96 w-96 rounded-full bg-red-600/15 blur-[120px]" />
        <div className="absolute top-1/4 -right-40 h-96 w-96 rounded-full bg-emerald-600/15 blur-[120px]" />
        <div className="absolute bottom-1/4 -right-40 h-96 w-96 rounded-full bg-amber-600/15 blur-[120px]" />
        <div className="absolute bottom-1/4 -left-40 h-96 w-96 rounded-full bg-blue-600/15 blur-[120px]" />
      </div>

      <div className="relative mx-auto flex w-full max-w-[560px] flex-col items-center px-3 pt-20 pb-5">
        {/* ── Top Header Navigation Bar ── */}
        <header className="relative z-30 flex w-full items-center justify-between gap-2 mb-2">
          <Link
            to="/games"
            className="flex h-9 items-center gap-1.5 rounded-full border border-white/10 bg-white/[0.06] px-3 text-[11px] font-semibold text-slate-300 backdrop-blur transition-colors hover:bg-white/10 hover:text-white"
          >
            <ArrowLeft size={14} />
            Games
          </Link>

          {/* Stats / Mode Pill */}
          <div className="flex items-center gap-1.5 rounded-full border border-amber-400/25 bg-amber-400/10 px-3 py-1.5 text-amber-200">
            <Trophy size={14} className="text-amber-400" />
            <span className="text-xs font-bold tabular-nums">
              {stats.gamesWon} Menang
            </span>
          </div>

          {/* Control Buttons */}
          <div className="flex items-center gap-1.5">
            <button
              type="button"
              onClick={() => setIsSetupOpen(true)}
              aria-label="Mode & Pemain"
              className="flex h-9 w-9 items-center justify-center rounded-full border border-white/10 bg-white/[0.06] text-slate-300 backdrop-blur transition-colors hover:bg-white/10 hover:text-white"
            >
              <Users size={15} />
            </button>
            <button
              type="button"
              onClick={() => setIsHelpOpen(true)}
              aria-label="Cara Bermain"
              className="flex h-9 w-9 items-center justify-center rounded-full border border-white/10 bg-white/[0.06] text-slate-300 backdrop-blur transition-colors hover:bg-white/10 hover:text-white"
            >
              <HelpCircle size={15} />
            </button>
            <button
              type="button"
              onClick={() => setIsSettingsOpen(true)}
              aria-label="Pengaturan"
              className="flex h-9 w-9 items-center justify-center rounded-full border border-white/10 bg-white/[0.06] text-slate-300 backdrop-blur transition-colors hover:bg-white/10 hover:text-white"
            >
              <Settings2 size={15} />
            </button>
          </div>
        </header>

        {/* ── Toast Notification Banner ── */}
        <div className="h-7 w-full flex items-center justify-center mb-1">
          <AnimatePresence>
            {banner && (
              <motion.div
                key={banner.id}
                initial={{ opacity: 0, y: -6, scale: 0.95 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: -6, scale: 0.95 }}
                className={`rounded-full px-3 py-1 text-xs font-bold shadow-md border ${
                  banner.type === 'success'
                    ? 'border-emerald-400/40 bg-emerald-500/20 text-emerald-200'
                    : banner.type === 'warning'
                    ? 'border-red-400/40 bg-red-500/20 text-red-200'
                    : 'border-white/15 bg-slate-800 text-slate-200'
                }`}
              >
                {banner.text}
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* ── Top Player Panels (Red & Green) ── */}
        <div className="grid w-full grid-cols-2 gap-2 mb-2">
          {playerByColor.red ? (
            <PlayerPanel
              player={playerByColor.red}
              isActive={state.players[state.activePlayerIndex]?.color === 'red'}
              phase={state.phase}
              currentDice={state.currentDice}
              isRolling={isRolling}
              timerSeconds={
                state.players[state.activePlayerIndex]?.color === 'red'
                  ? timerSeconds
                  : null
              }
              onRoll={handleRollDice}
            />
          ) : (
            <div />
          )}

          {playerByColor.green ? (
            <PlayerPanel
              player={playerByColor.green}
              isActive={state.players[state.activePlayerIndex]?.color === 'green'}
              phase={state.phase}
              currentDice={state.currentDice}
              isRolling={isRolling}
              timerSeconds={
                state.players[state.activePlayerIndex]?.color === 'green'
                  ? timerSeconds
                  : null
              }
              onRoll={handleRollDice}
            />
          ) : (
            <div />
          )}
        </div>

        {/* ── The 15x15 SVG Ludo Board ── */}
        <div className="w-full flex justify-center items-center my-auto">
          <LudoBoard
            state={state}
            animatingToken={animatingToken}
            onSelectToken={handleSelectToken}
          />
        </div>

        {/* ── Bottom Player Panels (Blue & Yellow) ── */}
        <div className="grid w-full grid-cols-2 gap-2 mt-2">
          {playerByColor.blue ? (
            <PlayerPanel
              player={playerByColor.blue}
              isActive={state.players[state.activePlayerIndex]?.color === 'blue'}
              phase={state.phase}
              currentDice={state.currentDice}
              isRolling={isRolling}
              timerSeconds={
                state.players[state.activePlayerIndex]?.color === 'blue'
                  ? timerSeconds
                  : null
              }
              onRoll={handleRollDice}
            />
          ) : (
            <div />
          )}

          {playerByColor.yellow ? (
            <PlayerPanel
              player={playerByColor.yellow}
              isActive={state.players[state.activePlayerIndex]?.color === 'yellow'}
              phase={state.phase}
              currentDice={state.currentDice}
              isRolling={isRolling}
              timerSeconds={
                state.players[state.activePlayerIndex]?.color === 'yellow'
                  ? timerSeconds
                  : null
              }
              onRoll={handleRollDice}
            />
          ) : (
            <div />
          )}
        </div>
      </div>

      {/* ── Confetti Celebration on Victory ── */}
      {state.phase === GAME_PHASES.GAME_OVER && <Confetti />}

      {/* ── Modals ── */}
      <SetupModal
        isOpen={isSetupOpen}
        onClose={() => setIsSetupOpen(false)}
        onStartGame={handleStartNewGame}
        initialConfig={{
          mode: state.mode,
          playerCount: state.playerCount,
          humanColor: state.humanColor,
          botDifficulty: state.botDifficulty,
        }}
      />

      <HelpModal
        isOpen={isHelpOpen}
        onClose={() => setIsHelpOpen(false)}
      />

      <SettingsModal
        isOpen={isSettingsOpen}
        onClose={() => setIsSettingsOpen(false)}
        settings={settings}
        onUpdateSettings={(newVals) => {
          setSettings((prev) => ({ ...prev, ...newVals }))
        }}
        onResetGame={handleResetGame}
        onNewGameMenu={() => {
          setIsSetupOpen(true)
        }}
      />

      <GameOverModal
        isOpen={isGameOverOpen}
        winnerPlayer={
          state.winner != null ? state.players[state.winner] : null
        }
        rankings={state.rankings}
        players={state.players}
        onPlayAgain={() => {
          setIsGameOverOpen(false)
          handleResetGame()
        }}
        onNewGame={() => {
          setIsGameOverOpen(false)
          setIsSetupOpen(true)
        }}
      />
    </main>
  )
}
