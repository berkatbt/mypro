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
  COLOR_CONFIG,
  GAME_PHASES,
} from './ludo/constants'
import {
  createInitialState,
  gameReducer,
  resumeSavedState,
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

// Placeholder shown when a board color has no player in this session
function EmptyColorPanel({ color }) {
  const cfg = COLOR_CONFIG[color]
  return (
    <div className="flex items-center justify-center gap-1.5 rounded-2xl border border-dashed border-white/[0.07] bg-white/[0.02] px-3 py-2.5 text-[10px] font-semibold text-slate-600">
      <span
        className="h-2.5 w-2.5 rounded-full opacity-25"
        style={{ backgroundColor: cfg.hex }}
      />
      {cfg.name} tidak dipakai
    </div>
  )
}

export default function Ludo() {
  const reduceMotion = useReducedMotion()

  // ── Settings & Stats State ──────────────────────────────────────────
  const [settings, setSettings] = useState(() => loadSettings())
  const [stats, setStats] = useState(() => loadStats())

  // ── Game State ──────────────────────────────────────────────────────
  const [state, setState] = useState(() => {
    const saved = resumeSavedState(loadSavedGame())
    if (saved) return saved
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
  const stateRef = useRef(state)
  const epochRef = useRef(0)
  const rollLockRef = useRef(false)
  const moveLockRef = useRef(false)
  const resultRef = useRef(null)

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

  const cancelTimer = useCallback((id) => {
    clearTimeout(id)
    timersRef.current.delete(id)
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
    if (state.phase !== GAME_PHASES.GAME_OVER) {
      resultRef.current = null
      return
    }
    if (resultRef.current === state.winner) return
    resultRef.current = state.winner

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
  }, [state.phase, state.winner, state.players, state.stats.captures])

  // ── Actions ─────────────────────────────────────────────────────────

  // Roll Dice Action
  const handleRollDice = useCallback(() => {
    const currentState = stateRef.current
    if (rollLockRef.current || moveLockRef.current) return
    if (currentState.phase !== GAME_PHASES.WAIT_ROLL || isRolling) return

    rollLockRef.current = true
    const epoch = epochRef.current
    setIsRolling(true)
    ludoAudio.diceRoll()

    const rollDuration = reduceMotion ? 100 : 700 / settings.animationSpeed

    schedule(() => {
      rollLockRef.current = false
      if (epochRef.current !== epoch) return
      setIsRolling(false)
      const latest = stateRef.current
      if (latest.phase !== GAME_PHASES.WAIT_ROLL) return
      const nextState = gameReducer(latest, { type: 'ROLL' })

      if (nextState.cancellationReason === 'THREE_SIXES') {
        showBanner('Tiga angka 6 berturut-turut! Giliran batal', 'warning')
        ludoAudio.turnCancelled()
      } else if (nextState.currentDice === 6 && nextState.legalMoves.length > 0) {
        showBanner('Dadu 6! Dapat lemparan lagi', 'success', 1600)
      }

      setState(nextState)
    }, rollDuration)
  }, [isRolling, reduceMotion, settings.animationSpeed, schedule, showBanner])

  const announceMoveResult = useCallback(
    (finishedState) => {
      const captured = finishedState.lastMove?.captured
      if (captured) {
        const label =
          captured.count > 1
            ? `${captured.count} pion tertangkap! Bonus lemparan`
            : `Pion ${captured.color} tertangkap! Bonus lemparan`
        showBanner(label, 'success')
        ludoAudio.capture()
        ludoHaptics.capture()
      } else if (finishedState.lastMove?.reachedHome) {
        showBanner('Pion masuk ke Home! Bonus lemparan', 'success')
        ludoAudio.home()
        ludoHaptics.home()
      }
    },
    [showBanner]
  )

  // Select Token Move Action
  const handleSelectToken = useCallback(
    (tokenId) => {
      const currentState = stateRef.current
      if (moveLockRef.current || rollLockRef.current) return
      if (
        currentState.phase !== GAME_PHASES.WAIT_SELECT &&
        currentState.phase !== GAME_PHASES.AUTO_MOVE
      ) {
        return
      }

      const activePlayer = currentState.players[currentState.activePlayerIndex]
      const nextState = gameReducer(currentState, { type: 'SELECT_TOKEN', tokenId })
      if (nextState === currentState || !nextState.lastMove) return

      moveLockRef.current = true
      const epoch = epochRef.current
      setState(nextState)

      const path = nextState.lastMove.path
      const fromPos = nextState.lastMove.fromPos
      const isExitingBase = fromPos === -1

      const finishMove = () => {
        moveLockRef.current = false
        if (epochRef.current !== epoch) return
        setAnimatingToken(null)
        const finishedState = gameReducer(nextState, { type: 'FINISH_MOVE' })
        announceMoveResult(finishedState)
        setState(finishedState)
      }

      if (isExitingBase) {
        ludoAudio.releaseFromBase()
      }

      if (reduceMotion || settings.animationSpeed >= 2) {
        finishMove()
        return
      }

      const stepInterval = Math.max(90, 160 / settings.animationSpeed)
      let stepIdx = 0

      const hopStep = () => {
        if (epochRef.current !== epoch) {
          moveLockRef.current = false
          return
        }
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
          schedule(finishMove, 90)
        }
      }

      hopStep()
    },
    [announceMoveResult, reduceMotion, settings.animationSpeed, schedule]
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
      return () => cancelTimer(id)
    }
  }, [
    state.phase,
    state.legalMoves,
    animatingToken,
    isRolling,
    settings.animationSpeed,
    handleSelectToken,
    schedule,
    cancelTimer,
  ])

  // Skip turn when no legal moves available
  useEffect(() => {
    if (state.phase === GAME_PHASES.RESOLVE && !isRolling) {
      showBanner('Tidak ada langkah. Giliran dilewati', 'info', 1600)
      const delay = Math.max(600, 800 / settings.animationSpeed)
      const id = schedule(() => {
        setState((prev) =>
          prev.phase === GAME_PHASES.RESOLVE
            ? gameReducer(prev, { type: 'AUTO_PASS' })
            : prev
        )
      }, delay)
      return () => cancelTimer(id)
    }
  }, [state.phase, isRolling, settings.animationSpeed, schedule, cancelTimer, showBanner])

  // Bot Turn Automation (Natural Thinking Delay)
  useEffect(() => {
    const activePlayer = state.players[state.activePlayerIndex]
    if (!activePlayer?.isBot || animatingToken || isRolling) return
    if (
      state.phase !== GAME_PHASES.WAIT_ROLL &&
      state.phase !== GAME_PHASES.WAIT_SELECT
    ) {
      return
    }

    const thinkTime =
      (state.phase === GAME_PHASES.WAIT_ROLL ? 650 : 520) + Math.random() * 420
    const phase = state.phase
    const dice = state.currentDice
    const difficulty = activePlayer.botDifficulty
    const snapshot = state

    const id = schedule(() => {
      if (phase === GAME_PHASES.WAIT_ROLL) {
        handleRollDice()
        return
      }
      const chosenToken = chooseBotMove(snapshot, dice, difficulty)
      if (chosenToken != null) {
        handleSelectToken(chosenToken)
      }
    }, thinkTime / settings.animationSpeed)

    return () => cancelTimer(id)
  }, [
    state,
    animatingToken,
    isRolling,
    settings.animationSpeed,
    schedule,
    cancelTimer,
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

    let remaining = settings.turnTimeLimit ?? 15
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
    settings.turnTimeLimit,
    state.activePlayerIndex,
    state.phase,
    state.players,
    handleRollDice,
    handleSelectToken,
  ])

  // Start New Game Handler
  const handleStartNewGame = useCallback(
    ({ mode, playerCount, humanColor, botDifficulty }) => {
      epochRef.current += 1
      rollLockRef.current = false
      moveLockRef.current = false
      clearAllTimers()
      clearSavedGame()
      setIsRolling(false)
      setAnimatingToken(null)
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
      showBanner('Permainan baru dimulai', 'success', 2000)
    },
    [clearAllTimers, settings, showBanner]
  )

  // Reset Current Round
  const handleResetGame = useCallback(() => {
    epochRef.current += 1
    rollLockRef.current = false
    moveLockRef.current = false
    clearAllTimers()
    clearSavedGame()
    setIsRolling(false)
    setAnimatingToken(null)
    setState((prev) =>
      createInitialState({
        mode: prev.mode,
        playerCount: prev.playerCount,
        humanColor: prev.humanColor,
        botDifficulty: prev.botDifficulty,
        options: settings,
      })
    )
    showBanner('Permainan diulang dari awal', 'info', 1800)
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

  const activePlayer = state.players[state.activePlayerIndex]
  const turnHint = (() => {
    if (!activePlayer || state.phase === GAME_PHASES.GAME_OVER) return 'Permainan selesai'
    const who = activePlayer.isBot
      ? activePlayer.name
      : state.mode === 'passAndPlay'
      ? `Giliran ${activePlayer.name}`
      : 'Giliranmu'
    if (isRolling) return `${who} melempar dadu`
    if (state.phase === GAME_PHASES.WAIT_ROLL) {
      return activePlayer.isBot ? `${who} sedang berpikir` : `${who} — ketuk dadu`
    }
    if (state.phase === GAME_PHASES.WAIT_SELECT) {
      return activePlayer.isBot ? `${who} memilih pion` : `${who} — pilih pion yang menyala`
    }
    if (state.phase === GAME_PHASES.AUTO_MOVE || state.phase === GAME_PHASES.MOVING) {
      return 'Pion bergerak'
    }
    if (state.phase === GAME_PHASES.RESOLVE) return 'Tidak ada langkah, giliran dilewati'
    return who
  })()

  // Render a player panel, or a subtle placeholder when the color is not in use
  const renderPlayerPanel = (color) => {
    const player = playerByColor[color]
    if (!player) return <EmptyColorPanel key={color} color={color} />

    const isActive = state.players[state.activePlayerIndex]?.color === color
    return (
      <PlayerPanel
        key={color}
        player={player}
        isActive={isActive}
        phase={state.phase}
        currentDice={state.currentDice}
        isRolling={isRolling}
        timerSeconds={isActive ? timerSeconds : null}
        onRoll={handleRollDice}
      />
    )
  }

  return (
    <main className="ludo-screen relative min-h-[100svh] w-full text-slate-100">
      <div className="pointer-events-none absolute inset-0 overflow-hidden">
        <div className="absolute top-1/4 -left-40 h-96 w-96 rounded-full bg-red-600/15 blur-[120px]" />
        <div className="absolute top-1/4 -right-40 h-96 w-96 rounded-full bg-emerald-600/15 blur-[120px]" />
        <div className="absolute bottom-1/4 -right-40 h-96 w-96 rounded-full bg-amber-600/15 blur-[120px]" />
        <div className="absolute bottom-1/4 -left-40 h-96 w-96 rounded-full bg-blue-600/15 blur-[120px]" />
      </div>

      <div className="ludo-shell relative mx-auto flex w-full max-w-[560px] flex-col items-stretch gap-2 px-3 pt-20 pb-8">
        {/* ── Top Header Navigation Bar ── */}
        <header className="relative z-30 flex w-full shrink-0 items-center justify-between gap-2">
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
        <div className="flex h-8 w-full shrink-0 items-center justify-center">
          <AnimatePresence mode="wait">
            {banner ? (
              <motion.div
                key={banner.id}
                initial={{ opacity: 0, y: -6, scale: 0.95 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: -4, scale: 0.95 }}
                className={`max-w-full truncate rounded-full border px-3 py-1 text-xs font-bold shadow-md ${
                  banner.type === 'success'
                    ? 'border-emerald-400/40 bg-emerald-500/20 text-emerald-200'
                    : banner.type === 'warning'
                    ? 'border-red-400/40 bg-red-500/20 text-red-200'
                    : 'border-white/15 bg-slate-800 text-slate-200'
                }`}
              >
                {banner.text}
              </motion.div>
            ) : (
              <motion.p
                key={turnHint}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="truncate text-xs font-semibold text-slate-300"
              >
                {turnHint}
              </motion.p>
            )}
          </AnimatePresence>
        </div>

        {/* ── Top Player Panels (Red & Green) ── */}
        <div className="grid w-full shrink-0 grid-cols-2 gap-2">
          {renderPlayerPanel('red')}
          {renderPlayerPanel('green')}
        </div>

        {/* ── The 15x15 SVG Ludo Board ── */}
        <div className="ludo-board-stage">
          <LudoBoard
            state={state}
            animatingToken={animatingToken}
            onSelectToken={handleSelectToken}
          />
        </div>

        {/* ── Bottom Player Panels (Blue & Yellow) ── */}
        <div className="grid w-full shrink-0 grid-cols-2 gap-2">
          {renderPlayerPanel('blue')}
          {renderPlayerPanel('yellow')}
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
          // Mirror rules into the running game so changes apply immediately
          setState((prev) =>
            prev ? { ...prev, options: { ...prev.options, ...newVals } } : prev
          )
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
