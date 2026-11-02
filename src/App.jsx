import { useLayoutEffect } from "react"
import Navbar from "./components/layout/Navbar"
import Footer from "./components/layout/Footer"
import Hero from "./sections/Hero"
import About from "./sections/About"
import Skills from "./sections/Skills"
import Projects from "./sections/Projects"
import Initiatives from "./sections/Initiatives"
import Contact from "./sections/Contact"
import { initCursorDraw } from "./lib/cursorDraw"

export default function App() {
  // Animasi pena menggambar halaman (intro + mengikuti scroll dua arah)
  useLayoutEffect(() => initCursorDraw(), [])

  return (
    <div className="min-h-screen overflow-x-hidden bg-background text-text-main">
      <Navbar />

      <main>
        <Hero />
        <About />
        <Skills />
        <Projects />
        <Initiatives />
        <Contact />
      </main>

      <Footer />
    </div>
  )
}
