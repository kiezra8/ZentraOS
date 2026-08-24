import { useState } from 'react'
import {
  UserCheck, Plus, Search, Phone, Mail, Award, UserPlus, Briefcase
} from 'lucide-react'
import { SectionHeader, Card } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { Input, Select } from '@/components/ui/Input'
import { Badge } from '@/components/ui/Badge'
import { Modal } from '@/components/ui/Modal'
import { DataTable } from '@/components/ui/DataTable'
import { useInstitutionStore } from '@/store/institution.store'
import { DataService } from '@/lib/dataService'
import { toast } from 'react-hot-toast'
import type { Staff, Gender, EmploymentType } from '@/types'

export function StaffListPage() {
  const { institution } = useInstitutionStore()
  const [staffList, setStaffList] = useState(() => DataService.getStaff(institution?.id))
  const [searchTerm, setSearchTerm] = useState('')
  const [isCreateOpen, setIsCreateOpen] = useState(false)

  // Form states
  const [firstName, setFirstName] = useState('')
  const [lastName, setLastName] = useState('')
  const [gender, setGender] = useState<Gender>('female')
  const [position, setPosition] = useState('')
  const [phone, setPhone] = useState('')
  const [email, setEmail] = useState('')
  const [employmentType, setEmploymentType] = useState<EmploymentType>('full_time')
  const [qualification, setQualification] = useState('')

  const filteredStaff = staffList.filter(s =>
    `${s.first_name} ${s.last_name} ${s.position} ${s.staff_number} ${s.phone || ''}`
      .toLowerCase()
      .includes(searchTerm.toLowerCase())
  )

  function handleCreateStaff(e: React.FormEvent) {
    e.preventDefault()
    const nextSeq = staffList.length + 1
    const staffNo = `STF/2026/${String(nextSeq).padStart(3, '0')}`

    DataService.createStaff({
      institution_id: institution?.id || 'inst-001',
      staff_number: staffNo,
      first_name: firstName,
      last_name: lastName,
      gender,
      position,
      phone,
      email,
      employment_type: employmentType,
      qualification,
      status: 'active',
    })

    setStaffList(DataService.getStaff(institution?.id))
    setIsCreateOpen(false)
    setFirstName('')
    setLastName('')
    setPosition('')
    setPhone('')
    setEmail('')
    toast.success(`Staff member appointed (${staffNo})!`)
  }

  return (
    <div className="space-y-6">
      <SectionHeader
        title="Teachers & Staff"
        subtitle="Manage educators, administrators, qualifications, and staff contracts"
        action={
          <Button
            variant="primary"
            leftIcon={<UserPlus className="w-4 h-4" />}
            onClick={() => setIsCreateOpen(true)}
          >
            Add Staff Member
          </Button>
        }
      />

      <div className="card p-4">
        <Input
          placeholder="Search staff by name, position, staff ID..."
          value={searchTerm}
          onChange={e => setSearchTerm(e.target.value)}
          leftAdornment={<Search className="w-4 h-4" />}
        />
      </div>

      <DataTable<Staff>
        data={filteredStaff}
        columns={[
          {
            key: 'staff_number',
            header: 'Staff ID',
            className: 'font-mono text-xs font-semibold text-primary-700',
          },
          {
            key: 'name',
            header: 'Staff Name',
            render: (row) => (
              <div>
                <div className="font-semibold text-surface-900">
                  {row.first_name} {row.last_name}
                </div>
                <div className="text-xs text-surface-500">{row.position}</div>
              </div>
            ),
          },
          {
            key: 'qualification',
            header: 'Academic Qualification',
            render: (row) => (
              <span className="text-xs text-surface-700">{row.qualification || '—'}</span>
            ),
          },
          {
            key: 'phone',
            header: 'Contact',
            render: (row) => (
              <div className="text-xs">
                <div className="text-surface-800 font-medium">{row.phone || '—'}</div>
                <div className="text-surface-400">{row.email || '—'}</div>
              </div>
            ),
          },
          {
            key: 'type',
            header: 'Contract',
            render: (row) => (
              <Badge variant="primary" className="capitalize text-xs">
                {row.employment_type.replace('_', ' ')}
              </Badge>
            ),
          },
          {
            key: 'status',
            header: 'Status',
            render: (row) => (
              <Badge variant="success" dot className="capitalize text-xs">
                {row.status}
              </Badge>
            ),
          },
        ]}
      />

      {/* CREATE MODAL */}
      <Modal
        isOpen={isCreateOpen}
        onClose={() => setIsCreateOpen(false)}
        title="Appoint New Staff Member"
        description="Register a teacher, bursar, nurse or administrative staff member"
      >
        <form onSubmit={handleCreateStaff} className="space-y-3">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="label">First Name *</label>
              <Input required value={firstName} onChange={e => setFirstName(e.target.value)} placeholder="e.g. Emmanuel" />
            </div>
            <div>
              <label className="label">Last Name *</label>
              <Input required value={lastName} onChange={e => setLastName(e.target.value)} placeholder="e.g. Okello" />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="label">Designation / Position *</label>
              <Input required value={position} onChange={e => setPosition(e.target.value)} placeholder="e.g. Mathematics Teacher" />
            </div>
            <div>
              <label className="label">Employment Type</label>
              <Select
                options={[
                  { value: 'full_time', label: 'Full Time' },
                  { value: 'part_time', label: 'Part Time' },
                  { value: 'contract', label: 'Fixed Term Contract' },
                ]}
                value={employmentType}
                onChange={e => setEmploymentType(e.target.value as EmploymentType)}
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="label">Telephone Number *</label>
              <Input required value={phone} onChange={e => setPhone(e.target.value)} placeholder="+256 700 000000" />
            </div>
            <div>
              <label className="label">Email Address</label>
              <Input type="email" value={email} onChange={e => setEmail(e.target.value)} placeholder="teacher@school.ug" />
            </div>
          </div>

          <div>
            <label className="label">Academic Qualifications</label>
            <Input value={qualification} onChange={e => setQualification(e.target.value)} placeholder="e.g. B.Sc with Education (Makerere University)" />
          </div>

          <div className="flex justify-end gap-2 pt-3 border-t border-surface-100">
            <Button variant="outline" type="button" onClick={() => setIsCreateOpen(false)}>
              Cancel
            </Button>
            <Button variant="primary" type="submit">
              Appoint Staff
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  )
}
