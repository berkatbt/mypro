# Template untuk Menambah Game Baru

## Struktur Folder
```
src/pages/games/
  ├── GAME_TEMPLATE.md       (ini)
  ├── PuzzleGame.jsx         (contoh: game puzzle)
  ├── ArcadeGame.jsx         (contoh: game arcade)
  └── ...
```

## Langkah-langkah Menambah Game

### 1. Buat file game baru
Contoh: `src/pages/games/MemoryGame.jsx`

```jsx
import { useState } from "react"
import { motion } from "motion/react"
import { ArrowLeft, RotateCcw, Trophy } from "lucide-react"
import { Link } from "react-router-dom"

export default function MemoryGame() {
  const [score, setScore] = useState(0)
  const [gameState, setGameState] = useState("idle") // idle, playing, won

  return (
    <div className="min-h-screen bg-[#050505] px-5 py-24 md:px-8">
      {/* Header */}
      <div className="mx-auto max-w-4xl">
        <Link
          to="/games"
          className="inline-flex items-center gap-2 text-sm text-slate-400 transition-colors hover:text-accent"
        >
          <ArrowLeft size={16} />
          Kembali ke Games
        </Link>

        <h1 className="mt-6 font-display text-4xl font-bold text-white">
          Memory Game 🧠
        </h1>
        <p className="mt-3 text-sm text-slate-400">
          Cocokkan semua kartu untuk menang!
        </p>

        {/* Score */}
        <div className="mt-6 flex items-center gap-4">
          <div className="glass rounded-lg px-4 py-2">
            <span className="text-xs text-slate-500">Score: </span>
            <span className="font-bold text-white">{score}</span>
          </div>
          <button
            onClick={() => {
              setScore(0)
              setGameState("idle")
            }}
            className="flex items-center gap-2 rounded-lg border border-white/20 bg-white/5 px-4 py-2 text-sm text-white transition-colors hover:bg-white/10"
          >
            <RotateCcw size={16} />
            Reset
          </button>
        </div>
      </div>

      {/* Game Canvas */}
      <div className="mx-auto mt-10 max-w-4xl">
        <div className="glass min-h-[500px] rounded-2xl p-8">
          <p className="text-center text-slate-400">
            Game logic goes here...
          </p>
        </div>
      </div>
    </div>
  )
}
```

### 2. Update `src/pages/Games.jsx`

Tambahkan game ke array `gameCategories`:

```js
const gameCategories = [
  {
    id: 1,
    title: "Puzzle Games",
    description: "Tantang logika dan strategi kamu dengan berbagai puzzle menarik",
    icon: "🧩",
    comingSoon: false,  // ← ubah jadi false
    games: [
      { name: "Memory Game", path: "/games/memory" }  // ← tambahkan games
    ],
  },
  // ...
]
```

### 3. Update router di `src/App.jsx`

Import game baru dan tambahkan route:

```jsx
import MemoryGame from "./pages/games/MemoryGame"

// Di dalam <Routes>:
<Route path="/games/memory" element={<MemoryGame />} />
```

### 4. Update `Games.jsx` untuk clickable cards

Ubah `GameCard` component:

```jsx
function GameCard({ category }) {
  return (
    <motion.div
      variants={staggerItem}
      whileHover={{ y: -6 }}
      className="group relative..."
    >
      {/* ... existing content ... */}

      {!category.comingSoon && category.games.length > 0 && (
        <div className="mt-6">
          {category.games.map((game) => (
            <Link
              key={game.path}
              to={game.path}
              className="block rounded-lg border border-white/10 bg-white/5 px-4 py-2 text-sm text-white transition-all hover:border-accent hover:bg-white/10"
            >
              {game.name} →
            </Link>
          ))}
        </div>
      )}
    </motion.div>
  )
}
```

---

## Contoh Game Sederhana

### Simple Clicker Game

```jsx
import { useState } from "react"
import { motion } from "motion/react"

export default function ClickerGame() {
  const [clicks, setClicks] = useState(0)

  return (
    <div className="flex min-h-screen items-center justify-center bg-[#050505]">
      <div className="text-center">
        <h1 className="mb-8 font-display text-4xl font-bold text-white">
          Click Counter
        </h1>
        <p className="mb-12 text-6xl font-bold text-accent">{clicks}</p>
        <motion.button
          whileTap={{ scale: 0.9 }}
          onClick={() => setClicks(clicks + 1)}
          className="rounded-2xl bg-gradient-to-r from-white to-zinc-300 px-12 py-6 text-xl font-bold text-black shadow-2xl"
        >
          Click Me!
        </motion.button>
      </div>
    </div>
  )
}
```

---

## Library Game yang Bisa Dipakai

1. **Phaser 3** - Full game engine (sudah pernah kamu pakai)
   ```bash
   npm install phaser
   ```

2. **React Spring** - Physics-based animation
   ```bash
   npm install @react-spring/web
   ```

3. **use-sound** - Sound effects
   ```bash
   npm install use-sound
   ```

4. **Canvas API** - Native HTML5 (no install needed)

---

## Tips

- **State Management**: Untuk game kompleks, pakai Zustand atau Context
- **Performance**: Game loop pakai `requestAnimationFrame`, bukan `setInterval`
- **Mobile**: Test touch events, bukan hanya mouse
- **Styling**: Reuse komponen UI dari portfolio (GlowButton, glass, dll)

---

Selamat berkreasi! 🎮
