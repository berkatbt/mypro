import { useEffect, useState } from "react"
import { motion, AnimatePresence, useScroll, useSpring } from "motion/react"
import { Menu, X, Gamepad2 } from "lucide-react"
import { Link, useLocation } from "react-router-dom"

const links = [
  { label: "Home", href: "#home", route: "/" },
  { label: "About", href: "#about", route: "/" },
  { label: "Skills", href: "#skills", route: "/" },
  { label: "Projects", href: "#projects", route: "/" },
  { label: "Games", href: "/games", route: "/games", isRoute: true },
  { label: "Contact", href: "#contact", route: "/" },
]

export default function Navbar() {
  const [scrolled, setScrolled] = useState(false)
  const [open, setOpen] = useState(false)
  const location = useLocation()
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

  const isActive = (link) => {
    if (link.isRoute) {
      return location.pathname === link.route
    }
    return location.pathname === "/"
  }

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
        <Link to="/" className="flex items-center gap-3">
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
        </Link>

        <div className="hidden items-center gap-9 md:flex">
          {links.map((link) => {
            const active = isActive(link)
            
            if (link.isRoute) {
              return (
                <Link
                  key={link.href}
                  to={link.href}
                  className={`flex items-center gap-1.5 text-sm font-medium transition-colors ${
                    active ? "text-accent" : "text-slate-300 hover:text-accent"
                  }`}
                >
                  {link.label === "Games" && <Gamepad2 size={16} />}
                  {link.label}
                </Link>
              )
            }
            
            return (
              <a
                key={link.href}
                href={link.href}
                className={`text-sm font-medium transition-colors ${
                  active ? "text-slate-300 hover:text-accent" : "text-slate-300 hover:text-accent"
                }`}
              >
                {link.label}
              </a>
            )
          })}
        </div>

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
              {links.map((link) => {
                const active = isActive(link)
                
                if (link.isRoute) {
                  return (
                    <Link
                      key={link.href}
                      to={link.href}
                      onClick={() => setOpen(false)}
                      className={`flex items-center gap-2 rounded-lg px-3 py-3 text-sm hover:bg-white/10 ${
                        active ? "text-accent" : "text-slate-200"
                      }`}
                    >
                      {link.label === "Games" && <Gamepad2 size={16} />}
                      {link.label}
                    </Link>
                  )
                }
                
                return (
                  <a
                    key={link.href}
                    href={link.href}
                    onClick={() => setOpen(false)}
                    className="rounded-lg px-3 py-3 text-sm text-slate-200 hover:bg-white/10"
                  >
                    {link.label}
                  </a>
                )
              })}
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
