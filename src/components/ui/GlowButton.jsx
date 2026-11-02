import { motion } from "motion/react"

export default function GlowButton({
  children,
  href,
  variant = "primary",
  className = "",
  onClick,
  ...props
}) {
  const isOutline = variant === "outline"

  const baseStyles =
    "inline-flex items-center justify-center gap-2 rounded-xl px-6 py-3.5 text-sm font-semibold transition-all duration-300 cursor-pointer select-none"

  const variantStyles = isOutline
    ? "border border-white/30 bg-white/[0.04] text-slate-200 hover:bg-white/10 hover:border-white/60 hover:text-white backdrop-blur-sm shadow-[0_0_18px_rgba(255,255,255,0.08)]"
    : "bg-gradient-to-r from-white to-zinc-300 text-black shadow-[0_0_25px_rgba(255,255,255,0.25)] hover:shadow-[0_0_38px_rgba(255,255,255,0.5)] hover:brightness-110"

  const combinedClassName = `${baseStyles} ${variantStyles} ${className}`

  if (href) {
    return (
      <motion.a
        href={href}
        whileHover={{ scale: 1.03 }}
        whileTap={{ scale: 0.97 }}
        className={combinedClassName}
        {...props}
      >
        {children}
      </motion.a>
    )
  }

  return (
    <motion.button
      type="button"
      onClick={onClick}
      whileHover={{ scale: 1.03 }}
      whileTap={{ scale: 0.97 }}
      className={combinedClassName}
      {...props}
    >
      {children}
    </motion.button>
  )
}
