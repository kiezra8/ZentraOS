import { useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { Building2, Shield, ArrowRight, CheckCircle2, Sparkles, Lock, Mail } from 'lucide-react'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { useAuthStore } from '@/store/auth.store'
import { useInstitutionStore } from '@/store/institution.store'
import { DEMO_AUTH_USERS, DEMO_INSTITUTIONS, DEMO_ACADEMIC_YEARS, DEMO_TERMS } from '@/lib/mockData'
import { toast } from 'react-hot-toast'
import type { UserRole } from '@/types'

export function LoginPage() {
  const [email, setEmail] = useState('admin@kampalamodel.sc.ug')
  const [password, setPassword] = useState('••••••••')
  const [isLoading, setIsLoading] = useState(false)
  const navigate = useNavigate()
  const { setUser } = useAuthStore()
  const { setInstitution, setCurrentAcademicYear, setCurrentTerm } = useInstitutionStore()

  function handleQuickRoleLogin(roleKey: keyof typeof DEMO_AUTH_USERS) {
    const demoUser = DEMO_AUTH_USERS[roleKey]
    if (!demoUser) return

    setUser(demoUser)
    setInstitution(demoUser.institution)
    setCurrentAcademicYear(DEMO_ACADEMIC_YEARS[0])
    setCurrentTerm(DEMO_TERMS[0])

    toast.success(`Signed in as ${demoUser.profile.full_name} (${demoUser.role.replace('_', ' ')})`)
    navigate('/dashboard')
  }

  function handleRegularLogin(e: React.FormEvent) {
    e.preventDefault()
    setIsLoading(true)

    setTimeout(() => {
      // Find matching user or fallback to admin
      const matched = Object.values(DEMO_AUTH_USERS).find(u => u.email.toLowerCase() === email.toLowerCase()) || DEMO_AUTH_USERS.admin
      setUser(matched)
      setInstitution(matched.institution)
      setCurrentAcademicYear(DEMO_ACADEMIC_YEARS[0])
      setCurrentTerm(DEMO_TERMS[0])
      setIsLoading(false)
      toast.success(`Welcome back, ${matched.profile.full_name}!`)
      navigate('/dashboard')
    }, 600)
  }

  return (
    <div className="min-h-screen bg-surface-900 flex flex-col justify-center py-12 sm:px-6 lg:px-8 relative overflow-hidden">
      {/* Decorative background gradients */}
      <div className="absolute top-0 left-1/4 w-96 h-96 bg-primary-600/20 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-accent-600/15 rounded-full blur-3xl pointer-events-none" />

      <div className="sm:mx-auto sm:w-full sm:max-w-md relative z-10 text-center">
        <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-gradient-to-tr from-primary-600 to-indigo-500 shadow-xl shadow-primary-500/25 mb-4">
          <Building2 className="w-9 h-9 text-white" />
        </div>
        <h1 className="text-3xl font-extrabold text-white tracking-tight">
          Zentra<span className="text-primary-400">OS</span>
        </h1>
        <p className="mt-1 text-sm text-surface-400">
          The Digital Operating System for East African Educational Institutions
        </p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md relative z-10 px-4">
        <div className="bg-surface-800/90 border border-surface-700/80 backdrop-blur-xl py-8 px-6 shadow-2xl rounded-3xl sm:px-10">
          <form className="space-y-4" onSubmit={handleRegularLogin}>
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-surface-300 mb-1.5">
                School Email / ID
              </label>
              <Input
                type="email"
                required
                value={email}
                onChange={e => setEmail(e.target.value)}
                placeholder="you@school.sc.ug"
                leftAdornment={<Mail className="w-4 h-4" />}
                className="bg-surface-900/60 border-surface-600 text-white placeholder:text-surface-500"
              />
            </div>

            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="block text-xs font-semibold uppercase tracking-wider text-surface-300">
                  Password
                </label>
                <Link to="/reset-password" className="text-xs text-primary-400 hover:text-primary-300">
                  Forgot password?
                </Link>
              </div>
              <Input
                type="password"
                required
                value={password}
                onChange={e => setPassword(e.target.value)}
                leftAdornment={<Lock className="w-4 h-4" />}
                className="bg-surface-900/60 border-surface-600 text-white"
              />
            </div>

            <Button
              type="submit"
              variant="primary"
              size="lg"
              className="w-full mt-2 font-semibold shadow-lg shadow-primary-600/30"
              isLoading={isLoading}
              rightIcon={<ArrowRight className="w-4 h-4" />}
            >
              Sign In to Workspace
            </Button>
          </form>

          {/* Quick Demo Switcher */}
          <div className="mt-6 pt-6 border-t border-surface-700">
            <div className="flex items-center gap-1.5 text-xs font-semibold text-primary-400 uppercase tracking-wider mb-3">
              <Sparkles className="w-3.5 h-3.5" />
              <span>Explore Instant Demo Roles</span>
            </div>

            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => handleQuickRoleLogin('admin')}
                className="flex items-center justify-between p-2.5 rounded-xl bg-surface-700/60 hover:bg-surface-700 text-left border border-surface-600/60 hover:border-primary-500 transition-all text-xs text-surface-200"
              >
                <div>
                  <div className="font-semibold text-white">Head Teacher</div>
                  <div className="text-[10px] text-surface-400">School Admin</div>
                </div>
                <span className="text-primary-400 font-bold">→</span>
              </button>

              <button
                type="button"
                onClick={() => handleQuickRoleLogin('teacher')}
                className="flex items-center justify-between p-2.5 rounded-xl bg-surface-700/60 hover:bg-surface-700 text-left border border-surface-600/60 hover:border-primary-500 transition-all text-xs text-surface-200"
              >
                <div>
                  <div className="font-semibold text-white">Teacher</div>
                  <div className="text-[10px] text-surface-400">Marks & Attendance</div>
                </div>
                <span className="text-primary-400 font-bold">→</span>
              </button>

              <button
                type="button"
                onClick={() => handleQuickRoleLogin('bursar')}
                className="flex items-center justify-between p-2.5 rounded-xl bg-surface-700/60 hover:bg-surface-700 text-left border border-surface-600/60 hover:border-primary-500 transition-all text-xs text-surface-200"
              >
                <div>
                  <div className="font-semibold text-white">Bursar</div>
                  <div className="text-[10px] text-surface-400">Fees & Receipts</div>
                </div>
                <span className="text-primary-400 font-bold">→</span>
              </button>

              <button
                type="button"
                onClick={() => handleQuickRoleLogin('parent')}
                className="flex items-center justify-between p-2.5 rounded-xl bg-surface-700/60 hover:bg-surface-700 text-left border border-surface-600/60 hover:border-primary-500 transition-all text-xs text-surface-200"
              >
                <div>
                  <div className="font-semibold text-white">Parent</div>
                  <div className="text-[10px] text-surface-400">Child Portal</div>
                </div>
                <span className="text-primary-400 font-bold">→</span>
              </button>
            </div>
          </div>

          {/* Onboarding callout */}
          <div className="mt-6 text-center">
            <Link
              to="/onboarding"
              className="inline-flex items-center gap-1.5 text-xs text-surface-400 hover:text-white transition-colors"
            >
              <span>Register a new school?</span>
              <span className="text-primary-400 font-semibold underline">Launch Onboarding Wizard</span>
            </Link>
          </div>
        </div>

        {/* Multi-tenant reassurance */}
        <div className="mt-6 flex items-center justify-center gap-2 text-xs text-surface-500">
          <Shield className="w-3.5 h-3.5 text-accent-500" />
          <span>Tenant Isolation & 256-bit Row-Level Encryption</span>
        </div>
      </div>
    </div>
  )
}
