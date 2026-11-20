import { DEFAULT_SETTINGS, STORAGE_KEYS } from './constants'

function safeGet(key) {
  try {
    return window.localStorage.getItem(key)
  } catch {
    return null
  }
}

function safeSet(key, value) {
  try {
    window.localStorage.setItem(key, value)
  } catch {}
}

function safeRemove(key) {
  try {
    window.localStorage.removeItem(key)
  } catch {}
}

// ── Saved Game Session ───────────────────────────────────────────────
export function loadSavedGame() {
  const raw = safeGet(STORAGE_KEYS.savedGame)
  if (!raw) return null
  try {
    const parsed = JSON.parse(raw)
    if (!parsed || !parsed.players || !Array.isArray(parsed.players)) {
      return null
    }
    return parsed
  } catch {
    return null
  }
}

export function saveCurrentGame(state) {
  if (!state || state.phase === 'GAME_OVER') {
    safeRemove(STORAGE_KEYS.savedGame)
    return
  }
  try {
    safeSet(STORAGE_KEYS.savedGame, JSON.stringify(state))
  } catch {}
}

export function clearSavedGame() {
  safeRemove(STORAGE_KEYS.savedGame)
}

// ── Settings ─────────────────────────────────────────────────────────
export function loadSettings() {
  const raw = safeGet(STORAGE_KEYS.settings)
  if (!raw) return DEFAULT_SETTINGS
  try {
    const parsed = JSON.parse(raw)
    return {
      ...DEFAULT_SETTINGS,
      ...parsed,
    }
  } catch {
    return DEFAULT_SETTINGS
  }
}

export function saveSettings(settings) {
  try {
    safeSet(STORAGE_KEYS.settings, JSON.stringify(settings))
  } catch {}
}

// ── Stats ────────────────────────────────────────────────────────────
export function loadStats() {
  const raw = safeGet(STORAGE_KEYS.stats)
  const defaultStats = {
    gamesPlayed: 0,
    gamesWon: 0,
    totalCaptures: 0,
    totalHome: 0,
  }
  if (!raw) return defaultStats
  try {
    return {
      ...defaultStats,
      ...JSON.parse(raw),
    }
  } catch {
    return defaultStats
  }
}

export function updateStats(increment) {
  const current = loadStats()
  const updated = {
    gamesPlayed: current.gamesPlayed + (increment.gamesPlayed || 0),
    gamesWon: current.gamesWon + (increment.gamesWon || 0),
    totalCaptures: current.totalCaptures + (increment.totalCaptures || 0),
    totalHome: current.totalHome + (increment.totalHome || 0),
  }
  try {
    safeSet(STORAGE_KEYS.stats, JSON.stringify(updated))
  } catch {}
  return updated
}
