import { motion } from "motion/react"
import { Gamepad2, Trophy, Star, ArrowLeft, Bot, Users } from "lucide-react"
import { Link } from "react-router-dom"
import { StaggerGroup, Reveal } from "../components/ui/Reveal"
import { staggerItem } from "../lib/animations"

const games = [
  {
    name: "Block Blast",
    path: "/games/block-blast",
    tag: "Populer 🔥",
    thumbnail: "/Thumbnail_Block_Blast.png",
    theme: "from-indigo-500 via-purple-500 to-fuchsia-500",
    glow: "group-hover:shadow-[0_0_40px_rgba(99,102,241,0.35)]",
    desc: "Susun balok bergradien di grid 8×8, bersihkan baris & kolom, dan raih kombo tertinggi!",
    features: ["Kombo beruntun", "Skor tertinggi tersimpan"],
  },
  {
    name: "Ludo",
    path: "/games/ludo",
    tag: "Baru 🔥",
    thumbnail: "/Thumbnail_Ludo.png",
    theme: "from-amber-500 via-orange-500 to-red-500",
    glow: "group-hover:shadow-[0_0_40px_rgba(245,158,11,0.35)]",
    desc: "Ludo klasik lawan Bot pintar dengan 3 tingkat kesulitan, atau seru-seruan bareng teman lewat Pass & Play!",
    features: ["Lawan Bot / Pass & Play", "2–4 pemain"],
  },
]

const stats = [
  { icon: Gamepad2, value: "02", label: "Games Tersedia" },
  { icon: Users, value: "2-4", label: "Pemain" },
  { icon: Bot, value: "03", label: "Level Kesulitan Bot" },
  { icon: Trophy, value: "∞", label: "Fun Level" },
]

function GameCard({ game }) {
  return (
    <motion.div
      variants={staggerItem}
      whileHover={{ y: -6 }}
      transition={{ duration: 0.35 }}
      className={`group relative flex h-full flex-col overflow-hidden rounded-3xl border border-white/10 bg-white/[0.02] transition-all duration-300 hover:border-white/25 ${game.glow}`}
    >
      <span className="absolute inset-x-0 top-0 z-10 h-px origin-left scale-x-0 bg-gradient-to-r from-transparent via-white/70 to-transparent transition-transform duration-700 group-hover:scale-x-100" />

      {/* Thumbnail Banner */}
      <div className="relative overflow-hidden">
        <img
          src={game.thumbnail}
          alt={`Thumbnail ${game.name}`}
          className="h-48 w-full object-cover transition-transform duration-500 group-hover:scale-105 sm:h-56"
          onError={(event) => {
            event.currentTarget.style.display = "none"
          }}
        />
        <span
          aria-hidden="true"
          className="pointer-events-none absolute inset-x-0 bottom-0 h-14 bg-gradient-to-t from-[#050505]/80 to-transparent"
        />
        <span className="absolute top-4 right-4 rounded-full border border-white/30 bg-black/50 px-3 py-1 text-[10px] font-bold text-white backdrop-blur">
          {game.tag}
        </span>
      </div>

      {/* Card Body */}
      <div className="flex flex-1 flex-col p-7">
        <h3 className="font-display text-2xl font-bold text-white">
          {game.name}
        </h3>

        <p className="mt-2.5 text-sm leading-7 text-slate-400">{game.desc}</p>

        <div className="mt-4 flex flex-wrap gap-2">
          {game.features.map((feature) => (
            <span
              key={feature}
              className="rounded-full border border-white/10 bg-white/5 px-3 py-1 text-[10px] font-semibold text-slate-300"
            >
              {feature}
            </span>
          ))}
        </div>

        <Link
          to={game.path}
          className={`mt-6 inline-flex items-center justify-center gap-2 rounded-2xl bg-gradient-to-r ${game.theme} py-3.5 text-sm font-bold text-white transition-all hover:scale-[1.02] hover:brightness-110 active:scale-[0.98]`}
        >
          <Gamepad2 size={18} />
          Mainkan Sekarang →
        </Link>
      </div>
    </motion.div>
  )
}

export default function Games() {
  return (
    <div className="min-h-screen overflow-x-hidden bg-background text-text-main">
      {/* Hero Section */}
      <section className="relative overflow-hidden bg-[#050505] px-5 pt-32 pb-16 md:px-8 md:pt-40 md:pb-20">
        <div
          aria-hidden="true"
          className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_center,rgba(255,255,255,0.08),transparent_60%)]"
        />
        <div aria-hidden="true" className="grid-pattern pointer-events-none absolute inset-0 opacity-30" />

        <motion.div
          aria-hidden="true"
          animate={{ rotate: 360 }}
          transition={{ duration: 80, repeat: Infinity, ease: "linear" }}
          className="pointer-events-none absolute top-20 right-10 h-[280px] w-[280px] rounded-full border border-dashed border-white/[0.06] sm:h-[380px] sm:w-[380px]"
        />

        <div className="relative mx-auto w-full max-w-7xl">
          <Reveal>
            <Link
              to="/"
              className="inline-flex items-center gap-2 text-sm text-slate-400 transition-colors hover:text-accent"
            >
              <ArrowLeft size={16} />
              Kembali ke Home
            </Link>
          </Reveal>

          <Reveal delay={0.1}>
            <div className="mt-8 flex items-center gap-3">
              <span className="h-px w-10 bg-gradient-to-r from-white/50 to-transparent" />
              <span className="text-[11px] font-semibold tracking-[0.35em] text-accent/80 uppercase">
                Play & Enjoy
              </span>
            </div>
          </Reveal>

          <Reveal delay={0.2}>
            <h1 className="mt-5 font-display text-5xl font-extrabold tracking-tight sm:text-6xl lg:text-7xl">
              Interactive{" "}
              <span className="gradient-text">Games</span>
            </h1>
          </Reveal>

          <Reveal delay={0.3}>
            <p className="mt-6 max-w-2xl text-sm leading-8 text-slate-400 md:text-base">
              Koleksi game interaktif yang saya buat untuk bersenang-senang dan mengeksplorasi
              kemampuan web development. Semua berjalan langsung di browser kamu.
            </p>
          </Reveal>

          {/* Stats */}
          <StaggerGroup className="mt-12 flex flex-wrap gap-8" stagger={0.1} delay={0.4}>
            {stats.map((stat) => (
              <motion.div
                key={stat.label}
                variants={staggerItem}
                className="flex items-center gap-3"
              >
                <div className="flex h-11 w-11 items-center justify-center rounded-xl border border-white/10 bg-white/[0.04] text-white/70">
                  <stat.icon size={20} />
                </div>
                <div>
                  <p className="font-display text-2xl font-bold text-white">
                    {stat.value}
                  </p>
                  <p className="text-[10px] tracking-[0.2em] text-slate-500 uppercase">
                    {stat.label}
                  </p>
                </div>
              </motion.div>
            ))}
          </StaggerGroup>
        </div>
      </section>

      {/* Games Grid */}
      <section className="relative overflow-hidden border-t border-white/10 bg-[#050505] px-5 py-24 md:px-8 md:py-32">
        <div
          aria-hidden="true"
          className="pointer-events-none absolute -top-20 left-0 h-72 w-72 rounded-full bg-white/[0.04] blur-3xl"
        />

        <div className="relative mx-auto w-full max-w-5xl">
          <Reveal>
            <div className="flex items-center gap-3">
              <span className="h-px w-10 bg-gradient-to-r from-white/50 to-transparent" />
              <span className="text-[11px] font-semibold tracking-[0.35em] text-accent/80 uppercase">
                Pilih Game
              </span>
            </div>
          </Reveal>

          <Reveal delay={0.1}>
            <h2 className="mt-4 font-display text-3xl font-extrabold tracking-tight text-white sm:text-4xl">
              Mainkan Sekarang<span className="text-accent">.</span>
            </h2>
          </Reveal>

          <StaggerGroup className="mt-12 grid gap-6 md:grid-cols-2" stagger={0.12} delay={0.2}>
            {games.map((game) => (
              <GameCard key={game.path} game={game} />
            ))}
          </StaggerGroup>

          <Reveal delay={0.3} className="mt-14">
            <p className="text-center text-sm text-slate-500">
              Lebih banyak game seru sedang dalam pengembangan — stay tuned!{" "}
              <span className="inline-block">
                <Star size={12} className="inline text-amber-400" />
              </span>
            </p>
          </Reveal>
        </div>
      </section>
    </div>
  )
}
