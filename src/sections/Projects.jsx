import { motion } from "motion/react"
import { ArrowUpRight } from "lucide-react"
import { profile } from "../data/profile"
import SectionHeading from "../components/ui/SectionHeading"
import { StaggerGroup } from "../components/ui/Reveal"
import { staggerItem } from "../lib/animations"

function handleSpotlight(event) {
  const rect = event.currentTarget.getBoundingClientRect()
  event.currentTarget.style.setProperty("--spot-x", `${event.clientX - rect.left}px`)
  event.currentTarget.style.setProperty("--spot-y", `${event.clientY - rect.top}px`)
}

export default function Projects() {
  return (
    <section
      id="projects"
      className="relative overflow-hidden border-t border-white/10 bg-[#050505] px-5 py-24 md:px-8 md:py-32"
    >
      <div
        aria-hidden="true"
        className="grid-pattern pointer-events-none absolute inset-0 opacity-30"
      />

      <div className="relative mx-auto w-full max-w-7xl">
        <div className="flex flex-wrap items-end justify-between gap-6">
          <SectionHeading
            index="03"
            eyebrow="Featured Projects"
            title="Things I have built."
            description="Kumpulan karya dari eksperimen AI, platform web, ERP, sampai aplikasi desktop."
          />
          <span className="hidden pb-2 font-display text-xs tracking-[0.3em] text-slate-500 uppercase md:block">
            {String(profile.projects.length).padStart(2, "0")} Projects
          </span>
        </div>

        <StaggerGroup className="mt-14 grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {profile.projects.map((project) => (
            <motion.article
              key={project.number}
              variants={staggerItem}
              whileHover={{ y: -6 }}
              transition={{ duration: 0.35 }}
              onMouseMove={handleSpotlight}
              className="spotlight-card group relative flex h-full min-h-[270px] flex-col overflow-hidden rounded-2xl border border-white/10 bg-white/[0.02] p-6 transition-colors duration-300 hover:border-white/25"
            >
              <span className="absolute inset-x-0 top-0 h-px origin-left scale-x-0 bg-gradient-to-r from-transparent via-white/60 to-transparent transition-transform duration-700 group-hover:scale-x-100" />

              <div className="flex items-start justify-between">
                <span className="font-display text-4xl font-extrabold text-white/10 transition-colors duration-300 group-hover:text-white/25">
                  {project.number}
                </span>
                <ArrowUpRight
                  size={20}
                  className="text-slate-600 transition-all duration-300 group-hover:-translate-y-1 group-hover:translate-x-1 group-hover:text-white"
                />
              </div>

              <h3 className="mt-8 font-display text-xl leading-snug font-semibold text-white">
                {project.title}
              </h3>

              <p className="mt-3 flex-1 text-sm leading-7 text-slate-400">
                {project.description}
              </p>

              <ul className="mt-6 flex flex-wrap gap-2">
                {project.tech.map((tech) => (
                  <li
                    key={tech}
                    className="rounded-full border border-white/10 bg-black/40 px-3 py-1 text-[11px] font-medium text-slate-300"
                  >
                    {tech}
                  </li>
                ))}
              </ul>
            </motion.article>
          ))}
        </StaggerGroup>
      </div>
    </section>
  )
}
