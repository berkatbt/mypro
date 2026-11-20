import { useState, useCallback, useMemo, useRef, useEffect, memo } from "react"
import { motion, AnimatePresence, useAnimationControls } from "motion/react"
import {
  ArrowLeft,
  RotateCcw,
  Trophy,
  Volume2,
  VolumeX,
  Zap,
  Flame,
  HelpCircle,
  X,
  Pause,
  Play,
} from "lucide-react"
import { Link } from "react-router-dom"
import {
  BOARD_SIZE,
  createEmptyBoard,
  canPlacePiece,
  isGameOver,
  simulatePlacement,
} from "./blockBlast/boardLogic"
import { calculateScore } from "./blockBlast/scoring"
import { generateThreePieces } from "./blockBlast/shapes"
import { sounds } from "./blockBlast/audio"
import { TIMING, DRAG, HAPTIC, STORAGE_KEYS } from "./blockBlast/constants"

// Floating particle component for blast effects — candy-colored sparks
const SPARK_COLORS = ["#ff6b6b", "#ffa726", "#ffd93d", "#5bd67a", "#4aa8ff", "#a47bff"]

function BlastParticles({ active }) {
  // Pre-seeded particle data stable across renders (useMemo with active as key triggers fresh values)
  const particles = useMemo(
    () =>
      Array.from({ length: 12 }, (_, i) => ({
        id: i,
        x: pseudoRandom(i * 7 + 1) * 100,
        y: pseudoRandom(i * 13 + 3) * 100,
        size: 3 + pseudoRandom(i * 19 + 5) * 4,
        delay: pseudoRandom(i * 23 + 7) * 0.15,
        drift: -30 + pseudoRandom(i * 31 + 11) * -20,
      })),
    [active] // eslint-disable-line react-hooks/exhaustive-deps
  )

  if (!active) return null

  return (
    <div className="pointer-events-none absolute inset-0 z-10 overflow-hidden">
      {particles.map((p) => (
        <motion.span
          key={p.id}
          initial={{ opacity: 1, scale: 1 }}
          animate={{ opacity: 0, scale: 0, y: p.drift }}
          transition={{ duration: 0.5, delay: p.delay, ease: "easeOut" }}
          className="absolute rounded-full"
          style={{
            left: `${p.x}%`,
            top: `${p.y}%`,
            width: p.size,
            height: p.size,
            backgroundColor: SPARK_COLORS[p.id % SPARK_COLORS.length],
          }}
        />
      ))}
    </div>
  )
}

// Simple deterministic pseudo-random (seeded by index) so render is pure
function pseudoRandom(seed) {
  const x = Math.sin(seed * 9301 + 49297) * 233280
  return x - Math.floor(x)
}

// Chunky candy block with natural 3D bevel: glossy top, darker bottom/right edges,
// soft contact shadow. All layers are pointer-events-none so hit-testing falls
// through to the cell socket below.
function CandyBlock({ color, blasting = false }) {
  return (
    <>
      {/* top face */}
      <div
        className="pointer-events-none absolute inset-0 rounded-[6px] transition-[filter] duration-150"
        style={{
          background: `linear-gradient(135deg, ${color.top} 0%, ${color.mid} 60%)`,
          filter: blasting ? "brightness(1.8) saturate(1.4)" : "none",
        }}
      />
      {/* glossy top-left highlight */}
      <div
        className="pointer-events-none absolute inset-x-[2px] top-[1px] h-[45%] rounded-t-[5px]"
        style={{
          background: "linear-gradient(180deg, rgba(255,255,255,0.55), rgba(255,255,255,0.04))",
        }}
      />
      {/* darker bottom bevel — gives the block its thickness */}
      <div
        className="pointer-events-none absolute inset-x-0 bottom-0 h-[5px] rounded-b-[6px]"
        style={{ background: color.dark }}
      />
      {/* right side bevel */}
      <div
        className="pointer-events-none absolute inset-y-0 right-0 w-[3px] rounded-r-[6px]"
        style={{ background: color.dark, opacity: 0.6 }}
      />
      {/* soft contact shadow on the tray */}
      <div
        className="pointer-events-none absolute"
        style={{
          left: "-10%",
          right: "-10%",
          bottom: "-4px",
          height: "8px",
          background: "radial-gradient(ellipse at center, rgba(0,0,0,0.4), transparent 70%)",
        }}
      />
    </>
  )
}

// Smaller candy block used in the dock
function MiniCandy({ color }) {
  return (
    <>
      <div
        className="pointer-events-none absolute inset-0 rounded-[3px]"
        style={{ background: `linear-gradient(135deg, ${color.top} 0%, ${color.mid} 60%)` }}
      />
      <div
        className="pointer-events-none absolute inset-x-[1px] top-[0.5px] h-[45%] rounded-t-[2px]"
        style={{
          background: "linear-gradient(180deg, rgba(255,255,255,0.6), rgba(255,255,255,0.05))",
        }}
      />
      <div
        className="pointer-events-none absolute inset-x-0 bottom-0 h-[2px] rounded-b-[3px]"
        style={{ background: color.dark }}
      />
    </>
  )
}

// One grid cell. Memoized so dragging only re-renders the cells whose preview,
// highlight or blast state actually changed (64 cells stay cheap on mobile).
const BoardCell = memo(function BoardCell({
  r,
  c,
  cell,
  previewKind,
  previewColor,
  willClear,
  blastDelayMs,
}) {
  const cellKey = `${r}-${c}`
  const blasting = blastDelayMs != null

  if (cell) {
    return (
      <motion.div
        data-cell={cellKey}
        initial={{ scale: 0.55, opacity: 0, y: -6 }}
        animate={
          blasting
            ? { scale: [1, 1.18, 0.12], opacity: [1, 1, 0], rotate: [0, -6, 8] }
            : { scale: 1, opacity: 1, y: 0 }
        }
        transition={
          blasting
            ? {
                duration: TIMING.clearDurationMs / 1000,
                delay: blastDelayMs / 1000,
                ease: "easeOut",
                times: [0, 0.32, 1],
              }
            : { type: "spring", stiffness: 460, damping: 24 }
        }
        className="relative touch-none"
      >
        <CandyBlock color={cell} blasting={blasting} />
        {willClear && (
          <div className="pointer-events-none absolute inset-0 rounded-[6px] bg-white/45 shadow-[0_0_12px_rgba(255,255,255,0.8)]" />
        )}
        {previewKind === 2 && (
          <div className="pointer-events-none absolute inset-0 rounded-[6px] bg-rose-500/45 ring-1 ring-rose-300/80 ring-inset" />
        )}
      </motion.div>
    )
  }

  if (previewKind) {
    const isValid = previewKind === 1
    return (
      <div
        data-cell={cellKey}
        className={`relative touch-none rounded-[7px] border ${
          isValid
            ? "shadow-[inset_0_1px_3px_rgba(255,255,255,0.55)]"
            : "border-rose-400/70 bg-rose-500/25"
        }`}
        style={
          isValid
            ? {
                backgroundColor: previewColor?.previewBg,
                borderColor: previewColor?.previewBorder,
              }
            : undefined
        }
      >
        {willClear && (
          <div className="pointer-events-none absolute inset-0 rounded-[6px] bg-white/30" />
        )}
      </div>
    )
  }

  return (
    <div
      data-cell={cellKey}
      className={`relative touch-none rounded-[7px] transition-colors duration-150 ${
        willClear
          ? "bg-white/20 ring-1 ring-white/60 ring-inset"
          : "bg-white/[0.055] shadow-[inset_0_1px_2px_rgba(0,0,0,0.35)]"
      }`}
    />
  )
})

const cellKeyOf = (r, c) => `${r}-${c}`

// Delay per cell so a clear ripples outward instead of popping all at once
function buildClearCells(rowsToClear, colsToClear, stagger) {
  const cells = new Map()

  rowsToClear.forEach((r) => {
    for (let c = 0; c < BOARD_SIZE; c++) {
      const key = cellKeyOf(r, c)
      if (!cells.has(key)) cells.set(key, (c + r * 0.4) * stagger)
    }
  })

  colsToClear.forEach((c) => {
    for (let r = 0; r < BOARD_SIZE; r++) {
      const key = cellKeyOf(r, c)
      if (!cells.has(key)) cells.set(key, r * stagger)
    }
  })

  return cells
}

function readHighScore() {
  try {
    const saved = localStorage.getItem(STORAGE_KEYS.best)
    return saved ? parseInt(saved, 10) || 0 : 0
  } catch {
    return 0
  }
}

export default function BlockBlast() {
  // ── Game state ────────────────────────────────────────────────────────
  const [board, setBoard] = useState(() => createEmptyBoard())
  const [pieces, setPieces] = useState(() => generateThreePieces(createEmptyBoard()))
  const [score, setScore] = useState(0)
  const [highScore, setHighScore] = useState(readHighScore)
  const [combo, setCombo] = useState(0)
  const [totalCleared, setTotalCleared] = useState(0)
  const [isNewHigh, setIsNewHigh] = useState(false)
  const [gameOver, setGameOver] = useState(false)
  const [isPaused, setIsPaused] = useState(false)
  const [isMuted, setIsMuted] = useState(false)
  const [showHowTo, setShowHowTo] = useState(false)

  // ── Effect state ─────────────────────────────────────────────────────
  const [banner, setBanner] = useState(null)
  const [clearFx, setClearFx] = useState(null) // { cells: Map<key, delayMs> }
  const [showParticles, setShowParticles] = useState(false)

  // ── Selection & drag state ───────────────────────────────────────────
  const [selectedPieceId, setSelectedPieceId] = useState(null)
  const [preview, setPreview] = useState(null) // { r, c, valid, pieceId }
  const [draggingPiece, setDraggingPiece] = useState(null)
  const [dragGeom, setDragGeom] = useState(null) // { size, step } in px

  const shakeControls = useAnimationControls()
  const boardRef = useRef(null)
  const ghostRef = useRef(null)
  const geomRef = useRef(null)
  const dragRef = useRef(null)
  const dragCleanupRef = useRef(null)
  const pointerRef = useRef(null)
  const previewRef = useRef(null)
  const boardTapRef = useRef(false)
  const rafRef = useRef(0)
  const busyRef = useRef(false)
  const timersRef = useRef(new Set())

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

  const toggleSound = () => {
    sounds.muted = !isMuted
    setIsMuted(!isMuted)
  }

  const resetGame = useCallback(() => {
    clearTimers()
    if (dragCleanupRef.current) dragCleanupRef.current()
    busyRef.current = false
    dragRef.current = null
    previewRef.current = null

    const emptyBoard = createEmptyBoard()
    setBoard(emptyBoard)
    setPieces(generateThreePieces(emptyBoard))
    setScore(0)
    setCombo(0)
    setTotalCleared(0)
    setIsNewHigh(false)
    setGameOver(false)
    setIsPaused(false)
    setSelectedPieceId(null)
    setPreview(null)
    setDraggingPiece(null)
    setDragGeom(null)
    setClearFx(null)
    setBanner(null)
    setShowParticles(false)
    sounds.playSelect()
  }, [clearTimers])

  const handlePlacement = useCallback(
    (piece, startRow, startCol) => {
      if (!piece || piece.used || gameOver || isPaused || busyRef.current) return false
      if (!canPlacePiece(board, piece.matrix, startRow, startCol)) return false

      const {
        placed,
        clearedBoard,
        rowsToClear,
        colsToClear,
        linesCleared,
        cellsCleared,
        isAllClear,
      } = simulatePlacement(board, piece, startRow, startCol)

      const markedPieces = pieces.map((p) => (p.id === piece.id ? { ...p, used: true } : p))
      const allUsed = markedPieces.every((p) => p.used)
      // Set baru dibuat dari papan SETELAH garis terhapus, dan dijamin bisa dimainkan
      const nextPieces = allUsed ? generateThreePieces(clearedBoard) : markedPieces

      const result = calculateScore({
        blocksPlaced: piece.blockCount,
        linesCleared,
        cellsCleared,
        streak: combo,
        isPerfectClear: isAllClear,
      })
      const nextScore = score + result.points

      sounds.init()
      sounds.playPlace()
      sounds.vibrate(HAPTIC.place)

      setScore(nextScore)
      setCombo(result.streak)
      setSelectedPieceId(null)
      setDraggingPiece(null)
      setDragGeom(null)
      updatePreview(null)

      if (nextScore > highScore) {
        setHighScore(nextScore)
        setIsNewHigh(true)
        try {
          localStorage.setItem(STORAGE_KEYS.best, String(nextScore))
        } catch {}
      }

      // Tidak ada garis pecah — papan langsung update
      if (linesCleared === 0) {
        setBoard(clearedBoard)
        setPieces(nextPieces)
        if (isGameOver(clearedBoard, nextPieces)) {
          sounds.playGameOver()
          sounds.vibrate(HAPTIC.gameOver)
          setGameOver(true)
        }
        return true
      }

      // Ada garis pecah — tampilkan pecah berurutan dulu, baru papan diupdate
      busyRef.current = true
      setBoard(placed)
      setTotalCleared((prev) => prev + linesCleared)
      setClearFx({ cells: buildClearCells(rowsToClear, colsToClear, TIMING.clearStaggerMs) })
      setShowParticles(true)
      schedule(() => setShowParticles(false), 600)

      sounds.playBlast(linesCleared)
      if (result.streak > 1) sounds.playCombo(result.streak)
      sounds.vibrate(
        isAllClear ? HAPTIC.perfectClear : linesCleared > 1 ? HAPTIC.multiClear : HAPTIC.clear
      )

      if (linesCleared >= 2) {
        const dist = TIMING.shakeDistance * Math.min(linesCleared - 1, 3)
        shakeControls.start({
          x: [0, -dist, dist, -dist * 0.6, dist * 0.6, 0],
          y: [0, dist * 0.5, -dist * 0.5, dist * 0.3, 0],
          transition: { duration: TIMING.shakeMs / 1000, ease: "easeInOut" },
        })
      }

      if (result.label) {
        setBanner({
          text: result.praise,
          comboText: result.streak >= 2 ? `COMBO ×${result.streak}` : null,
          points: result.points,
          id: Date.now(),
        })
        schedule(() => setBanner(null), TIMING.bannerMs)
      }

      const sweep = TIMING.clearStaggerMs * (BOARD_SIZE - 1)
      schedule(() => {
        setBoard(clearedBoard)
        setClearFx(null)
        setPieces(nextPieces)
        busyRef.current = false
        if (isGameOver(clearedBoard, nextPieces)) {
          sounds.playGameOver()
          sounds.vibrate(HAPTIC.gameOver)
          setGameOver(true)
        }
      }, sweep + TIMING.clearDurationMs + 30)

      return true
    },
    [
      board,
      pieces,
      combo,
      score,
      highScore,
      gameOver,
      isPaused,
      schedule,
      updatePreview,
      shakeControls,
    ]
  )

  // ── Geometry helpers ─────────────────────────────────────────────────
  const measureBoard = useCallback(() => {
    const grid = boardRef.current
    if (!grid) return null
    const firstCell = grid.querySelector('[data-cell="0-0"]')
    const nextCell = grid.querySelector('[data-cell="0-1"]')
    if (!firstCell || !nextCell) return null
    const a = firstCell.getBoundingClientRect()
    const b = nextCell.getBoundingClientRect()
    if (!a.width || !b.width) return null
    return { left: a.left, top: a.top, size: a.width, step: b.left - a.left }
  }, [])

  // Moves the lifted piece above the finger and resolves the target cell.
  // Runs straight on the DOM node so dragging never re-renders the board.
  const renderGhost = useCallback(
    (x, y, pointerType) => {
      const drag = dragRef.current
      const geom = geomRef.current
      if (!drag || !geom) return

      const { piece } = drag
      const rows = piece.matrix.length
      const cols = piece.matrix[0].length
      const gap = Math.max(geom.step - geom.size, 0)
      const width = cols * geom.step - gap
      const height = rows * geom.step - gap
      const lift = pointerType === "touch" ? geom.step * DRAG.touchLiftCells : 0
      const left = x - width / 2
      const top = y - height - lift

      if (ghostRef.current) {
        ghostRef.current.style.transform = `translate3d(${Math.round(left)}px, ${Math.round(
          top
        )}px, 0)`
      }

      const c = Math.round((left - geom.left) / geom.step)
      const r = Math.round((top - geom.top) / geom.step)
      const inside = r >= 0 && c >= 0 && r + rows <= BOARD_SIZE && c + cols <= BOARD_SIZE

      if (!inside) {
        updatePreview(null)
        return
      }

      const valid = canPlacePiece(board, piece.matrix, r, c)
      updatePreview({ r, c, valid, pieceId: piece.id })
    },
    [board, updatePreview]
  )

  useEffect(() => {
    if (!draggingPiece) return
    const pointer = pointerRef.current
    if (pointer) renderGhost(pointer.x, pointer.y, pointer.type)
  }, [draggingPiece, dragGeom, renderGhost])

  const handlePiecePointerDown = (piece, event) => {
    if (piece.used || gameOver || isPaused || busyRef.current) return
    if (event.button > 0) return
    event.preventDefault()

    const geom = measureBoard()
    if (!geom) return

    geomRef.current = geom
    pointerRef.current = { x: event.clientX, y: event.clientY, type: event.pointerType }
    const wasSelected = selectedPieceId === piece.id
    dragRef.current = {
      piece,
      startX: event.clientX,
      startY: event.clientY,
      wasSelected,
      moved: false,
    }

    setSelectedPieceId(piece.id)
    setDragGeom({ size: geom.size, step: geom.step })
    setDraggingPiece(piece)
    sounds.playSelect()

    const pointerId = event.pointerId

    const onPointerMove = (moveEvent) => {
      if (pointerId != null && moveEvent.pointerId !== pointerId) return
      const drag = dragRef.current
      if (drag) {
        const distance = Math.hypot(
          moveEvent.clientX - drag.startX,
          moveEvent.clientY - drag.startY
        )
        if (distance > DRAG.tapThreshold) drag.moved = true
      }
      pointerRef.current = {
        x: moveEvent.clientX,
        y: moveEvent.clientY,
        type: moveEvent.pointerType,
      }
      // Satu update per frame, walau pointermove bisa puluhan kali per frame
      if (!rafRef.current) {
        rafRef.current = requestAnimationFrame(() => {
          rafRef.current = 0
          const pointer = pointerRef.current
          if (pointer) renderGhost(pointer.x, pointer.y, pointer.type)
        })
      }
    }

    const finishDrag = () => {
      cleanup()
      const drag = dragRef.current
      const target = previewRef.current
      dragRef.current = null
      geomRef.current = null

      if (drag && target && target.valid) {
        handlePlacement(drag.piece, target.r, target.c)
      } else if (drag && !drag.moved) {
        // Tap tanpa geser = pilih/lepas balok (tap papan untuk menaruh)
        setSelectedPieceId(drag.wasSelected ? null : drag.piece.id)
      } else {
        setSelectedPieceId(null)
      }

      setDraggingPiece(null)
      setDragGeom(null)
      updatePreview(null)
    }

    const onPointerUp = (upEvent) => {
      if (pointerId != null && upEvent.pointerId !== pointerId) return
      finishDrag()
    }

    const onPointerCancel = (cancelEvent) => {
      if (pointerId != null && cancelEvent.pointerId !== pointerId) return
      finishDrag()
    }

    const cleanup = () => {
      window.removeEventListener("pointermove", onPointerMove)
      window.removeEventListener("pointerup", onPointerUp)
      window.removeEventListener("pointercancel", onPointerCancel)
      if (rafRef.current) {
        cancelAnimationFrame(rafRef.current)
        rafRef.current = 0
      }
      dragCleanupRef.current = null
    }

    window.addEventListener("pointermove", onPointerMove, { passive: true })
    window.addEventListener("pointerup", onPointerUp, { passive: true })
    window.addEventListener("pointercancel", onPointerCancel, { passive: true })
    dragCleanupRef.current = cleanup
  }

  // Nearest legal anchor for tap-to-place: centre the piece on the tapped cell,
  // then fall back to the closest spot where it actually fits.
  const findAnchor = useCallback(
    (piece, targetR, targetC) => {
      const rows = piece.matrix.length
      const cols = piece.matrix[0].length
      const clamp = (value, max) => Math.min(Math.max(value, 0), max)
      const prefR = clamp(targetR - Math.floor((rows - 1) / 2), BOARD_SIZE - rows)
      const prefC = clamp(targetC - Math.floor((cols - 1) / 2), BOARD_SIZE - cols)

      if (canPlacePiece(board, piece.matrix, prefR, prefC)) return { r: prefR, c: prefC }

      let best = null
      let bestDistance = Infinity
      for (let r = 0; r <= BOARD_SIZE - rows; r++) {
        for (let c = 0; c <= BOARD_SIZE - cols; c++) {
          if (!canPlacePiece(board, piece.matrix, r, c)) continue
          const distance = Math.abs(r - prefR) + Math.abs(c - prefC)
          if (distance < bestDistance) {
            bestDistance = distance
            best = { r, c }
          }
        }
      }
      return best
    },
    [board]
  )

  const handleBoardPointerDown = () => {
    boardTapRef.current = true
  }

  const handleBoardClick = (event) => {
    const startedOnBoard = boardTapRef.current
    boardTapRef.current = false
    if (!startedOnBoard || dragRef.current) return

    const piece = pieces.find((p) => p.id === selectedPieceId)
    if (!piece || piece.used) return

    const geom = measureBoard()
    if (!geom) return
    const targetC = Math.round((event.clientX - geom.left) / geom.step)
    const targetR = Math.round((event.clientY - geom.top) / geom.step)
    if (targetR < 0 || targetC < 0 || targetR >= BOARD_SIZE || targetC >= BOARD_SIZE) return

    const anchor = findAnchor(piece, targetR, targetC)
    if (anchor) handlePlacement(piece, anchor.r, anchor.c)
  }

  // ── Derived preview data for rendering ───────────────────────────────
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

  // Baris/kolom yang akan terhapus kalau balok dijatuhkan di posisi ini
  const previewLines = useMemo(() => {
    if (!preview || !preview.valid) return null
    const piece = pieces.find((p) => p.id === preview.pieceId)
    if (!piece) return null
    const { rowsToClear, colsToClear } = simulatePlacement(
      board,
      piece,
      preview.r,
      preview.c
    )
    return { rows: new Set(rowsToClear), cols: new Set(colsToClear) }
  }, [preview, pieces, board])

  const activePieces = pieces.filter((p) => !p.used).length

  return (
    <div className="relative min-h-[100svh] overflow-x-hidden bg-[#0a0a1c] px-4 pt-24 pb-10 text-slate-100 select-none">
      {/* Dark blue / purple atmosphere */}
      <div
        className="pointer-events-none fixed inset-0"
        style={{
          background:
            "radial-gradient(900px 520px at 18% -10%, rgba(124,77,255,0.40), transparent 62%), radial-gradient(760px 520px at 92% 6%, rgba(41,121,255,0.32), transparent 60%), radial-gradient(900px 700px at 50% 118%, rgba(138,43,226,0.26), transparent 66%)",
        }}
      />

      <div className="relative mx-auto flex w-full max-w-[430px] flex-col">
        {/* ── Top bar ── */}
        <div className="mb-3 flex items-center justify-between gap-2">
          <Link
            to="/games"
            className="group flex h-9 items-center gap-1.5 rounded-xl border border-white/10 bg-white/[0.06] px-3 text-[11px] font-semibold text-slate-300 backdrop-blur transition-colors hover:bg-white/10 hover:text-white"
          >
            <ArrowLeft size={14} className="transition-transform group-hover:-translate-x-0.5" />
            Games
          </Link>

          <div className="flex items-center gap-1.5">
            <button
              onClick={() => setShowHowTo(true)}
              title="Cara Bermain"
              aria-label="Cara Bermain"
              className="flex h-9 w-9 items-center justify-center rounded-xl border border-white/10 bg-white/[0.06] text-slate-300 backdrop-blur transition-colors hover:bg-white/10 hover:text-white"
            >
              <HelpCircle size={15} />
            </button>
            <button
              onClick={toggleSound}
              title={isMuted ? "Nyalakan suara & getar" : "Matikan suara & getar"}
              aria-label={isMuted ? "Nyalakan suara" : "Matikan suara"}
              className="flex h-9 w-9 items-center justify-center rounded-xl border border-white/10 bg-white/[0.06] text-slate-300 backdrop-blur transition-colors hover:bg-white/10 hover:text-white"
            >
              {isMuted ? <VolumeX size={15} /> : <Volume2 size={15} />}
            </button>
            <button
              onClick={() => setIsPaused((prev) => !prev)}
              title={isPaused ? "Lanjut" : "Jeda"}
              aria-label={isPaused ? "Lanjut" : "Jeda"}
              className="flex h-9 w-9 items-center justify-center rounded-xl border border-white/10 bg-white/[0.06] text-slate-300 backdrop-blur transition-colors hover:bg-white/10 hover:text-white"
            >
              {isPaused ? <Play size={15} /> : <Pause size={15} />}
            </button>
            <button
              onClick={resetGame}
              title="Ulang"
              aria-label="Ulang"
              className="flex h-9 w-9 items-center justify-center rounded-xl border border-white/10 bg-white/[0.06] text-slate-300 backdrop-blur transition-colors hover:bg-white/10 hover:text-white"
            >
              <RotateCcw size={15} />
            </button>
          </div>
        </div>

        {/* ── Title ── */}
        <div className="mb-3 flex items-center justify-center gap-2">
          <div className="grid h-6 w-6 grid-cols-2 gap-[2px] rounded-md border border-white/15 bg-white/5 p-[2px]">
            <span className="rounded-[2px] bg-[#f05555]" />
            <span className="rounded-[2px] bg-[#f5c542]" />
            <span className="rounded-[2px] bg-[#4cbf6a]" />
            <span className="rounded-[2px] bg-[#4a9df2]" />
          </div>
          <h1 className="font-display text-sm font-extrabold tracking-[0.28em] text-white/90">
            BLOCK BLAST
          </h1>
        </div>

        {/* ── Score strip ── */}
        <div className="mb-3 grid w-full grid-cols-3 gap-2">
          <div className="flex flex-col items-center rounded-2xl border border-white/10 bg-white/[0.06] py-2 backdrop-blur">
            <span className="text-[9px] font-semibold tracking-[0.22em] text-slate-400 uppercase">
              Skor
            </span>
            <span className="font-display text-xl font-black text-white tabular-nums">
              {score.toLocaleString()}
            </span>
          </div>
          <div className="flex flex-col items-center rounded-2xl border border-white/10 bg-white/[0.06] py-2 backdrop-blur">
            <span className="flex items-center gap-1 text-[9px] font-semibold tracking-[0.22em] text-slate-400 uppercase">
              <Trophy size={10} /> Rekor
            </span>
            <span className="font-display text-xl font-black text-amber-300 tabular-nums">
              {highScore.toLocaleString()}
            </span>
            <span
              className={`text-[8px] leading-none font-bold tracking-wider ${
                isNewHigh ? "text-emerald-400" : "opacity-0"
              }`}
            >
              BARU!
            </span>
          </div>
          <div className="flex flex-col items-center rounded-2xl border border-white/10 bg-white/[0.06] py-2 backdrop-blur">
            <span className="flex items-center gap-1 text-[9px] font-semibold tracking-[0.22em] text-slate-400 uppercase">
              <Flame size={10} /> Kombo
            </span>
            <span
              className={`font-display text-xl font-black tabular-nums ${
                combo > 1 ? "text-orange-400" : "text-slate-500"
              }`}
            >
              {combo > 1 ? `×${combo}` : "—"}
            </span>
          </div>
        </div>

        {/* ── Board ── */}
        <div className="relative">
          {/* Praise / combo banner floats over the board like the original */}
          <div className="pointer-events-none absolute inset-x-0 -top-1 z-30 flex justify-center">
            <AnimatePresence>
              {banner && (
                <motion.div
                  key={banner.id}
                  initial={{ opacity: 0, y: 14, scale: 0.7 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: -26, scale: 1.1 }}
                  transition={{ type: "spring", stiffness: 420, damping: 22 }}
                  className="flex flex-col items-center gap-0.5"
                >
                  <span
                    className="font-display text-3xl font-black tracking-tight text-transparent sm:text-4xl"
                    style={{
                      backgroundImage: "linear-gradient(180deg, #ffffff, #ffd93d 70%, #ff9f43)",
                      WebkitBackgroundClip: "text",
                      backgroundClip: "text",
                      filter: "drop-shadow(0 3px 10px rgba(255,196,66,0.55))",
                    }}
                  >
                    {banner.text}
                  </span>
                  <span className="flex items-center gap-1.5 rounded-full bg-black/45 px-2.5 py-0.5 text-[10px] font-bold text-white backdrop-blur">
                    {banner.comboText && (
                      <span className="text-orange-300">{banner.comboText}</span>
                    )}
                    <span>+{banner.points.toLocaleString()}</span>
                  </span>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          <motion.div animate={shakeControls} className="relative">
            <div
              ref={boardRef}
              onPointerDown={handleBoardPointerDown}
              onClick={handleBoardClick}
              className="relative grid aspect-square w-full grid-cols-8 gap-[4px] rounded-[22px] border border-white/10 bg-[#15153a]/85 p-2 shadow-[0_18px_50px_rgba(0,0,0,0.5),inset_0_1px_0_rgba(255,255,255,0.09)] backdrop-blur-sm sm:gap-[5px] sm:p-2.5"
              style={{ touchAction: "none" }}
            >
              <BlastParticles active={showParticles} />

              {board.map((row, r) =>
                row.map((cell, c) => {
                  const key = cellKeyOf(r, c)
                  const previewKind = previewCells?.cells.has(key)
                    ? previewCells.valid
                      ? 1
                      : 2
                    : 0
                  const willClear = previewLines
                    ? previewLines.rows.has(r) || previewLines.cols.has(c)
                    : false
                  const blastDelayMs = clearFx ? clearFx.cells.get(key) ?? null : null

                  return (
                    <BoardCell
                      key={key}
                      r={r}
                      c={c}
                      cell={cell}
                      previewKind={previewKind}
                      previewColor={previewCells?.color}
                      willClear={willClear}
                      blastDelayMs={blastDelayMs}
                    />
                  )
                })
              )}
            </div>
          </motion.div>
        </div>

        {/* ── Piece dock ── */}
        <div className="mt-3 flex w-full flex-col items-center">
          <div className="mb-1.5 flex w-full items-center justify-between px-1">
            <span className="text-[9px] font-semibold tracking-[0.22em] text-slate-500 uppercase">
              Balok · {activePieces}/3
            </span>
            <span className="text-[9px] text-slate-500 italic">geser ke papan</span>
          </div>

          <div className="grid h-[112px] w-full grid-cols-3 gap-2">
            {pieces.map((piece) => {
              const isSelected = selectedPieceId === piece.id
              const isUsed = piece.used

              return (
                <motion.div
                  key={piece.id}
                  initial={{ scale: 0.85, opacity: 0, y: 8 }}
                  animate={{
                    scale: isSelected ? 1.03 : 1,
                    // balok yang sedang diangkat hilang dari dock, seperti aslinya
                    opacity: isUsed ? 0.22 : draggingPiece?.id === piece.id ? 0.12 : 1,
                    y: 0,
                  }}
                  transition={{ type: "spring", stiffness: 380, damping: 26 }}
                  onPointerDown={(event) => handlePiecePointerDown(piece, event)}
                  className={`relative flex h-full touch-none items-center justify-center rounded-2xl border transition-colors duration-200 ${
                    isUsed
                      ? "cursor-default border-white/5 bg-transparent"
                      : isSelected
                        ? "cursor-grab border-indigo-300/60 bg-white/[0.10] shadow-[0_0_18px_rgba(129,140,248,0.35)]"
                        : "cursor-grab border-white/[0.06] bg-white/[0.04] hover:bg-white/[0.07]"
                  }`}
                >
                  {!isUsed && (
                    <div
                      className="pointer-events-none grid gap-[2px]"
                      style={{
                        gridTemplateColumns: `repeat(${piece.matrix[0].length}, minmax(0, 1fr))`,
                      }}
                    >
                      {piece.matrix.map((row, rIdx) =>
                        row.map((value, cIdx) => (
                          <div key={`${rIdx}-${cIdx}`} className="relative h-5 w-5 sm:h-[22px] sm:w-[22px]">
                            {value ? <MiniCandy color={piece.color} /> : null}
                          </div>
                        ))
                      )}
                    </div>
                  )}
                </motion.div>
              )
            })}
          </div>
        </div>
      </div>

      {/* ── Drag ghost: piece lifted to board scale, held above the finger ── */}
      {draggingPiece && dragGeom && (
        <div
          ref={ghostRef}
          aria-hidden="true"
          className="pointer-events-none fixed top-0 left-0 z-[60] will-change-transform"
        >
          <div
            className="grid"
            style={{
              gridTemplateColumns: `repeat(${draggingPiece.matrix[0].length}, ${dragGeom.size}px)`,
              gap: `${Math.max(dragGeom.step - dragGeom.size, 0)}px`,
              filter: "drop-shadow(0 14px 18px rgba(0,0,0,0.55))",
            }}
          >
            {draggingPiece.matrix.map((row, rIdx) =>
              row.map((value, cIdx) => (
                <div
                  key={`${rIdx}-${cIdx}`}
                  className="relative"
                  style={{ width: dragGeom.size, height: dragGeom.size }}
                >
                  {value ? <CandyBlock color={draggingPiece.color} /> : null}
                </div>
              ))
            )}
          </div>
        </div>
      )}

      {/* ═════ Pause ═════ */}
      <AnimatePresence>
        {isPaused && !gameOver && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-[#05001a]/75 px-4 backdrop-blur-md"
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0, y: 18 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.92, opacity: 0 }}
              transition={{ type: "spring", stiffness: 400, damping: 28 }}
              className="w-full max-w-xs rounded-3xl border border-white/10 bg-[#12102b] p-6 text-center shadow-2xl"
            >
              <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-indigo-500/20">
                <Pause size={26} className="text-indigo-300" />
              </div>
              <h2 className="font-display text-2xl font-black text-white">JEDA</h2>
              <p className="mt-1 text-[11px] text-slate-400">
                Skor sekarang {score.toLocaleString()}
              </p>
              <div className="mt-5 space-y-2">
                <button
                  onClick={() => setIsPaused(false)}
                  className="w-full rounded-xl bg-indigo-500 py-3 text-sm font-bold text-white transition-colors hover:bg-indigo-400"
                >
                  Lanjut Main
                </button>
                <button
                  onClick={resetGame}
                  className="w-full rounded-xl border border-white/10 bg-white/5 py-2.5 text-xs font-semibold text-slate-300 transition-colors hover:bg-white/10 hover:text-white"
                >
                  Ulang dari Awal
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

      {/* ═════ Game Over ═════ */}
      <AnimatePresence>
        {gameOver && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-[#05001a]/80 px-4 backdrop-blur-md"
          >
            <motion.div
              initial={{ scale: 0.85, opacity: 0, y: 24 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.9, opacity: 0 }}
              transition={{ type: "spring", stiffness: 400, damping: 28 }}
              className="relative w-full max-w-sm overflow-hidden rounded-3xl border border-white/10 bg-[#12102b] p-7 text-center shadow-2xl"
            >
              <div className="absolute inset-x-0 top-0 h-1 bg-gradient-to-r from-[#f05555] via-[#f5c542] to-[#4cbf6a]" />

              <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-rose-500/20">
                <Flame size={30} className="text-rose-400" />
              </div>

              <h2 className="font-display text-2xl font-black tracking-tight text-white">
                PERMAINAN SELESAI
              </h2>
              <p className="mt-1.5 text-[11px] text-slate-400">
                Tidak ada ruang tersisa untuk balok yang ada.
              </p>

              <div className="my-5 space-y-3 rounded-2xl border border-white/10 bg-white/[0.04] p-5">
                <div className="flex items-center justify-between">
                  <span className="text-[11px] text-slate-400">Skor Akhir</span>
                  <span className="font-display text-2xl font-black text-white tabular-nums">
                    {score.toLocaleString()}
                  </span>
                </div>
                <div className="h-px bg-white/10" />
                <div className="flex items-center justify-between">
                  <span className="text-[11px] text-slate-400">Rekor Terbaik</span>
                  <span className="font-display text-lg font-bold text-amber-300 tabular-nums">
                    {highScore.toLocaleString()}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-[11px] text-slate-400">Garis Dibersihkan</span>
                  <span className="font-display text-lg font-bold text-emerald-400 tabular-nums">
                    {totalCleared}
                  </span>
                </div>
                {isNewHigh && (
                  <div className="flex items-center justify-center gap-1.5 rounded-lg bg-emerald-500/15 py-1.5 text-[11px] font-bold text-emerald-300">
                    <Zap size={13} /> REKOR BARU!
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
            className="fixed inset-0 z-50 flex items-center justify-center bg-[#05001a]/80 px-4 backdrop-blur-md"
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="relative w-full max-w-md overflow-hidden rounded-3xl border border-white/10 bg-[#12102b] p-6 shadow-2xl"
            >
              <div className="absolute inset-x-0 top-0 h-1 bg-gradient-to-r from-[#f05555] via-[#f5c542] to-[#4cbf6a]" />

              <button
                onClick={() => setShowHowTo(false)}
                aria-label="Tutup"
                className="absolute top-5 right-5 text-slate-400 transition-colors hover:text-white"
              >
                <X size={18} />
              </button>

              <div className="flex items-center gap-2.5">
                <div className="grid h-8 w-8 grid-cols-2 gap-[2px] rounded-lg border border-white/15 bg-white/5 p-[3px]">
                  <span className="rounded-[3px] bg-[#f05555]" />
                  <span className="rounded-[3px] bg-[#f5c542]" />
                  <span className="rounded-[3px] bg-[#4cbf6a]" />
                  <span className="rounded-[3px] bg-[#4a9df2]" />
                </div>
                <h3 className="font-display text-lg font-bold text-white">Cara Bermain</h3>
              </div>

              <div className="mt-5 space-y-2.5 text-[11px] leading-6 text-slate-300">
                <div className="flex items-start gap-3 rounded-xl border border-white/10 bg-white/[0.04] p-3">
                  <span className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-md bg-rose-500/20 text-[10px] font-bold text-rose-300">
                    1
                  </span>
                  <p>
                    <span className="font-semibold text-white">Pasang Balok —</span> Geser balok
                    dari bawah ke papan. Balok terangkat di atas jari dan ada bayangannya di grid.
                    Balok tidak bisa diputar, sama seperti aslinya.
                  </p>
                </div>
                <div className="flex items-start gap-3 rounded-xl border border-white/10 bg-white/[0.04] p-3">
                  <span className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-md bg-emerald-500/20 text-[10px] font-bold text-emerald-300">
                    2
                  </span>
                  <p>
                    <span className="font-semibold text-white">Bersihkan Garis —</span> Penuhi
                    satu baris atau kolom. Baris/kolom yang akan pecah menyala saat kamu menggeser
                    balok.
                  </p>
                </div>
                <div className="flex items-start gap-3 rounded-xl border border-white/10 bg-white/[0.04] p-3">
                  <span className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-md bg-amber-500/20 text-[10px] font-bold text-amber-300">
                    3
                  </span>
                  <p>
                    <span className="font-semibold text-white">Kombo —</span> Clear berturut-turut
                    tanpa jeda menaikkan pengali skor. Beberapa garis sekaligus memberi bonus besar.
                  </p>
                </div>
                <div className="flex items-start gap-3 rounded-xl border border-white/10 bg-white/[0.04] p-3">
                  <span className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-md bg-indigo-500/20 text-[10px] font-bold text-indigo-300">
                    4
                  </span>
                  <p>
                    <span className="font-semibold text-white">All Clear —</span> Kosongkan seluruh
                    papan untuk bonus besar. Game over kalau tidak ada satu balok pun yang muat.
                  </p>
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
