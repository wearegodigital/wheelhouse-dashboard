"use client"
import { createContext, useContext, useState, useCallback, ReactNode } from "react"

interface Toast {
  id: string
  message: string
  type: "success" | "error" | "info"
}

const TOAST_STYLES = {
  success: {
    bg: "bg-gradient-to-r from-green-950/90 to-green-900/80 border-green-400 text-green-50",
    shadow: "0 0 8px rgba(74, 222, 128, 0.6), 0 0 16px rgba(74, 222, 128, 0.3), inset 0 0 4px rgba(74, 222, 128, 0.2)",
    glow: "0 0 4px rgba(74, 222, 128, 0.5)",
    iconGlow: "drop-shadow-[0_0_4px_rgba(74,222,128,0.8)]"
  },
  error: {
    bg: "bg-gradient-to-r from-red-950/90 to-red-900/80 border-red-400 text-red-50",
    shadow: "0 0 8px rgba(248, 113, 113, 0.6), 0 0 16px rgba(248, 113, 113, 0.3), inset 0 0 4px rgba(248, 113, 113, 0.2)",
    glow: "0 0 4px rgba(248, 113, 113, 0.5)",
    iconGlow: "drop-shadow-[0_0_4px_rgba(248,113,113,0.8)]"
  },
  info: {
    bg: "bg-gradient-to-r from-cyan-950/90 to-cyan-900/80 border-cyan-400 text-cyan-50",
    shadow: "0 0 8px rgba(34, 211, 238, 0.6), 0 0 16px rgba(34, 211, 238, 0.3), inset 0 0 4px rgba(34, 211, 238, 0.2)",
    glow: "0 0 4px rgba(34, 211, 238, 0.5)",
    iconGlow: "drop-shadow-[0_0_4px_rgba(34,211,238,0.8)]"
  }
} as const

interface ToastContextType {
  toasts: Toast[]
  addToast: (message: string, type?: Toast["type"]) => void
  removeToast: (id: string) => void
}

const ToastContext = createContext<ToastContextType | undefined>(undefined)

function ToastIcon({ type }: { type: Toast["type"] }) {
  const style = TOAST_STYLES[type]
  const svgProps = { className: `w-5 h-5 flex-shrink-0 mt-0.5 ${style.iconGlow}`, fill: "currentColor", viewBox: "0 0 20 20" }

  if (type === "success") {
    return <svg {...svgProps}><path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" /></svg>
  }
  if (type === "error") {
    return <svg {...svgProps}><path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" /></svg>
  }
  return <svg {...svgProps}><path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" /></svg>
}

function ToastContainer({
  toasts,
  removeToast
}: {
  toasts: Toast[]
  removeToast: (id: string) => void
}) {
  return (
    <div className="fixed bottom-4 right-4 z-50 flex flex-col gap-3 max-w-md">
      {toasts.map((toast) => {
        const style = TOAST_STYLES[toast.type]
        return (
        <div
          key={toast.id}
          className={`
            relative px-4 py-3 rounded border-2 flex items-start justify-between gap-3 overflow-hidden
            animate-in slide-in-from-right-full duration-300 backdrop-blur-sm
            ${style.bg}
          `}
          style={{
            boxShadow: style.shadow,
            animation: "glitch 0.3s ease-out"
          }}
        >
          {/* Scan line effect */}
          <div className="absolute inset-0 pointer-events-none opacity-30">
            <div className="absolute inset-0 bg-gradient-to-b from-transparent via-white/5 to-transparent"
              style={{ animation: "scan-line 2s linear infinite" }} />
          </div>

          <div className="flex items-start gap-2 flex-1 relative z-10">
            <ToastIcon type={toast.type} />
            <p className="text-sm font-medium uppercase tracking-wide" style={{ textShadow: style.glow }}>
              {toast.message}
            </p>
          </div>
          <button
            onClick={() => removeToast(toast.id)}
            className="relative z-10 text-current opacity-70 hover:opacity-100 transition-all flex-shrink-0 hover:scale-110"
            style={{ filter: "drop-shadow(0 0 4px currentColor)" }}
          >
            <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
            </svg>
          </button>

          {/* Corner accents */}
          <div className="absolute top-0 left-0 w-2 h-2 border-t-2 border-l-2 border-current opacity-60" />
          <div className="absolute top-0 right-0 w-2 h-2 border-t-2 border-r-2 border-current opacity-60" />
          <div className="absolute bottom-0 left-0 w-2 h-2 border-b-2 border-l-2 border-current opacity-60" />
          <div className="absolute bottom-0 right-0 w-2 h-2 border-b-2 border-r-2 border-current opacity-60" />
        </div>
      )})}
    </div>
  )
}

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([])

  const addToast = useCallback((message: string, type: Toast["type"] = "info") => {
    const id = crypto.randomUUID()
    setToasts((prev) => [...prev, { id, message, type }])
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id))
    }, 5000)
  }, [])

  const removeToast = useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id))
  }, [])

  return (
    <ToastContext.Provider value={{ toasts, addToast, removeToast }}>
      {children}
      <ToastContainer toasts={toasts} removeToast={removeToast} />
    </ToastContext.Provider>
  )
}

export function useToast() {
  const context = useContext(ToastContext)
  if (!context) {
    throw new Error("useToast must be used within ToastProvider")
  }
  return context
}
