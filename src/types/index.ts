// =============================================
// ZentraOS — Global TypeScript Types
// =============================================

// ---- Enums & Literal Types -------------------

export type InstitutionType = 'nursery' | 'primary' | 'secondary' | 'nursing' | 'other';
export type UserRole =
  | 'super_admin'
  | 'school_admin'
  | 'head_teacher'
  | 'deputy_head'
  | 'registrar'
  | 'teacher'
  | 'bursar'
  | 'nurse'
  | 'librarian'
  | 'storekeeper'
  | 'parent'
  | 'student';

export type StudentStatus = 'active' | 'graduated' | 'transferred' | 'suspended' | 'withdrawn' | 'deceased';
export type Gender = 'male' | 'female' | 'other';
export type AttendanceStatus = 'present' | 'absent' | 'late' | 'excused';
export type PaymentStatus = 'paid' | 'partial' | 'outstanding' | 'overdue';
export type SubscriptionPlan = 'trial' | 'starter' | 'professional' | 'enterprise';
export type SubscriptionStatus = 'trial' | 'active' | 'suspended' | 'cancelled';
export type TermType = 'term' | 'semester';
export type EmploymentType = 'full_time' | 'part_time' | 'contract' | 'volunteer';
export type StaffStatus = 'active' | 'inactive' | 'on_leave' | 'terminated';
export type ExamType = 'cat' | 'midterm' | 'endterm' | 'coursework' | 'practical' | 'clinical';
export type FeeType = 'tuition' | 'boarding' | 'meals' | 'transport' | 'uniform' | 'exam' | 'registration' | 'other';
export type ConnectivityStatus = 'online' | 'offline' | 'syncing' | 'sync_complete' | 'sync_error';

// ---- Institution -------------------------

export interface Institution {
  id: string;
  name: string;
  code: string;
  type: InstitutionType;
  logo_url?: string;
  address?: string;
  phone?: string;
  email?: string;
  website?: string;
  country: string;
  region?: string;
  district?: string;
  motto?: string;
  subscription_plan: SubscriptionPlan;
  subscription_status: SubscriptionStatus;
  trial_ends_at?: string;
  settings: InstitutionSettings;
  created_at: string;
  updated_at: string;
}

export interface InstitutionSettings {
  currency: string;           // default 'UGX'
  date_format: string;
  modules_enabled: string[];  // ['students','fees','attendance','exams',...]
  grading_system_id?: string;
  enable_streams: boolean;
  enable_health_module: boolean;
  enable_library: boolean;
  enable_inventory: boolean;
  enable_parent_portal: boolean;
  enable_student_portal: boolean;
  academic_structure: AcademicStructureConfig;
}

export interface AcademicStructureConfig {
  class_levels: ClassLevel[];
  uses_streams: boolean;
  uses_departments: boolean;
  uses_combinations: boolean; // A-level subject combos
}

export interface ClassLevel {
  id: string;
  name: string;          // e.g. "P1", "S1", "Baby Class", "Year 1"
  order: number;
  section?: string;      // e.g. "Primary", "O-Level", "A-Level"
}

// ---- User & Profile -------------------------

export interface Profile {
  id: string;
  full_name: string;
  phone?: string;
  avatar_url?: string;
  gender?: Gender;
  date_of_birth?: string;
  address?: string;
  created_at: string;
}

export interface InstitutionUser {
  id: string;
  institution_id: string;
  user_id: string;
  role: UserRole;
  is_active: boolean;
  created_at: string;
  profile?: Profile;
}

export interface AuthUser {
  id: string;
  email: string;
  profile: Profile;
  institution_id: string;
  role: UserRole;
  institution: Institution;
}

// ---- Academic Structure --------------------

export interface AcademicYear {
  id: string;
  institution_id: string;
  name: string;
  start_date: string;
  end_date: string;
  is_current: boolean;
  status: 'active' | 'completed' | 'upcoming';
  created_at: string;
}

export interface Term {
  id: string;
  institution_id: string;
  academic_year_id: string;
  name: string;
  type: TermType;
  start_date: string;
  end_date: string;
  is_current: boolean;
  academic_year?: AcademicYear;
}

export interface Department {
  id: string;
  institution_id: string;
  name: string;
  head_staff_id?: string;
  created_at: string;
}

export interface Class {
  id: string;
  institution_id: string;
  academic_year_id: string;
  name: string;
  level: number;
  type?: string;
  department_id?: string;
  capacity?: number;
  created_at: string;
  academic_year?: AcademicYear;
  department?: Department;
  streams?: Stream[];
}

export interface Stream {
  id: string;
  institution_id: string;
  class_id: string;
  name: string;
  class_teacher_id?: string;
  created_at: string;
  class?: Class;
  class_teacher?: Staff;
  student_count?: number;
}

export interface Subject {
  id: string;
  institution_id: string;
  name: string;
  code?: string;
  type: 'theory' | 'practical' | 'clinical';
  department_id?: string;
  is_elective: boolean;
  created_at: string;
}

export interface ClassSubject {
  id: string;
  class_id: string;
  subject_id: string;
  teacher_id?: string;
  term_id?: string;
  subject?: Subject;
  teacher?: Staff;
}

// ---- Student & Parent ----------------------

export interface Student {
  id: string;
  institution_id: string;
  admission_number: string;
  first_name: string;
  last_name: string;
  middle_name?: string;
  date_of_birth: string;
  gender: Gender;
  nationality?: string;
  address?: string;
  phone?: string;
  email?: string;
  photo_url?: string;
  previous_school?: string;
  admission_date: string;
  status: StudentStatus;
  special_needs?: string;
  medical_notes?: string;
  allergies?: string;
  blood_group?: string;
  emergency_contact_name?: string;
  emergency_contact_phone?: string;
  current_class_id?: string;
  current_stream_id?: string;
  created_at: string;
  updated_at: string;
  // joined
  current_class?: Class;
  current_stream?: Stream;
  parents?: ParentStudent[];
}

export interface Parent {
  id: string;
  institution_id: string;
  user_id?: string;
  full_name: string;
  phone: string;
  email?: string;
  address?: string;
  occupation?: string;
  created_at: string;
  children?: ParentStudent[];
}

export interface ParentStudent {
  id: string;
  parent_id: string;
  student_id: string;
  relationship: string;
  is_primary_contact: boolean;
  is_emergency_contact: boolean;
  parent?: Parent;
  student?: Student;
}

// ---- Staff ----------------------------------

export interface Staff {
  id: string;
  institution_id: string;
  user_id?: string;
  staff_number: string;
  first_name: string;
  last_name: string;
  gender: Gender;
  date_of_birth?: string;
  phone?: string;
  email?: string;
  address?: string;
  position: string;
  department_id?: string;
  employment_type: EmploymentType;
  employment_date?: string;
  qualification?: string;
  photo_url?: string;
  status: StaffStatus;
  created_at: string;
  department?: Department;
}

// ---- Attendance ----------------------------

export interface AttendanceSession {
  id: string;
  institution_id: string;
  class_id: string;
  stream_id?: string;
  subject_id?: string;
  date: string;
  period?: string;
  term_id: string;
  taken_by: string;
  created_at: string;
  class?: Class;
  stream?: Stream;
}

export interface AttendanceRecord {
  id: string;
  session_id: string;
  student_id: string;
  status: AttendanceStatus;
  notes?: string;
  created_at: string;
  student?: Student;
}

// ---- Exams & Results -----------------------

export interface GradingSystem {
  id: string;
  institution_id: string;
  name: string;
  is_default: boolean;
  scales: GradingScale[];
}

export interface GradingScale {
  id: string;
  grading_system_id: string;
  grade: string;      // e.g. "A", "B", "D1"
  min_score: number;
  max_score: number;
  points?: number;
  description?: string;
}

export interface Exam {
  id: string;
  institution_id: string;
  name: string;
  exam_type: ExamType;
  class_id: string;
  subject_id: string;
  term_id: string;
  academic_year_id: string;
  date?: string;
  max_marks: number;
  pass_marks?: number;
  weight_percentage?: number;
  created_at: string;
  class?: Class;
  subject?: Subject;
}

export interface StudentMark {
  id: string;
  exam_id: string;
  student_id: string;
  marks_obtained: number;
  grade?: string;
  remarks?: string;
  entered_by: string;
  entered_at: string;
  is_published: boolean;
  student?: Student;
  exam?: Exam;
}

// ---- Fees & Finance -------------------------

export interface FeeStructure {
  id: string;
  institution_id: string;
  academic_year_id: string;
  term_id?: string;
  class_id?: string;
  name: string;
  description?: string;
  amount: number;
  currency: string;
  fee_type: FeeType;
  is_mandatory: boolean;
  created_at: string;
}

export interface StudentInvoice {
  id: string;
  institution_id: string;
  student_id: string;
  academic_year_id: string;
  term_id: string;
  total_amount: number;
  total_paid: number;
  balance: number;
  status: PaymentStatus;
  due_date?: string;
  created_at: string;
  student?: Student;
  items?: InvoiceItem[];
  payments?: Payment[];
}

export interface InvoiceItem {
  id: string;
  invoice_id: string;
  fee_structure_id?: string;
  description: string;
  amount: number;
}

export interface Payment {
  id: string;
  institution_id: string;
  invoice_id: string;
  student_id: string;
  amount: number;
  currency: string;
  payment_method: string;
  reference_number?: string;
  received_by: string;
  notes?: string;
  payment_date: string;
  created_at: string;
  receipt?: Receipt;
  student?: Student;
}

export interface Receipt {
  id: string;
  payment_id: string;
  receipt_number: string;
  issued_at: string;
  issued_by: string;
}

// ---- Audit Logs ----------------------------

export interface AuditLog {
  id: string;
  institution_id: string;
  user_id: string;
  action: string;
  table_name: string;
  record_id?: string;
  old_values?: Record<string, unknown>;
  new_values?: Record<string, unknown>;
  ip_address?: string;
  user_agent?: string;
  created_at: string;
  profile?: Profile;
}

// ---- UI Helpers ----------------------------

export interface SelectOption {
  value: string;
  label: string;
}

export interface TableColumn<T = Record<string, unknown>> {
  key: keyof T | string;
  header: string;
  render?: (row: T) => React.ReactNode;
  className?: string;
  sortable?: boolean;
}

export interface PaginationState {
  page: number;
  pageSize: number;
  total: number;
}

export interface FilterState {
  search: string;
  [key: string]: string | string[] | boolean | undefined;
}
