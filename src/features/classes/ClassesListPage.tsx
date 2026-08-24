import { useState } from 'react'
import {
  BookMarked, Plus, Users, Layers, ArrowRight, Shield
} from 'lucide-react'
import { SectionHeader, Card } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { Input, Select } from '@/components/ui/Input'
import { Badge } from '@/components/ui/Badge'
import { Modal } from '@/components/ui/Modal'
import { useInstitutionStore } from '@/store/institution.store'
import { DataService } from '@/lib/dataService'
import { toast } from 'react-hot-toast'
import type { Class, Stream } from '@/types'

export function ClassesListPage() {
  const { institution, currentAcademicYear } = useInstitutionStore()
  const [classes, setClasses] = useState(() => DataService.getClasses(institution?.id))
  const [isClassOpen, setIsClassOpen] = useState(false)
  const [isStreamOpen, setIsStreamOpen] = useState(false)
  const [activeClassId, setActiveClassId] = useState(classes[0]?.id || '')

  // New Class Form
  const [className, setClassName] = useState('')
  const [classLevel, setClassLevel] = useState('1')
  const [classType, setClassType] = useState('O-Level')
  const [capacity, setCapacity] = useState('60')

  // New Stream Form
  const [streamName, setStreamName] = useState('')

  function refreshClasses() {
    setClasses(DataService.getClasses(institution?.id))
  }

  function handleCreateClass(e: React.FormEvent) {
    e.preventDefault()
    DataService.createClass({
      institution_id: institution?.id || 'inst-001',
      academic_year_id: currentAcademicYear?.id || 'ay-2026',
      name: className,
      level: parseInt(classLevel) || 1,
      type: classType,
      capacity: parseInt(capacity) || 60,
    })

    refreshClasses()
    setIsClassOpen(false)
    setClassName('')
    toast.success(`Class ${className} created successfully!`)
  }

  function handleCreateStream(e: React.FormEvent) {
    e.preventDefault()
    DataService.createStream({
      institution_id: institution?.id || 'inst-001',
      class_id: activeClassId,
      name: streamName,
    })

    refreshClasses()
    setIsStreamOpen(false)
    setStreamName('')
    toast.success(`Stream created!`)
  }

  return (
    <div className="space-y-6">
      <SectionHeader
        title="Classes & Streams"
        subtitle="Manage grade levels, class streams, classroom capacities, and teacher assignments"
        action={
          <Button
            variant="primary"
            leftIcon={<Plus className="w-4 h-4" />}
            onClick={() => setIsClassOpen(true)}
          >
            Create Class
          </Button>
        }
      />

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {classes.map(c => (
          <div key={c.id} className="card space-y-3 p-5">
            <div className="flex items-start justify-between">
              <div>
                <h3 className="text-base font-bold text-surface-900">{c.name}</h3>
                <span className="badge badge-primary text-[10px] mt-0.5">{c.type || 'Standard'}</span>
              </div>
              <div className="text-right">
                <div className="text-sm font-bold text-primary-700">{c.studentCount} / {c.capacity}</div>
                <div className="text-[10px] text-surface-400">Capacity</div>
              </div>
            </div>

            {/* Streams */}
            <div className="pt-2 border-t border-surface-100">
              <div className="flex items-center justify-between text-xs mb-2">
                <span className="font-semibold text-surface-600">Active Streams ({c.streams?.length || 0})</span>
                <button
                  onClick={() => { setActiveClassId(c.id); setIsStreamOpen(true); }}
                  className="text-primary-600 font-semibold hover:underline"
                >
                  + Add Stream
                </button>
              </div>

              <div className="flex flex-wrap gap-1.5">
                {c.streams && c.streams.length > 0 ? (
                  c.streams.map(str => (
                    <span key={str.id} className="badge badge-surface text-xs">
                      {str.name}
                    </span>
                  ))
                ) : (
                  <span className="text-xs text-surface-400">No streams assigned</span>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* CREATE CLASS MODAL */}
      <Modal
        isOpen={isClassOpen}
        onClose={() => setIsClassOpen(false)}
        title="Create Class"
        description="Add a new academic class level to this institution"
      >
        <form onSubmit={handleCreateClass} className="space-y-3">
          <div>
            <label className="label">Class Title *</label>
            <Input required value={className} onChange={e => setClassName(e.target.value)} placeholder="e.g. Senior Five (S.5 Science)" />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="label">Level Order</label>
              <Input type="number" value={classLevel} onChange={e => setClassLevel(e.target.value)} />
            </div>
            <div>
              <label className="label">Section / Type</label>
              <Select
                options={[
                  { value: 'O-Level', label: 'O-Level' },
                  { value: 'A-Level', label: 'A-Level' },
                  { value: 'Primary', label: 'Primary' },
                  { value: 'Diploma', label: 'Diploma' },
                ]}
                value={classType}
                onChange={e => setClassType(e.target.value)}
              />
            </div>
          </div>

          <div>
            <label className="label">Maximum Student Capacity</label>
            <Input type="number" value={capacity} onChange={e => setCapacity(e.target.value)} />
          </div>

          <div className="flex justify-end gap-2 pt-3 border-t border-surface-100">
            <Button variant="outline" type="button" onClick={() => setIsClassOpen(false)}>
              Cancel
            </Button>
            <Button variant="primary" type="submit">
              Save Class
            </Button>
          </div>
        </form>
      </Modal>

      {/* CREATE STREAM MODAL */}
      <Modal
        isOpen={isStreamOpen}
        onClose={() => setIsStreamOpen(false)}
        title="Add Stream to Class"
        description="Create a sub-stream (e.g. Blue, Gold, North, Stream 1)"
      >
        <form onSubmit={handleCreateStream} className="space-y-3">
          <div>
            <label className="label">Stream Name *</label>
            <Input required value={streamName} onChange={e => setStreamName(e.target.value)} placeholder="e.g. Stream Blue (Science Wing)" />
          </div>

          <div className="flex justify-end gap-2 pt-3 border-t border-surface-100">
            <Button variant="outline" type="button" onClick={() => setIsStreamOpen(false)}>
              Cancel
            </Button>
            <Button variant="primary" type="submit">
              Add Stream
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  )
}
