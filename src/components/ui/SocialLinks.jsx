import { Mail } from "lucide-react"
import { Linkedin, Instagram, Twitter } from "./BrandIcons"
import Github from "./GithubIcon"
import { profile } from "../../data/profile"

export default function SocialLinks({ className = "", size = 20, showLabels = false }) {
  const socials = [
    {
      name: "GitHub",
      url: profile.github,
      icon: Github,
      color: "hover:text-white",
    },
    {
      name: "LinkedIn",
      url: profile.linkedin,
      icon: Linkedin,
      color: "hover:text-[#0A66C2]",
    },
    {
      name: "Instagram",
      url: profile.instagram,
      icon: Instagram,
      color: "hover:text-[#E4405F]",
    },
    {
      name: "Email",
      url: `mailto:${profile.email}`,
      icon: Mail,
      color: "hover:text-accent",
    },
  ]

  // Filter yang ada URL-nya saja
  const availableSocials = socials.filter((social) => social.url && social.url !== "#")

  if (profile.twitter && profile.twitter !== "#") {
    availableSocials.splice(2, 0, {
      name: "Twitter",
      url: profile.twitter,
      icon: Twitter,
      color: "hover:text-[#1DA1F2]",
    })
  }

  return (
    <div className={`flex items-center gap-4 ${className}`}>
      {availableSocials.map((social) => {
        const Icon = social.icon

        return (
          <a
            key={social.name}
            href={social.url}
            target={social.name !== "Email" ? "_blank" : undefined}
            rel={social.name !== "Email" ? "noopener noreferrer" : undefined}
            aria-label={social.name}
            className={`group flex items-center gap-2 text-slate-400 transition-colors ${social.color}`}
          >
            <Icon size={size} />
            {showLabels && (
              <span className="text-sm font-medium opacity-0 transition-opacity group-hover:opacity-100">
                {social.name}
              </span>
            )}
          </a>
        )
      })}
    </div>
  )
}
