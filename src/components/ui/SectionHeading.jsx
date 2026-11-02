import { motion, useReducedMotion } from "motion/react"
import { EASE } from "../../lib/animations"

export default function SectionHeading({
  index,
  eyebrow,
  title,
  description,
  className = "",
}) {
  const reduceMotion = useReducedMotion()
  const words = title.split(" ")

  return (
    <div className={className}>
      <motion.div
        initial={reduceMotion ? false : { opacity: 0, y: 14 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, amount: 0.6 }}
        transition={{ duration: 0.6, ease: EASE }}
        className="flex items-center gap-3"
      >
        {index && (
          <span className="font-display text-xs font-semibold tracking-[0.3em] text-white/40">
            {index}
          </span>
        )}
        <span className="h-px w-10 bg-gradient-to-r from-white/50 to-transparent" />
        <span className="text-[11px] font-semibold tracking-[0.35em] text-accent/80 uppercase">
          {eyebrow}
        </span>
      </motion.div>

      <h2 className="mt-5 font-display text-4xl font-bold tracking-tight text-white sm:text-5xl lg:text-6xl">
        {words.map((word, i) => (
          <span key={`${word}-${i}`} className="inline-block overflow-hidden pb-1 align-bottom">
            <motion.span
              className="inline-block"
              initial={reduceMotion ? false : { y: "115%" }}
              whileInView={{ y: "0%" }}
              viewport={{ once: true, amount: 0.4 }}
              transition={{ duration: 0.85, delay: i * 0.07, ease: EASE }}
            >
              {word}
              {i < words.length - 1 ? "\u00A0" : ""}
            </motion.span>
          </span>
        ))}
      </h2>

      {description && (
        <motion.p
          initial={reduceMotion ? false : { opacity: 0, y: 16 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, amount: 0.4 }}
          transition={{ duration: 0.7, delay: 0.25, ease: EASE }}
          className="mt-5 max-w-xl text-sm leading-8 text-slate-400 md:text-base"
        >
          {description}
        </motion.p>
      )}
    </div>
  )
}
