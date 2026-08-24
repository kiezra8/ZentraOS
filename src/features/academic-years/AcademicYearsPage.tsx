import { useState } from 'react'
import { Calendar, Plus, CheckCircle2, Clock, CalendarDays } from 'lucide-react'
import { SectionHeader, Card } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { Input, Select } from '@/components/ui/Input'
import { Badge } from '@/components/ui/Badge'
import { Modal } from '@/components/ui/Modal'
import { useInstitutionStore } from '@/store/institution.store'
import { DataService } from '@/lib/dataService'
import { formatDate } from '@/lib/utils'
import { toast } from 'react-hot-toast'
import type { AcademicYear, Term } from '@/types'

export function AcademicYearsPage() {
  const { institution, currentAcademicYear, setCurrentAcademicYear, currentTerm, setCurrentTerm } = useInstitutionStore()
  const [academicYears, setAcademicYears] = useState(() => DataService.getAcademicYears(institution?.id))
  const [terms, setTerms] = useState(() => DataService.getTerms())
  const [isYearOpen, setIsYearOpen] = useState(false)
  const [isTermOpen, setIsTermOpen] = useState(false)

  // New Year Form
  const [yearName, setYearName] = useState('')
  const [startDate, setStartDate] = useState('2027-02-01')
  const [endDate, setEndDate] = useState('2027-11-30')

  // New Term Form
  const [termName, setTermName] = useState('')
  const [termStart, setTermStart] = useState('')
  const [termEnd, setTermEnd] = useState('')

  function handleCreateYear(e: React.FormEvent) {
    e.preventDefault()
    const newYear = DataService.createAcademicYear({
      institution_id: institution?.id || 'inst-001',
      name: yearName,
      start_date: startDate,
      end_date: endDate,
      is_current: false,
      status: 'upcoming',
    })

    setAcademicYears(DataService.getAcademicYears(institution?.id))
    setIsYearOpen(false)
    setYearName('')
    toast.success('Academic Year created successfully!')
  }

  function handleSetActiveYear(year: AcademicYear) {
    setCurrentAcademicYear(year)
    toast.success(`Active academic year switched to ${year.name}`)
  }

  function handleSetActiveTerm(term: Term) {
    setCurrentTerm(term)
    toast.success(`Active academic period set to ${term.name}`)
  }

  return (
    <div className="space-y-6">
      <SectionHeader
        title="Academic Calendar"
        subtitle="Manage academic years, terms, semesters, and active operational periods"
        action={
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              leftIcon={<Plus className="w-4 h-4" />}
              onClick={() => setIsTermOpen(true)}
            >
              Add Term
            </Button>
            <Button
              variant="primary"
              leftIcon={<Plus className="w-4 h-4" />}
              onClick={() => setIsYearOpen(true)}
            >
              New Academic Year
            </Button>
          </div>
        }
      />

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Academic Years List */}
        <div className="card space-y-4">
          <div>
            <h2 className="text-base font-bold text-surface-900">Academic Years</h2>
            <p className="text-xs text-surface-500">Historical & upcoming academic cycles</p>
          </div>

          <div className="divide-y divide-surface-100">
            {academicYears.map(ay => {
              const isSelected = currentAcademicYear?.id === ay.id
              return (
                <div key={ay.id} className="py-3.5 flex items-center justify-between gap-3">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-sm text-surface-900">{ay.name}</span>
                      {isSelected && <Badge variant="success" dot>Current Session</Badge>}
                    </div>
                    <div className="text-xs text-surface-400 mt-0.5">
                      {formatDate(ay.start_date)} — {formatDate(ay.end_date)}
                    </div>
                  </div>

                  {!isSelected && (
                    <Button size="sm" variant="outline" onClick={() => handleSetActiveYear(ay)}>
                      Set Active
                    </Button>
                  )}
                </div>
              )
            })}
          </div>
        </div>

        {/* Terms & Semesters */}
        <div className="card space-y-4">
          <div>
            <h2 className="text-base font-bold text-surface-900">Terms / Semesters</h2>
            <p className="text-xs text-surface-500">Current terms in active academic year</p>
          </div>

          <div className="divide-y divide-surface-100">
            {terms.map(t => {
              const isSelected = currentTerm?.id === t.id
              return (
                <div key={t.id} className="py-3.5 flex items-center justify-between gap-3">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-sm text-surface-900">{t.name}</span>
                      {isSelected && <Badge variant="primary" dot>Active Term</Badge>}
                    </div>
                    <div className="text-xs text-surface-400 mt-0.5">
                      {formatDate(t.start_date)} — {formatDate(t.end_date)}
                    </div>
                  </div>

                  {!isSelected && (
                    <Button size="sm" variant="outline" onClick={() => handleSetActiveTerm(t)}>
                      Switch Term
                    </Button>
                  )}
                </div>
              )
            })}
          </div>
        </div>
      </div>

      {/* CREATE YEAR MODAL */}
      <Modal
        isOpen={isYearOpen}
        onClose={() => setIsYearOpen(false)}
        title="Add Academic Year"
        description="Configure new calendar cycle"
      >
        <form onSubmit={handleCreateYear} className="space-y-3">
          <div>
            <label className="label">Year Name *</label>
            <Input required value={yearName} onChange={e => setYearName(e.target.value)} placeholder="e.g. 2027 Academic Year" />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="label">Start Date *</label>
              <Input type="date" required value={startDate} onChange={e => setStartDate(e.target.value)} />
            </div>
            <div>
              <label className="label">End Date *</label>
              <Input type="date" required value={endDate} onChange={e => setEndDate(e.target.value)} />
            </div>
          </div>

          <div className="flex justify-end gap-2 pt-3 border-t border-surface-100">
            <Button variant="outline" type="button" onClick={() => setIsYearOpen(false)}>
              Cancel
            </Button>
            <Button variant="primary" type="submit">
              Save Academic Year
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  )
}
