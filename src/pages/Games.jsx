import { motion } from "motion/react"
import { Gamepad2, Trophy, Star, Sparkles, ArrowLeft } from "lucide-react"
import { Link } from "react-router-dom"
import SectionHeading from "../components/ui/SectionHeading"
import { StaggerGroup, Reveal } from "../components/ui/Reveal"
import { staggerItem } from "../lib/animations"

const gameCategories = [
  {
    id: 1,
    title: "Puzzle Games",
    description: "Tantang logika dan strategi kamu dengan berbagai puzzle menarik",
    icon: "🧩",
    comingSoon: true,
    games: [],
  },
  {
    id: 2,
    title: "Action Games",
    description: "Rasakan sensasi permainan yang menguji refleks dan ketangkasan",
    icon: "⚡",
    comingSoon: true,
    games: [],
  },
  {
    id: 3,
    title: "Brain Teasers",
    description: "Asah otak dengan teka-teki yang menantang kemampuan berpikir",
    icon: "🧠",
    comingSoon: true,
    games: [],
  },
  {
    id: 4,
    title: "Arcade Classics",
    description: "Nostalgia dengan game arcade klasik yang tak lekang waktu",
    icon: "🕹️",
    comingSoon: true,
    games: [],
  },
]

const stats = [
  { icon: Gamepad2, value: "04", label: "Categories" },
  { icon: Trophy, value: "00", label: "Games" },
  { icon: Star, value: "∞", label: "Fun Level" },
]

function GameCard({ category }) {
  return (
    <motion.div
      variants={staggerItem}
      whileHover={{ y: -6 }}
      transition={{ duration: 0.35 }}
      className="group relative flex h-full min-h-[280px] flex-col overflow-hidden rounded-2xl border border-white/10 bg-white/[0.02] p-7 transition-colors duration-300 hover:border-white/25 hover:bg-white/[0.04]"
    >
      <span className="absolute inset-x-0 top-0 h-px origin-left scale-x-0 bg-gradient-to-r from-transparent via-white/60 to-transparent transition-transform duration-700 group-hover:scale-x-100" />

      <div className="flex items-start justify-between">
        <span className="text-5xl transition-transform duration-300 group-hover:scale-110">
          {category.icon}
        </span>
        <span className="font-display text-xs font-semibold tracking-[0.3em] text-white/25">
          0{category.id}
        </span>
      </div>

      <h3 className="mt-8 font-display text-xl leading-snug font-semibold text-white">
        {category.title}
      </h3>

      <p className="mt-3 flex-1 text-sm leading-7 text-slate-400">
        {category.description}
      </p>

      {category.comingSoon && (
        <div className="mt-6 inline-flex items-center gap-2 rounded-full border border-amber-500/30 bg-amber-500/10 px-4 py-2 text-xs font-semibold text-amber-300">
          <Sparkles size={14} />
          Coming Soon
        </div>
      )}

      {!category.comingSoon && category.games.length > 0 && (
        <div className="mt-6 flex items-center justify-between">
          <span className="text-xs text-slate-400">
            {category.games.length} game{category.games.length > 1 ? "s" : ""} available
          </span>
          <span className="text-sm text-accent transition-transform duration-300 group-hover:translate-x-1">
            →
          </span>
        </div>
      )}
    </motion.div>
  )
}

export default function Games() {
  return (
    <div className="min-h-screen overflow-x-hidden bg-background text-text-main">
      {/* Hero Section */}
      <section className="relative overflow-hidden bg-[#050505] px-5 pt-32 pb-20 md:px-8 md:pt-40 md:pb-24">
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
              kemampuan web development. semua berjalan 
              di browser kamu.
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

      {/* Game Categories */}
      <section className="relative overflow-hidden border-t border-white/10 bg-[#050505] px-5 py-24 md:px-8 md:py-32">
        <div
          aria-hidden="true"
          className="pointer-events-none absolute -top-20 left-0 h-72 w-72 rounded-full bg-white/[0.04] blur-3xl"
        />

        <div className="relative mx-auto w-full max-w-7xl">
          <SectionHeading
            index="01"
            eyebrow="Game Categories"
            title="Choose your adventure."
            description="Pilih kategori game yang kamu suka dan mulai bermain!"
          />

          <StaggerGroup className="mt-14 grid gap-5 md:grid-cols-2 lg:grid-cols-4">
            {gameCategories.map((category) => (
              <GameCard key={category.id} category={category} />
            ))}
          </StaggerGroup>

          {/* Coming Soon Notice */}
          <Reveal delay={0.2} className="mt-16">
            <div className="glass mx-auto max-w-2xl rounded-2xl p-8 text-center">
              <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full border border-white/10 bg-white/[0.04]">
                <Sparkles size={28} className="text-accent" />
              </div>
              <h3 className="font-display text-2xl font-bold text-white">
                Sedang Dalam Pengembangan
              </h3>
              <p className="mt-3 text-sm leading-7 text-slate-400">
                Game-game seru sedang dalam tahap pembuatan. Stay tuned untuk update selanjutnya! 
                Sementara itu, kamu bisa eksplorasi proyek-proyek lain di halaman utama.
              </p>
              <Link
                to="/"
                className="mt-6 inline-flex items-center gap-2 rounded-xl border border-white/30 bg-white/[0.04] px-6 py-3 text-sm font-semibold text-white transition-all hover:border-white/60 hover:bg-white/10"
              >
                <ArrowLeft size={16} />
                Kembali ke Portfolio
              </Link>
            </div>
          </Reveal>
        </div>
      </section>
    </div>
  )
}
