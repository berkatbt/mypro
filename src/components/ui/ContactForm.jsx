import { useState } from "react"
import { motion } from "motion/react"
import { Send, CheckCircle, AlertCircle, Loader2 } from "lucide-react"

export default function ContactForm() {
  const [formState, setFormState] = useState({
    name: "",
    email: "",
    message: "",
  })
  const [status, setStatus] = useState("idle") // idle, loading, success, error

  const handleSubmit = async (e) => {
    e.preventDefault()
    setStatus("loading")

    try {
      // TODO: Replace 'YOUR_FORM_ID' with actual Formspree form ID
      // Get it from https://formspree.io after creating a form
      const response = await fetch("https://formspree.io/f/YOUR_FORM_ID", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(formState),
      })

      if (response.ok) {
        setStatus("success")
        setFormState({ name: "", email: "", message: "" })
        setTimeout(() => setStatus("idle"), 5000)
      } else {
        setStatus("error")
        setTimeout(() => setStatus("idle"), 5000)
      }
    } catch {
      setStatus("error")
      setTimeout(() => setStatus("idle"), 5000)
    }
  }

  const handleChange = (e) => {
    setFormState({
      ...formState,
      [e.target.name]: e.target.value,
    })
  }

  return (
    <motion.form
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ duration: 0.6, delay: 0.2 }}
      onSubmit={handleSubmit}
      className="glass space-y-5 rounded-2xl p-6 md:p-7"
    >
      <div>
        <label
          htmlFor="name"
          className="mb-2 block text-xs font-semibold tracking-[0.2em] text-slate-400 uppercase"
        >
          Nama
        </label>
        <input
          type="text"
          id="name"
          name="name"
          value={formState.name}
          onChange={handleChange}
          required
          disabled={status === "loading"}
          className="w-full rounded-lg border border-white/10 bg-white/[0.02] px-4 py-3 text-sm text-white placeholder-slate-500 transition-colors focus:border-accent focus:outline-none focus:ring-1 focus:ring-accent disabled:cursor-not-allowed disabled:opacity-50"
          placeholder="Nama kamu"
        />
      </div>

      <div>
        <label
          htmlFor="email"
          className="mb-2 block text-xs font-semibold tracking-[0.2em] text-slate-400 uppercase"
        >
          Email
        </label>
        <input
          type="email"
          id="email"
          name="email"
          value={formState.email}
          onChange={handleChange}
          required
          disabled={status === "loading"}
          className="w-full rounded-lg border border-white/10 bg-white/[0.02] px-4 py-3 text-sm text-white placeholder-slate-500 transition-colors focus:border-accent focus:outline-none focus:ring-1 focus:ring-accent disabled:cursor-not-allowed disabled:opacity-50"
          placeholder="email@example.com"
        />
      </div>

      <div>
        <label
          htmlFor="message"
          className="mb-2 block text-xs font-semibold tracking-[0.2em] text-slate-400 uppercase"
        >
          Pesan
        </label>
        <textarea
          id="message"
          name="message"
          value={formState.message}
          onChange={handleChange}
          required
          disabled={status === "loading"}
          rows={5}
          className="w-full resize-none rounded-lg border border-white/10 bg-white/[0.02] px-4 py-3 text-sm text-white placeholder-slate-500 transition-colors focus:border-accent focus:outline-none focus:ring-1 focus:ring-accent disabled:cursor-not-allowed disabled:opacity-50"
          placeholder="Tulis pesan kamu di sini..."
        />
      </div>

      <button
        type="submit"
        disabled={status === "loading" || status === "success"}
        className="flex w-full items-center justify-center gap-2 rounded-lg bg-gradient-to-r from-white to-zinc-300 px-6 py-3.5 text-sm font-semibold text-black shadow-[0_0_25px_rgba(255,255,255,0.25)] transition-all hover:shadow-[0_0_38px_rgba(255,255,255,0.5)] hover:brightness-110 disabled:cursor-not-allowed disabled:opacity-60 disabled:hover:shadow-[0_0_25px_rgba(255,255,255,0.25)]"
      >
        {status === "loading" && (
          <>
            <Loader2 size={18} className="animate-spin" />
            Mengirim...
          </>
        )}
        {status === "success" && (
          <>
            <CheckCircle size={18} />
            Terkirim!
          </>
        )}
        {status === "idle" && (
          <>
            <Send size={18} />
            Kirim Pesan
          </>
        )}
        {status === "error" && (
          <>
            <AlertCircle size={18} />
            Coba Lagi
          </>
        )}
      </button>

      {status === "success" && (
        <motion.p
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="rounded-lg border border-green-500/30 bg-green-500/10 px-4 py-3 text-sm text-green-300"
        >
          Terima kasih! Pesan kamu sudah terkirim. Saya akan segera membalas.
        </motion.p>
      )}

      {status === "error" && (
        <motion.p
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="rounded-lg border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-300"
        >
          Maaf, terjadi kesalahan. Silakan coba lagi atau hubungi langsung via email.
        </motion.p>
      )}
    </motion.form>
  )
}
