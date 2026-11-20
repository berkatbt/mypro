import React from 'react'
import { motion } from 'motion/react'
import {
  X,
  Volume2,
  VolumeX,
  Zap,
  RotateCcw,
  Shield,
  Timer,
  Gauge,
  Crown,
  Trophy,
  Users,
  Bot,
  HelpCircle,
} from 'lucide-react'
import { COLOR_CONFIG, COLORS } from './constants'

// ── Setup Modal (New Game Configuration) ─────────────────────────────
export function SetupModal({
  isOpen,
  onClose,
  onStartGame,
  initialConfig = {},
}) {
  const [mode, setMode] = React.useState(initialConfig.mode || 'vsBot')
  const [playerCount, setPlayerCount] = React.useState(initialConfig.playerCount || 2)
  const [humanColor, setHumanColor] = React.useState(initialConfig.humanColor || 'red')
  const [botDifficulty, setBotDifficulty] = React.useState(
    initialConfig.botDifficulty || 'medium'
  )

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm">
      <motion.div
        initial={{ opacity: 0, scale: 0.9, y: 12 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 8 }}
        className="relative w-full max-w-md rounded-3xl border border-white/15 bg-slate-900/95 p-6 shadow-2xl backdrop-blur-xl text-white max-h-[92vh] overflow-y-auto"
      >
        <div className="flex items-center justify-between border-b border-white/10 pb-4">
          <div className="flex items-center gap-2.5">
            <span className="text-2xl">🎲</span>
            <div>
              <h2 className="text-lg font-bold tracking-tight">Mulai Permainan Baru</h2>
              <p className="text-xs text-slate-400">Pilih mode dan aturan permainan</p>
            </div>
          </div>
          {onClose && (
            <button
              onClick={onClose}
              className="rounded-full p-1.5 text-slate-400 hover:bg-white/10 hover:text-white"
            >
              <X size={18} />
            </button>
          )}
        </div>

        <div className="mt-5 space-y-5">
          {/* Mode Selection */}
          <div>
            <label className="text-xs font-bold text-slate-300 uppercase tracking-wider">
              Mode Permainan
            </label>
            <div className="mt-2 grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => setMode('vsBot')}
                className={`flex items-center justify-center gap-2 rounded-xl border p-3 text-xs font-bold transition-all ${
                  mode === 'vsBot'
                    ? 'border-indigo-400 bg-indigo-600/30 text-white shadow-[0_0_12px_rgba(99,102,241,0.3)]'
                    : 'border-white/10 bg-white/5 text-slate-400 hover:bg-white/10'
                }`}
              >
                <Bot size={16} />
                Lawan Komputer
              </button>
              <button
                type="button"
                onClick={() => setMode('passAndPlay')}
                className={`flex items-center justify-center gap-2 rounded-xl border p-3 text-xs font-bold transition-all ${
                  mode === 'passAndPlay'
                    ? 'border-indigo-400 bg-indigo-600/30 text-white shadow-[0_0_12px_rgba(99,102,241,0.3)]'
                    : 'border-white/10 bg-white/5 text-slate-400 hover:bg-white/10'
                }`}
              >
                <Users size={16} />
                Pass & Play
              </button>
            </div>
          </div>

          {/* Player Count */}
          <div>
            <div className="flex items-center justify-between">
              <label className="text-xs font-bold text-slate-300 uppercase tracking-wider">
                Jumlah Pemain
              </label>
              {playerCount === 2 && (
                <span className="text-[10px] text-amber-300 font-semibold">
                  (Warna berseberangan)
                </span>
              )}
            </div>
            <div className="mt-2 grid grid-cols-3 gap-2">
              {[2, 3, 4].map((count) => (
                <button
                  key={count}
                  type="button"
                  onClick={() => setPlayerCount(count)}
                  className={`rounded-xl border py-2.5 text-xs font-bold transition-all ${
                    playerCount === count
                      ? 'border-amber-400 bg-amber-400/20 text-amber-200'
                      : 'border-white/10 bg-white/5 text-slate-400 hover:bg-white/10'
                  }`}
                >
                  {count} Pemain
                </button>
              ))}
            </div>
          </div>

          {/* Color Selection */}
          <div>
            <label className="text-xs font-bold text-slate-300 uppercase tracking-wider">
              {mode === 'vsBot' ? 'Pilih Warna Kamu' : 'Warna Pemain 1'}
            </label>
            <div className="mt-2 grid grid-cols-4 gap-2">
              {COLORS.map((colorKey) => {
                const cfg = COLOR_CONFIG[colorKey]
                const isSelected = humanColor === colorKey
                return (
                  <button
                    key={colorKey}
                    type="button"
                    onClick={() => setHumanColor(colorKey)}
                    className={`flex flex-col items-center gap-1.5 rounded-xl border p-2.5 transition-all ${
                      isSelected
                        ? 'border-white bg-white/15 scale-105 shadow-md'
                        : 'border-white/10 bg-white/5 opacity-70 hover:opacity-100'
                    }`}
                  >
                    <span
                      className="h-6 w-6 rounded-full flex items-center justify-center text-xs text-white font-bold shadow"
                      style={{ backgroundColor: cfg.hex }}
                    >
                      {cfg.symbol}
                    </span>
                    <span className="text-[11px] font-semibold">{cfg.name}</span>
                  </button>
                )
              })}
            </div>
          </div>

          {/* Bot Difficulty (if vsBot) */}
          {mode === 'vsBot' && (
            <div>
              <label className="text-xs font-bold text-slate-300 uppercase tracking-wider">
                Tingkat Kesulitan Bot
              </label>
              <div className="mt-2 grid grid-cols-3 gap-2">
                {[
                  { id: 'easy', label: 'Mudah' },
                  { id: 'medium', label: 'Sedang' },
                  { id: 'hard', label: 'Sulit' },
                ].map((diff) => (
                  <button
                    key={diff.id}
                    type="button"
                    onClick={() => setBotDifficulty(diff.id)}
                    className={`rounded-xl border py-2 text-xs font-bold transition-all ${
                      botDifficulty === diff.id
                        ? 'border-emerald-400 bg-emerald-500/20 text-emerald-200'
                        : 'border-white/10 bg-white/5 text-slate-400 hover:bg-white/10'
                    }`}
                  >
                    {diff.label}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Start Button */}
          <button
            type="button"
            onClick={() => {
              onStartGame({
                mode,
                playerCount,
                humanColor,
                botDifficulty,
              })
            }}
            className="w-full mt-2 rounded-2xl bg-gradient-to-r from-amber-500 to-orange-500 py-3.5 text-sm font-bold text-slate-950 shadow-lg shadow-orange-500/20 transition-all hover:scale-[1.02] active:scale-[0.98]"
          >
            Mulai Main 🎲
          </button>
        </div>
      </motion.div>
    </div>
  )
}

// ── Help Modal (Cara Bermain) ────────────────────────────────────────
export function HelpModal({ isOpen, onClose }) {
  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm">
      <motion.div
        initial={{ opacity: 0, scale: 0.9, y: 12 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 8 }}
        className="relative w-full max-w-lg rounded-3xl border border-white/15 bg-slate-900/95 p-6 shadow-2xl backdrop-blur-xl text-white max-h-[85vh] overflow-y-auto"
      >
        <div className="flex items-center justify-between border-b border-white/10 pb-4">
          <div className="flex items-center gap-2">
            <HelpCircle size={20} className="text-amber-400" />
            <h2 className="text-lg font-bold">Panduan & Aturan Ludo</h2>
          </div>
          <button
            onClick={onClose}
            className="rounded-full p-1.5 text-slate-400 hover:bg-white/10 hover:text-white"
          >
            <X size={18} />
          </button>
        </div>

        <div className="mt-4 space-y-3.5 text-xs text-slate-300 leading-relaxed">
          <div className="rounded-xl border border-white/10 bg-white/5 p-3">
            <h3 className="font-bold text-amber-300">🎲 Dadu Angka 6</h3>
            <p className="mt-1">
              Angka 6 dapat mengeluarkan pion dari base ke kotak start, atau memajukan pion di lintasan sebanyak 6 langkah. Pemain mendapat lemparan dadu tambahan. <strong>Tiga kali angka 6 berturut-turut akan membatalkan giliran!</strong>
            </p>
          </div>

          <div className="rounded-xl border border-white/10 bg-white/5 p-3">
            <h3 className="font-bold text-red-400">⚔️ Menangkap Pion Lawan (Capture)</h3>
            <p className="mt-1">
              Mendarat persis di sel yang ditempati pion lawan akan memulangkan pion tersebut kembali ke basenya. Berhasil menangkap memberi <strong>lemparan bonus</strong>!
            </p>
          </div>

          <div className="rounded-xl border border-white/10 bg-white/5 p-3">
            <h3 className="font-bold text-emerald-300">★ Kotak Aman (Safe Squares)</h3>
            <p className="mt-1">
              Ada 8 kotak aman di lintasan: 4 kotak start warna dan 4 kotak bertanda bintang (★). Di kotak aman, pion berbeda warna dapat berbagi sel tanpa bisa ditangkap.
            </p>
          </div>

          <div className="rounded-xl border border-white/10 bg-white/5 p-3">
            <h3 className="font-bold text-cyan-300">🏠 Masuk Home & Angka Pas</h3>
            <p className="mt-1">
              Untuk memasukkan pion ke Home di pusat papan, diperlukan <strong>angka dadu yang pas</strong>. Setiap pion yang berhasil masuk ke Home memberikan lemparan bonus.
            </p>
          </div>

          <div className="rounded-xl border border-white/10 bg-white/5 p-3">
            <h3 className="font-bold text-purple-300">🛡️ Blokade (Opsional)</h3>
            <p className="mt-1">
              Jika aturan blokade diaktifkan di Pengaturan, dua pion sewarna di satu kotak membentuk dinding yang tidak bisa dilewati atau disinggahi oleh pion lawan.
            </p>
          </div>

          <div className="rounded-xl border border-white/10 bg-white/5 p-3">
            <h3 className="font-bold text-amber-300">👑 Penentuan Pemenang</h3>
            <p className="mt-1">
              Pemain pertama yang berhasil membawa <strong>keempat pionnya</strong> ke Home keluar sebagai pemenang juara 1!
            </p>
          </div>
        </div>

        <button
          onClick={onClose}
          className="w-full mt-5 rounded-xl bg-white/10 py-2.5 text-xs font-bold text-white transition-colors hover:bg-white/20"
        >
          Mengerti & Tutup
        </button>
      </motion.div>
    </div>
  )
}

// ── Settings Modal ───────────────────────────────────────────────────
export function SettingsModal({
  isOpen,
  onClose,
  settings,
  onUpdateSettings,
  onResetGame,
  onNewGameMenu,
}) {
  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm">
      <motion.div
        initial={{ opacity: 0, scale: 0.9, y: 12 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 8 }}
        className="relative w-full max-w-sm rounded-3xl border border-white/15 bg-slate-900/95 p-6 shadow-2xl backdrop-blur-xl text-white"
      >
        <div className="flex items-center justify-between border-b border-white/10 pb-4">
          <h2 className="text-base font-bold">Pengaturan Game</h2>
          <button
            onClick={onClose}
            className="rounded-full p-1.5 text-slate-400 hover:bg-white/10 hover:text-white"
          >
            <X size={18} />
          </button>
        </div>

        <div className="mt-4 space-y-2 text-xs">
          {/* Suara */}
          <button
            type="button"
            onClick={() => onUpdateSettings({ muted: !settings.muted })}
            className="flex w-full items-center justify-between rounded-xl p-2.5 transition-colors hover:bg-white/5"
          >
            <span className="flex items-center gap-2 text-slate-200">
              {settings.muted ? <VolumeX size={16} /> : <Volume2 size={16} />}
              Suara Efek
            </span>
            <span
              className={`rounded-full px-2.5 py-0.5 text-[10px] font-black ${
                settings.muted ? 'bg-white/10 text-slate-400' : 'bg-emerald-500 text-slate-950'
              }`}
            >
              {settings.muted ? 'OFF' : 'ON'}
            </span>
          </button>

          {/* Getar */}
          <button
            type="button"
            onClick={() => onUpdateSettings({ vibration: !settings.vibration })}
            className="flex w-full items-center justify-between rounded-xl p-2.5 transition-colors hover:bg-white/5"
          >
            <span className="flex items-center gap-2 text-slate-200">
              <Zap
                size={16}
                className={settings.vibration ? 'text-amber-400' : 'text-slate-500'}
              />
              Getar
            </span>
            <span
              className={`rounded-full px-2.5 py-0.5 text-[10px] font-black ${
                settings.vibration ? 'bg-amber-400 text-slate-950' : 'bg-white/10 text-slate-400'
              }`}
            >
              {settings.vibration ? 'ON' : 'OFF'}
            </span>
          </button>

          {/* Aturan Blok */}
          <button
            type="button"
            onClick={() => onUpdateSettings({ blockRule: !settings.blockRule })}
            className="flex w-full items-center justify-between rounded-xl p-2.5 transition-colors hover:bg-white/5"
          >
            <span className="flex items-center gap-2 text-slate-200">
              <Shield
                size={16}
                className={settings.blockRule ? 'text-indigo-400' : 'text-slate-500'}
              />
              Aturan Blokade
            </span>
            <span
              className={`rounded-full px-2.5 py-0.5 text-[10px] font-black ${
                settings.blockRule ? 'bg-indigo-500 text-white' : 'bg-white/10 text-slate-400'
              }`}
            >
              {settings.blockRule ? 'ON' : 'OFF'}
            </span>
          </button>

          {/* Timer Giliran */}
          <button
            type="button"
            onClick={() => onUpdateSettings({ turnTimer: !settings.turnTimer })}
            className="flex w-full items-center justify-between rounded-xl p-2.5 transition-colors hover:bg-white/5"
          >
            <span className="flex items-center gap-2 text-slate-200">
              <Timer
                size={16}
                className={settings.turnTimer ? 'text-cyan-400' : 'text-slate-500'}
              />
              Timer Giliran (15s)
            </span>
            <span
              className={`rounded-full px-2.5 py-0.5 text-[10px] font-black ${
                settings.turnTimer ? 'bg-cyan-500 text-slate-950' : 'bg-white/10 text-slate-400'
              }`}
            >
              {settings.turnTimer ? 'ON' : 'OFF'}
            </span>
          </button>

          {/* Kecepatan Animasi */}
          <button
            type="button"
            onClick={() =>
              onUpdateSettings({
                animationSpeed: settings.animationSpeed === 1 ? 1.5 : 1,
              })
            }
            className="flex w-full items-center justify-between rounded-xl p-2.5 transition-colors hover:bg-white/5"
          >
            <span className="flex items-center gap-2 text-slate-200">
              <Gauge size={16} />
              Kecepatan Animasi
            </span>
            <span className="rounded-full bg-white/15 px-2.5 py-0.5 text-[10px] font-black text-white">
              {settings.animationSpeed === 1 ? 'Normal (1×)' : 'Cepat (1.5×)'}
            </span>
          </button>

          <hr className="my-2 border-white/10" />

          {/* Reset Game */}
          <button
            type="button"
            onClick={() => {
              onResetGame()
              onClose()
            }}
            className="flex w-full items-center gap-2 rounded-xl p-2.5 text-slate-300 transition-colors hover:bg-white/10"
          >
            <RotateCcw size={16} />
            Mulai Ulang Ronde Ini
          </button>

          {/* New Game Setup */}
          <button
            type="button"
            onClick={() => {
              onNewGameMenu()
              onClose()
            }}
            className="flex w-full items-center gap-2 rounded-xl p-2.5 text-slate-300 transition-colors hover:bg-white/10"
          >
            <Users size={16} />
            Ubah Mode / Setup Baru
          </button>
        </div>
      </motion.div>
    </div>
  )
}

// ── GameOver / Victory Modal ─────────────────────────────────────────
export function GameOverModal({
  isOpen,
  winnerPlayer,
  rankings,
  players,
  onPlayAgain,
  onNewGame,
}) {
  if (!isOpen || !winnerPlayer) return null

  // Sort players by ranking list
  const rankedPlayers = rankings
    .map((id) => players.find((p) => p.id === id))
    .filter(Boolean)

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md">
      <motion.div
        initial={{ opacity: 0, scale: 0.85, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        className="relative w-full max-w-sm rounded-3xl border border-amber-400/30 bg-slate-900/95 p-6 text-center shadow-2xl backdrop-blur-xl text-white"
      >
        <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-amber-400/20 text-amber-300 border border-amber-400/40 shadow-[0_0_24px_rgba(251,191,36,0.3)]">
          <Trophy size={32} />
        </div>

        <span className="mt-3 block text-xs font-bold uppercase tracking-widest text-amber-300">
          Permainan Selesai!
        </span>

        <h2 className="mt-1 text-2xl font-black text-white">
          {winnerPlayer.name} Menang! 🎉
        </h2>

        {/* Leaderboard Rankings */}
        <div className="mt-5 space-y-2 text-left">
          <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
            Peringkat Akhir
          </span>
          {rankedPlayers.map((player, idx) => {
            const cfg = COLOR_CONFIG[player.color]
            return (
              <div
                key={player.id}
                className={`flex items-center justify-between rounded-xl border p-2.5 text-xs ${
                  idx === 0
                    ? 'border-amber-400/50 bg-amber-400/10 font-bold text-amber-200'
                    : 'border-white/10 bg-white/5 text-slate-300'
                }`}
              >
                <div className="flex items-center gap-2">
                  <span className="font-mono font-bold text-slate-400">#{idx + 1}</span>
                  <span
                    className="h-3 w-3 rounded-full"
                    style={{ backgroundColor: cfg.hex }}
                  />
                  <span>{player.name}</span>
                </div>
                <div className="flex items-center gap-1.5 font-semibold text-slate-400">
                  <Crown size={12} className={idx === 0 ? 'text-amber-400' : ''} />
                  <span>{player.tokensAtHome}/4 di Home</span>
                </div>
              </div>
            )
          })}
        </div>

        {/* Action Buttons */}
        <div className="mt-6 flex flex-col gap-2.5">
          <button
            type="button"
            onClick={onPlayAgain}
            className="w-full rounded-2xl bg-gradient-to-r from-amber-500 to-orange-500 py-3 text-xs font-bold text-slate-950 shadow-lg shadow-orange-500/20 transition-all hover:scale-[1.02] active:scale-[0.98]"
          >
            Main Lagi 🎲
          </button>
          <button
            type="button"
            onClick={onNewGame}
            className="w-full rounded-2xl border border-white/15 bg-white/5 py-2.5 text-xs font-bold text-slate-300 transition-colors hover:bg-white/10 hover:text-white"
          >
            Ganti Mode / Pemain
          </button>
        </div>
      </motion.div>
    </div>
  )
}
