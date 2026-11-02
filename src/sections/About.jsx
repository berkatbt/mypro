import { motion } from "motion/react"
import { ArrowUpRight, GraduationCap, MapPin, Sparkles } from "lucide-react"
import { profile } from "../data/profile"
import SectionHeading from "../components/ui/SectionHeading"
import { Reveal, StaggerGroup } from "../components/ui/Reveal"
import { staggerItem } from "../lib/animations"
import Github from "../components/ui/GithubIcon"

const stats = [
  { value: String(profile.projects.length).padStart(2, "0"), label: "Projects" },
  { value: String(profile.skills.length).padStart(2, "0"), label: "Skill Areas" },
  { value: String(profile.interests.length).padStart(2, "0"), label: "Interests" },
]

export default function About() {
  return (
    <section
      id="about"
      className="relative overflow-hidden border-t border-white/10 bg-[#050505] px-5 py-24 md:px-8 md:py-32"
    >
      <div aria-hidden="true" className="grid-pattern pointer-events-none absolute inset-0 opacity-40" />
      <div
        aria-hidden="true"
        className="pointer-events-none absolute -top-20 right-0 h-72 w-72 rounded-full bg-white/[0.05] blur-3xl"
      />

      <div className="relative mx-auto grid w-full max-w-7xl gap-16 lg:grid-cols-[1.05fr_0.95fr] lg:gap-20">
        <div>
          <SectionHeading
            index="01"
            eyebrow="About Me"
            title="Meaningful code for real problems."
          />

          <div className="mt-9 space-y-5">
            {profile.about.map((paragraph, index) => (
              <Reveal key={index} delay={0.12 + index * 0.1}>
                <p className="max-w-xl text-sm leading-8 text-slate-400 md:text-base">
                  {paragraph}
                </p>
              </Reveal>
            ))}
          </div>

          <Reveal delay={0.42} className="mt-10">
            <p className="mb-4 text-[11px] font-semibold tracking-[0.35em] text-slate-500 uppercase">
              Interests
            </p>
            <div className="flex flex-wrap gap-2">
              {profile.interests.map((interest) => (
                <span
                  key={interest}
                  className="rounded-full border border-white/10 bg-white/[0.03] px-4 py-2 text-xs text-slate-300 transition-colors duration-300 hover:border-white/30 hover:text-white"
                >
                  {interest}
                </span>
              ))}
            </div>
          </Reveal>
        </div>

        <StaggerGroup className="flex flex-col gap-5 lg:pt-24" stagger={0.12}>
          <motion.div variants={staggerItem} className="glass rounded-2xl p-6 md:p-7">
            <div className="grid grid-cols-3 gap-4 border-b border-white/10 pb-6">
              {stats.map((stat) => (
                <div key={stat.label}>
                  <p className="font-display text-2xl font-bold text-white md:text-3xl">
                    {stat.value}
                  </p>
                  <p className="mt-1 text-[10px] font-medium tracking-[0.2em] text-slate-500 uppercase">
                    {stat.label}
                  </p>
                </div>
              ))}
            </div>

            <dl className="mt-6 space-y-5">
              <div className="flex items-start gap-3">
                <MapPin size={16} className="mt-0.5 shrink-0 text-slate-400" />
                <div>
                  <dt className="text-[10px] tracking-[0.2em] text-slate-500 uppercase">
                    Location
                  </dt>
                  <dd className="mt-1 text-sm text-slate-300">{profile.location}</dd>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <GraduationCap size={16} className="mt-0.5 shrink-0 text-slate-400" />
                <div>
                  <dt className="text-[10px] tracking-[0.2em] text-slate-500 uppercase">
                    Education
                  </dt>
                  <dd className="mt-1 text-sm text-slate-300">{profile.education}</dd>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <Github size={16} className="mt-0.5 shrink-0 text-slate-400" />
                <div>
                  <dt className="text-[10px] tracking-[0.2em] text-slate-500 uppercase">
                    GitHub
                  </dt>
                  <dd className="mt-1">
                    <a
                      href={profile.github}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1 text-sm text-slate-300 transition-colors hover:text-white"
                    >
                      berkatbt <ArrowUpRight size={13} />
                    </a>
                  </dd>
                </div>
              </div>
            </dl>
          </motion.div>

          <motion.div
            variants={staggerItem}
            className="relative overflow-hidden rounded-2xl border border-white/10 bg-gradient-to-br from-white/[0.07] via-white/[0.02] to-transparent p-6 md:p-7"
          >
            <div className="flex items-center gap-2 text-[10px] font-semibold tracking-[0.3em] text-slate-400 uppercase">
              <Sparkles size={13} /> Personal Vision
            </div>
            <p className="mt-4 text-sm leading-8 text-slate-300">{profile.vision}</p>
          </motion.div>
        </StaggerGroup>
      </div>
    </section>
  )
}
