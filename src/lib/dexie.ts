import Dexie, { Table } from 'dexie'
import type {
  Student,
  Class,
  Stream,
  AttendanceSession,
  AttendanceRecord,
  StudentMark,
  Term,
  AcademicYear,
  Subject,
} from '@/types'

// =============================================
// ZentraOS Offline DB (IndexedDB via Dexie)
// =============================================

interface SyncQueueItem {
  id?: number
  table_name: string
  operation: 'insert' | 'update' | 'delete'
  record_id: string
  data: Record<string, unknown>
  created_at: number
  retries: number
  error?: string
}

export class ZentraDB extends Dexie {
  // Cached remote data (read-only mirror)
  students!: Table<Student>
  classes!: Table<Class>
  streams!: Table<Stream>
  terms!: Table<Term>
  academic_years!: Table<AcademicYear>
  subjects!: Table<Subject>

  // Locally created attendance (offline write)
  attendance_sessions!: Table<AttendanceSession>
  attendance_records!: Table<AttendanceRecord>
  student_marks!: Table<StudentMark>

  // Sync queue — mutations waiting to be pushed to Supabase
  sync_queue!: Table<SyncQueueItem>

  // Metadata
  meta!: Table<{ key: string; value: string }>

  constructor() {
    super('ZentraOS')
    this.version(1).stores({
      students: 'id, institution_id, admission_number, current_class_id, status',
      classes: 'id, institution_id, academic_year_id',
      streams: 'id, institution_id, class_id',
      terms: 'id, institution_id, academic_year_id, is_current',
      academic_years: 'id, institution_id, is_current',
      subjects: 'id, institution_id',
      attendance_sessions: 'id, institution_id, class_id, date, term_id',
      attendance_records: 'id, session_id, student_id',
      student_marks: 'id, exam_id, student_id',
      sync_queue: '++id, table_name, operation, created_at',
      meta: 'key',
    })
  }
}

export const db = new ZentraDB()

// ---- Sync Queue Helpers --------------------

export async function enqueueSync(
  table_name: string,
  operation: 'insert' | 'update' | 'delete',
  record_id: string,
  data: Record<string, unknown>
) {
  await db.sync_queue.add({
    table_name,
    operation,
    record_id,
    data,
    created_at: Date.now(),
    retries: 0,
  })
}

export async function getPendingSyncCount(): Promise<number> {
  return db.sync_queue.count()
}

export async function clearSyncQueue() {
  await db.sync_queue.clear()
}

// ---- Meta Helpers -------------------------

export async function getMeta(key: string): Promise<string | undefined> {
  const row = await db.meta.get(key)
  return row?.value
}

export async function setMeta(key: string, value: string) {
  await db.meta.put({ key, value })
}
