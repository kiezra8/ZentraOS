-- ==========================================================
-- ZentraOS — Multi-Tenant School Management System Schema
-- Postgres / Supabase Migration
-- ==========================================================

-- Enable UUID extension
create extension if not exists "uuid-ossp";

-- 1. INSTITUTIONS TABLE
create table if not exists institutions (
    id uuid primary key default uuid_generate_v4(),
    name text not null,
    code text not null unique,
    type text not null check (type in ('nursery', 'primary', 'secondary', 'nursing', 'other')),
    logo_url text,
    address text,
    phone text,
    email text,
    website text,
    country text not null default 'Uganda',
    region text,
    district text,
    motto text,
    subscription_plan text not null default 'starter' check (subscription_plan in ('trial', 'starter', 'professional', 'enterprise')),
    subscription_status text not null default 'trial' check (subscription_status in ('trial', 'active', 'suspended', 'cancelled')),
    trial_ends_at timestamptz,
    settings jsonb not null default '{}'::jsonb,
    created_at timestamptz not null default now(),
    updated_at timestamptz not null default now()
);

-- 2. USER PROFILES
create table if not exists profiles (
    id uuid primary key references auth.users(id) on delete cascade,
    full_name text not null,
    phone text,
    avatar_url text,
    gender text check (gender in ('male', 'female', 'other')),
    date_of_birth date,
    address text,
    created_at timestamptz not null default now()
);

-- 3. INSTITUTION USERS (User <-> Institution membership)
create table if not exists institution_users (
    id uuid primary key default uuid_generate_v4(),
    institution_id uuid not null references institutions(id) on delete cascade,
    user_id uuid not null references auth.users(id) on delete cascade,
    role text not null check (role in (
        'super_admin', 'school_admin', 'head_teacher', 'deputy_head',
        'registrar', 'teacher', 'bursar', 'nurse', 'librarian',
        'storekeeper', 'parent', 'student'
    )),
    is_active boolean not null default true,
    created_at timestamptz not null default now(),
    unique (institution_id, user_id)
);

-- 4. ACADEMIC YEARS
create table if not exists academic_years (
    id uuid primary key default uuid_generate_v4(),
    institution_id uuid not null references institutions(id) on delete cascade,
    name text not null,
    start_date date not null,
    end_date date not null,
    is_current boolean not null default false,
    status text not null default 'active' check (status in ('active', 'completed', 'upcoming')),
    created_at timestamptz not null default now()
);

-- 5. TERMS / SEMESTERS
create table if not exists terms (
    id uuid primary key default uuid_generate_v4(),
    institution_id uuid not null references institutions(id) on delete cascade,
    academic_year_id uuid not null references academic_years(id) on delete cascade,
    name text not null,
    type text not null default 'term' check (type in ('term', 'semester')),
    start_date date not null,
    end_date date not null,
    is_current boolean not null default false
);

-- 6. CLASSES
create table if not exists classes (
    id uuid primary key default uuid_generate_v4(),
    institution_id uuid not null references institutions(id) on delete cascade,
    academic_year_id uuid not null references academic_years(id) on delete cascade,
    name text not null,
    level integer not null,
    type text,
    capacity integer default 60,
    created_at timestamptz not null default now()
);

-- 7. STREAMS
create table if not exists streams (
    id uuid primary key default uuid_generate_v4(),
    institution_id uuid not null references institutions(id) on delete cascade,
    class_id uuid not null references classes(id) on delete cascade,
    name text not null,
    class_teacher_id uuid,
    created_at timestamptz not null default now()
);

-- 8. SUBJECTS
create table if not exists subjects (
    id uuid primary key default uuid_generate_v4(),
    institution_id uuid not null references institutions(id) on delete cascade,
    name text not null,
    code text,
    type text not null default 'theory' check (type in ('theory', 'practical', 'clinical')),
    is_elective boolean not null default false,
    created_at timestamptz not null default now()
);

-- 9. STUDENTS
create table if not exists students (
    id uuid primary key default uuid_generate_v4(),
    institution_id uuid not null references institutions(id) on delete cascade,
    admission_number text not null,
    first_name text not null,
    last_name text not null,
    middle_name text,
    date_of_birth date not null,
    gender text not null check (gender in ('male', 'female', 'other')),
    nationality text default 'Ugandan',
    address text,
    phone text,
    email text,
    photo_url text,
    previous_school text,
    admission_date date not null default current_date,
    status text not null default 'active' check (status in ('active', 'graduated', 'transferred', 'suspended', 'withdrawn', 'deceased')),
    special_needs text,
    medical_notes text,
    allergies text,
    blood_group text,
    emergency_contact_name text,
    emergency_contact_phone text,
    current_class_id uuid references classes(id) on delete set null,
    current_stream_id uuid references streams(id) on delete set null,
    created_at timestamptz not null default now(),
    updated_at timestamptz not null default now(),
    unique (institution_id, admission_number)
);

-- 10. PARENTS & GUARDIANS
create table if not exists parents (
    id uuid primary key default uuid_generate_v4(),
    institution_id uuid not null references institutions(id) on delete cascade,
    user_id uuid references auth.users(id) on delete set null,
    full_name text not null,
    phone text not null,
    email text,
    address text,
    occupation text,
    created_at timestamptz not null default now()
);

-- 11. PARENT <-> STUDENT RELATIONSHIPS
create table if not exists parent_students (
    id uuid primary key default uuid_generate_v4(),
    parent_id uuid not null references parents(id) on delete cascade,
    student_id uuid not null references students(id) on delete cascade,
    relationship text not null,
    is_primary_contact boolean not null default true,
    is_emergency_contact boolean not null default true,
    unique (parent_id, student_id)
);

-- 12. STAFF
create table if not exists staff (
    id uuid primary key default uuid_generate_v4(),
    institution_id uuid not null references institutions(id) on delete cascade,
    user_id uuid references auth.users(id) on delete set null,
    staff_number text not null,
    first_name text not null,
    last_name text not null,
    gender text not null check (gender in ('male', 'female', 'other')),
    date_of_birth date,
    phone text,
    email text,
    address text,
    position text not null,
    employment_type text not null default 'full_time' check (employment_type in ('full_time', 'part_time', 'contract', 'volunteer')),
    employment_date date,
    qualification text,
    photo_url text,
    status text not null default 'active' check (status in ('active', 'inactive', 'on_leave', 'terminated')),
    created_at timestamptz not null default now(),
    unique (institution_id, staff_number)
);

-- 13. ATTENDANCE SESSIONS & RECORDS
create table if not exists attendance_sessions (
    id uuid primary key default uuid_generate_v4(),
    institution_id uuid not null references institutions(id) on delete cascade,
    class_id uuid not null references classes(id) on delete cascade,
    stream_id uuid references streams(id) on delete set null,
    subject_id uuid references subjects(id) on delete set null,
    date date not null,
    period text,
    term_id uuid not null references terms(id) on delete cascade,
    taken_by text not null,
    created_at timestamptz not null default now()
);

create table if not exists attendance_records (
    id uuid primary key default uuid_generate_v4(),
    session_id uuid not null references attendance_sessions(id) on delete cascade,
    student_id uuid not null references students(id) on delete cascade,
    status text not null check (status in ('present', 'absent', 'late', 'excused')),
    notes text,
    created_at timestamptz not null default now(),
    unique (session_id, student_id)
);

-- 14. EXAMS & MARKS
create table if not exists exams (
    id uuid primary key default uuid_generate_v4(),
    institution_id uuid not null references institutions(id) on delete cascade,
    name text not null,
    exam_type text not null check (exam_type in ('cat', 'midterm', 'endterm', 'coursework', 'practical', 'clinical')),
    class_id uuid not null references classes(id) on delete cascade,
    subject_id uuid not null references subjects(id) on delete cascade,
    term_id uuid not null references terms(id) on delete cascade,
    academic_year_id uuid not null references academic_years(id) on delete cascade,
    date date,
    max_marks numeric not null default 100,
    pass_marks numeric default 50,
    weight_percentage numeric default 100,
    created_at timestamptz not null default now()
);

create table if not exists student_marks (
    id uuid primary key default uuid_generate_v4(),
    exam_id uuid not null references exams(id) on delete cascade,
    student_id uuid not null references students(id) on delete cascade,
    marks_obtained numeric not null,
    grade text,
    remarks text,
    entered_by text not null,
    entered_at timestamptz not null default now(),
    is_published boolean not null default true,
    unique (exam_id, student_id)
);

-- 15. FEES, INVOICES & PAYMENTS
create table if not exists fee_structures (
    id uuid primary key default uuid_generate_v4(),
    institution_id uuid not null references institutions(id) on delete cascade,
    academic_year_id uuid not null references academic_years(id) on delete cascade,
    term_id uuid references terms(id) on delete set null,
    class_id uuid references classes(id) on delete set null,
    name text not null,
    description text,
    amount numeric not null,
    currency text not null default 'UGX',
    fee_type text not null check (fee_type in ('tuition', 'boarding', 'meals', 'transport', 'uniform', 'exam', 'registration', 'other')),
    is_mandatory boolean not null default true,
    created_at timestamptz not null default now()
);

create table if not exists student_invoices (
    id uuid primary key default uuid_generate_v4(),
    institution_id uuid not null references institutions(id) on delete cascade,
    student_id uuid not null references students(id) on delete cascade,
    academic_year_id uuid not null references academic_years(id) on delete cascade,
    term_id uuid not null references terms(id) on delete cascade,
    total_amount numeric not null default 0,
    total_paid numeric not null default 0,
    balance numeric not null default 0,
    status text not null default 'outstanding' check (status in ('paid', 'partial', 'outstanding', 'overdue')),
    due_date date,
    created_at timestamptz not null default now()
);

create table if not exists payments (
    id uuid primary key default uuid_generate_v4(),
    institution_id uuid not null references institutions(id) on delete cascade,
    invoice_id uuid not null references student_invoices(id) on delete cascade,
    student_id uuid not null references students(id) on delete cascade,
    amount numeric not null,
    currency text not null default 'UGX',
    payment_method text not null,
    reference_number text,
    received_by text not null,
    notes text,
    payment_date date not null default current_date,
    created_at timestamptz not null default now()
);

-- 16. AUDIT LOGS
create table if not exists audit_logs (
    id uuid primary key default uuid_generate_v4(),
    institution_id uuid not null references institutions(id) on delete cascade,
    user_id text not null,
    action text not null,
    table_name text not null,
    record_id text,
    old_values jsonb,
    new_values jsonb,
    ip_address text,
    created_at timestamptz not null default now()
);

-- ROW LEVEL SECURITY (RLS) ENABLEMENT
alter table institutions enable row level security;
alter table academic_years enable row level security;
alter table terms enable row level security;
alter table classes enable row level security;
alter table streams enable row level security;
alter table subjects enable row level security;
alter table students enable row level security;
alter table parents enable row level security;
alter table staff enable row level security;
alter table attendance_sessions enable row level security;
alter table attendance_records enable row level security;
alter table exams enable row level security;
alter table student_marks enable row level security;
alter table fee_structures enable row level security;
alter table student_invoices enable row level security;
alter table payments enable row level security;
alter table audit_logs enable row level security;

-- Basic multi-tenant RLS policy helper
create or replace function get_user_institution_id()
returns uuid
language sql
security definer
stable
as $$
  select institution_id from institution_users
  where user_id = auth.uid() and is_active = true
  limit 1;
$$;
