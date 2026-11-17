// ── Semua angka tuning Block Blast ada di satu tempat ──────────────────────
// Logika (boardLogic/shapes) dan rendering (BlockBlast.jsx) membaca dari sini,
// jadi menyeimbangkan skor/kesulitan cukup ubah file ini.

export const BOARD_SIZE = 8
export const PIECES_PER_TURN = 3

export const SCORE = {
  // poin tiap kotak balok yang dipasang
  perBlock: 1,
  // poin tiap kotak yang ikut terhapus
  perClearedCell: 10,
  // bonus kalau beberapa garis pecah bersamaan (index = jumlah garis)
  multiLineBonus: [0, 0, 150, 400, 800, 1400],
  // tambahan per garis di atas 5 garis sekaligus
  extraLineBonus: 400,
  // combo beruntun: +25% tiap clear berturut-turut
  comboStep: 0.25,
  maxComboMultiplier: 3,
  // bonus papan kosong total
  allClearBonus: 500,
}

// Teks pujian, index 0 = clear paling kecil
export const PRAISE = ["Good!", "Great!", "Excellent!", "Amazing!", "Unbelievable!"]
export const ALL_CLEAR_PRAISE = "ALL CLEAR!"

export const TIMING = {
  // jeda antar kotak saat pecah berurutan
  clearStaggerMs: 24,
  // durasi animasi pecah satu kotak
  clearDurationMs: 380,
  bannerMs: 1400,
  shakeMs: 420,
  // tinggi getaran layar saat clear besar (px)
  shakeDistance: 7,
}

export const PIECE_GENERATION = {
  // berapa kali dicoba sampai dapat set yang minimal 1 baloknya bisa dipasang
  maxAttempts: 80,
  weights: { small: 5, medium: 4, large: 2 },
}

export const DRAG = {
  // jarak balok di atas jari (px) supaya tidak tertutup jari
  liftTouch: 32,
  liftPointer: 14,
  // gerakan di bawah ini dianggap tap, bukan drag
  tapThreshold: 7,
}

export const HAPTIC = {
  place: 8,
  clear: 14,
  multiClear: [18, 26, 34],
  allClear: [24, 32, 24, 32, 70],
  gameOver: [70, 50, 90],
}

export const STORAGE_KEY = "blockblast_highscore"
