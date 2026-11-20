// Grid 15x15 Ludo Board Constants & Path Geometry
export const GRID_SIZE = 15

export const COLORS = ['red', 'green', 'yellow', 'blue']

export const COLOR_INDICES = {
  red: 0,
  green: 1,
  yellow: 2,
  blue: 3,
}

export const COLOR_CONFIG = {
  red: {
    id: 'red',
    name: 'Merah',
    index: 0,
    hex: '#ef4444',
    bgHex: '#fee2e2',
    accentHex: '#b91c1c',
    glowHex: 'rgba(239, 68, 68, 0.45)',
    symbol: '★',
    startTrackIdx: 0,
    baseArea: { rMin: 0, rMax: 5, cMin: 0, cMax: 5 },
  },
  green: {
    id: 'green',
    name: 'Hijau',
    index: 1,
    hex: '#10b981',
    bgHex: '#d1fae5',
    accentHex: '#047857',
    glowHex: 'rgba(16, 185, 129, 0.45)',
    symbol: '◆',
    startTrackIdx: 13,
    baseArea: { rMin: 0, rMax: 5, cMin: 9, cMax: 14 },
  },
  yellow: {
    id: 'yellow',
    name: 'Kuning',
    index: 2,
    hex: '#f59e0b',
    bgHex: '#fef3c7',
    accentHex: '#b45309',
    glowHex: 'rgba(245, 158, 11, 0.45)',
    symbol: '●',
    startTrackIdx: 26,
    baseArea: { rMin: 9, rMax: 14, cMin: 9, cMax: 14 },
  },
  blue: {
    id: 'blue',
    name: 'Biru',
    index: 3,
    hex: '#3b82f6',
    bgHex: '#dbeafe',
    accentHex: '#1d4ed8',
    glowHex: 'rgba(59, 130, 246, 0.45)',
    symbol: '▲',
    startTrackIdx: 39,
    baseArea: { rMin: 9, rMax: 14, cMin: 0, cMax: 5 },
  },
}

// 52 common track cells, clockwise, 0-indexed (row, col)
// Index 0 = Red start (6,1)
export const COMMON_TRACK = [
  { r: 6, c: 1 },  // 0  Red start
  { r: 6, c: 2 },  // 1
  { r: 6, c: 3 },  // 2
  { r: 6, c: 4 },  // 3
  { r: 6, c: 5 },  // 4
  { r: 5, c: 6 },  // 5  Inner corner diagonal (6,5) -> (5,6)
  { r: 4, c: 6 },  // 6
  { r: 3, c: 6 },  // 7
  { r: 2, c: 6 },  // 8  Star (safe)
  { r: 1, c: 6 },  // 9
  { r: 0, c: 6 },  // 10
  { r: 0, c: 7 },  // 11
  { r: 0, c: 8 },  // 12
  { r: 1, c: 8 },  // 13 Green start
  { r: 2, c: 8 },  // 14
  { r: 3, c: 8 },  // 15
  { r: 4, c: 8 },  // 16
  { r: 5, c: 8 },  // 17
  { r: 6, c: 9 },  // 18 Inner corner diagonal (5,8) -> (6,9)
  { r: 6, c: 10 }, // 19
  { r: 6, c: 11 }, // 20
  { r: 6, c: 12 }, // 21 Star (safe)
  { r: 6, c: 13 }, // 22
  { r: 6, c: 14 }, // 23
  { r: 7, c: 14 }, // 24
  { r: 8, c: 14 }, // 25
  { r: 8, c: 13 }, // 26 Yellow start
  { r: 8, c: 12 }, // 27
  { r: 8, c: 11 }, // 28
  { r: 8, c: 10 }, // 29
  { r: 8, c: 9 },  // 30
  { r: 9, c: 8 },  // 31 Inner corner diagonal (8,9) -> (9,8)
  { r: 10, c: 8 }, // 32
  { r: 11, c: 8 }, // 33
  { r: 12, c: 8 }, // 34 Star (safe)
  { r: 13, c: 8 }, // 35
  { r: 14, c: 8 }, // 36
  { r: 14, c: 7 }, // 37
  { r: 14, c: 6 }, // 38
  { r: 13, c: 6 }, // 39 Blue start
  { r: 12, c: 6 }, // 40
  { r: 11, c: 6 }, // 41
  { r: 10, c: 6 }, // 42
  { r: 9, c: 6 },  // 43
  { r: 8, c: 5 },  // 44 Inner corner diagonal (9,6) -> (8,5)
  { r: 8, c: 4 },  // 45
  { r: 8, c: 3 },  // 46
  { r: 8, c: 2 },  // 47 Star (safe)
  { r: 8, c: 1 },  // 48
  { r: 8, c: 0 },  // 49
  { r: 7, c: 0 },  // 50
  { r: 6, c: 0 },  // 51
]

// 4 start squares + 4 star squares = 8 safe squares
export const SAFE_TRACK_INDICES = [0, 8, 13, 21, 26, 34, 39, 47]
export const SAFE_TRACK_SET = new Set(SAFE_TRACK_INDICES)

// 4 Star cells
export const STAR_TRACK_INDICES = [8, 21, 34, 47]
export const STAR_TRACK_SET = new Set(STAR_TRACK_INDICES)

// Start track index for each color
export const COLOR_START_INDEX = {
  red: 0,
  green: 13,
  yellow: 26,
  blue: 39,
}

// 5 Home column cells per color leading to center (7,7)
export const HOME_COLUMNS = {
  red: [
    { r: 7, c: 1 },
    { r: 7, c: 2 },
    { r: 7, c: 3 },
    { r: 7, c: 4 },
    { r: 7, c: 5 },
  ],
  green: [
    { r: 1, c: 7 },
    { r: 2, c: 7 },
    { r: 3, c: 7 },
    { r: 4, c: 7 },
    { r: 5, c: 7 },
  ],
  yellow: [
    { r: 7, c: 13 },
    { r: 7, c: 12 },
    { r: 7, c: 11 },
    { r: 7, c: 10 },
    { r: 7, c: 9 },
  ],
  blue: [
    { r: 13, c: 7 },
    { r: 12, c: 7 },
    { r: 11, c: 7 },
    { r: 10, c: 7 },
    { r: 9, c: 7 },
  ],
}

// Center home triangle target coordinate
export const HOME_CENTER = { r: 7, c: 7 }

// Discrete base slots (4 slots inside each 6x6 base's inner 4x4 box)
export const BASE_SLOTS = {
  red: [
    { r: 1.8, c: 1.8 },
    { r: 1.8, c: 3.2 },
    { r: 3.2, c: 1.8 },
    { r: 3.2, c: 3.2 },
  ],
  green: [
    { r: 1.8, c: 10.8 },
    { r: 1.8, c: 12.2 },
    { r: 3.2, c: 10.8 },
    { r: 3.2, c: 12.2 },
  ],
  yellow: [
    { r: 10.8, c: 10.8 },
    { r: 10.8, c: 12.2 },
    { r: 12.2, c: 10.8 },
    { r: 12.2, c: 12.2 },
  ],
  blue: [
    { r: 10.8, c: 1.8 },
    { r: 10.8, c: 3.2 },
    { r: 12.2, c: 1.8 },
    { r: 12.2, c: 3.2 },
  ],
}

export const TOTAL_STEPS_TO_HOME = 56 // pos 0 = start, pos 56 = home
export const BASE_POS = -1
export const HOME_POS = 56

export const GAME_PHASES = {
  WAIT_ROLL: 'WAIT_ROLL',
  ROLLING: 'ROLLING',
  WAIT_SELECT: 'WAIT_SELECT',
  AUTO_MOVE: 'AUTO_MOVE',
  MOVING: 'MOVING',
  RESOLVE: 'RESOLVE',
  GAME_OVER: 'GAME_OVER',
}

export const STORAGE_KEYS = {
  savedGame: 'ludo_saved_game_v1',
  settings: 'ludo_settings_v1',
  stats: 'ludo_stats_v1',
}

export const DEFAULT_SETTINGS = {
  muted: false,
  vibration: true,
  blockRule: false,
  turnTimer: false,
  turnTimeLimit: 15,
  animationSpeed: 1, // 1 = normal, 1.5 = fast
}
