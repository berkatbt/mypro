// Web Audio Synthesizer for Ludo Game
// Synthesizes all sounds without external audio assets.

class LudoSoundController {
  constructor() {
    this.ctx = null
    this.muted = false
  }

  // Must be unlocked from a user gesture (pointerdown/click)
  unlock() {
    if (typeof window === 'undefined') return
    if (!this.ctx) {
      const AudioCtx = window.AudioContext || window.webkitAudioContext
      if (!AudioCtx) return
      try {
        this.ctx = new AudioCtx()
      } catch {
        return
      }
    }
    if (this.ctx.state === 'suspended') {
      this.ctx.resume().catch(() => {})
    }
  }

  _tone({
    freq,
    type = 'sine',
    duration = 0.15,
    volume = 0.1,
    delay = 0,
    slideTo = null,
  }) {
    if (!this.ctx || this.muted) return
    try {
      const start = this.ctx.currentTime + delay
      const osc = this.ctx.createOscillator()
      const gain = this.ctx.createGain()

      osc.type = type
      osc.frequency.setValueAtTime(freq, start)
      if (slideTo) {
        osc.frequency.exponentialRampToValueAtTime(slideTo, start + duration)
      }

      gain.gain.setValueAtTime(volume, start)
      gain.gain.exponentialRampToValueAtTime(0.0001, start + duration)

      osc.connect(gain)
      gain.connect(this.ctx.destination)

      osc.start(start)
      osc.stop(start + duration + 0.03)
    } catch {}
  }

  // Dice rolling rumble / rattles
  diceRoll() {
    if (!this.ctx || this.muted) return
    const clickTimes = [0, 0.08, 0.16, 0.24, 0.33, 0.42, 0.52, 0.63]
    clickTimes.forEach((t, i) => {
      const freq = 320 + (i % 3) * 60 + Math.random() * 40
      this._tone({
        freq,
        type: 'triangle',
        duration: 0.04,
        volume: 0.07,
        delay: t,
      })
    })
  }

  // Single token hop step
  step(stepIndex = 0) {
    const baseFreq = 440 + (stepIndex % 10) * 15
    this._tone({
      freq: baseFreq,
      type: 'sine',
      duration: 0.08,
      volume: 0.08,
      slideTo: baseFreq + 80,
    })
  }

  // Token leaving base
  releaseFromBase() {
    this._tone({ freq: 520, type: 'triangle', duration: 0.1, volume: 0.1, delay: 0 })
    this._tone({ freq: 780, type: 'triangle', duration: 0.15, volume: 0.1, delay: 0.08 })
  }

  // Opponent token captured
  capture() {
    if (!this.ctx || this.muted) return
    // Dynamic punchy thump & descending sweep
    this._tone({ freq: 380, slideTo: 110, type: 'sawtooth', duration: 0.2, volume: 0.14 })
    this._tone({ freq: 160, slideTo: 60, type: 'triangle', duration: 0.25, volume: 0.18, delay: 0.05 })
  }

  // Token entered home
  home() {
    if (!this.ctx || this.muted) return
    // Sparkle major triad chord
    const notes = [523.25, 659.25, 783.99, 1046.5] // C5, E5, G5, C6
    notes.forEach((freq, idx) => {
      this._tone({
        freq,
        type: 'sine',
        duration: 0.3,
        volume: 0.09,
        delay: idx * 0.07,
      })
    })
  }

  // Three sixes cancellation sound
  turnCancelled() {
    this._tone({ freq: 320, slideTo: 180, type: 'sawtooth', duration: 0.25, volume: 0.1 })
  }

  // Victory Fanfare
  victory() {
    if (!this.ctx || this.muted) return
    const melody = [
      { f: 523.25, d: 0.12, t: 0 },
      { f: 523.25, d: 0.12, t: 0.13 },
      { f: 523.25, d: 0.12, t: 0.26 },
      { f: 659.25, d: 0.35, t: 0.4 },
      { f: 587.33, d: 0.12, t: 0.78 },
      { f: 659.25, d: 0.12, t: 0.92 },
      { f: 783.99, d: 0.6, t: 1.06 },
    ]
    melody.forEach((note) => {
      this._tone({
        freq: note.f,
        type: 'triangle',
        duration: note.d,
        volume: 0.12,
        delay: note.t,
      })
    })
  }
}

export const ludoAudio = new LudoSoundController()
