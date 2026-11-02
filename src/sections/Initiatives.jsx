import { motion, useReducedMotion } from "motion/react"
import { Sparkles } from "lucide-react"
import { profile } from "../data/profile"
import Marquee from "../components/ui/Marquee"
import { Reveal } from "../components/ui/Reveal"

export default function Initiatives() {
  const reduceMotion = useReducedMotion()
  const { initiative } = profile

  return (
    <section
      id="initiatives"
      className="relative overflow-hidden border-t border-white/10 bg-[#050505] px-5 py-24 md:px-8 md:py-32"
    >
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_center,rgba(255,255,255,0.06),transparent_60%)]"
      />

      <motion.div
        aria-hidden="true"
        animate={reduceMotion ? {} : { rotate: 360 }}
        transition={{ duration: 70, repeat: Infinity, ease: "linear" }}
        className="pointer-events-none absolute top-1/2 left-1/2 h-[300px] w-[300px] -translate-x-1/2 -translate-y-1/2 rounded-full border border-dashed border-white/10 sm:h-[440px] sm:w-[440px]"
      />
      <motion.div
        aria-hidden="true"
        animate={reduceMotion ? {} : { rotate: -360 }}
        transition={{ duration: 90, repeat: Infinity, ease: "linear" }}
        className="pointer-events-none absolute top-1/2 left-1/2 h-[420px] w-[420px] -translate-x-1/2 -translate-y-1/2 rounded-full border border-white/[0.06] sm:h-[620px] sm:w-[620px]"
      />

      <div className="relative mx-auto w-full max-w-4xl text-center">
        <Reveal>
          <span className="inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/[0.04] px-4 py-2 text-[10px] font-semibold tracking-[0.35em] text-slate-300 uppercase">
            <Sparkles size={13} /> 04 — Initiative
          </span>
        </Reveal>

        <Reveal delay={0.1}>
          <h2 className="mt-7 font-display text-5xl font-extrabold tracking-tight sm:text-6xl lg:text-7xl">
            <span className="gradient-text">{initiative.name}</span>
          </h2>
        </Reveal>

        <Reveal delay={0.2}>
          <p className="mx-auto mt-6 max-w-2xl text-sm leading-8 text-slate-400 md:text-base">
            {initiative.description}
          </p>
        </Reveal>

        <Reveal delay={0.3}>
          <p className="mt-10 font-display text-xl font-semibold text-white/90 sm:text-2xl md:text-3xl">
            &ldquo;{initiative.tagline}&rdquo;
          </p>
        </Reveal>
      </div>

      <div className="relative mt-16 left-1/2 w-screen -translate-x-1/2">
        <Marquee
          items={["Nova Studio", "We build the new", "We build the bright", "Build · Explore · Innovate"]}
        />
      </div>
    </section>
  )
}
