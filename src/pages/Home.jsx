import { useLayoutEffect, useEffect } from "react"
import { useLocation } from "react-router-dom"
import Hero from "../sections/Hero"
import About from "../sections/About"
import Skills from "../sections/Skills"
import Projects from "../sections/Projects"
import Initiatives from "../sections/Initiatives"
import Contact from "../sections/Contact"
import { initCursorDraw } from "../lib/cursorDraw"

export default function Home() {
  // Animasi pena menggambar halaman (intro + mengikuti scroll dua arah)
  useLayoutEffect(() => initCursorDraw(), [])

  const { hash } = useLocation()

  useEffect(() => {
    if (!hash) return
    document.getElementById(hash.slice(1))?.scrollIntoView({ behavior: "smooth" })
  }, [hash])

  return (
    <main>
      <Hero />
      <About />
      <Skills />
      <Projects />
      <Initiatives />
      <Contact />
    </main>
  )
}
