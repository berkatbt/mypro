import { memo } from "react"

/**
 * Tile glossy flat-bevel: gradient jenuh ala permen, highlight tipis di atas,
 * bayangan dalam di bawah. Semua dari CSS, tanpa aset.
 */
export const CandyBlock = memo(function CandyBlock({ color, className = "" }) {
  return (
    <div
      className={`bb-tile ${className}`}
      style={{
        "--bb-top": color.top,
        "--bb-mid": color.mid,
        "--bb-dark": color.dark,
      }}
    >
      <span className="bb-tile-shine" aria-hidden="true" />
      <span className="bb-tile-depth" aria-hidden="true" />
    </div>
  )
})

export const MiniCandy = memo(function MiniCandy({ color }) {
  return (
    <div
      className="bb-mini-tile"
      style={{
        "--bb-top": color.top,
        "--bb-mid": color.mid,
        "--bb-dark": color.dark,
      }}
    />
  )
})
