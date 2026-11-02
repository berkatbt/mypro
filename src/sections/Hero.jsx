
import { motion, useReducedMotion } from "motion/react"
import { ArrowRight, Code2, Mail, ChevronDown } from "lucide-react"
import Github from "../components/ui/GithubIcon"
import { profile } from "../data/profile"
import GlowButton from "../components/ui/GlowButton"

export default function Hero() {
    const reduceMotion = useReducedMotion()

    const reveal = (delay = 0) => ({
        initial: reduceMotion ? false : { opacity: 0, y: 28 },
        animate: { opacity: 1, y: 0 },
        transition: { duration: 0.75, delay, ease: "easeOut" },
    })

    const nameParts = profile.name ? profile.name.trim().split(/\s+/) : []
    const lastName = nameParts.length > 1 ? nameParts.pop() : ""
    const firstPart = nameParts.length > 0 ? nameParts.join(" ") : profile.name

    return (
        <>
        <section id="home" className="relative z-10 flex min-h-screen items-center justify-center overflow-hidden bg-[#000000] px-5 py-20">
            <video src="/Animasionlogo.mp4" autoPlay loop muted playsInline controlsList="nodownload noplaybackrate" disablePictureInPicture onContextMenu={(event) => event.preventDefault()} draggable="false" aria-label="Animasi logo Berkat" className="relative z-10 mx-auto max-h-[72vh] w-full max-w-3xl object-contain brightness-75" />
            <motion.a href="#intro" aria-label="Scroll untuk melihat profil" animate={reduceMotion ? {} : { y: [0, 7, 0] }} transition={{ duration: 1.8, repeat: Infinity }} className="absolute bottom-7 left-1/2 z-20 flex -translate-x-1/2 flex-col items-center gap-1 text-xs tracking-widest text-white/60 uppercase">
                Scroll Down <ChevronDown size={20} />
            </motion.a>
        </section>

        <section id="intro" className="relative flex min-h-screen items-center overflow-hidden bg-[#050505] pt-28 pb-20">
            <video src="/Animate_static_anime_image_9ac8a8cc.mp4" autoPlay loop muted playsInline controlsList="nodownload noplaybackrate" disablePictureInPicture onContextMenu={(event) => event.preventDefault()} draggable="false" aria-hidden="true" className="pointer-events-none absolute inset-0 z-0 h-full w-full object-cover object-center opacity-35" />
            <div aria-hidden="true" className="pointer-events-none absolute inset-0 z-0 bg-gradient-to-r from-[#050505] via-[#050505]/75 to-transparent" />
            <div className="grid-pattern pointer-events-none absolute inset-0 opacity-70" />
            <div className="relative z-10 mx-auto grid w-full max-w-7xl items-center gap-12 px-5 md:px-8 lg:grid-cols-[1.05fr_0.95fr]">
                <div className="relative z-20">
                    <motion.p
                        {...reveal(0.15)}
                        className="mb-5 font-display text-xl font-semibold text-accent md:text-2xl"
                    >
                        Hi, I'm
                    </motion.p>

                    <motion.h1
                        {...reveal(0.3)}
                        className="font-display text-5xl leading-[1.07] font-extrabold tracking-tight sm:text-6xl lg:text-7xl"
                    >
                        {firstPart}
                        {lastName && (
                            <span className="gradient-text mt-1 block">
                                {lastName}
                            </span>
                        )}
                    </motion.h1>

                    <motion.p
                        {...reveal(0.45)}
                        className="mt-5 text-base font-medium text-slate-200 md:text-lg"
                    >
                        {profile.roles.join(" | ")}
                    </motion.p>

                    <motion.p
                        {...reveal(0.55)}
                        className="mt-6 max-w-lg text-sm leading-8 text-slate-400 md:text-base"
                    >
                        {profile.description}
                    </motion.p>

                    <motion.div
                        {...reveal(0.7)}
                        className="mt-9 flex flex-wrap gap-4"
                    >
                        <GlowButton href="#projects">
                            <Code2 size={18} />
                            Lihat Project
                            <ArrowRight size={18} />
                        </GlowButton>

                        <GlowButton href="#contact" variant="outline">
                            <Mail size={18} />
                            Hubungi Saya
                        </GlowButton>
                    </motion.div>

                    <motion.div
                        {...reveal(0.85)}
                        className="mt-12 flex items-center gap-5"
                    >
                        <a
                            href={profile.github}
                            target="_blank"
                            rel="noopener noreferrer"
                            aria-label="GitHub Berkat"
                            className="text-slate-400 transition-colors hover:text-accent"
                        >
                            <Github size={22} />
                        </a>

                        <span className="h-5 w-px bg-white/30" />

                        <span className="text-xs tracking-widest text-slate-500 uppercase">
                            {profile.location}
                        </span>
                    </motion.div>
                </div>

                <div className="relative flex min-h-[350px] items-center justify-center sm:min-h-[470px] lg:min-h-[620px]">
                    <div className="glass absolute right-0 bottom-0 z-20 max-w-[230px] rounded-xl p-4">
                        <p className="text-xs leading-6 text-slate-300">
                            "{profile.quote}"
                        </p>
                        <p className="mt-3 text-xs font-semibold text-accent">
                            — {profile.verse}
                        </p>
                    </div>
                </div>
            </div>

            {/* <motion.a
                href="#about"
                aria-label="Scroll ke About"
                animate={reduceMotion ? {} : { y: [0, 7, 0] }}
                transition={{ duration: 1.8, repeat: Infinity }}
                className="absolute bottom-5 left-1/2 z-20 hidden -translate-x-1/2 flex-col items-center gap-1 text-xs text-slate-400 md:flex"
            >
                Scroll Down
                <ChevronDown size={20} className="text-accent" />
            </motion.a> */}
        </section>
        </>
    )
}
    