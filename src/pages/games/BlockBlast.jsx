import { useCallback, useEffect, useMemo, useRef, useState } from "react"
import { AnimatePresence, motion, useAnimationControls, useReducedMotion } from "motion/react"
import {
  ArrowLeft,
  Crown,
  HelpCircle,
  RotateCcw,
  Settings2,
  Sparkles,
  Volume2,
  VolumeX,
  X,
  Zap,
} from "lucide-react"
import { Link } from "react-router-dom"
import {
  BOARD_SIZE,
  canPlacePiece,
  createEmptyBoard,
  isGameOver,
  simulatePlacement,
} from "./blockBlast/boardLogic"
import { generatePieces } from "./blockBlast/shapes"
import { calculateScore } from "./blockBlast/scoring"
import { DRAG, HAPTIC, TIMING } from "./blockBlast/constants"
import { sounds } from "./blockBlast/audio"
import { haptics } from "./blockBlast/haptics"
import { useCountUp } from "./blockBlast/useCountUp"
import { clearGame, loadBest, saveBest } from "./blockBlast/storage"
import { BoardGrid } from "./blockBlast/Board"
import { buildClearCells, cellKeyOf, maxClearDelay } from "./blockBlast/boardFx"
import { CandyBlock, MiniCandy } from "./blockBlast/Block"
import "./blockBlast/blockBlast.css"

const SPRING = { type: "spring", stiffness: 380, damping: 26 }

function createSession() {
  const board = createEmptyBoard()
  return {
    board,
    pieces: generatePieces(board, { score: 0 }),
    score: 0,
    streak: 0,
    dryPlacements: 0,
    totalCleared: 0,
    gameOver: false,
  }
}

function ghostRect(piece, geometry, x, y, pointerType) {
  const rows = piece.matrix.length
  const cols = piece.matrix[0].length
  const gap = Math.max(geometry.step - geometry.size, 0)
  const width = cols * geometry.step - gap
  const height = rows * geometry.step - gap
  const lift = pointerType === "touch" ? geometry.step * DRAG.touchLiftCells : 0

  return {
    left: x - width / 2,
    top: y - height / 2 - lift,
    width,
    height,
  }
}

function GhostBody({ piece, geometry, innerRef, grow = false }) {
  const cols = piece.matrix[0].length
  const gap = Math.max(geometry.step - geometry.size, 0)

  return (
    <div
      ref={innerRef}
      className={grow ? "bb-ghost-inner" : undefined}
      style={{
        display: "grid",
        gridTemplateColumns: `repeat(${cols}, ${geometry.size}px)`,
        gridAutoRows: `${geometry.size}px`,
        gap: `${gap}px`,
      }}
    >
      {piece.matrix.map((row, r) =>
        row.map((value, c) => (
          <div key={`${r}-${c}`} className="relative">
            {value ? <CandyBlock color={piece.color} /> : null}
          </div>
        ))
      )}
    </div>
  )
}

function PiecePreview({ piece }) {
  const cols = piece.matrix[0].length

  return (
    <div
      className="grid"
      style={{
        gridTemplateColumns: `repeat(${cols}, var(--bb-mini))`,
        gridAutoRows: "var(--bb-mini)",
        gap: "3px",
      }}
    >
      {piece.matrix.map((row, r) =>
        row.map((value, c) => (
          <div key={`${r}-${c}`} className="relative">
            {value ? <MiniCandy color={piece.color} /> : null}
          </div>
        ))
      )}
    </div>
  )
}

export default function BlockBlast() {
  const [initial] = useState(createSession)

  // ── Game state ────────────────────────────────────────────────────────
  const [board, setBoard] = useState(initial.board)
  const [pieces, setPieces] = useState(initial.pieces)
  const [score, setScore] = useState(initial.score)
  const [streak, setStreak] = useState(initial.streak)
  const [dryPlacements, setDryPlacements] = useState(initial.dryPlacements)
  const [totalCleared, setTotalCleared] = useState(initial.totalCleared)
  const [gameOver, setGameOver] = useState(initial.gameOver)
  const [best, setBest] = useState(() => Math.max(loadBest(), initial.score))
  const [isNewHigh, setIsNewHigh] = useState(false)

  // ── UI state ──────────────────────────────────────────────────────────
  const [muted, setMuted] = useState(false)
  const [vibrationOn, setVibrationOn] = useState(true)
  const [settingsOpen, setSettingsOpen] = useState(false)
  const [showHowTo, setShowHowTo] = useState(false)
  const [banner, setBanner] = useState(null)
  const [scorePopup, setScorePopup] = useState(null)

  // ── Interaction / effect state ────────────────────────────────────────
  const [preview, setPreview] = useState(null)
  const [drag, setDrag] = useState(null)
  const [returning, setReturning] = useState(null)
  const [clearFx, setClearFx] = useState(null)

  const boardRef = useRef(null)
  const ghostRef = useRef(null)
  const geomRef = useRef(null)
  const dragRef = useRef(null)
  const previewRef = useRef(null)
  const pointerRef = useRef(null)
  const rafRef = useRef(0)
  const busyRef = useRef(false)
  const dragCleanupRef = useRef(null)
  const timersRef = useRef(new Set())

  const shakeControls = useAnimationControls()
  const reduceMotion = useReducedMotion()
  const displayScore = useCountUp(score, { enabled: !reduceMotion })
  const displayFinal = useCountUp(gameOver ? score : 0, {
    duration: 700,
    enabled: gameOver && !reduceMotion,
  })

  const schedule = useCallback((fn, ms) => {
    const id = setTimeout(() => {
      timersRef.current.delete(id)
      fn()
    }, ms)
    timersRef.current.add(id)
    return id
  }, [])

  const clearTimers = useCallback(() => {
    timersRef.current.forEach((id) => clearTimeout(id))
    timersRef.current.clear()
  }, [])

  useEffect(
    () => () => {
      clearTimers()
      if (dragCleanupRef.current) dragCleanupRef.current()
    },
    [clearTimers]
  )

  useEffect(() => {
    sounds.muted = muted
  }, [muted])

  useEffect(() => {
    haptics.enabled = vibrationOn
  }, [vibrationOn])

  // iOS hanya mengizinkan audio setelah gesture pertama
  useEffect(() => {
    const unlock = () => sounds.unlock()
    window.addEventListener("pointerdown", unlock, { once: true })
    return () => window.removeEventListener("pointerdown", unlock)
  }, [])

  const updatePreview = useCallback((next) => {
    const prev = previewRef.current
    if (!prev && !next) return
    if (
      prev &&
      next &&
      prev.r === next.r &&
      prev.c === next.c &&
      prev.valid === next.valid &&
      prev.pieceId === next.pieceId
    ) {
      return
    }
    previewRef.current = next
    setPreview(next)
  }, [])

  const finishGame = useCallback(() => {
    busyRef.current = false
    setGameOver(true)
    sounds.playGameOver()
    haptics.vibrate(HAPTIC.gameOver)
  }, [])

  const resetGame = useCallback(() => {
    clearTimers()
    if (dragCleanupRef.current) dragCleanupRef.current()
    busyRef.current = false
    dragRef.current = null
    geomRef.current = null
    previewRef.current = null

    const next = createSession()
    setBoard(next.board)
    setPieces(next.pieces)
    setScore(0)
    setStreak(0)
    setDryPlacements(0)
    setTotalCleared(0)
    setGameOver(false)
    setIsNewHigh(false)
    setBanner(null)
    setScorePopup(null)
    setClearFx(null)
    setPreview(null)
    setDrag(null)
    setReturning(null)
    setSettingsOpen(false)
    clearGame()
    sounds.playSelect()
  }, [clearTimers])

  // ── Placement & scoring ───────────────────────────────────────────────
  const placePiece = useCallback(
    (piece, startRow, startCol) => {
      if (!piece || piece.used || gameOver || busyRef.current) return
      if (!canPlacePiece(board, piece.matrix, startRow, startCol)) return

      const simulated = simulatePlacement(board, piece, startRow, startCol)
      const markedPieces = pieces.map((p) => (p.id === piece.id ? { ...p, used: true } : p))
      const allUsed = markedPieces.every((p) => p.used)

      const result = calculateScore({
        blocksPlaced: piece.blockCount,
        linesCleared: simulated.linesCleared,
        cellsCleared: simulated.cellsCleared,
        streak,
        dryPlacements,
        isPerfectClear: simulated.isAllClear,
      })
      const nextScore = score + result.points
      // Set baru dibuat dari papan setelah garis terhapus, dijamin bisa dimainkan
      const nextPieces = allUsed
        ? generatePieces(simulated.clearedBoard, { score: nextScore })
        : markedPieces
      const nextGameOver = isGameOver(simulated.clearedBoard, nextPieces)

      setScore(nextScore)
      setStreak(result.streak)
      setDryPlacements(result.dryPlacements)

      if (nextScore > best) {
        setBest(nextScore)
        setIsNewHigh(true)
        saveBest(nextScore)
      }

      sounds.init()
      sounds.playPlace()
      haptics.vibrate(HAPTIC.place)

      if (simulated.linesCleared === 0) {
        setBoard(simulated.clearedBoard)
        setPieces(nextPieces)
        if (nextGameOver) finishGame()
        return
      }

      setBanner({
        id: Date.now(),
        text: result.praise,
        level: result.praiseLevel,
        perfect: result.isPerfectClear,
        comboText: result.streak >= 2 ? `COMBO ×${result.streak}` : null,
        points: result.points,
      })
      schedule(() => setBanner(null), TIMING.bannerMs)

      setScorePopup({
        id: Date.now(),
        points: result.points,
        x: ((startCol + 0.5) / BOARD_SIZE) * 100,
        y: ((startRow + 0.5) / BOARD_SIZE) * 100,
      })
      schedule(() => setScorePopup(null), TIMING.popupMs)

      sounds.playClear({
        lines: simulated.linesCleared,
        streak: result.streak,
        perfect: simulated.isAllClear,
      })
      haptics.vibrate(
        simulated.isAllClear
          ? HAPTIC.perfectClear
          : simulated.linesCleared > 1
            ? HAPTIC.multiClear
            : HAPTIC.clear
      )

      if (simulated.linesCleared >= 3 && !reduceMotion) {
        const distance = TIMING.shakeDistance * Math.min(simulated.linesCleared - 2, 2)
        shakeControls.start({
          x: [0, -distance, distance, -distance * 0.6, distance * 0.6, 0],
          y: [0, distance * 0.4, -distance * 0.4, distance * 0.2, 0],
          transition: { duration: TIMING.shakeMs / 1000, ease: "easeInOut" },
        })
      }

      // Reduced motion: papan langsung ke kondisi akhir, tanpa gelombang
      if (reduceMotion) {
        setBoard(simulated.clearedBoard)
        setPieces(nextPieces)
        if (nextGameOver) finishGame()
        return
      }

      busyRef.current = true
      setBoard(simulated.placed)
      // Balok yang baru dipasang langsung hilang dari tray, set baru datang setelah clear
      setPieces(markedPieces)
      setTotalCleared((total) => total + simulated.linesCleared)

      const cells = buildClearCells(
        simulated.placed,
        simulated.rowsToClear,
        simulated.colsToClear,
        { r: startRow, c: startCol },
        TIMING.clearStaggerMs
      )
      setClearFx({ cells })

      const sweep = maxClearDelay(cells) + TIMING.clearDurationMs + 40
      schedule(() => {
        setBoard(simulated.clearedBoard)
        setClearFx(null)
        setPieces(nextPieces)
        busyRef.current = false
        if (nextGameOver) finishGame()
      }, sweep)
    },
    [
      board,
      pieces,
      score,
      streak,
      dryPlacements,
      best,
      gameOver,
      reduceMotion,
      shakeControls,
      schedule,
      finishGame,
    ]
  )

  // ── Geometry ──────────────────────────────────────────────────────────
  const measureBoard = useCallback(() => {
    const grid = boardRef.current
    if (!grid) return null
    const first = grid.querySelector('[data-cell="0-0"]')
    const second = grid.querySelector('[data-cell="0-1"]')
    if (!first || !second) return null
    const a = first.getBoundingClientRect()
    const b = second.getBoundingClientRect()
    if (!a.width || !b.width) return null
    return { left: a.left, top: a.top, size: a.width, step: b.left - a.left }
  }, [])

  const updateGhost = useCallback(
    (x, y, pointerType) => {
      const current = dragRef.current
      const geometry = geomRef.current
      if (!current || !geometry) return

      const rect = ghostRect(current.piece, geometry, x, y, pointerType)
      if (ghostRef.current) {
        ghostRef.current.style.transform = `translate3d(${Math.round(rect.left)}px, ${Math.round(
          rect.top
        )}px, 0)`
      }

      const row = Math.round((rect.top - geometry.top) / geometry.step)
      const col = Math.round((rect.left - geometry.left) / geometry.step)
      const rows = current.piece.matrix.length
      const cols = current.piece.matrix[0].length
      const inside =
        row >= 0 && col >= 0 && row + rows <= BOARD_SIZE && col + cols <= BOARD_SIZE

      if (!inside) {
        updatePreview(null)
        return
      }

      updatePreview({
        r: row,
        c: col,
        valid: canPlacePiece(board, current.piece.matrix, row, col),
        pieceId: current.piece.id,
      })
    },
    [board, updatePreview]
  )

  const startReturn = useCallback(
    (piece, geometry, pointer) => {
      const rect = ghostRect(piece, geometry, pointer.x, pointer.y, pointer.type)
      const slot = document.querySelector(`[data-slot="${piece.id}"]`)
      const slotRect = slot?.getBoundingClientRect()
      if (!slotRect) return

      setReturning({
        key: Date.now(),
        piece,
        geometry,
        from: { x: rect.left, y: rect.top },
        to: {
          x: slotRect.left + slotRect.width / 2 - rect.width / 2,
          y: slotRect.top + slotRect.height / 2 - rect.height / 2,
        },
      })
    },
    []
  )

  const handlePiecePointerDown = (piece, event) => {
    if (piece.used || gameOver || busyRef.current) return
    if (event.button != null && event.button > 0) return
    event.preventDefault()

    const geometry = measureBoard()
    if (!geometry) return

    const pointerId = event.pointerId
    const pointerType = event.pointerType || "mouse"
    const element = event.currentTarget
    const pointer = { x: event.clientX, y: event.clientY, type: pointerType }

    geomRef.current = geometry
    pointerRef.current = pointer
    dragRef.current = {
      piece,
      pointerId,
      element,
      startX: event.clientX,
      startY: event.clientY,
      moved: false,
    }
    setDrag({ piece, geometry, pointer })
    setReturning(null)
    setSettingsOpen(false)
    sounds.playSelect()

    try {
      element.setPointerCapture(pointerId)
    } catch {}

    const onPointerMove = (moveEvent) => {
      if (dragRef.current?.pointerId !== pointerId) return
      const current = dragRef.current
      const distance = Math.hypot(
        moveEvent.clientX - current.startX,
        moveEvent.clientY - current.startY
      )
      if (distance > DRAG.tapThreshold) current.moved = true

      pointerRef.current = {
        x: moveEvent.clientX,
        y: moveEvent.clientY,
        type: moveEvent.pointerType || pointerType,
      }
      // Satu update per frame, tanpa setState di setiap pointermove
      if (!rafRef.current) {
        rafRef.current = requestAnimationFrame(() => {
          rafRef.current = 0
          const latest = pointerRef.current
          if (latest) updateGhost(latest.x, latest.y, latest.type)
        })
      }
    }

    const cleanup = () => {
      window.removeEventListener("pointermove", onPointerMove)
      window.removeEventListener("pointerup", onPointerUp)
      window.removeEventListener("pointercancel", onPointerCancel)
      if (rafRef.current) {
        cancelAnimationFrame(rafRef.current)
        rafRef.current = 0
      }
      try {
        element.releasePointerCapture(pointerId)
      } catch {}
      dragCleanupRef.current = null
    }

    const finishDrag = () => {
      const current = dragRef.current
      const target = previewRef.current
      const lastGeometry = geomRef.current
      const lastPointer = pointerRef.current
      cleanup()
      dragRef.current = null
      geomRef.current = null
      setDrag(null)
      updatePreview(null)
      if (!current) return

      if (target?.valid && target.pieceId === current.piece.id) {
        placePiece(current.piece, target.r, target.c)
        return
      }

      if (current.moved && lastGeometry && lastPointer) {
        startReturn(current.piece, lastGeometry, lastPointer)
      }
    }

    const onPointerUp = (upEvent) => {
      if (pointerId != null && upEvent.pointerId !== pointerId) return
      finishDrag()
    }

    const onPointerCancel = (cancelEvent) => {
      if (pointerId != null && cancelEvent.pointerId !== pointerId) return
      finishDrag()
    }

    window.addEventListener("pointermove", onPointerMove, { passive: true })
    window.addEventListener("pointerup", onPointerUp, { passive: true })
    window.addEventListener("pointercancel", onPointerCancel, { passive: true })
    dragCleanupRef.current = cleanup
  }

  // ── Derived preview data ──────────────────────────────────────────────
  const previewCells = useMemo(() => {
    if (!preview) return null
    const piece = pieces.find((p) => p.id === preview.pieceId)
    if (!piece) return null
    const cells = new Set()
    piece.matrix.forEach((row, rOffset) => {
      row.forEach((value, cOffset) => {
        if (value) cells.add(cellKeyOf(preview.r + rOffset, preview.c + cOffset))
      })
    })
    return { cells, valid: preview.valid, color: piece.color }
  }, [preview, pieces])

  const previewLines = useMemo(() => {
    if (!preview?.valid) return null
    const piece = pieces.find((p) => p.id === preview.pieceId)
    if (!piece) return null
    const simulated = simulatePlacement(board, piece, preview.r, preview.c)
    if (!simulated.linesCleared) return null
    return { rows: new Set(simulated.rowsToClear), cols: new Set(simulated.colsToClear) }
  }, [preview, pieces, board])

  const ghostPreview = drag
    ? ghostRect(drag.piece, drag.geometry, drag.pointer.x, drag.pointer.y, drag.pointer.type)
    : null
  const activePieces = pieces.filter((p) => !p.used).length

  return (
    <div className="bb-page relative min-h-[100svh] overflow-x-hidden text-slate-100 select-none">
      <div className="relative mx-auto flex min-h-[100svh] w-full max-w-[520px] flex-col items-center px-3 pt-20 pb-6">
        {/* ── Top bar ── */}
        <div className="relative z-40 flex w-full items-center justify-between gap-2">
          <Link
            to="/games"
            className="flex h-9 items-center gap-1.5 rounded-full border border-white/10 bg-white/[0.06] px-3 text-[11px] font-semibold text-slate-300 backdrop-blur transition-colors hover:bg-white/10 hover:text-white"
          >
            <ArrowLeft size={14} />
            Games
          </Link>

          <div className="flex items-center gap-1.5 rounded-full border border-amber-300/25 bg-amber-400/10 px-3 py-1.5 text-amber-200">
            <Crown size={14} className="text-amber-300" />
            <span className="text-xs font-bold tabular-nums">{best.toLocaleString()}</span>
          </div>

          <div className="relative flex items-center gap-1.5">
            <button
              onClick={() => setShowHowTo(true)}
              aria-label="Cara Bermain"
              className="flex h-9 w-9 items-center justify-center rounded-full border border-white/10 bg-white/[0.06] text-slate-300 backdrop-blur transition-colors hover:bg-white/10 hover:text-white"
            >
              <HelpCircle size={15} />
            </button>
            <button
              onClick={() => setSettingsOpen((open) => !open)}
              aria-label="Pengaturan"
              aria-expanded={settingsOpen}
              className="flex h-9 w-9 items-center justify-center rounded-full border border-white/10 bg-white/[0.06] text-slate-300 backdrop-blur transition-colors hover:bg-white/10 hover:text-white"
            >
              <Settings2 size={15} />
            </button>

            <AnimatePresence>
              {settingsOpen && (
                <>
                  <div
                    className="fixed inset-0 z-30"
                    onClick={() => setSettingsOpen(false)}
                    aria-hidden="true"
                  />
                  <motion.div
                    initial={{ opacity: 0, y: -8, scale: 0.95 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: -6, scale: 0.97 }}
                    transition={{ duration: 0.16 }}
                    className="bb-settings-panel absolute top-11 right-0 z-40 w-56 rounded-2xl p-2"
                  >
                    <button
                      onClick={() => setMuted((value) => !value)}
                      className="flex w-full items-center justify-between rounded-xl px-3 py-2.5 text-xs font-semibold text-slate-200 transition-colors hover:bg-white/10"
                    >
                      <span className="flex items-center gap-2">
                        {muted ? <VolumeX size={15} /> : <Volume2 size={15} />}
                        Suara
                      </span>
                      <span
                        className={`rounded-full px-2 py-0.5 text-[9px] font-black ${
                          muted ? "bg-white/10 text-slate-400" : "bg-emerald-500 text-white"
                        }`}
                      >
                        {muted ? "OFF" : "ON"}
                      </span>
                    </button>
                    <button
                      onClick={() => setVibrationOn((value) => !value)}
                      className="flex w-full items-center justify-between rounded-xl px-3 py-2.5 text-xs font-semibold text-slate-200 transition-colors hover:bg-white/10"
                    >
                      <span className="flex items-center gap-2">
                        <Zap
                          size={15}
                          className={vibrationOn ? "text-amber-300" : "text-slate-500"}
                        />
                        Getar
                      </span>
                      <span
                        className={`rounded-full px-2 py-0.5 text-[9px] font-black ${
                          vibrationOn
                            ? "bg-amber-400 text-amber-950"
                            : "bg-white/10 text-slate-400"
                        }`}
                      >
                        {vibrationOn ? "ON" : "OFF"}
                      </span>
                    </button>
                    <button
                      onClick={resetGame}
                      className="flex w-full items-center gap-2 rounded-xl px-3 py-2.5 text-xs font-semibold text-slate-200 transition-colors hover:bg-white/10"
                    >
                      <RotateCcw size={15} />
                      Main Ulang
                    </button>
                    <Link
                      to="/games"
                      className="flex w-full items-center gap-2 rounded-xl px-3 py-2.5 text-xs font-semibold text-slate-200 transition-colors hover:bg-white/10"
                    >
                      <ArrowLeft size={15} />
                      Kembali ke Games
                    </Link>
                  </motion.div>
                </>
              )}
            </AnimatePresence>
          </div>
        </div>

        {/* ── Score ── */}
        <div className="mt-1 flex flex-col items-center">
          <span className="text-[9px] font-bold tracking-[0.42em] text-indigo-200/40 uppercase">
            Block Blast
          </span>
          <span className="font-display text-[46px] leading-none font-black tracking-tight text-white tabular-nums sm:text-5xl">
            {displayScore.toLocaleString()}
          </span>
          <div className="mt-1.5 flex h-6 items-center">
            {streak >= 2 && (
              <motion.span
                key={streak}
                initial={{ scale: 0.6, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={SPRING}
                className="bb-combo-chip rounded-full px-2.5 py-0.5 text-[11px] font-black tracking-wide text-white"
              >
                COMBO ×{streak}
              </motion.span>
            )}
          </div>
        </div>

        {/* ── Board ── */}
        <div className="bb-stage relative mt-1">
          <AnimatePresence>
            {banner && (
              <motion.div
                key={banner.id}
                initial={{ opacity: 0, y: 10, scale: 0.75 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: -22, scale: 1.08 }}
                transition={{ type: "spring", stiffness: 420, damping: 22 }}
                className="pointer-events-none absolute inset-x-0 top-[26%] z-30 flex flex-col items-center gap-1"
              >
                <span
                  className="bb-praise font-display font-black tracking-tight"
                  style={{
                    fontSize: banner.perfect
                      ? "clamp(2.4rem, 11vw, 3.6rem)"
                      : `${30 + (banner.level ?? 0) * 5}px`,
                  }}
                >
                  {banner.text}
                </span>
                <span className="flex items-center gap-2 rounded-full bg-black/45 px-3 py-1 text-[11px] font-bold text-white backdrop-blur">
                  {banner.comboText && (
                    <span className="text-orange-300">{banner.comboText}</span>
                  )}
                  <span>+{banner.points.toLocaleString()}</span>
                </span>
              </motion.div>
            )}
          </AnimatePresence>

          <AnimatePresence>
            {scorePopup && (
              <motion.span
                key={scorePopup.id}
                initial={{ opacity: 0, y: 8, scale: 0.7 }}
                animate={{ opacity: 1, y: -28, scale: 1 }}
                exit={{ opacity: 0, y: -58, scale: 0.9 }}
                transition={{ duration: 0.85, ease: "easeOut" }}
                className="font-display pointer-events-none absolute z-30 -translate-x-1/2 -translate-y-1/2 text-xl font-black text-white"
                style={{
                  left: `${scorePopup.x}%`,
                  top: `${scorePopup.y}%`,
                  textShadow: "0 3px 12px rgba(0,0,0,0.65)",
                }}
              >
                +{scorePopup.points.toLocaleString()}
              </motion.span>
            )}
          </AnimatePresence>

          <motion.div animate={shakeControls}>
            <BoardGrid
              board={board}
              preview={previewCells}
              highlight={previewLines}
              clearFx={clearFx}
              boardRef={boardRef}
              reduceMotion={reduceMotion}
            />
          </motion.div>
        </div>

        {/* ── Tray ── */}
        <div className="bb-stage mt-3">
          <div className="mb-1.5 flex items-center justify-between px-1">
            <span className="text-[9px] font-semibold tracking-[0.22em] text-indigo-200/40 uppercase">
              Balok · {activePieces}/3
            </span>
            <span className="text-[9px] text-indigo-200/30 italic">geser ke papan</span>
          </div>

          <div className="bb-tray grid grid-cols-3 gap-2 rounded-[24px] border border-white/10 p-2">
            {pieces.map((piece) => (
              <motion.div
                key={piece.id}
                data-slot={piece.id}
                initial={{ y: 28, opacity: 0 }}
                animate={{
                  y: 0,
                  opacity: piece.used ? 0.18 : drag?.piece.id === piece.id ? 0.12 : 1,
                  scale: 1,
                }}
                transition={SPRING}
                onPointerDown={(event) => handlePiecePointerDown(piece, event)}
                className={`bb-tray-slot relative flex min-h-[104px] touch-none items-center justify-center rounded-2xl ${
                  piece.used ? "cursor-default" : "cursor-grab active:cursor-grabbing"
                }`}
              >
                {!piece.used && <PiecePreview piece={piece} />}
              </motion.div>
            ))}
          </div>
        </div>
      </div>

      {/* ── Dragged piece: grows to board scale, held above the finger ── */}
      {drag && ghostPreview && (
        <div
          ref={ghostRef}
          aria-hidden="true"
          className="bb-ghost-wrap pointer-events-none fixed top-0 left-0 z-[60] will-change-transform"
          style={{
            transform: `translate3d(${Math.round(ghostPreview.left)}px, ${Math.round(
              ghostPreview.top
            )}px, 0)`,
          }}
        >
          <GhostBody piece={drag.piece} geometry={drag.geometry} grow />
        </div>
      )}

      {/* ── Invalid drop: spring back to the tray ── */}
      {returning && (
        <motion.div
          key={returning.key}
          aria-hidden="true"
          className="bb-ghost-wrap pointer-events-none fixed top-0 left-0 z-[55]"
          initial={{ x: returning.from.x, y: returning.from.y, scale: 1, opacity: 1 }}
          animate={{ x: returning.to.x, y: returning.to.y, scale: 0.42, opacity: 0 }}
          transition={{ duration: TIMING.returnMs / 1000, ease: [0.34, 1.56, 0.64, 1] }}
          onAnimationComplete={() =>
            setReturning((current) =>
              current?.key === returning.key ? null : current
            )
          }
        >
          <GhostBody piece={returning.piece} geometry={returning.geometry} />
        </motion.div>
      )}

      {/* ═════ Game Over ═════ */}
      <AnimatePresence>
        {gameOver && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[70] flex items-center justify-center bg-[#05081c]/82 px-4 backdrop-blur-md"
          >
            <motion.div
              initial={{ scale: 0.86, opacity: 0, y: 22 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.9, opacity: 0 }}
              transition={SPRING}
              className="relative w-full max-w-sm overflow-hidden rounded-[28px] border border-white/10 bg-[#111635] p-7 text-center shadow-2xl"
            >
              <div className="absolute inset-x-0 top-0 h-1 bg-gradient-to-r from-[#4a9df2] via-[#4cbf6a] to-[#f05555]" />

              <div className="mx-auto mb-4 grid h-14 w-14 grid-cols-2 gap-1 rounded-2xl border border-white/10 bg-white/5 p-2">
                <span className="rounded-[4px] bg-[#4a9df2]" />
                <span className="rounded-[4px] bg-[#f5c542]" />
                <span className="rounded-[4px] bg-[#4cbf6a]" />
                <span className="rounded-[4px] bg-[#f05555]" />
              </div>

              <h2 className="font-display text-3xl font-black tracking-tight text-white">
                Game Over
              </h2>
              <p className="mt-1.5 text-[11px] text-slate-400">
                Tidak ada balok tersisa yang muat di papan.
              </p>

              <div className="my-5 rounded-2xl border border-white/10 bg-white/[0.04] p-5">
                <span className="text-[9px] font-semibold tracking-[0.25em] text-slate-400 uppercase">
                  Skor Akhir
                </span>
                <div className="font-display mt-1 text-4xl font-black text-white tabular-nums">
                  {displayFinal.toLocaleString()}
                </div>
                <div className="mt-3 flex items-center justify-center gap-2 text-[11px] text-slate-400">
                  <Crown size={13} className="text-amber-300" />
                  Terbaik {best.toLocaleString()}
                  <span className="text-slate-600">·</span>
                  {totalCleared} garis
                </div>
                {isNewHigh && (
                  <div className="mt-3 flex items-center justify-center gap-1.5 rounded-lg bg-emerald-500/15 py-1.5 text-[11px] font-bold text-emerald-300">
                    <Sparkles size={13} /> New Best!
                  </div>
                )}
              </div>

              <div className="space-y-2.5">
                <button
                  onClick={resetGame}
                  className="w-full rounded-xl bg-indigo-500 py-3 text-sm font-bold text-white shadow-lg shadow-indigo-500/25 transition-all hover:bg-indigo-400 active:scale-[0.98]"
                >
                  Main Lagi
                </button>
                <Link
                  to="/games"
                  className="block w-full rounded-xl border border-white/10 bg-white/5 py-2.5 text-xs font-semibold text-slate-300 transition-colors hover:bg-white/10 hover:text-white"
                >
                  Kembali ke Games
                </Link>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ═════ How To Play ═════ */}
      <AnimatePresence>
        {showHowTo && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[70] flex items-center justify-center bg-[#05081c]/82 px-4 backdrop-blur-md"
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              transition={SPRING}
              className="relative w-full max-w-md overflow-hidden rounded-[28px] border border-white/10 bg-[#111635] p-6 shadow-2xl"
            >
              <div className="absolute inset-x-0 top-0 h-1 bg-gradient-to-r from-[#4a9df2] via-[#4cbf6a] to-[#f05555]" />
              <button
                onClick={() => setShowHowTo(false)}
                aria-label="Tutup"
                className="absolute top-5 right-5 text-slate-400 transition-colors hover:text-white"
              >
                <X size={18} />
              </button>

              <h3 className="font-display text-lg font-bold text-white">Cara Bermain</h3>

              <div className="mt-4 space-y-2.5 text-[11px] leading-6 text-slate-300">
                <div className="rounded-xl border border-white/10 bg-white/[0.04] p-3">
                  <span className="font-semibold text-white">Pasang Balok —</span> Geser balok dari
                  tray ke papan. Tidak bisa diputar atau dibalik. Ketiga balok harus dipakai
                  sebelum set baru muncul.
                </div>
                <div className="rounded-xl border border-white/10 bg-white/[0.04] p-3">
                  <span className="font-semibold text-white">Bersihkan Garis —</span> Penuhi satu
                  baris atau kolom. Baris/kolom yang akan pecah menyala saat kamu menggeser balok.
                  Baris dan kolom bisa pecah bersamaan.
                </div>
                <div className="rounded-xl border border-white/10 bg-white/[0.04] p-3">
                  <span className="font-semibold text-white">Combo —</span> Clear berturut-turut
                  menaikkan pengali. Tiga penempatan tanpa clear memutus combo.
                </div>
                <div className="rounded-xl border border-white/10 bg-white/[0.04] p-3">
                  <span className="font-semibold text-white">Perfect —</span> Kosongkan seluruh
                  papan untuk bonus besar. Game over kalau tidak ada balok yang muat.
                </div>
              </div>

              <button
                onClick={() => setShowHowTo(false)}
                className="mt-5 w-full rounded-xl bg-indigo-500 py-2.5 text-xs font-bold text-white shadow-lg shadow-indigo-500/20 transition-colors hover:bg-indigo-400"
              >
                Siap Main!
              </button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
