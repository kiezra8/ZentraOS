import { useState, useMemo } from 'react'
import { useSearchParams, useNavigate } from 'react-router-dom'
import {
  Search, GraduationCap, Users, UserCheck, CreditCard,
  ArrowRight, BookMarked, FileText
} from 'lucide-react'
import { SectionHeader, Card } from '@/components/ui/Card'
import { Input } from '@/components/ui/Input'
import { Badge } from '@/components/ui/Badge'
import { useInstitutionStore } from '@/store/institution.store'
import { DataService } from '@/lib/dataService'
import { formatCurrency, formatDate } from '@/lib/utils'

export function SearchPage() {
  const [searchParams, setSearchParams] = useSearchParams()
  const initialQuery = searchParams.get('q') || ''
  const [query, setQuery] = useState(initialQuery)
  const { institution } = useInstitutionStore()
  const navigate = useNavigate()

  const students = DataService.getStudents(institution?.id)
  const staff = DataService.getStaff(institution?.id)
  const classes = DataService.getClasses(institution?.id)
  const invoices = DataService.getInvoices(institution?.id)
  const payments = DataService.getPayments(institution?.id)

  const results = useMemo(() => {
    if (!query.trim()) return { students: [], staff: [], classes: [], invoices: [], payments: [] }

    const q = query.toLowerCase()
    return {
      students: students.filter(s =>
        `${s.first_name} ${s.last_name} ${s.admission_number} ${s.current_class?.name || ''}`.toLowerCase().includes(q)
      ),
      staff: staff.filter(st =>
        `${st.first_name} ${st.last_name} ${st.position} ${st.staff_number}`.toLowerCase().includes(q)
      ),
      classes: classes.filter(c =>
        c.name.toLowerCase().includes(q)
      ),
      invoices: invoices.filter(i =>
        `${i.student?.first_name} ${i.student?.last_name} ${i.status}`.toLowerCase().includes(q)
      ),
      payments: payments.filter(p =>
        `${p.receipt?.receipt_number} ${p.payment_method} ${p.student?.first_name}`.toLowerCase().includes(q)
      ),
    }
  }, [query, students, staff, classes, invoices, payments])

  const totalMatches =
    results.students.length +
    results.staff.length +
    results.classes.length +
    results.invoices.length +
    results.payments.length

  return (
    <div className="space-y-6">
      <SectionHeader
        title="Global Search"
        subtitle="Search across students, educators, classes, fee invoices, and receipts"
      />

      <div className="card p-4">
        <Input
          placeholder="Type name, admission number, receipt ID, or search 'unpaid'..."
          value={query}
          onChange={e => {
            setQuery(e.target.value)
            setSearchParams({ q: e.target.value })
          }}
          leftAdornment={<Search className="w-5 h-5" />}
          className="text-base py-3"
          autoFocus
        />
      </div>

      {query.trim() && (
        <div className="text-xs text-surface-500 font-semibold uppercase tracking-wider">
          Found {totalMatches} result{totalMatches === 1 ? '' : 's'} for "{query}"
        </div>
      )}

      {/* RESULTS LIST */}
      <div className="space-y-6">
        {/* Students Match */}
        {results.students.length > 0 && (
          <div className="card space-y-3">
            <h3 className="text-sm font-bold text-surface-900 flex items-center gap-2">
              <GraduationCap className="w-4 h-4 text-primary-600" />
              <span>Students ({results.students.length})</span>
            </h3>
            <div className="divide-y divide-surface-100">
              {results.students.map(s => (
                <div
                  key={s.id}
                  onClick={() => navigate('/students')}
                  className="py-2.5 flex items-center justify-between hover:bg-surface-50 p-2 rounded-xl cursor-pointer"
                >
                  <div>
                    <div className="font-semibold text-sm text-surface-900">{s.first_name} {s.last_name}</div>
                    <div className="text-xs text-surface-400 font-mono">{s.admission_number} • {s.current_class?.name}</div>
                  </div>
                  <Badge variant="success" dot>{s.status}</Badge>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Staff Match */}
        {results.staff.length > 0 && (
          <div className="card space-y-3">
            <h3 className="text-sm font-bold text-surface-900 flex items-center gap-2">
              <UserCheck className="w-4 h-4 text-accent-600" />
              <span>Staff & Educators ({results.staff.length})</span>
            </h3>
            <div className="divide-y divide-surface-100">
              {results.staff.map(st => (
                <div
                  key={st.id}
                  onClick={() => navigate('/staff')}
                  className="py-2.5 flex items-center justify-between hover:bg-surface-50 p-2 rounded-xl cursor-pointer"
                >
                  <div>
                    <div className="font-semibold text-sm text-surface-900">{st.first_name} {st.last_name}</div>
                    <div className="text-xs text-surface-500">{st.position} • {st.staff_number}</div>
                  </div>
                  <Badge variant="primary">{st.employment_type}</Badge>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Invoices Match */}
        {results.invoices.length > 0 && (
          <div className="card space-y-3">
            <h3 className="text-sm font-bold text-surface-900 flex items-center gap-2">
              <CreditCard className="w-4 h-4 text-emerald-600" />
              <span>Fee Invoices ({results.invoices.length})</span>
            </h3>
            <div className="divide-y divide-surface-100">
              {results.invoices.map(inv => (
                <div
                  key={inv.id}
                  onClick={() => navigate('/fees')}
                  className="py-2.5 flex items-center justify-between hover:bg-surface-50 p-2 rounded-xl cursor-pointer"
                >
                  <div>
                    <div className="font-semibold text-sm text-surface-900">{inv.student?.first_name} {inv.student?.last_name}</div>
                    <div className="text-xs text-surface-500">Balance: {formatCurrency(inv.balance)}</div>
                  </div>
                  <Badge variant={inv.status === 'paid' ? 'success' : 'danger'}>{inv.status}</Badge>
                </div>
              ))}
            </div>
          </div>
        )}

        {query.trim() && totalMatches === 0 && (
          <div className="text-center py-12 text-surface-400 text-sm">
            No matching records found for "{query}".
          </div>
        )}
      </div>
    </div>
  )
}
