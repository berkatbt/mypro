import { useState, useCallback, useMemo } from "react"
import { motion, AnimatePresence } from "motion/react"
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
} from "lucide-react"
import { Link } from "react-router-dom"
import {
  BOARD_SIZE,
  createEmptyBoard,
  canPlacePiece,
  placePieceOnBoard,
  findCompletedLines,
  clearLinesFromBoard,
  isGameOver,
  calculateScore,
} from "./blockBlast/boardLogic"
import { generateThreePieces } from "./blockBlast/shapes"
import { sounds } from "./blockBlast/audio"

// Floating particle component for blast effects — candy-colored sparks
const SPARK_COLORS = ["#f05555", "#f5913e", "#f5c542", "#4cbf6a", "#4a9df2", "#9a7bf2"]

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
        className="absolute inset-0 rounded-[6px] transition-[filter] duration-150"
        style={{
          background: `linear-gradient(135deg, ${color.top} 0%, ${color.mid} 60%)`,
          filter: blasting ? "brightness(1.7) saturate(1.4)" : "none",
        }}
      />
      {/* glossy top-left highlight */}
      <div
        className="absolute inset-x-[2px] top-[1px] h-[45%] rounded-t-[5px]"
        style={{ background: "linear-gradient(180deg, rgba(255,255,255,0.55), rgba(255,255,255,0.04))" }}
      />
      {/* darker bottom bevel — gives the block its thickness */}
      <div className="absolute inset-x-0 bottom-0 h-[5px] rounded-b-[6px]" style={{ background: color.dark }} />
      {/* right side bevel */}
      <div className="absolute inset-y-0 right-0 w-[3px] rounded-r-[6px]" style={{ background: color.dark, opacity: 0.6 }} />
      {/* soft contact shadow on the tray */}
      <div
        className="absolute"
        style={{
          left: "-10%",
          right: "-10%",
          bottom: "-4px",
          height: "8px",
          background: "radial-gradient(ellipse at center, rgba(30,41,59,0.28), transparent 70%)",
        }}
      />
    </>
  )
}

// Smaller candy block used in the dock and drag ghost
function MiniCandy({ color, className = "h-[15px] w-[15px] rounded-[3px]" }) {
  return (
    <>
      <div
        className={`absolute inset-0 ${className}`}
        style={{ background: `linear-gradient(135deg, ${color.top} 0%, ${color.mid} 60%)` }}
      />
      <div
        className="absolute inset-x-[1px] top-[0.5px] h-[45%] rounded-t-[2px]"
        style={{ background: "linear-gradient(180deg, rgba(255,255,255,0.6), rgba(255,255,255,0.05))" }}
      />
      <div className="absolute inset-x-0 bottom-0 h-[2px] rounded-b-[3px]" style={{ background: color.dark }} />
    </>
  )
}

export default function BlockBlast() {
  // Game state
  const [board, setBoard] = useState(() => createEmptyBoard())
  const [pieces, setPieces] = useState(() => generateThreePieces())
  const [score, setScore] = useState(0)
  const [highScore, setHighScore] = useState(() => {
    try {
      const saved = localStorage.getItem("blockblast_highscore")
      return saved ? parseInt(saved, 10) || 0 : 0
    } catch {
      return 0
    }
  })
  const [combo, setCombo] = useState(0)
  const [totalCleared, setTotalCleared] = useState(0) // running total of lines cleared
  const [isNewHigh, setIsNewHigh] = useState(false)
  const [gameOver, setGameOver] = useState(false)
  const [isMuted, setIsMuted] = useState(false)
  const [showHowTo, setShowHowTo] = useState(false)

  // Visual states
  const [banner, setBanner] = useState(null)
  const [blastingCells, setBlastingCells] = useState(new Set())
  const [showParticles, setShowParticles] = useState(false)
  const [pulseBoard, setPulseBoard] = useState(false)

  // Selection & drag states
  const [selectedPieceId, setSelectedPieceId] = useState(null)
  const [hoverPosition, setHoverPosition] = useState(null)
  const [draggingPiece, setDraggingPiece] = useState(null)
  const [dragPointerPos, setDragPointerPos] = useState({ x: 0, y: 0 })

  const toggleSound = () => {
    sounds.muted = !isMuted
    setIsMuted(!isMuted)
  }

  const resetGame = useCallback(() => {
    setBoard(createEmptyBoard())
    const initialPieces = generateThreePieces()
    setPieces(initialPieces)
    setScore(0)
    setCombo(0)
    setTotalCleared(0)
    setIsNewHigh(false)
    setGameOver(false)
    setSelectedPieceId(null)
    setHoverPosition(null)
    setDraggingPiece(null)
    setBlastingCells(new Set())
    setBanner(null)
    setShowParticles(false)
    sounds.playPlace()
  }, [])

  const handlePlacement = useCallback(
    (piece, startRow, startCol) => {
      if (!piece || piece.used) return false
      if (!canPlacePiece(board, piece.matrix, startRow, startCol)) return false

      sounds.playPlace()

      const newBoard = placePieceOnBoard(board, piece.matrix, startRow, startCol, piece.color)
      const nextPieces = pieces.map((p) => (p.id === piece.id ? { ...p, used: true } : p))
      const { rowsToClear, colsToClear } = findCompletedLines(newBoard)
      const linesCleared = rowsToClear.length + colsToClear.length
      const scoreResult = calculateScore(piece.blockCount, linesCleared, combo)
      const nextScore = score + scoreResult.points

      setScore(nextScore)
      setCombo(scoreResult.newCombo)

      if (nextScore > highScore) {
        setHighScore(nextScore)
        setIsNewHigh(true)
        try {
          localStorage.setItem("blockblast_highscore", nextScore.toString())
        } catch {}
      }

      const allUsed = nextPieces.every((p) => p.used)
      const remainingOrNewPieces = allUsed ? generateThreePieces() : nextPieces

      if (linesCleared > 0) {
        setTotalCleared((prev) => prev + linesCleared)
        const blastSet = new Set()
        rowsToClear.forEach((r) => {
          for (let c = 0; c < BOARD_SIZE; c++) blastSet.add(`${r}-${c}`)
        })
        colsToClear.forEach((c) => {
          for (let r = 0; r < BOARD_SIZE; r++) blastSet.add(`${r}-${c}`)
        })

        setBlastingCells(blastSet)
        setShowParticles(true)
        setTimeout(() => setShowParticles(false), 600)
        setPulseBoard(true)
        setTimeout(() => setPulseBoard(false), 350)

        sounds.playBlast(linesCleared)
        if (scoreResult.newCombo > 1) sounds.playCombo(scoreResult.newCombo)

        if (scoreResult.bannerText) {
          setBanner({ text: scoreResult.bannerText, points: scoreResult.points, id: Date.now() })
          setTimeout(() => setBanner(null), 1600)
        }

        setTimeout(() => {
          const clearedBoard = clearLinesFromBoard(newBoard, rowsToClear, colsToClear)
          setBoard(clearedBoard)
          setBlastingCells(new Set())
          setPieces(remainingOrNewPieces)
          if (isGameOver(clearedBoard, remainingOrNewPieces)) {
            sounds.playGameOver()
            setGameOver(true)
          }
        }, 250)
      } else {
        setBoard(newBoard)
        setPieces(remainingOrNewPieces)
        if (isGameOver(newBoard, remainingOrNewPieces)) {
          sounds.playGameOver()
          setGameOver(true)
        }
      }

      setSelectedPieceId(null)
      setHoverPosition(null)
      setDraggingPiece(null)
      return true
    },
    [board, pieces, combo, score, highScore]
  )

  const handleCellHover = (r, c) => {
    const activePiece = draggingPiece || pieces.find((p) => p.id === selectedPieceId)
    if (!activePiece || activePiece.used) {
      if (hoverPosition) setHoverPosition(null)
      return
    }
    const valid = canPlacePiece(board, activePiece.matrix, r, c)
    setHoverPosition({ r, c, valid, piece: activePiece })
  }

  const handleCellClick = (r, c) => {
    const activePiece = pieces.find((p) => p.id === selectedPieceId)
    if (!activePiece || activePiece.used) return
    handlePlacement(activePiece, r, c)
  }

  // Resolves a viewport point to a board cell via DOM hit-testing —
  // pixel-accurate regardless of any visual transforms.
  const getCellFromPoint = (clientX, clientY) => {
    const el = document.elementFromPoint(clientX, clientY)
    const cellEl = el && el.closest ? el.closest("[data-cell]") : null
    if (!cellEl) return null
    return { r: Number(cellEl.dataset.r), c: Number(cellEl.dataset.c) }
  }

  const handlePiecePointerDown = (piece, e) => {
    if (piece.used || gameOver) return
    e.preventDefault()
    sounds.playSelect()
    const wasSelected = selectedPieceId === piece.id
    setSelectedPieceId(piece.id)
    setDraggingPiece(piece)
    setDragPointerPos({ x: e.clientX, y: e.clientY })
    const startX = e.clientX
    const startY = e.clientY

    const onPointerMove = (moveEvent) => {
      moveEvent.preventDefault()
      setDragPointerPos({ x: moveEvent.clientX, y: moveEvent.clientY })
      const isTouch = moveEvent.pointerType === "touch"
      const targetY = isTouch ? moveEvent.clientY - 60 : moveEvent.clientY
      const target = getCellFromPoint(moveEvent.clientX, targetY)
      if (target) {
        const valid = canPlacePiece(board, piece.matrix, target.r, target.c)
        setHoverPosition({ r: target.r, c: target.c, valid, piece })
      } else {
        setHoverPosition(null)
      }
    }

    const onPointerUp = (upEvent) => {
      window.removeEventListener("pointermove", onPointerMove)
      window.removeEventListener("pointerup", onPointerUp)
      const isTouch = upEvent.pointerType === "touch"
      const targetY = isTouch ? upEvent.clientY - 60 : upEvent.clientY
      const target = getCellFromPoint(upEvent.clientX, targetY)
      if (target) {
        const placed = handlePlacement(piece, target.r, target.c)
        if (placed) return
      }
      // A tap without movement toggles selection (deterministic across browsers,
      // unlike relying on click which some browsers suppress after preventDefault)
      const dist = Math.hypot(upEvent.clientX - startX, upEvent.clientY - startY)
      if (dist < 6) {
        setSelectedPieceId(wasSelected ? null : piece.id)
      }
      setDraggingPiece(null)
      setHoverPosition(null)
    }

    window.addEventListener("pointermove", onPointerMove)
    window.addEventListener("pointerup", onPointerUp)
  }

  const getCellPreviewState = (r, c) => {
    if (!hoverPosition || !hoverPosition.piece) return null
    const { r: startR, c: startC, valid, piece } = hoverPosition
    const relR = r - startR
    const relC = c - startC
    if (
      relR >= 0 &&
      relR < piece.matrix.length &&
      relC >= 0 &&
      relC < piece.matrix[0].length &&
      piece.matrix[relR][relC] === 1
    ) {
      return { valid, color: piece.color }
    }
    return null
  }

  // Compute a "level" from total lines cleared (purely cosmetic)
  const level = Math.floor(totalCleared / 5) + 1

  return (
    <div className="min-h-screen overflow-x-hidden bg-[#eef1f8] px-4 pt-28 pb-16 text-slate-800 select-none">
      <div className="relative mx-auto flex max-w-xl flex-col items-center">
        {/* Top Bar */}
        <div className="mb-5 flex w-full items-center justify-between">
          <Link
            to="/games"
            className="group flex items-center gap-2 rounded-xl border border-[#dfe4ef] bg-white px-3.5 py-2 text-xs font-medium text-slate-500 shadow-sm transition-all hover:border-[#c9d1e2] hover:text-slate-700"
          >
            <ArrowLeft size={14} className="transition-transform group-hover:-translate-x-0.5" />
            Games
          </Link>

          {/* Logo — 2×2 candy blocks */}
          <div className="flex items-center gap-2">
            <div className="grid h-8 w-8 grid-cols-2 gap-[2px] rounded-lg border border-[#dfe4ef] bg-white p-[3px] shadow-sm">
              <span className="rounded-[3px] bg-[#f05555]" />
              <span className="rounded-[3px] bg-[#f5c542]" />
              <span className="rounded-[3px] bg-[#4cbf6a]" />
              <span className="rounded-[3px] bg-[#4a9df2]" />
            </div>
            <h1 className="font-display text-lg font-extrabold tracking-wide text-slate-800 sm:text-xl">
              BLOCK BLAST
            </h1>
          </div>

          <div className="flex items-center gap-1.5">
            <button
              onClick={() => setShowHowTo(true)}
              title="Cara Bermain"
              className="flex h-8 w-8 items-center justify-center rounded-lg border border-[#dfe4ef] bg-white text-slate-500 shadow-sm transition-all hover:border-[#c9d1e2] hover:text-slate-700"
            >
              <HelpCircle size={14} />
            </button>
            <button
              onClick={toggleSound}
              title={isMuted ? "Unmute" : "Mute"}
              className="flex h-8 w-8 items-center justify-center rounded-lg border border-[#dfe4ef] bg-white text-slate-500 shadow-sm transition-all hover:border-[#c9d1e2] hover:text-slate-700"
            >
              {isMuted ? <VolumeX size={14} /> : <Volume2 size={14} />}
            </button>
            <button
              onClick={resetGame}
              title="Ulang"
              className="flex h-8 w-8 items-center justify-center rounded-lg border border-[#dfe4ef] bg-white text-slate-500 shadow-sm transition-all hover:border-[#c9d1e2] hover:text-slate-700"
            >
              <RotateCcw size={14} />
            </button>
          </div>
        </div>

        {/* Score strip — 3-column minimal */}
        <div className="mb-4 grid w-full grid-cols-3 gap-2">
          <div className="flex flex-col items-center rounded-xl border border-[#e2e6f0] bg-white py-2.5 px-2 shadow-sm">
            <span className="text-[9px] font-semibold tracking-[0.25em] text-slate-400 uppercase">Skor</span>
            <span className="font-display text-xl font-black text-slate-800 sm:text-2xl">
              {score.toLocaleString()}
            </span>
            {/* Reserved line keeps card heights constant so the board never shifts */}
            <span className="text-[9px] leading-3 opacity-0">.</span>
          </div>
          <div className="flex flex-col items-center rounded-xl border border-[#e2e6f0] bg-white py-2.5 px-2 shadow-sm">
            <span className="flex items-center gap-1 text-[9px] font-semibold tracking-[0.25em] text-slate-400 uppercase">
              <Trophy size={10} /> Rekor
            </span>
            <span className="font-display text-xl font-black text-amber-500 sm:text-2xl">
              {highScore.toLocaleString()}
            </span>
            <span className={`text-[9px] leading-3 font-bold ${isNewHigh ? "text-emerald-500 animate-pulse" : "opacity-0"}`}>
              BARU!
            </span>
          </div>
          <div className="flex flex-col items-center rounded-xl border border-[#e2e6f0] bg-white py-2.5 px-2 shadow-sm">
            <span className="text-[9px] font-semibold tracking-[0.25em] text-slate-400 uppercase">Level</span>
            <span className="font-display text-xl font-black text-indigo-500 sm:text-2xl">{level}</span>
            <div className={`flex items-center gap-0.5 text-[9px] leading-3 font-bold ${combo > 1 ? "text-orange-500" : "opacity-0"}`}>
              <Flame size={10} className={combo > 1 ? "animate-pulse" : ""} /> x{Math.max(combo, 1)}
            </div>
          </div>
        </div>

        {/* Banner notification */}
        <div className="relative h-6 w-full overflow-visible">
          <AnimatePresence>
            {banner && (
              <motion.div
                key={banner.id}
                initial={{ opacity: 0, y: 8, scale: 0.9 }}
                animate={{ opacity: 1, y: -2, scale: 1 }}
                exit={{ opacity: 0, y: -18, scale: 1.05 }}
                transition={{ duration: 0.3 }}
                className="absolute inset-x-0 mx-auto flex w-fit items-center gap-2.5 rounded-full border border-emerald-200 bg-white/95 px-4 py-1 text-[11px] font-bold text-emerald-700 shadow-lg backdrop-blur"
              >
                <Zap size={12} className="text-emerald-500" />
                <span>{banner.text}</span>
                <span className="rounded-full bg-emerald-100 px-1.5 py-0.5 text-[10px] text-emerald-700">
                  +{banner.points}
                </span>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* ───── 8×8 Board ───── */}
        <div className="relative mt-2 flex w-full justify-center">
          {/* Soft pulse ring on line clear */}
          <div
            className={`pointer-events-none absolute -inset-1.5 rounded-3xl border-4 border-indigo-200/80 transition-opacity duration-300 ${
              pulseBoard ? "opacity-100" : "opacity-0"
            }`}
          />

          <div
            onMouseLeave={() => setHoverPosition(null)}
            className="relative grid aspect-square w-full max-w-[420px] grid-cols-8 gap-[5px] rounded-2xl border border-[#e2e6f0] bg-white p-2.5 select-none sm:gap-1.5 sm:p-3"
            style={{
              boxShadow: "0 16px 40px rgba(15,23,42,0.10), inset 0 1px 0 #ffffff",
            }}
          >
            <BlastParticles active={showParticles} />

            {board.map((row, r) =>
              row.map((cell, c) => {
                const cellKey = `${r}-${c}`
                const isBlasting = blastingCells.has(cellKey)
                const preview = getCellPreviewState(r, c)

                // Filled cell — candy block
                if (cell) {
                  return (
                    <motion.div
                      key={cellKey}
                      data-cell
                      data-r={r}
                      data-c={c}
                      initial={{ scale: 0.55, y: -12 }}
                      animate={{ scale: isBlasting ? 1.25 : 1, y: 0 }}
                      transition={{ type: "spring", stiffness: 420, damping: 26 }}
                      className="touch-none relative"
                    >
                      <CandyBlock color={cell} blasting={isBlasting} />
                    </motion.div>
                  )
                }

                // Preview cell — translucent block-colored overlay
                if (preview) {
                  return (
                    <div
                      key={cellKey}
                      data-cell
                      data-r={r}
                      data-c={c}
                      onMouseEnter={() => handleCellHover(r, c)}
                      onClick={() => handleCellClick(r, c)}
                      className={`touch-none flex cursor-pointer items-center justify-center rounded-[7px] border transition-all duration-100 ${
                        preview.valid
                          ? "shadow-[inset_0_1px_3px_rgba(255,255,255,0.6)]"
                          : "border-rose-300 bg-rose-100"
                      }`}
                      style={
                        preview.valid
                          ? { backgroundColor: preview.color.previewBg, borderColor: preview.color.previewBorder }
                          : undefined
                      }
                    >
                      {!preview.valid && (
                        <span className="text-[9px] font-bold text-rose-500">×</span>
                      )}
                    </div>
                  )
                }

                // Empty cell — recessed socket
                return (
                  <div
                    key={cellKey}
                    data-cell
                    data-r={r}
                    data-c={c}
                    onMouseEnter={() => handleCellHover(r, c)}
                    onClick={() => handleCellClick(r, c)}
                    className="touch-none cursor-pointer rounded-[7px] border border-[#dde2ee] bg-[#e9ecf4] shadow-[inset_0_2px_4px_rgba(15,23,42,0.08)] transition-all duration-100 hover:border-[#c3cbe0] hover:bg-[#e2e6f0]"
                  />
                )
              })
            )}
          </div>
        </div>

        {/* ───── Piece Dock ───── */}
        <div className="mt-5 flex w-full max-w-[420px] flex-col items-center">
          <div className="mb-2 flex w-full items-center justify-between px-1">
            <span className="text-[10px] font-semibold tracking-[0.2em] text-slate-400 uppercase">
              Pieces
            </span>
            <span className="text-[10px] text-slate-400 italic">
              drag · atau · tap lalu tap papan
            </span>
          </div>

          <div className="grid h-[116px] w-full grid-cols-3 gap-2.5">
            {pieces.map((piece) => {
              const isSelected = selectedPieceId === piece.id
              const isUsed = piece.used

              return (
                <motion.div
                  key={piece.id}
                  initial={{ scale: 0.85, opacity: 0, y: 6 }}
                  animate={{ scale: isSelected ? 1.04 : 1, opacity: isUsed ? 0.3 : 1, y: 0 }}
                  transition={{ type: "spring", stiffness: 380, damping: 26 }}
                  onPointerDown={(e) => handlePiecePointerDown(piece, e)}
                  className={`touch-none relative flex h-full items-center justify-center rounded-2xl border p-2 transition-all duration-200 ${
                    isUsed
                      ? "cursor-not-allowed border-dashed border-[#d5dae6] bg-transparent"
                      : isSelected
                      ? "cursor-grab border-indigo-300 bg-white shadow-md ring-2 ring-indigo-100"
                      : "cursor-grab border-[#e2e6f0] bg-white shadow-sm hover:border-[#c9d1e2] hover:shadow-md"
                  }`}
                >
                  {!isUsed && (
                    <div
                      className="pointer-events-none grid gap-[3px]"
                      style={{
                        gridTemplateColumns: `repeat(${piece.matrix[0].length}, minmax(0, 1fr))`,
                      }}
                    >
                      {piece.matrix.map((row, rIdx) =>
                        row.map((val, cIdx) => (
                          <div key={`${rIdx}-${cIdx}`} className="relative h-[15px] w-[15px] sm:h-[18px] sm:w-[18px]">
                            {val ? (
                              <MiniCandy color={piece.color} className="h-[15px] w-[15px] rounded-[3px] sm:h-[18px] sm:w-[18px]" />
                            ) : (
                              <div className="absolute inset-0 opacity-0" />
                            )}
                          </div>
                        ))
                      )}
                    </div>
                  )}

                  {isSelected && (
                    <motion.span
                      initial={{ scale: 0 }}
                      animate={{ scale: 1 }}
                      className="absolute -top-1 -right-1 z-10 flex h-4 w-4 items-center justify-center rounded-full bg-emerald-500 text-[9px] font-bold text-white shadow-md"
                    >
                      ✓
                    </motion.span>
                  )}
                </motion.div>
              )
            })}
          </div>
        </div>

        {/* Drag ghost following pointer */}
        {draggingPiece && (
          <div
            className="pointer-events-none fixed z-50 -translate-x-1/2 -translate-y-1/2"
            style={{
              left: `${dragPointerPos.x}px`,
              top: `${dragPointerPos.y - 45}px`,
              transition: "left 40ms linear, top 40ms linear",
            }}
          >
            <div
              className="grid gap-1 rounded-xl border border-[#dfe4ef] bg-white/95 p-2 shadow-xl"
              style={{
                gridTemplateColumns: `repeat(${draggingPiece.matrix[0].length}, minmax(0, 1fr))`,
              }}
            >
              {draggingPiece.matrix.map((row, rIdx) =>
                row.map((val, cIdx) => (
                  <div key={`${rIdx}-${cIdx}`} className="relative h-7 w-7 sm:h-8 sm:w-8">
                    {val ? (
                      <MiniCandy color={draggingPiece.color} className="h-7 w-7 rounded-md sm:h-8 sm:w-8" />
                    ) : (
                      <div className="absolute inset-0 opacity-0" />
                    )}
                  </div>
                ))
              )}
            </div>
          </div>
        )}
      </div>

      {/* ═════ Game Over Modal ═════ */}
      <AnimatePresence>
        {gameOver && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 px-4 backdrop-blur-md"
          >
            <motion.div
              initial={{ scale: 0.85, opacity: 0, y: 24 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.9, opacity: 0 }}
              transition={{ type: "spring", stiffness: 400, damping: 28 }}
              className="relative w-full max-w-sm overflow-hidden rounded-3xl border border-[#e2e6f0] bg-white p-8 text-center shadow-2xl"
            >
              {/* Candy accent bar */}
              <div className="absolute inset-x-0 top-0 h-1 bg-gradient-to-r from-[#f05555] via-[#f5c542] to-[#4cbf6a]" />

              <div className="mx-auto mb-5 flex h-16 w-16 items-center justify-center rounded-2xl bg-rose-100">
                <Flame size={30} className="text-rose-500" />
              </div>

              <h2 className="font-display text-3xl font-black tracking-tight text-slate-800">
                PERMAINAN SELESAI
              </h2>
              <p className="mt-1.5 text-[11px] text-slate-500">
                Tidak ada ruang tersisa untuk balok yang ada.
              </p>

              <div className="my-6 space-y-3 rounded-2xl border border-[#e8ebf3] bg-[#f6f7fb] p-5">
                <div className="flex items-center justify-between">
                  <span className="text-[11px] text-slate-500">Skor Akhir</span>
                  <span className="font-display text-2xl font-black text-slate-800">
                    {score.toLocaleString()}
                  </span>
                </div>
                <div className="h-px bg-[#e2e6f0]" />
                <div className="flex items-center justify-between">
                  <span className="text-[11px] text-slate-500">Rekor Terbaik</span>
                  <span className="font-display text-lg font-bold text-amber-500">
                    {highScore.toLocaleString()}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-[11px] text-slate-500">Level</span>
                  <span className="font-display text-lg font-bold text-indigo-500">{level}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-[11px] text-slate-500">Garis Dibersihkan</span>
                  <span className="font-display text-lg font-bold text-emerald-600">{totalCleared}</span>
                </div>
                {isNewHigh && (
                  <div className="flex items-center justify-center gap-1.5 rounded-lg bg-emerald-100 py-1.5 text-[11px] font-bold text-emerald-700">
                    <Zap size={13} /> REKOR BARU!
                  </div>
                )}
              </div>

              <div className="space-y-2.5">
                <button
                  onClick={resetGame}
                  className="w-full rounded-xl bg-blue-500 py-3 text-sm font-bold text-white shadow-lg shadow-blue-500/25 transition-all hover:bg-blue-600 hover:scale-[1.02] active:scale-[0.98]"
                >
                  Main Lagi
                </button>
                <Link
                  to="/games"
                  className="block w-full rounded-xl border border-[#e2e6f0] bg-white py-3 text-sm font-medium text-slate-500 transition-colors hover:bg-[#f6f7fb] hover:text-slate-700"
                >
                  Kembali
                </Link>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ═════ How To Play Modal ═════ */}
      <AnimatePresence>
        {showHowTo && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 px-4 backdrop-blur-md"
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="relative w-full max-w-md overflow-hidden rounded-3xl border border-[#e2e6f0] bg-white p-6 shadow-2xl"
            >
              <div className="absolute inset-x-0 top-0 h-1 bg-gradient-to-r from-[#f05555] via-[#f5c542] to-[#4cbf6a]" />

              <button
                onClick={() => setShowHowTo(false)}
                className="absolute top-5 right-5 text-slate-400 transition-colors hover:text-slate-600"
              >
                <X size={18} />
              </button>

              <div className="flex items-center gap-2.5">
                <div className="grid h-8 w-8 grid-cols-2 gap-[2px] rounded-lg border border-[#dfe4ef] bg-white p-[3px] shadow-sm">
                  <span className="rounded-[3px] bg-[#f05555]" />
                  <span className="rounded-[3px] bg-[#f5c542]" />
                  <span className="rounded-[3px] bg-[#4cbf6a]" />
                  <span className="rounded-[3px] bg-[#4a9df2]" />
                </div>
                <h3 className="font-display text-lg font-bold text-slate-800">
                  Cara Bermain
                </h3>
              </div>

              <div className="mt-5 space-y-2.5 text-[11px] leading-6 text-slate-600">
                <div className="flex items-start gap-3 rounded-xl border border-[#e8ebf3] bg-[#f6f7fb] p-3">
                  <span className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-md bg-red-100 text-[10px] font-bold text-red-500">1</span>
                  <p><span className="font-semibold text-slate-800">Pasang Balok —</span> Drag balok dari dock ke papan, atau tap balok lalu tap posisi di grid 8×8.</p>
                </div>
                <div className="flex items-start gap-3 rounded-xl border border-[#e8ebf3] bg-[#f6f7fb] p-3">
                  <span className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-md bg-emerald-100 text-[10px] font-bold text-emerald-600">2</span>
                  <p><span className="font-semibold text-slate-800">Bersihkan Garis —</span> Isi baris atau kolom penuh untuk menghapus dan mendapat poin.</p>
                </div>
                <div className="flex items-start gap-3 rounded-xl border border-[#e8ebf3] bg-[#f6f7fb] p-3">
                  <span className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-md bg-amber-100 text-[10px] font-bold text-amber-500">3</span>
                  <p><span className="font-semibold text-slate-800">Combo —</span> Hapus garis berturut-turut untuk melipatgandakan skor.</p>
                </div>
                <div className="flex items-start gap-3 rounded-xl border border-[#e8ebf3] bg-[#f6f7fb] p-3">
                  <span className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-md bg-rose-100 text-[10px] font-bold text-rose-500">4</span>
                  <p><span className="font-semibold text-slate-800">Game Over —</span> Berakhir jika tak ada balok yang bisa ditempatkan.</p>
                </div>
              </div>

              <button
                onClick={() => setShowHowTo(false)}
                className="mt-5 w-full rounded-xl bg-blue-500 py-2.5 text-xs font-bold text-white shadow-lg shadow-blue-500/20 transition-colors hover:bg-blue-600"
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
