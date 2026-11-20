import { memo } from "react"
import { motion } from "motion/react"
import { TIMING } from "./constants"
import { CandyBlock } from "./Block"
import { cellKeyOf } from "./boardFx"

const BoardCell = memo(function BoardCell({
  r,
  c,
  cell,
  previewKind,
  previewColor,
  willClear,
  blastDelay,
}) {
  const blasting = blastDelay != null

  if (cell) {
    return (
      <motion.div
        data-cell={`${r}-${c}`}
        initial={{ scale: 0.72, opacity: 0.35 }}
        animate={
          blasting ? { scale: [1, 1.12, 0.08], opacity: [1, 1, 0] } : { scale: 1, opacity: 1 }
        }
        transition={
          blasting
            ? {
                duration: TIMING.clearDurationMs / 1000,
                delay: (blastDelay ?? 0) / 1000,
                ease: "easeOut",
                times: [0, 0.3, 1],
              }
            : { type: "spring", stiffness: 460, damping: 24 }
        }
        className="relative"
      >
        <CandyBlock color={cell} />
        {willClear && (
          <span className="bb-cell-light" aria-hidden="true">
            <span className="bb-cell-light-inner" />
          </span>
        )}
        {previewKind === 2 && <span className="bb-cell-invalid" aria-hidden="true" />}
      </motion.div>
    )
  }

  return (
    <div className="relative" data-cell={`${r}-${c}`}>
      <span className="bb-slot" aria-hidden="true" />
      {previewKind === 1 && (
        <span
          className="bb-cell-preview"
          aria-hidden="true"
          style={{
            background: previewColor?.previewBg,
            boxShadow: `inset 0 0 0 1.5px ${previewColor?.previewBorder}`,
          }}
        />
      )}
      {previewKind === 2 && <span className="bb-cell-invalid" aria-hidden="true" />}
      {willClear && (
        <span className="bb-cell-glow" aria-hidden="true" style={{ color: previewColor?.mid }} />
      )}
    </div>
  )
})

export const BoardGrid = memo(function BoardGrid({
  board,
  preview,
  highlight,
  clearFx,
  boardRef,
}) {
  return (
    <div
      ref={boardRef}
      className="bb-board relative grid aspect-square w-full touch-none grid-cols-8 gap-[5px] rounded-[26px] p-2 select-none"
    >
      {board.map((row, r) =>
        row.map((cell, c) => {
          const key = cellKeyOf(r, c)
          const previewKind = preview?.cells.has(key) ? (preview.valid ? 1 : 2) : 0
          const willClear = highlight
            ? highlight.rows.has(r) || highlight.cols.has(c)
            : false
          const blast = clearFx ? clearFx.cells.get(key) : null

          return (
            <BoardCell
              key={`${key}-${cell?.id ?? "empty"}`}
              r={r}
              c={c}
              cell={cell}
              previewKind={previewKind}
              previewColor={preview?.color}
              willClear={willClear}
              blastDelay={blast ? blast.delay : null}
            />
          )
        })
      )}
    </div>
  )
})
