import { useState } from 'react'
import { Lock, ShieldCheck, Delete, AlertCircle } from 'lucide-react'
import { toast } from 'react-hot-toast'

interface BursarPinGateProps {
  onUnlock: () => void
  isOpen: boolean
}

export const BURSAR_REQUIRED_PIN = '88888888'

export function BursaryPinGate({ onUnlock, isOpen }: BursarPinGateProps) {
  const [pin, setPin] = useState('')
  const [error, setError] = useState(false)

  if (!isOpen) return null

  function handleKeyPress(digit: string) {
    if (pin.length < 8) {
      const nextPin = pin + digit
      setPin(nextPin)
      setError(false)

      if (nextPin.length === 8) {
        if (nextPin === BURSAR_REQUIRED_PIN) {
          toast.success('Bursar & Accounts Department Unlocked Successfully')
          sessionStorage.setItem('zentraos_bursary_unlocked', 'true')
          onUnlock()
        } else {
          setError(true)
          toast.error('Invalid Bursar & Accounts Security PIN')
          setTimeout(() => setPin(''), 600)
        }
      }
    }
  }

  function handleBackspace() {
    setPin(prev => prev.slice(0, -1))
    setError(false)
  }

  function handleClear() {
    setPin('')
    setError(false)
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-surface-950/80 backdrop-blur-md animate-fade-in">
      <div className="bg-surface-900 border border-surface-700 w-full max-w-sm rounded-3xl p-6 sm:p-8 shadow-2xl text-center text-white relative">
        {/* Lock Icon */}
        <div className="w-16 h-16 rounded-2xl bg-gradient-to-tr from-emerald-600 to-teal-500 text-white flex items-center justify-center mx-auto mb-4 shadow-lg shadow-emerald-600/30">
          <Lock className="w-8 h-8" />
        </div>

        <h2 className="text-xl font-extrabold tracking-tight text-white">
          Bursar & Accounts Department
        </h2>
        <p className="text-xs text-surface-400 mt-1 max-w-xs mx-auto">
          This portal is restricted to authorized personnel. Enter the 8-digit Bursar & Accounts PIN to access financial records.
        </p>

        {/* PIN Digit Indicators (8 Dots) */}
        <div className="flex items-center justify-center gap-2.5 my-6">
          {Array.from({ length: 8 }).map((_, i) => (
            <div
              key={i}
              className={`w-3.5 h-3.5 rounded-full transition-all ${
                i < pin.length
                  ? error
                    ? 'bg-red-500 scale-110 animate-bounce'
                    : 'bg-emerald-400 scale-110 shadow-sm shadow-emerald-400/50'
                  : 'bg-surface-700 border border-surface-600'
              }`}
            />
          ))}
        </div>

        {error && (
          <div className="text-xs text-red-400 mb-4 font-medium flex items-center justify-center gap-1.5">
            <AlertCircle className="w-3.5 h-3.5" />
            <span>Incorrect PIN. Please re-enter.</span>
          </div>
        )}

        {/* Numeric Touch Keypad */}
        <div className="grid grid-cols-3 gap-2.5 max-w-[260px] mx-auto">
          {['1', '2', '3', '4', '5', '6', '7', '8', '9'].map(num => (
            <button
              key={num}
              type="button"
              onClick={() => handleKeyPress(num)}
              className="h-12 rounded-2xl bg-surface-800 hover:bg-surface-700 active:bg-emerald-600 text-lg font-bold text-white border border-surface-700/80 transition-all active:scale-95 flex items-center justify-center select-none"
            >
              {num}
            </button>
          ))}
          <button
            type="button"
            onClick={handleClear}
            className="h-12 rounded-2xl bg-surface-800/60 hover:bg-surface-800 text-xs font-semibold text-surface-400 border border-surface-700/60 transition-all flex items-center justify-center select-none"
          >
            Clear
          </button>
          <button
            type="button"
            onClick={() => handleKeyPress('0')}
            className="h-12 rounded-2xl bg-surface-800 hover:bg-surface-700 active:bg-emerald-600 text-lg font-bold text-white border border-surface-700/80 transition-all active:scale-95 flex items-center justify-center select-none"
          >
            0
          </button>
          <button
            type="button"
            onClick={handleBackspace}
            className="h-12 rounded-2xl bg-surface-800/60 hover:bg-surface-800 text-xs font-semibold text-surface-400 border border-surface-700/60 transition-all flex items-center justify-center select-none"
          >
            <Delete className="w-5 h-5" />
          </button>
        </div>

        <div className="mt-6 pt-4 border-t border-surface-800 text-[11px] text-surface-500 flex items-center justify-center gap-1.5">
          <ShieldCheck className="w-3.5 h-3.5 text-emerald-500" />
          <span>Security Protected • 256-bit Row Ledger</span>
        </div>
      </div>
    </div>
  )
}
