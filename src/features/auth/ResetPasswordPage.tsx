import { useState } from 'react'
import { Link } from 'react-router-dom'
import { Building2, ArrowLeft, Mail, CheckCircle2 } from 'lucide-react'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { toast } from 'react-hot-toast'

export function ResetPasswordPage() {
  const [email, setEmail] = useState('')
  const [isSubmitted, setIsSubmitted] = useState(false)
  const [isLoading, setIsLoading] = useState(false)

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setIsLoading(true)
    setTimeout(() => {
      setIsLoading(false)
      setIsSubmitted(true)
      toast.success('Password recovery link sent to your email!')
    }, 600)
  }

  return (
    <div className="min-h-screen bg-surface-900 flex flex-col justify-center py-12 sm:px-6 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-md text-center">
        <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-primary-600 mb-3">
          <Building2 className="w-7 h-7 text-white" />
        </div>
        <h2 className="text-2xl font-bold text-white">Reset Your Password</h2>
        <p className="mt-1 text-sm text-surface-400">
          Enter your registered school email to receive reset instructions
        </p>
      </div>

      <div className="mt-6 sm:mx-auto sm:w-full sm:max-w-md px-4">
        <div className="bg-surface-800 border border-surface-700 py-8 px-6 shadow-xl rounded-2xl">
          {isSubmitted ? (
            <div className="text-center py-4 space-y-4">
              <div className="w-12 h-12 rounded-full bg-success-500/20 text-success-400 flex items-center justify-center mx-auto">
                <CheckCircle2 className="w-6 h-6" />
              </div>
              <h3 className="text-lg font-semibold text-white">Check Your Inbox</h3>
              <p className="text-xs text-surface-300">
                We've sent a secure reset link to <span className="font-semibold text-white">{email}</span>.
              </p>
              <div className="pt-4">
                <Link to="/login" className="btn btn-outline btn-md w-full">
                  Return to Sign In
                </Link>
              </div>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4">
              <Input
                label="Registered Email"
                type="email"
                required
                value={email}
                onChange={e => setEmail(e.target.value)}
                placeholder="you@school.sc.ug"
                leftAdornment={<Mail className="w-4 h-4" />}
                className="bg-surface-900 border-surface-600 text-white"
              />

              <Button type="submit" variant="primary" size="md" className="w-full" isLoading={isLoading}>
                Send Password Reset Link
              </Button>

              <div className="text-center pt-2">
                <Link to="/login" className="inline-flex items-center gap-1.5 text-xs text-surface-400 hover:text-white">
                  <ArrowLeft className="w-3.5 h-3.5" />
                  Back to Sign In
                </Link>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  )
}
