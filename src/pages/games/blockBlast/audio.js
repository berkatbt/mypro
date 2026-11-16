// Deeper, more cinematic audio — layered sine+square harmonics, white noise bursts, detuned chords

class SoundController {
  constructor() {
    this.ctx = null
    this.muted = false
  }

  init() {
    if (!this.ctx && typeof window !== "undefined") {
      const AudioContext = window.AudioContext || window.webkitAudioContext
      if (AudioContext) {
        this.ctx = new AudioContext()
      }
    }
    if (this.ctx && this.ctx.state === "suspended") {
      this.ctx.resume()
    }
  }

  // Utility: create a short noise burst (like a soft "pff")
  _noiseBurst(duration = 0.06, volume = 0.08) {
    if (!this.ctx) return
    const bufSize = Math.ceil(this.ctx.sampleRate * duration)
    const buf = this.ctx.createBuffer(1, bufSize, this.ctx.sampleRate)
    const data = buf.getChannelData(0)
    for (let i = 0; i < bufSize; i++) {
      data[i] = (Math.random() * 2 - 1) * (1 - i / bufSize) // decay envelope
    }
    const src = this.ctx.createBufferSource()
    src.buffer = buf
    const gain = this.ctx.createGain()
    gain.gain.setValueAtTime(volume, this.ctx.currentTime)
    gain.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + duration)
    // high-pass to make it sizzle
    const hp = this.ctx.createBiquadFilter()
    hp.type = "highpass"
    hp.frequency.value = 3000
    src.connect(hp)
    hp.connect(gain)
    gain.connect(this.ctx.destination)
    src.start()
  }

  playSelect() {
    if (this.muted) return
    this.init()
    if (!this.ctx) return
    try {
      const now = this.ctx.currentTime
      // Two quick layered tones — a "tick" feeling
      const freqs = [680, 1020]
      freqs.forEach((freq, i) => {
        const osc = this.ctx.createOscillator()
        const gain = this.ctx.createGain()
        osc.type = i === 0 ? "sine" : "triangle"
        osc.frequency.setValueAtTime(freq, now)
        gain.gain.setValueAtTime(0.08, now)
        gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.06)
        osc.connect(gain)
        gain.connect(this.ctx.destination)
        osc.start(now)
        osc.stop(now + 0.06)
      })
    } catch {}
  }

  playPlace() {
    if (this.muted) return
    this.init()
    if (!this.ctx) return
    try {
      const now = this.ctx.currentTime
      // Warm thud: low sine sweep + noise click
      const osc = this.ctx.createOscillator()
      const gain = this.ctx.createGain()
      osc.type = "sine"
      osc.frequency.setValueAtTime(220, now)
      osc.frequency.exponentialRampToValueAtTime(80, now + 0.14)
      gain.gain.setValueAtTime(0.22, now)
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.14)
      osc.connect(gain)
      gain.connect(this.ctx.destination)
      osc.start(now)
      osc.stop(now + 0.14)
      // Add a tiny click
      this._noiseBurst(0.03, 0.06)
    } catch {}
  }

  playBlast(lineCount = 1) {
    if (this.muted) return
    this.init()
    if (!this.ctx) return
    try {
      const now = this.ctx.currentTime
      // Rising shimmer — more lines = higher pitch & longer tail
      const baseFreq = 350 + lineCount * 120
      const steps = 3 + Math.min(lineCount, 3)
      for (let i = 0; i < steps; i++) {
        const delay = i * 0.04
        const osc = this.ctx.createOscillator()
        const gain = this.ctx.createGain()
        osc.type = "sine"
        osc.frequency.setValueAtTime(baseFreq + i * 90, now + delay)
        gain.gain.setValueAtTime(0.16, now + delay)
        gain.gain.exponentialRampToValueAtTime(0.0001, now + delay + 0.22)
        osc.connect(gain)
        gain.connect(this.ctx.destination)
        osc.start(now + delay)
        osc.stop(now + delay + 0.22)
      }
      // White noise whoosh
      this._noiseBurst(0.12, 0.1)
    } catch {}
  }

  playCombo(combo = 1) {
    if (this.muted) return
    this.init()
    if (!this.ctx) return
    try {
      // Bright pentatonic arpeggio, longer the higher the combo
      const scale = [523, 587, 659, 784, 880, 988, 1047]
      const noteCount = Math.min(scale.length, 3 + combo)
      const now = this.ctx.currentTime
      for (let i = 0; i < noteCount; i++) {
        const delay = i * 0.055
        const osc = this.ctx.createOscillator()
        const gain = this.ctx.createGain()
        osc.type = "triangle"
        // Slight detune for richness
        osc.detune.setValueAtTime((Math.random() - 0.5) * 10, now + delay)
        osc.frequency.setValueAtTime(scale[i], now + delay)
        gain.gain.setValueAtTime(0.14, now + delay)
        gain.gain.exponentialRampToValueAtTime(0.0001, now + delay + 0.28)
        osc.connect(gain)
        gain.connect(this.ctx.destination)
        osc.start(now + delay)
        osc.stop(now + delay + 0.28)
      }
    } catch {}
  }

  playGameOver() {
    if (this.muted) return
    this.init()
    if (!this.ctx) return
    try {
      const now = this.ctx.currentTime
      // Minor chord descend — melancholy but cinematic
      const chords = [
        [330, 392, 494],
        [294, 349, 440],
        [262, 311, 392],
        [196, 233, 294],
      ]
      chords.forEach((chord, chordIdx) => {
        const delay = chordIdx * 0.18
        chord.forEach((freq) => {
          const osc = this.ctx.createOscillator()
          const gain = this.ctx.createGain()
          osc.type = "sine"
          osc.frequency.setValueAtTime(freq, now + delay)
          gain.gain.setValueAtTime(0.1, now + delay)
          gain.gain.exponentialRampToValueAtTime(0.0001, now + delay + 0.35)
          osc.connect(gain)
          gain.connect(this.ctx.destination)
          osc.start(now + delay)
          osc.stop(now + delay + 0.35)
        })
      })
    } catch {}
  }
}

export const sounds = new SoundController()
