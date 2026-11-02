import { useEffect, useState } from "react"
import { motion, AnimatePresence, useScroll, useSpring } from "motion/react"
import { Menu, X, Download } from "lucide-react"

const links = [
  { label: "Home", href: "#home" },
  { label: "About", href: "#about" },
  { label: "Skills", href: "#skills" },
  { label: "Projects", href: "#projects" },
  { label: "Contact", href: "#contact" },
]

export default function Navbar() {
  const [scrolled, setScrolled] = useState(false)
  const [open, setOpen] = useState(false)
  const { scrollYProgress } = useScroll()
  const progress = useSpring(scrollYProgress, {
    stiffness: 140,
    damping: 30,
    restDelta: 0.001,
  })

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 30)
    onScroll()
    window.addEventListener("scroll", onScroll, { passive: true })
    return () => window.removeEventListener("scroll", onScroll)
  }, [])

  return (
    <motion.header
      initial={{ y: -70, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ duration: 0.65 }}
      className={`fixed inset-x-0 top-0 z-50 transition-all duration-300 ${
        scrolled ? "glass shadow-lg shadow-black/20" : "bg-transparent"
      }`}
    >
      <nav className="mx-auto flex h-20 max-w-7xl items-center justify-between px-5 md:px-8">
        <a href="#home" className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-lg border border-white/15 bg-white/5 shadow-[0_0_18px_rgba(255,255,255,0.08)]">
            <img
              src="/logo.png"
              alt="Berkat logo"
              className="h-9 w-9 object-contain"
              onError={(event) => {
                event.currentTarget.style.display = "none"
                event.currentTarget.parentElement.textContent = "B"
              }}/>
          </div>
          <span className="font-display text-xl font-bold text-white">
            Berkat<span className="text-accent">.</span>
          </span>
        </a>

        <div className="hidden items-center gap-9 md:flex">
          {links.map((link) => (
            <a
              key={link.href}
              href={link.href}
              className="text-sm font-medium text-slate-300 transition-colors hover:text-accent">
              {link.label}
            </a>
          ))}
        </div>

        <a
          href="/cv.pdf"
          download
          className="hidden items-center gap-2 rounded-lg border border-white/30 px-4 py-2.5 text-sm text-white transition-all hover:border-white/60 hover:bg-white/10 hover:shadow-[0_0_20px_rgba(255,255,255,0.12)] lg:flex"
        >
          <Download size={17} />
          Download CV
        </a>

        <button
          type="button"
          aria-label={open ? "Tutup menu" : "Buka menu"}
          aria-expanded={open}
          onClick={() => setOpen(!open)}
          className="rounded-lg p-2 text-white md:hidden"
        >
          {open ? <X /> : <Menu />}
        </button>
      </nav>

      <motion.span
        aria-hidden="true"
        style={{ scaleX: progress }}
        className="absolute bottom-0 left-0 h-px w-full origin-left bg-gradient-to-r from-white/20 via-white/70 to-white/20"
      />

      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            className="glass overflow-hidden md:hidden"
          >
            <div className="flex flex-col gap-1 px-5 py-4">
              {links.map((link) => (
                <a
                  key={link.href}
                  href={link.href}
                  onClick={() => setOpen(false)}
                  className="rounded-lg px-3 py-3 text-sm text-slate-200 hover:bg-white/10"
                >
                  {link.label}
                </a>
              ))}
              <a href="/cv.pdf" download className="px-3 py-3 text-sm text-accent">
                Download CV
              </a>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.header>
  )
}
