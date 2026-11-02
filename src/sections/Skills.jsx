import { motion } from "motion/react"
import { BrainCircuit, Database, MonitorSmartphone, Server, Wrench } from "lucide-react"
import { profile } from "../data/profile"
import SectionHeading from "../components/ui/SectionHeading"
import Marquee from "../components/ui/Marquee"
import { StaggerGroup } from "../components/ui/Reveal"
import { staggerItem } from "../lib/animations"

const iconMap = {
  frontend: MonitorSmartphone,
  backend: Server,
  database: Database,
  ai: BrainCircuit,
  tools: Wrench,
}

const allTech = [
  ...new Set(
    profile.skills.flatMap((group) =>
      group.items.map((item) => item.replace(" (Exploring)", ""))
    )
  ),
]

export default function Skills() {
  return (
    <section
      id="skills"
      className="relative overflow-hidden border-t border-white/10 bg-[#050505] px-5 py-24 md:px-8 md:py-32"
    >
      <div
        aria-hidden="true"
        className="pointer-events-none absolute top-1/3 -left-24 h-72 w-72 rounded-full bg-white/[0.04] blur-3xl"
      />

      <div className="relative mx-auto w-full max-w-7xl">
        <SectionHeading
          index="02"
          eyebrow="Technical Skills"
          title="The stack behind the work."
          description="Dari antarmuka hingga model bahasa — teknologi yang saya pakai untuk mengubah ide menjadi produk nyata."
        />
      </div>

      <StaggerGroup className="relative mx-auto mt-14 grid w-full max-w-7xl gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {profile.skills.map((group, index) => {
          const Icon = iconMap[group.key] ?? Wrench

          return (
            <motion.div
              key={group.key}
              variants={staggerItem}
              whileHover={{ y: -6 }}
              transition={{ duration: 0.35 }}
              className="group relative overflow-hidden rounded-2xl border border-white/10 bg-white/[0.02] p-6 transition-colors duration-300 hover:border-white/25 hover:bg-white/[0.04]"
            >
              <div className="flex items-start justify-between">
                <span className="flex h-11 w-11 items-center justify-center rounded-xl border border-white/10 bg-white/[0.04] text-white/80 transition-all duration-300 group-hover:border-white/30 group-hover:bg-white/[0.08] group-hover:text-white">
                  <Icon size={20} />
                </span>
                <span className="font-display text-xs font-semibold tracking-[0.3em] text-white/25">
                  0{index + 1}
                </span>
              </div>

              <h3 className="mt-6 font-display text-lg font-semibold text-white">
                {group.title}
              </h3>

              <ul className="mt-4 flex flex-wrap gap-2">
                {group.items.map((item) => (
                  <li
                    key={item}
                    className="rounded-md border border-white/10 bg-white/[0.03] px-2.5 py-1.5 text-xs text-slate-400 transition-colors duration-300 group-hover:border-white/15 group-hover:text-slate-300"
                  >
                    {item}
                  </li>
                ))}
              </ul>

              <span className="absolute inset-x-6 bottom-0 h-px origin-left scale-x-0 bg-gradient-to-r from-white/60 to-transparent transition-transform duration-500 group-hover:scale-x-100" />
            </motion.div>
          )
        })}
      </StaggerGroup>

      <div className="relative mt-16 left-1/2 w-screen -translate-x-1/2">
        <Marquee items={allTech} />
      </div>
    </section>
  )
}
