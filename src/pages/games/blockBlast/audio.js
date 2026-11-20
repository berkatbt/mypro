// Semua suara disintesis lewat Web Audio API — tanpa file audio.
// Nada naik seiring streak, dan tidak ada yang dijalankan sebelum gesture user.

class SoundController {
  constructor() {
    this.ctx = null
    this.muted = false
  }

  // Harus dipanggil dari gesture user (pointerdown) supaya iOS mengizinkan audio
  unlock() {
    if (typeof window === "undefined") return
    if (!this.ctx) {
      const AudioContext = window.AudioContext || window.webkitAudioContext
      if (!AudioContext) return
      try {
        this.ctx = new AudioContext()
      } catch {
        return
      }
    }
    if (this.ctx.state === "suspended") {
      this.ctx.resume().catch(() => {})
    }
  }

  init() {
    this.unlock()
  }

  _tone({ freq, type = "sine", duration = 0.2, volume = 0.1, delay = 0, slideTo = null }) {
    if (!this.ctx || this.muted) return
    try {
      const start = this.ctx.currentTime + delay
      const osc = this.ctx.createOscillator()
      const gain = this.ctx.createGain()
      osc.type = type
      osc.frequency.setValueAtTime(freq, start)
      if (slideTo) osc.frequency.exponentialRampToValueAtTime(slideTo, start + duration)
      gain.gain.setValueAtTime(volume, start)
      gain.gain.exponentialRampToValueAtTime(0.0001, start + duration)
      osc.connect(gain)
      gain.connect(this.ctx.destination)
      osc.start(start)
      osc.stop(start + duration + 0.02)
    } catch {}
  }

  _noise({ duration = 0.06, volume = 0.05, delay = 0 }) {
    if (!this.ctx || this.muted) return
    try {
      const start = this.ctx.currentTime + delay
      const size = Math.ceil(this.ctx.sampleRate * duration)
      const buffer = this.ctx.createBuffer(1, size, this.ctx.sampleRate)
      const data = buffer.getChannelData(0)
      for (let i = 0; i < size; i++) {
        data[i] = (Math.random() * 2 - 1) * (1 - i / size)
      }
      const source = this.ctx.createBufferSource()
      source.buffer = buffer
      const filter = this.ctx.createBiquadFilter()
      filter.type = "highpass"
      filter.frequency.value = 2600
      const gain = this.ctx.createGain()
      gain.gain.setValueAtTime(volume, start)
      gain.gain.exponentialRampToValueAtTime(0.0001, start + duration)
      source.connect(filter)
      filter.connect(gain)
      gain.connect(this.ctx.destination)
      source.start(start)
      source.stop(start + duration)
    } catch {}
  }

  playSelect() {
    if (this.muted) return
    this.unlock()
    this._tone({ freq: 720, type: "sine", duration: 0.06, volume: 0.06 })
    this._tone({ freq: 1080, type: "triangle", duration: 0.05, volume: 0.03 })
  }

  playPlace() {
    if (this.muted) return
    this.unlock()
    this._tone({ freq: 210, slideTo: 92, duration: 0.14, volume: 0.2 })
    this._noise({ duration: 0.03, volume: 0.05 })
  }

  playClear({ lines = 1, streak = 1, perfect = false } = {}) {
    if (this.muted) return
    this.unlock()
    if (!this.ctx) return

    const root = 300 + Math.min(streak, 8) * 38 + (lines - 1) * 30
    const notes = perfect ? [0, 4, 7, 12, 16, 19] : [0, 4, 7, 12]
    const count = perfect ? notes.length : Math.min(notes.length, 2 + lines + Math.min(streak, 3))

    for (let i = 0; i < count; i++) {
      const semitone = notes[i]
      this._tone({
        freq: root * 2 ** (semitone / 12),
        type: "triangle",
        duration: 0.22,
        volume: 0.11,
        delay: i * 0.045,
      })
    }

    this._noise({ duration: 0.16, volume: perfect ? 0.1 : 0.06 })
    if (perfect) {
      this._tone({ freq: root * 2, duration: 0.5, volume: 0.06, delay: 0.12 })
      this._tone({ freq: root * 3, duration: 0.6, volume: 0.04, delay: 0.18 })
    }
  }

  playGameOver() {
    if (this.muted) return
    this.unlock()
    const chords = [
      [330, 392, 494],
      [294, 349, 440],
      [262, 311, 392],
      [196, 233, 294],
    ]

    chords.forEach((chord, index) => {
      chord.forEach((freq) => {
        this._tone({
          freq,
          type: "sine",
          duration: 0.38,
          volume: 0.07,
          delay: index * 0.17,
        })
      })
    })
    this._tone({ freq: 98, slideTo: 65, duration: 0.7, volume: 0.12, delay: 0.1 })
  }
}

export const sounds = new SoundController()
