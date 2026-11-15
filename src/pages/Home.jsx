import { useLayoutEffect } from "react"
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
