import { useRef } from "react"
import { motion, useReducedMotion, useScroll, useTransform } from "motion/react"
import { MapPin } from "lucide-react"
import { profile } from "../data/profile"
import GlowButton from "../components/ui/GlowButton"
import Github from "../components/ui/GithubIcon"
import SectionHeading from "../components/ui/SectionHeading"
import { Reveal } from "../components/ui/Reveal"

export default function Contact() {
  const reduceMotion = useReducedMotion()
  const sectionRef = useRef(null)
  const { scrollYProgress } = useScroll({
    target: sectionRef,
    offset: ["start end", "end start"],
  })
  const backgroundY = useTransform(scrollYProgress, [0, 1], ["-12%", "12%"])

  return (
    <section
      ref={sectionRef}
      id="contact"
      className="relative overflow-hidden border-t border-white/10 bg-[#050505] px-5 py-24 md:px-8 md:py-32"
    >
      <motion.p
        aria-hidden="true"
        style={reduceMotion ? undefined : { y: backgroundY }}
        className="pointer-events-none absolute inset-x-0 top-6 text-center font-display text-[22vw] leading-none font-extrabold tracking-tight text-white/[0.03] select-none"
      >
        BUILD
      </motion.p>

      <div
        aria-hidden="true"
        className="pointer-events-none absolute -bottom-24 left-1/2 h-80 w-[36rem] -translate-x-1/2 rounded-full bg-white/[0.05] blur-3xl"
      />

      <div className="relative mx-auto grid w-full max-w-7xl gap-14 lg:grid-cols-[1fr_0.85fr] lg:gap-20">
        <div>
          <SectionHeading
            index="05"
            eyebrow="Get In Touch"
            title="Let's build something."
            description="Punya ide, proyek, atau ketertarikan yang sama? Saya terbuka untuk kolaborasi, belajar bersama, dan membangun sesuatu yang bermakna."
          />

          <Reveal delay={0.2} className="mt-9">
            <div className="flex flex-wrap items-center gap-4">
              <GlowButton
                href={profile.github}
                target="_blank"
                rel="noopener noreferrer"
              >
                <Github size={18} />
                Kunjungi GitHub
              </GlowButton>

              <span className="inline-flex items-center gap-2 text-xs tracking-[0.2em] text-slate-400 uppercase">
                <MapPin size={14} /> {profile.location}
              </span>
            </div>
          </Reveal>

          <Reveal delay={0.32} className="mt-12">
            <p className="font-display text-3xl font-extrabold tracking-tight sm:text-4xl">
              <span className="gradient-text">{profile.tagline}</span>
            </p>
            <p className="mt-3 text-sm text-slate-500 italic">{profile.taglineSub}</p>
          </Reveal>
        </div>

        <Reveal delay={0.18} className="lg:pt-24">
          <div className="glass relative overflow-hidden rounded-2xl p-7">
            <div
              aria-hidden="true"
              className="pointer-events-none absolute -top-16 -right-16 h-40 w-40 rounded-full bg-white/[0.06] blur-2xl"
            />

            <p className="text-[10px] font-semibold tracking-[0.35em] text-slate-500 uppercase">
              Personal Vision
            </p>
            <p className="mt-4 text-sm leading-8 text-slate-300">{profile.vision}</p>

            <div className="mt-7 border-t border-white/10 pt-6">
              <p className="text-[10px] font-semibold tracking-[0.35em] text-slate-500 uppercase">
                A Note To Myself
              </p>
              <p className="mt-3 text-sm leading-7 text-slate-400">
                &ldquo;{profile.quote}&rdquo;
              </p>
              <p className="mt-3 text-xs font-semibold text-accent">— {profile.verse}</p>
            </div>

            <a
              href={profile.github}
              target="_blank"
              rel="noopener noreferrer"
              className="mt-7 flex items-center gap-3 rounded-xl border border-white/10 bg-white/[0.03] px-4 py-3 text-sm text-slate-300 transition-all duration-300 hover:border-white/30 hover:bg-white/[0.06] hover:text-white"
            >
              <Github size={18} />
              {profile.github.replace("https://", "")}
            </a>
          </div>
        </Reveal>
      </div>
    </section>
  )
}
