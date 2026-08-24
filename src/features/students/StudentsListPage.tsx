import { useState, useMemo } from 'react'
import {
  GraduationCap, Plus, Search, Filter, Download, UserCheck,
  Eye, Edit2, Trash2, ArrowUpDown, UserPlus, Phone, MapPin, Sparkles
} from 'lucide-react'
import { SectionHeader, Card } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { Input, Select } from '@/components/ui/Input'
import { Badge } from '@/components/ui/Badge'
import { Modal, ConfirmDialog } from '@/components/ui/Modal'
import { DataTable } from '@/components/ui/DataTable'
import { useInstitutionStore } from '@/store/institution.store'
import { DataService } from '@/lib/dataService'
import { formatDate, getStudentStatusConfig, generateAdmissionNumber } from '@/lib/utils'
import { toast } from 'react-hot-toast'
import type { Student, StudentStatus, Gender } from '@/types'

export function StudentsListPage() {
  const { institution } = useInstitutionStore()
  const [students, setStudents] = useState(() => DataService.getStudents(institution?.id))
  const [classes] = useState(() => DataService.getClasses(institution?.id))
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedClass, setSelectedClass] = useState('')
  const [selectedStatus, setSelectedStatus] = useState<string>('')

  // Modal states
  const [isCreateOpen, setIsCreateOpen] = useState(false)
  const [isViewOpen, setIsViewOpen] = useState(false)
  const [activeStudent, setActiveStudent] = useState<Student | null>(null)
  const [studentToDelete, setStudentToDelete] = useState<Student | null>(null)

  // Form states
  const [firstName, setFirstName] = useState('')
  const [lastName, setLastName] = useState('')
  const [middleName, setMiddleName] = useState('')
  const [gender, setGender] = useState<Gender>('male')
  const [dob, setDob] = useState('2011-05-15')
  const [nationality, setNationality] = useState('Ugandan')
  const [admissionClass, setAdmissionClass] = useState(classes[0]?.id || '')
  const [phone, setPhone] = useState('')
  const [emergencyName, setEmergencyName] = useState('')
  const [emergencyPhone, setEmergencyPhone] = useState('')
  const [allergies, setAllergies] = useState('')
  const [previousSchool, setPreviousSchool] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)

  // Refresh list
  const refreshStudents = () => {
    setStudents(DataService.getStudents(institution?.id))
  }

  // Filtered students
  const filteredStudents = useMemo(() => {
    return students.filter(s => {
      const matchSearch =
        `${s.first_name} ${s.last_name} ${s.admission_number} ${s.address || ''}`
          .toLowerCase()
          .includes(searchTerm.toLowerCase())
      const matchClass = !selectedClass || s.current_class_id === selectedClass
      const matchStatus = !selectedStatus || s.status === selectedStatus
      return matchSearch && matchClass && matchStatus
    })
  }, [students, searchTerm, selectedClass, selectedStatus])

  async function handleCreateStudent(e: React.FormEvent) {
    e.preventDefault()
    setIsSubmitting(true)

    try {
      const nextSeq = students.length + 1
      const admNo = generateAdmissionNumber(`${institution?.code || 'SCH'}/2026/`, nextSeq)

      await DataService.createStudent({
        institution_id: institution?.id || 'inst-001',
        admission_number: admNo,
        first_name: firstName,
        last_name: lastName,
        middle_name: middleName,
        date_of_birth: dob,
        gender,
        nationality,
        phone,
        emergency_contact_name: emergencyName,
        emergency_contact_phone: emergencyPhone,
        allergies,
        previous_school: previousSchool,
        admission_date: new Date().toISOString().split('T')[0],
        status: 'active',
        current_class_id: admissionClass,
      })

      setIsSubmitting(false)
      setIsCreateOpen(false)
      refreshStudents()
      toast.success(`Student admitted successfully with ID ${admNo}!`)

      // Reset form
      setFirstName('')
      setLastName('')
      setMiddleName('')
      setPhone('')
      setEmergencyName('')
      setEmergencyPhone('')
    } catch (err) {
      setIsSubmitting(false)
      toast.error('Failed to create student record')
    }
  }

  async function handleDeleteStudent() {
    if (!studentToDelete) return
    await DataService.deleteStudent(studentToDelete.id)
    setStudentToDelete(null)
    refreshStudents()
    toast.success('Student record removed')
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <SectionHeader
        title="Student Directory"
        subtitle={`Manage enrollment, student bio data, class allocations, and guardian links (${students.length} students enrolled)`}
        action={
          <Button
            variant="primary"
            leftIcon={<UserPlus className="w-4 h-4" />}
            onClick={() => setIsCreateOpen(true)}
          >
            Admit New Student
          </Button>
        }
      />

      {/* Filter and Search Bar */}
      <div className="card p-4 space-y-3">
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <div className="sm:col-span-1">
            <Input
              placeholder="Search by name, admission no..."
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
              leftAdornment={<Search className="w-4 h-4" />}
            />
          </div>

          <div>
            <Select
              placeholder="All Classes & Streams"
              options={[
                { value: '', label: 'All Classes' },
                ...classes.map(c => ({ value: c.id, label: c.name })),
              ]}
              value={selectedClass}
              onChange={e => setSelectedClass(e.target.value)}
            />
          </div>

          <div>
            <Select
              placeholder="All Statuses"
              options={[
                { value: '', label: 'All Statuses' },
                { value: 'active', label: 'Active' },
                { value: 'graduated', label: 'Graduated' },
                { value: 'suspended', label: 'Suspended' },
                { value: 'transferred', label: 'Transferred' },
                { value: 'withdrawn', label: 'Withdrawn' },
              ]}
              value={selectedStatus}
              onChange={e => setSelectedStatus(e.target.value)}
            />
          </div>
        </div>
      </div>

      {/* Students Data Table */}
      <DataTable<Student & { current_class?: any; current_stream?: any }>
        data={filteredStudents as any}
        columns={[
          {
            key: 'admission_number',
            header: 'Adm No',
            className: 'font-mono text-xs font-semibold text-primary-700',
          },
          {
            key: 'full_name',
            header: 'Student Name',
            render: (row) => (
              <div>
                <div className="font-semibold text-surface-900">
                  {row.first_name} {row.middle_name ? `${row.middle_name} ` : ''}{row.last_name}
                </div>
                <div className="text-[11px] text-surface-400">
                  {row.gender.toUpperCase()} • DOB: {formatDate(row.date_of_birth)}
                </div>
              </div>
            ),
          },
          {
            key: 'class',
            header: 'Class / Stream',
            render: (row) => (
              <div>
                <div className="font-medium text-surface-800">{row.current_class?.name || 'Unassigned'}</div>
                <div className="text-[11px] text-surface-400">{row.current_stream?.name || 'Default Stream'}</div>
              </div>
            ),
          },
          {
            key: 'emergency',
            header: 'Emergency Contact',
            render: (row) => (
              <div className="text-xs">
                <div className="text-surface-700 font-medium">{row.emergency_contact_name || 'Guardian'}</div>
                <div className="text-surface-400">{row.emergency_contact_phone || '—'}</div>
              </div>
            ),
          },
          {
            key: 'status',
            header: 'Status',
            render: (row) => {
              const cfg = getStudentStatusConfig(row.status)
              return <Badge variant={cfg.className as any} dot>{cfg.label}</Badge>
            },
          },
          {
            key: 'actions',
            header: 'Actions',
            className: 'text-right',
            render: (row) => (
              <div className="flex items-center justify-end gap-1.5" onClick={e => e.stopPropagation()}>
                <button
                  onClick={() => { setActiveStudent(row); setIsViewOpen(true); }}
                  className="btn btn-ghost btn-sm p-1 text-surface-500 hover:text-primary-600"
                  title="View Full Profile"
                >
                  <Eye className="w-4 h-4" />
                </button>
                <button
                  onClick={() => setStudentToDelete(row)}
                  className="btn btn-ghost btn-sm p-1 text-surface-400 hover:text-red-600"
                  title="Delete Record"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            ),
          },
        ]}
      />

      {/* ADMISSION MODAL */}
      <Modal
        isOpen={isCreateOpen}
        onClose={() => setIsCreateOpen(false)}
        title="Admit New Student"
        description="Register a new learner into the institution's official database"
        size="lg"
      >
        <form onSubmit={handleCreateStudent} className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div>
              <label className="label">First Name *</label>
              <Input required value={firstName} onChange={e => setFirstName(e.target.value)} placeholder="e.g. Brian" />
            </div>
            <div>
              <label className="label">Last Name *</label>
              <Input required value={lastName} onChange={e => setLastName(e.target.value)} placeholder="e.g. Kigozi" />
            </div>
            <div>
              <label className="label">Middle Name</label>
              <Input value={middleName} onChange={e => setMiddleName(e.target.value)} placeholder="e.g. Paul" />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div>
              <label className="label">Gender *</label>
              <Select
                options={[
                  { value: 'male', label: 'Male' },
                  { value: 'female', label: 'Female' },
                ]}
                value={gender}
                onChange={e => setGender(e.target.value as Gender)}
              />
            </div>
            <div>
              <label className="label">Date of Birth *</label>
              <Input type="date" required value={dob} onChange={e => setDob(e.target.value)} />
            </div>
            <div>
              <label className="label">Nationality</label>
              <Input value={nationality} onChange={e => setNationality(e.target.value)} />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="label">Class Allocation *</label>
              <Select
                options={classes.map(c => ({ value: c.id, label: c.name }))}
                value={admissionClass}
                onChange={e => setAdmissionClass(e.target.value)}
              />
            </div>
            <div>
              <label className="label">Previous School & Grades</label>
              <Input value={previousSchool} onChange={e => setPreviousSchool(e.target.value)} placeholder="e.g. Greenhill Academy (Agg 5)" />
            </div>
          </div>

          <div className="p-3 bg-surface-50 rounded-xl border border-surface-200 space-y-3">
            <h4 className="text-xs font-bold uppercase tracking-wider text-surface-600">Guardian & Emergency Details</h4>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="label">Guardian Name</label>
                <Input value={emergencyName} onChange={e => setEmergencyName(e.target.value)} placeholder="e.g. Eng. Patrick Kigozi" />
              </div>
              <div>
                <label className="label">Guardian Phone Number</label>
                <Input value={emergencyPhone} onChange={e => setEmergencyPhone(e.target.value)} placeholder="+256 772 000000" />
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="label">Known Medical Allergies</label>
              <Input value={allergies} onChange={e => setAllergies(e.target.value)} placeholder="e.g. Peanuts, Penicillin, Asthmatic" />
            </div>
            <div>
              <label className="label">Student Phone / Email (Optional)</label>
              <Input value={phone} onChange={e => setPhone(e.target.value)} placeholder="+256..." />
            </div>
          </div>

          <div className="flex justify-end gap-2 pt-2 border-t border-surface-100">
            <Button variant="outline" type="button" onClick={() => setIsCreateOpen(false)}>
              Cancel
            </Button>
            <Button variant="primary" type="submit" isLoading={isSubmitting}>
              Complete Admission
            </Button>
          </div>
        </form>
      </Modal>

      {/* VIEW PROFILE MODAL */}
      <Modal
        isOpen={isViewOpen}
        onClose={() => setIsViewOpen(false)}
        title={activeStudent ? `${activeStudent.first_name} ${activeStudent.last_name}` : 'Student Profile'}
        size="lg"
      >
        {activeStudent && (
          <div className="space-y-4">
            <div className="flex items-center gap-4 p-4 rounded-2xl bg-gradient-to-r from-primary-50 to-indigo-50 border border-primary-100">
              <div className="w-16 h-16 rounded-2xl bg-primary-600 text-white font-bold text-xl flex items-center justify-center shadow-md">
                {activeStudent.first_name[0]}{activeStudent.last_name[0]}
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="text-lg font-bold text-surface-900">
                    {activeStudent.first_name} {activeStudent.middle_name} {activeStudent.last_name}
                  </h3>
                  <Badge variant="success" dot>Active</Badge>
                </div>
                <div className="text-xs text-surface-500 mt-0.5">
                  Admission No: <span className="font-mono font-semibold text-primary-700">{activeStudent.admission_number}</span> • Enrolled: {formatDate(activeStudent.admission_date)}
                </div>
              </div>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 text-xs">
              <div className="p-3 bg-surface-50 rounded-xl">
                <span className="text-surface-400 block">Gender</span>
                <span className="font-semibold text-surface-800 capitalize">{activeStudent.gender}</span>
              </div>
              <div className="p-3 bg-surface-50 rounded-xl">
                <span className="text-surface-400 block">Date of Birth</span>
                <span className="font-semibold text-surface-800">{formatDate(activeStudent.date_of_birth)}</span>
              </div>
              <div className="p-3 bg-surface-50 rounded-xl">
                <span className="text-surface-400 block">Nationality</span>
                <span className="font-semibold text-surface-800">{activeStudent.nationality || 'Ugandan'}</span>
              </div>
              <div className="p-3 bg-surface-50 rounded-xl">
                <span className="text-surface-400 block">Blood Group</span>
                <span className="font-semibold text-surface-800">{activeStudent.blood_group || 'O+'}</span>
              </div>
              <div className="p-3 bg-surface-50 rounded-xl">
                <span className="text-surface-400 block">Allergies / Special Needs</span>
                <span className="font-semibold text-surface-800">{activeStudent.allergies || 'None Recorded'}</span>
              </div>
              <div className="p-3 bg-surface-50 rounded-xl">
                <span className="text-surface-400 block">Previous School</span>
                <span className="font-semibold text-surface-800">{activeStudent.previous_school || '—'}</span>
              </div>
            </div>

            <div className="p-4 bg-surface-50 rounded-xl border border-surface-200 space-y-2">
              <h4 className="text-xs font-bold text-surface-700 uppercase tracking-wider">Guardian Contact Information</h4>
              <div className="flex items-center justify-between text-xs">
                <span className="text-surface-600">{activeStudent.emergency_contact_name || 'Patrick Kigozi (Father)'}</span>
                <span className="font-semibold text-primary-600">{activeStudent.emergency_contact_phone || '+256 772 400111'}</span>
              </div>
            </div>
          </div>
        )}
      </Modal>

      {/* DELETE CONFIRMATION */}
      <ConfirmDialog
        isOpen={!!studentToDelete}
        onClose={() => setStudentToDelete(null)}
        onConfirm={handleDeleteStudent}
        title="Delete Student Record"
        message={`Are you sure you want to remove ${studentToDelete?.first_name} ${studentToDelete?.last_name} (${studentToDelete?.admission_number})? This will archive all marks and invoices.`}
        confirmLabel="Delete Student"
      />
    </div>
  )
}
