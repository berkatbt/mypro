class LudoHapticsController {
  constructor() {
    this.enabled = true
  }

  vibrate(pattern) {
    if (!this.enabled) return
    if (typeof navigator === 'undefined' || typeof navigator.vibrate !== 'function') {
      return
    }
    try {
      navigator.vibrate(pattern)
    } catch {}
  }

  // Short tap
  tap() {
    this.vibrate(15)
  }

  // Capture vibration
  capture() {
    this.vibrate([40, 30, 70])
  }

  // Token entered home
  home() {
    this.vibrate([70, 40, 120])
  }

  // Victory celebration
  victory() {
    this.vibrate([100, 50, 100, 50, 200])
  }
}

export const ludoHaptics = new LudoHapticsController()
