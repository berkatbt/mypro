import { useEffect, useRef, useState } from "react"
import { TIMING } from "./constants"

/**
 * Angka naik pelan ke nilai baru dengan rAF. `enabled=false` (reduced motion)
 * langsung melompat ke nilai akhir.
 */
export function useCountUp(value, { duration = TIMING.countUpMs, enabled = true } = {}) {
  const [display, setDisplay] = useState(value)
  const displayRef = useRef(value)
  const rafRef = useRef(0)

  useEffect(() => {
    if (!enabled) return

    const from = displayRef.current
    const delta = value - from
    if (!delta) return

    const start = performance.now()
    const tick = (now) => {
      const progress = Math.min(1, (now - start) / duration)
      const eased = 1 - (1 - progress) ** 3
      const next = Math.round(from + delta * eased)
      displayRef.current = next
      setDisplay(next)
      if (progress < 1) rafRef.current = requestAnimationFrame(tick)
    }

    rafRef.current = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(rafRef.current)
  }, [value, duration, enabled])

  return enabled ? display : value
}
