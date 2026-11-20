// ── Semua angka tuning Block Blast ada di satu tempat ──────────────────────
// Engine (boardLogic/scoring/shapes) dan UI (BlockBlast.jsx) membaca dari sini,
// jadi menyeimbangkan skor/kesulitan cukup ubah file ini.

export const BOARD_SIZE = 8
export const PIECES_PER_TURN = 3

export const SCORE = {
  // +1 poin tiap sel balok yang dipasang
  perPlacedCell: 1,
  // 10 poin × jumlah sel terhapus × jumlah garis terhapus
  perClearedCell: 10,
  // pengali streak: 1 + 0.5 × (streak − 1)
  streakStep: 0.5,
  // 3 penempatan berturut-turut tanpa clear memutus streak (satu set penuh)
  comboWindow: 3,
  // bonus papan kosong total setelah clear
  perfectClearBonus: 1000,
}

// Teks pujian, index 0 = clear paling kecil
export const PRAISE = ["Good!", "Great!", "Excellent!", "Amazing!", "Unbelievable!"]
export const PERFECT_PRAISE = "PERFECT!"

export const TIMING = {
  // jeda antar sel saat clear bergelombang dari titik penempatan
  clearStaggerMs: 22,
  // durasi animasi satu sel pecah
  clearDurationMs: 340,
  bannerMs: 1200,
  popupMs: 900,
  shakeMs: 400,
  // tinggi getaran layar saat clear besar (px)
  shakeDistance: 6,
  // durasi count-up skor
  countUpMs: 420,
  // animasi blok kembali ke tray saat drop tidak valid
  returnMs: 300,
}

export const DIFFICULTY = {
  // berapa kali set dicoba sampai adil sebelum fallback ke blok kecil
  maxAttempts: 50,
  // bobot dasar tiap kategori bentuk
  baseWeights: { small: 4, medium: 4, large: 3 },
  // makin penuh papan, blok kecil makin sering
  fillInfluence: 2.5,
  // makin tinggi skor, blok besar makin sering
  scoreInfluence: 2,
  // skor yang dianggap "tinggi" untuk bobot di atas
  scoreReference: 3000,
  // batas node saat mengecek apakah ketiga blok bisa dipasang berurutan
  orderSearchBudget: 4000,
}

export const DRAG = {
  // di layar sentuh blok diangkat 1.75 sel di atas jari
  touchLiftCells: 1.75,
  // gerakan di bawah ini dianggap tap, bukan drag
  tapThreshold: 6,
  // skala awal saat blok terangkat dari tray
  ghostScale: 0.6,
  // durasi blok membesar dari ukuran tray ke ukuran sel
  growMs: 150,
}

export const HAPTIC = {
  place: 8,
  clear: 14,
  multiClear: [18, 26, 34],
  perfectClear: [24, 32, 24, 32, 70],
  gameOver: [70, 50, 90],
}

export const STORAGE_KEYS = {
  best: "blockblast:best",
  game: "blockblast:game",
  settings: "blockblast:settings",
}
