export default function Marquee({ items, className = "" }) {
  const row = [...items, ...items]

  return (
    <div className={`marquee ${className}`} aria-hidden="true">
      <div className="marquee-track">
        {row.map((item, index) => (
          <span
            key={`${item}-${index}`}
            className="flex shrink-0 items-center font-display text-sm font-medium tracking-[0.28em] whitespace-nowrap text-slate-500 uppercase md:text-base"
          >
            {item}
            <span className="mx-5 text-white/20 md:mx-8">✦</span>
          </span>
        ))}
      </div>
    </div>
  )
}
