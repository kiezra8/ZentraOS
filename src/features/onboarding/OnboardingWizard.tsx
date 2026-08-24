import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  Building2, School, GraduationCap, Stethoscope, Baby,
  CheckCircle2, ArrowRight, ArrowLeft, Sparkles, ShieldCheck
} from 'lucide-react'
import { Button } from '@/components/ui/Button'
import { Input, Select, Textarea } from '@/components/ui/Input'
import { Card } from '@/components/ui/Card'
import { useAuthStore } from '@/store/auth.store'
import { useInstitutionStore } from '@/store/institution.store'
import { DataService } from '@/lib/dataService'
import { toast } from 'react-hot-toast'
import type { InstitutionType, AcademicStructureConfig } from '@/types'

const INSTITUTION_TYPES: {
  type: InstitutionType
  title: string
  desc: string
  icon: React.ComponentType<{ className?: string }>
  badge: string
  defaultClasses: string[]
}[] = [
  {
    type: 'secondary',
    title: 'Secondary School',
    desc: 'O-Level (S1-S4) & A-Level (S5-S6) with subject combinations, UNEB standards & streams.',
    icon: GraduationCap,
    badge: 'UNEB O/A-Level',
    defaultClasses: ['Senior 1 (S.1)', 'Senior 2 (S.2)', 'Senior 3 (S.3)', 'Senior 4 (S.4)', 'Senior 5 (S.5)', 'Senior 6 (S.6)'],
  },
  {
    type: 'primary',
    title: 'Primary School',
    desc: 'Primary 1 to Primary 7 (P.1 - P.7) with continuous assessment, PLE preparation and streams.',
    icon: School,
    badge: 'P.1 to P.7',
    defaultClasses: ['Primary 1', 'Primary 2', 'Primary 3', 'Primary 4', 'Primary 5', 'Primary 6', 'Primary 7 (Candidates)'],
  },
  {
    type: 'nursing',
    title: 'Nursing & Health Training',
    desc: 'Diploma and Certificate in Nursing, Midwifery, Laboratory with clinical rotations & semesters.',
    icon: Stethoscope,
    badge: 'UNMC / UAHEB Standards',
    defaultClasses: ['Certificate in Nursing - Year 1', 'Certificate in Nursing - Year 2', 'Diploma in Midwifery - Year 1', 'Diploma in Midwifery - Year 2'],
  },
  {
    type: 'nursery',
    title: 'Nursery & Early Childhood',
    desc: 'Baby Class, Middle Class, and Top Class with developmental milestones and parent reports.',
    icon: Baby,
    badge: 'Early Years',
    defaultClasses: ['Baby Class (Daycare)', 'Middle Class', 'Top Class (Pre-Primary)'],
  },
  {
    type: 'other',
    title: 'Vocational / Other Institution',
    desc: 'Flexible modular structure for technical institutes, colleges, and specialized academies.',
    icon: Building2,
    badge: 'Custom Modules',
    defaultClasses: ['Foundation Year', 'Intermediate Level', 'Advanced Diploma'],
  },
]

export function OnboardingWizard() {
  const [step, setStep] = useState(1)
  const [instType, setInstType] = useState<InstitutionType>('secondary')
  const [schoolName, setSchoolName] = useState('')
  const [motto, setMotto] = useState('')
  const [phone, setPhone] = useState('')
  const [email, setEmail] = useState('')
  const [district, setDistrict] = useState('Kampala')
  const [address, setAddress] = useState('')
  const [academicYearName, setAcademicYearName] = useState('2026 Academic Year')
  const [termCount, setTermCount] = useState('3')
  const [adminName, setAdminName] = useState('')
  const [adminEmail, setAdminEmail] = useState('')
  const [adminPassword, setAdminPassword] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)

  const navigate = useNavigate()
  const { setUser } = useAuthStore()
  const { setInstitution, setCurrentAcademicYear, setCurrentTerm } = useInstitutionStore()

  const selectedTypeConfig = INSTITUTION_TYPES.find(t => t.type === instType)!

  function handleComplete() {
    setIsSubmitting(true)

    setTimeout(() => {
      // 1. Create Institution
      const newInst = DataService.createInstitution({
        name: schoolName || 'New School Academy',
        code: `SCH-${Math.floor(100 + Math.random() * 900)}`,
        type: instType,
        country: 'Uganda',
        district: district || 'Kampala',
        address: address || 'Uganda',
        phone: phone || '+256 700 000000',
        email: email || 'admin@school.ug',
        motto: motto || 'Knowledge is Power',
        subscription_plan: 'starter',
        subscription_status: 'trial',
        settings: {
          currency: 'UGX',
          date_format: 'dd/MM/yyyy',
          modules_enabled: ['students', 'parents', 'staff', 'classes', 'subjects', 'attendance', 'exams', 'fees', 'reports', 'settings', 'announcements'],
          enable_streams: true,
          enable_health_module: instType === 'nursing',
          enable_library: true,
          enable_inventory: true,
          enable_parent_portal: true,
          enable_student_portal: true,
          academic_structure: {
            class_levels: selectedTypeConfig.defaultClasses.map((cls, idx) => ({
              id: `lvl-${idx + 1}`,
              name: cls,
              order: idx + 1,
            })),
            uses_streams: true,
            uses_departments: instType === 'nursing' || instType === 'secondary',
            uses_combinations: instType === 'secondary',
          },
        },
      })

      // 2. Create Academic Year & Terms
      const newAY = DataService.createAcademicYear({
        institution_id: newInst.id,
        name: academicYearName,
        start_date: '2026-02-02',
        end_date: '2026-11-28',
        is_current: true,
        status: 'active',
      })

      const newTerm = DataService.createTerm({
        institution_id: newInst.id,
        academic_year_id: newAY.id,
        name: instType === 'nursing' ? 'Semester 1' : 'Term 1',
        type: instType === 'nursing' ? 'semester' : 'term',
        start_date: '2026-02-02',
        end_date: '2026-05-02',
        is_current: true,
      })

      // 3. Create Default Classes
      selectedTypeConfig.defaultClasses.forEach((clsName, idx) => {
        const c = DataService.createClass({
          institution_id: newInst.id,
          academic_year_id: newAY.id,
          name: clsName,
          level: idx + 1,
          capacity: 60,
        })
        // Add default stream
        DataService.createStream({
          institution_id: newInst.id,
          class_id: c.id,
          name: 'Stream A (Main)',
        })
      })

      // 4. Set active user & stores
      const authUser = {
        id: 'usr-new-admin',
        email: adminEmail || 'headteacher@school.ug',
        role: 'school_admin' as const,
        institution_id: newInst.id,
        profile: {
          id: 'usr-new-admin',
          full_name: adminName || 'School Administrator',
          phone,
          address,
          created_at: new Date().toISOString(),
        },
        institution: newInst,
      }

      setUser(authUser)
      setInstitution(newInst)
      setCurrentAcademicYear(newAY)
      setCurrentTerm(newTerm)

      setIsSubmitting(false)
      toast.success(`Welcome to ZentraOS! ${newInst.name} has been set up successfully.`)
      navigate('/dashboard')
    }, 800)
  }

  return (
    <div className="min-h-screen bg-surface-900 text-white flex flex-col py-8 px-4 sm:px-6 lg:px-8">
      {/* Header */}
      <div className="max-w-3xl mx-auto w-full text-center mb-8">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary-500/20 text-primary-300 text-xs font-semibold uppercase tracking-wider mb-2">
          <Sparkles className="w-3.5 h-3.5" />
          <span>New Institution Onboarding</span>
        </div>
        <h1 className="text-3xl font-extrabold text-white">Setup Your Institution on ZentraOS</h1>
        <p className="text-surface-400 text-sm mt-1">
          Complete these quick steps to generate your school's isolated digital workspace.
        </p>

        {/* Step indicator */}
        <div className="flex items-center justify-center gap-2 mt-6">
          {[1, 2, 3, 4].map(s => (
            <div key={s} className="flex items-center gap-2">
              <div
                className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold transition-all ${
                  step === s
                    ? 'bg-primary-600 text-white ring-4 ring-primary-600/30'
                    : step > s
                    ? 'bg-accent-600 text-white'
                    : 'bg-surface-700 text-surface-400'
                }`}
              >
                {step > s ? <CheckCircle2 className="w-4 h-4" /> : s}
              </div>
              {s < 4 && <div className={`w-8 sm:w-12 h-1 rounded ${step > s ? 'bg-accent-600' : 'bg-surface-700'}`} />}
            </div>
          ))}
        </div>
      </div>

      {/* Main card */}
      <div className="max-w-2xl mx-auto w-full bg-surface-800 border border-surface-700 rounded-3xl p-6 sm:p-8 shadow-2xl">
        {/* STEP 1: Institution Type */}
        {step === 1 && (
          <div className="space-y-4">
            <h2 className="text-xl font-bold text-white">Step 1: Select Institution Category</h2>
            <p className="text-xs text-surface-400">
              The institution category automatically tailors modules, grading schemes, and classes.
            </p>

            <div className="space-y-2.5 pt-2">
              {INSTITUTION_TYPES.map(t => {
                const Icon = t.icon
                const isSelected = instType === t.type
                return (
                  <div
                    key={t.type}
                    onClick={() => setInstType(t.type)}
                    className={`flex items-start gap-4 p-4 rounded-2xl border cursor-pointer transition-all ${
                      isSelected
                        ? 'bg-primary-600/15 border-primary-500 ring-2 ring-primary-500/20'
                        : 'bg-surface-900/60 border-surface-700 hover:border-surface-600'
                    }`}
                  >
                    <div className={`p-3 rounded-xl flex-shrink-0 ${isSelected ? 'bg-primary-600 text-white' : 'bg-surface-700 text-surface-300'}`}>
                      <Icon className="w-6 h-6" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between">
                        <h3 className="text-base font-semibold text-white">{t.title}</h3>
                        <span className="badge badge-primary text-[10px]">{t.badge}</span>
                      </div>
                      <p className="text-xs text-surface-400 mt-1">{t.desc}</p>
                    </div>
                  </div>
                )
              })}
            </div>

            <div className="pt-4 flex justify-end">
              <Button
                variant="primary"
                onClick={() => setStep(2)}
                rightIcon={<ArrowRight className="w-4 h-4" />}
              >
                Continue to School Info
              </Button>
            </div>
          </div>
        )}

        {/* STEP 2: School Profile */}
        {step === 2 && (
          <div className="space-y-4">
            <h2 className="text-xl font-bold text-white">Step 2: School Identity & Location</h2>
            <p className="text-xs text-surface-400">Provide formal details for report cards, fee invoices, and student badges.</p>

            <div className="space-y-3 pt-2">
              <div>
                <label className="label text-surface-300">Official School Name *</label>
                <Input
                  required
                  value={schoolName}
                  onChange={e => setSchoolName(e.target.value)}
                  placeholder="e.g. Kampala Model Secondary School"
                  className="bg-surface-900 border-surface-600 text-white"
                />
              </div>

              <div>
                <label className="label text-surface-300">School Motto</label>
                <Input
                  value={motto}
                  onChange={e => setMotto(e.target.value)}
                  placeholder="e.g. Strive for Academic and Moral Excellence"
                  className="bg-surface-900 border-surface-600 text-white"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="label text-surface-300">District (Uganda) *</label>
                  <Input
                    value={district}
                    onChange={e => setDistrict(e.target.value)}
                    placeholder="e.g. Kampala, Wakiso, Mbarara, Gulu"
                    className="bg-surface-900 border-surface-600 text-white"
                  />
                </div>
                <div>
                  <label className="label text-surface-300">Official Phone *</label>
                  <Input
                    value={phone}
                    onChange={e => setPhone(e.target.value)}
                    placeholder="+256 700 123456"
                    className="bg-surface-900 border-surface-600 text-white"
                  />
                </div>
              </div>

              <div>
                <label className="label text-surface-300">Official Email</label>
                <Input
                  type="email"
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  placeholder="admin@yourschool.sc.ug"
                  className="bg-surface-900 border-surface-600 text-white"
                />
              </div>

              <div>
                <label className="label text-surface-300">Physical Address</label>
                <Input
                  value={address}
                  onChange={e => setAddress(e.target.value)}
                  placeholder="Plot / Road, Sub-county, Town"
                  className="bg-surface-900 border-surface-600 text-white"
                />
              </div>
            </div>

            <div className="pt-4 flex items-center justify-between">
              <Button variant="ghost" onClick={() => setStep(1)} leftIcon={<ArrowLeft className="w-4 h-4" />}>
                Back
              </Button>
              <Button
                variant="primary"
                onClick={() => {
                  if (!schoolName) return toast.error('Please enter the school name')
                  setStep(3)
                }}
                rightIcon={<ArrowRight className="w-4 h-4" />}
              >
                Academic Calendar
              </Button>
            </div>
          </div>
        )}

        {/* STEP 3: Academic Setup */}
        {step === 3 && (
          <div className="space-y-4">
            <h2 className="text-xl font-bold text-white">Step 3: Academic Structure & Classes</h2>
            <p className="text-xs text-surface-400">Configure initial academic year and default classes.</p>

            <div className="space-y-3 pt-2">
              <div>
                <label className="label text-surface-300">Initial Academic Year</label>
                <Input
                  value={academicYearName}
                  onChange={e => setAcademicYearName(e.target.value)}
                  className="bg-surface-900 border-surface-600 text-white"
                />
              </div>

              <div>
                <label className="label text-surface-300">Initial Academic Period Type</label>
                <Select
                  options={[
                    { value: '3', label: '3 Terms per Year (Uganda Standard: Term 1, 2, 3)' },
                    { value: '2', label: '2 Semesters per Year (Higher Education / Nursing)' },
                  ]}
                  value={termCount}
                  onChange={e => setTermCount(e.target.value)}
                  className="bg-surface-900 border-surface-600 text-white"
                />
              </div>

              <div className="pt-2">
                <label className="label text-surface-300">Classes that will be automatically generated:</label>
                <div className="bg-surface-900/80 rounded-xl p-3 border border-surface-700 flex flex-wrap gap-2">
                  {selectedTypeConfig.defaultClasses.map(cls => (
                    <span key={cls} className="badge badge-surface text-xs text-surface-200">
                      ✓ {cls}
                    </span>
                  ))}
                </div>
                <p className="text-[11px] text-surface-400 mt-1">You can add, edit, or customize streams and subjects anytime later.</p>
              </div>
            </div>

            <div className="pt-4 flex items-center justify-between">
              <Button variant="ghost" onClick={() => setStep(2)} leftIcon={<ArrowLeft className="w-4 h-4" />}>
                Back
              </Button>
              <Button variant="primary" onClick={() => setStep(4)} rightIcon={<ArrowRight className="w-4 h-4" />}>
                Administrator Account
              </Button>
            </div>
          </div>
        )}

        {/* STEP 4: Administrator Account & Launch */}
        {step === 4 && (
          <div className="space-y-4">
            <h2 className="text-xl font-bold text-white">Step 4: Administrator Account</h2>
            <p className="text-xs text-surface-400">Create the primary super administrator account for this school.</p>

            <div className="space-y-3 pt-2">
              <div>
                <label className="label text-surface-300">Administrator Full Name *</label>
                <Input
                  required
                  value={adminName}
                  onChange={e => setAdminName(e.target.value)}
                  placeholder="e.g. Dr. Joseph Muwanga"
                  className="bg-surface-900 border-surface-600 text-white"
                />
              </div>

              <div>
                <label className="label text-surface-300">Administrator Email *</label>
                <Input
                  type="email"
                  required
                  value={adminEmail}
                  onChange={e => setAdminEmail(e.target.value)}
                  placeholder="headteacher@yourschool.sc.ug"
                  className="bg-surface-900 border-surface-600 text-white"
                />
              </div>

              <div>
                <label className="label text-surface-300">Admin Password</label>
                <Input
                  type="password"
                  value={adminPassword}
                  onChange={e => setAdminPassword(e.target.value)}
                  placeholder="••••••••••••"
                  className="bg-surface-900 border-surface-600 text-white"
                />
              </div>

              <div className="p-3.5 rounded-xl bg-accent-500/10 border border-accent-500/20 flex items-center gap-3">
                <ShieldCheck className="w-6 h-6 text-accent-400 flex-shrink-0" />
                <div className="text-xs text-accent-200">
                  Your school instance will be isolated with dedicated encryption keys and multi-tenant RLS protection.
                </div>
              </div>
            </div>

            <div className="pt-4 flex items-center justify-between">
              <Button variant="ghost" onClick={() => setStep(3)} leftIcon={<ArrowLeft className="w-4 h-4" />}>
                Back
              </Button>
              <Button
                variant="success"
                size="lg"
                onClick={handleComplete}
                isLoading={isSubmitting}
                rightIcon={<Sparkles className="w-4 h-4" />}
              >
                Launch School Workspace
              </Button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
