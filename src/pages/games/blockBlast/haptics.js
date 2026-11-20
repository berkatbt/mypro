class HapticsController {
  constructor() {
    this.enabled = true
  }

  vibrate(pattern) {
    if (!this.enabled) return
    if (typeof navigator === "undefined" || typeof navigator.vibrate !== "function") return
    try {
      navigator.vibrate(pattern)
    } catch {}
  }
}

export const haptics = new HapticsController()
