import { useEffect } from "react"
import { BrowserRouter, Routes, Route, useLocation } from "react-router-dom"
import Navbar from "./components/layout/Navbar"
import Footer from "./components/layout/Footer"
import Home from "./pages/Home"
import Games from "./pages/Games"
import BlockBlast from "./pages/games/BlockBlast"

function ScrollToTop() {
  const { pathname } = useLocation()

  useEffect(() => {
    window.scrollTo(0, 0)
  }, [pathname])

  return null
}

function App() {
  // Console Easter Egg
  useEffect(() => {
    const styles = [
      "color: #ffffff",
      "background: linear-gradient(90deg, #050505, #1a1a1a)",
      "font-size: 14px",
      "padding: 12px 20px",
      "border: 2px solid #ffffff",
      "border-radius: 8px",
      "font-weight: bold",
    ].join(";")

    const message = `
╔═══════════════════════════════════════════════════╗
║                                                   ║
║   👋 Hey there, curious developer!               ║
║                                                   ║
║   Thanks for checking out my portfolio's code!   ║
║   I see you're a person of culture 🧐           ║
║                                                   ║
║   ⚡ Built with: React 19 + Vite 8 + Tailwind 4  ║
║   ✨ Special feature: Cursor Drawing Animation   ║
║   🎨 Design: Custom dark theme with glassmorphism║
║                                                   ║
║   Interested in collaboration or just want to    ║
║   chat about tech? Let's connect!                ║
║                                                   ║
║   🔗 GitHub: github.com/berkatbt                  ║
║   📧 Email: berkat@example.com                    ║
║                                                   ║
║   "Build. Explore. Innovate." 🚀                 ║
║                                                   ║
╚═══════════════════════════════════════════════════╝
    `

    console.log("%c" + message, styles)

    // Bonus: Konami code easter egg
    let konamiCode = []
    const konamiSequence = [
      "ArrowUp",
      "ArrowUp",
      "ArrowDown",
      "ArrowDown",
      "ArrowLeft",
      "ArrowRight",
      "ArrowLeft",
      "ArrowRight",
      "b",
      "a",
    ]

    const handleKonami = (e) => {
      konamiCode.push(e.key)
      konamiCode = konamiCode.slice(-10)

      if (konamiCode.join(",") === konamiSequence.join(",")) {
        console.log(
          "%c🎮 KONAMI CODE ACTIVATED! 🎮",
          "color: #00ff00; font-size: 24px; font-weight: bold; text-shadow: 2px 2px 4px #000;"
        )
        console.log(
          "%cYou found the secret! Here's a virtual high-five ✋",
          "color: #ffffff; font-size: 16px;"
        )
        
        // Trigger special animation
        document.body.style.animation = "rainbow 2s linear"
        setTimeout(() => {
          document.body.style.animation = ""
        }, 2000)
      }
    }

    window.addEventListener("keydown", handleKonami)

    return () => {
      window.removeEventListener("keydown", handleKonami)
    }
  }, [])

  return (
    <BrowserRouter>
      <ScrollToTop />
      <div className="min-h-screen overflow-x-hidden bg-background text-text-main">
        <Navbar />

        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/games" element={<Games />} />
          <Route path="/games/block-blast" element={<BlockBlast />} />
        </Routes>

        <Footer />
      </div>
    </BrowserRouter>
  )
}

export default App
