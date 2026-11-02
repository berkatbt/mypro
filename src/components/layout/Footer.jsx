import { Heart } from "lucide-react"
import Github from "../ui/GithubIcon"
import { profile } from "../../data/profile"

export default function Footer() {
  return (
    <footer className="border-t border-white/10 bg-[#050505] px-5 py-7">
      <div className="mx-auto flex max-w-7xl flex-col items-center justify-between gap-4 text-center sm:flex-row">
        <p className="text-sm text-slate-400">
          © {new Date().getFullYear()} {profile.firstName}. All rights reserved.
        </p>

        <div className="flex items-center gap-2 text-xs text-slate-500">
          Built with <Heart size={13} className="text-white" />
          React & Motion
        </div>

        <a
          href={profile.github}
          target="_blank"
          rel="noopener noreferrer"
          aria-label="GitHub"
          className="text-slate-400 hover:text-accent">
          <Github size={20} />
        </a>
      </div>
    </footer>
  )
}
