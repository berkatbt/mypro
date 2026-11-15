import { Heart } from "lucide-react"
import { profile } from "../../data/profile"
import SocialLinks from "../ui/SocialLinks"

const currentYear = new Date().getFullYear()

export default function Footer() {
  return (
    <footer className="border-t border-white/10 bg-[#050505] px-5 py-7">
      <div className="mx-auto flex max-w-7xl flex-col items-center justify-between gap-4 text-center sm:flex-row">
        <p className="text-sm text-slate-400">
          © {currentYear} {profile.firstName}. All rights reserved.
        </p>

        <div className="flex items-center gap-2 text-xs text-slate-500">
          Built with <Heart size={13} className="text-white" />
          React & Motion
        </div>

        <SocialLinks size={20} />
      </div>
    </footer>
  )
}
