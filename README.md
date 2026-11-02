# Berkat Portfolio

> A cinematic developer portfolio and open-source starter for showcasing your work, skills, and story.

Built with React and Vite, this portfolio pairs a dark visual style with motion-driven sections and a scroll-synced cursor-drawing effect. Use it as a learning reference or adapt it into your own portfolio.

![React](https://img.shields.io/badge/React-19-149eca?logo=react&logoColor=white)
![Vite](https://img.shields.io/badge/Vite-8-646cff?logo=vite&logoColor=white)
![Tailwind CSS](https://img.shields.io/badge/Tailwind_CSS-4-06b6d4?logo=tailwindcss&logoColor=white)

## What’s inside

- **Cinematic landing page** with an animated logo, atmospheric visuals, and responsive navigation.
- **Scroll-synced cursor drawing** that traces page content and follows the visitor’s scroll progress.
- **Portfolio sections** for an introduction, profile, skills, featured projects, initiatives, and contact links.
- **Motion details** including reveal effects, a marquee, and animated interface elements.
- **Reduced-motion support** for visitors who prefer less animation.
- **Data-driven content** that can be personalized from one profile file.

## Preview

The app runs locally with Vite. Start it using the instructions below to explore the complete page and its animations.

## Get started

### Requirements

- Node.js
- npm

### Install and run

```bash
git clone https://github.com/berkatbt/mypro.git
cd mypro
npm install
npm run dev
```

Vite will print a local URL in the terminal. Open it in your browser.

### Available scripts

| Command | Purpose |
| --- | --- |
| `npm run dev` | Start the local development server |
| `npm run build` | Create a production build in `dist/` |
| `npm run preview` | Preview the production build locally |
| `npm run lint` | Check the source with Oxlint |

## Make it yours

1. Update the name, introduction, skills, projects, interests, and links in [`src/data/profile.js`](src/data/profile.js).
2. Replace or edit the visuals in `public/` and `src/assets/` with assets you have permission to use.
3. Adjust the page sections and navigation in `src/sections/` and `src/components/layout/`.
4. Customize colors, layout, and responsive styles in `src/App.css`, `src/index.css`, and `src/assets/styles/`.
5. Change the cursor-drawing behavior in [`src/lib/cursorDraw.js`](src/lib/cursorDraw.js) and its styles in `src/assets/styles/cursorDraw.css`.

## Project structure

```text
src/
├── components/       # Shared layout and UI components
├── data/             # Portfolio content
├── lib/              # Animation utilities
├── sections/         # Main page sections
├── assets/styles/    # Global and cursor-drawing styles
├── App.jsx           # Page composition and animation setup
└── main.jsx          # React entry point
public/               # Static images, video, icons, and logo
```

## Built with

- React 19
- Vite 8
- Tailwind CSS 4
- Motion
- Lucide React

## Contributing

Ideas, fixes, and improvements are welcome. Fork the repository, make a focused change, and open a pull request with a short explanation of what changed.

## License

No license file is currently included. Until a license is added, this repository is public for viewing, but reuse and redistribution are not automatically granted. Add a license that matches your intended permissions before presenting this project as a reusable template.

---

Made by [Berkat](https://github.com/berkatbt) · Build. Explore. Innovate.
