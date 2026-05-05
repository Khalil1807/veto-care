# Dr Paws 🐾

> **Smart veterinary care — connecting pet owners with trusted specialists.**

---

## Problem Statement

Pet owners struggle to find and book reliable veterinary care. The traditional process involves:

- Searching for vets through word-of-mouth or unverified directories
- No centralized system to book or track appointments
- No digital access to pet medical records or vaccination history
- Lack of visibility into specialist availability
- Communication gaps between owners and veterinarians

Veterinarians equally lack a modern digital platform to:

- Manage patient appointments efficiently
- Maintain digital medical records and vaccination logs
- Communicate with pet owners in real time
- View and manage their registered patient base

---

## Solution

**Dr Paws** is a full-stack web platform that bridges the gap between pet owners and veterinary specialists. It provides a clean, role-based experience for two types of users:

- **For Pet Owners (Patients):** Search for specialists, book appointments, manage pet profiles, and access medical records — all from one dashboard.
- **For Veterinarians (Doctors):** Manage appointments, log medical records, add vaccinations, view patient lists, and handle pet owner relationships from a dedicated professional dashboard.

---

## Technology Stack

### Frontend
- **Framework:** Next.js 16.2 (App Router)
- **Language:** TypeScript
- **Styling:** Tailwind CSS v4 + `tw-animate-css`
- **Component Library:** shadcn/ui (`@base-ui/react`, `class-variance-authority`, `tailwind-merge`)
- **Icons:** `lucide-react`

### Backend & Services
- **Backend:** Supabase (`@supabase/supabase-js`)
  - Authentication (role-based: Patient / Doctor)
  - PostgreSQL Database
  - Real-time data subscriptions
  - File storage (pet images, medical record PDFs)

### Development Tools
- **Build Tool:** Next.js (Turbopack / Webpack)
- **Linting:** ESLint + `eslint-config-next`
- **Package Manager:** npm
- **Language Tooling:** TypeScript 5

---

## Features

### For Pet Owners (Patients)

#### 1. Authentication & Profile
- Sign up and log in as a Patient
- Role-based access — Patient dashboard is isolated from the Doctor view
- Manage personal profile and account settings

#### 2. Pet Management
- Register and manage multiple pet profiles
- Store pet details: name, species, breed, age, weight, photo
- View each pet's medical history and vaccination records

#### 3. Specialist Search
- Browse and search for veterinary specialists
- Filter by specialization or location
- View doctor profiles before booking

#### 4. Appointment Booking
- Book appointments with preferred specialists in minutes
- Track appointment status (pending approval, confirmed, completed)
- View appointment history

#### 5. Medical Records
- Access pet medical records logged by the veterinarian
- View attached documents and clinical notes

---

### For Veterinarians (Doctors)

#### 1. Authentication & Profile
- Secure login as a Doctor
- Role-based dashboard separate from the Patient interface
- Manage professional profile and clinic information

#### 2. Dashboard Overview
- Quick stats: pending appointments, total registered patients
- Quick Actions: Log a medical record or add a vaccination in one click

#### 3. Appointment Management
- View and manage all appointments (pending, confirmed, completed)
- Approve or decline appointment requests
- Add clinical notes to completed appointments

#### 4. Patient Management
- View all registered patients (pets)
- Access each pet's full medical history
- Review pet owner information

#### 5. Pet Owner Directory
- Browse associated pet owners
- Access owner contact details and their registered pets

#### 6. Vaccinations
- Log vaccination records for patients
- Track vaccination history per pet

#### 7. Medical Records
- Create and manage digital medical records
- Attach clinical observations and documents per appointment

---

## Architecture

### Project Structure

```
veto-care/
├── public/
│   └── logo.png                  # Dr Paws logo
├── src/
│   ├── app/
│   │   ├── layout.tsx            # Root layout
│   │   ├── page.tsx              # Landing page
│   │   ├── login/                # Authentication pages
│   │   ├── dashboard/            # Patient dashboard
│   │   │   ├── page.tsx          # Dashboard home
│   │   │   ├── appointments/     # My Appointments
│   │   │   ├── pets/             # My Pets
│   │   │   ├── specialists/      # Specialists search
│   │   │   ├── medical-records/  # Medical Records
│   │   │   └── profile/          # My Profile
│   │   └── doctor/               # Doctor dashboard
│   │       ├── page.tsx          # Doctor dashboard home
│   │       ├── appointments/     # Appointment management
│   │       ├── patients/         # Patient list
│   │       ├── pet-owners/       # Pet owner directory
│   │       ├── vaccinations/     # Vaccination records
│   │       ├── medical-records/  # Medical records management
│   │       └── profile/          # Doctor profile
│   ├── components/
│   │   ├── ui/                   # shadcn/ui base components
│   │   ├── patient/              # Patient-specific components
│   │   │   ├── Sidebar.tsx
│   │   │   └── Navbar.tsx
│   │   └── doctor/               # Doctor-specific components
│   │       ├── Sidebar.tsx
│   │       └── Navbar.tsx
│   └── lib/
│       ├── supabase.ts           # Supabase client
│       └── utils.ts              # Utility helpers
├── .env.local                    # Environment variables
├── next.config.ts                # Next.js configuration
├── tailwind.config.ts            # Tailwind configuration
├── tsconfig.json                 # TypeScript configuration
└── package.json
```

### Database Schema

#### Tables

- **`users`** — User profiles (shared)
  - `id` (UUID, references auth.users)
  - `full_name`, `email`, `phone`
  - `role` (`patient` | `doctor`)
  - `avatar_url`, `created_at`

- **`doctor_profiles`** — Veterinarian details
  - `id` (UUID, references users)
  - `specialization`, `clinic_name`
  - `license_number`, `bio`
  - `created_at`, `updated_at`

- **`pets`** — Pet profiles
  - `id`, `owner_id` (references users)
  - `name`, `species`, `breed`
  - `age`, `weight`, `image_url`
  - `created_at`

- **`appointments`** — Appointment records
  - `id`, `owner_id`, `doctor_id`, `pet_id`
  - `scheduled_date`, `scheduled_time`
  - `status` (`pending` | `confirmed` | `completed` | `cancelled`)
  - `reason`, `notes`
  - `created_at`, `updated_at`

- **`medical_records`** — Clinical records per pet
  - `id`, `pet_id`, `doctor_id`, `appointment_id`
  - `diagnosis`, `treatment`, `notes`
  - `document_url`
  - `created_at`

- **`vaccinations`** — Vaccination history
  - `id`, `pet_id`, `doctor_id`
  - `vaccine_name`, `date_administered`
  - `next_due_date`, `notes`
  - `created_at`

---

### Authentication Flow

```
Patient Login                      Doctor Login
      │                                  │
      ▼                                  ▼
Supabase Auth.signInWithPassword   Supabase Auth.signInWithPassword
      │                                  │
      ▼                                  ▼
 Check role = "patient"            Check role = "doctor"
      │                                  │
      ▼                                  ▼
Redirect to /dashboard             Redirect to /doctor
```

---

### Routing Architecture

```
/                          → Landing Page
/login                     → Login / Sign Up

// Patient Routes (Protected)
/dashboard                 → Patient Dashboard Home
/dashboard/appointments    → My Appointments
/dashboard/pets            → My Pets
/dashboard/specialists     → Find Specialists
/dashboard/medical-records → Medical Records
/dashboard/profile         → My Profile

// Doctor Routes (Protected)
/doctor                    → Doctor Dashboard Home
/doctor/appointments       → Manage Appointments
/doctor/patients           → Patient List
/doctor/pet-owners         → Pet Owner Directory
/doctor/vaccinations       → Vaccination Records
/doctor/medical-records    → Medical Records
/doctor/profile            → Doctor Profile
```

---

## Screenshots

### Patient Interface

![Patient Dashboard](screenshots/patient-dashboard.png)
*Patient dashboard with appointment stats and quick booking*

### Doctor Interface

![Doctor Dashboard](screenshots/doctor-dashboard.png)
*Doctor dashboard with patient stats and quick actions*

---

## Setup & Installation

### 1. Clone the repository

```bash
git clone https://github.com/your-username/veto-care.git
cd veto-care
```

### 2. Install dependencies

```bash
npm install
```

### 3. Configure environment variables

Create a `.env.local` file at the root:

```env
NEXT_PUBLIC_SUPABASE_URL=your_supabase_project_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_supabase_service_role_key
```

### 4. Set up the database

Run the provided SQL migration files in your Supabase SQL editor to create all required tables, RLS policies, and seed data.

### 5. Start the development server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

---

## Available Scripts

| Script | Description |
|--------|-------------|
| `npm run dev` | Start development server at http://localhost:3000 |
| `npm run build` | Build for production |
| `npm start` | Start production server |
| `npm run lint` | Run ESLint |

---

## License

© 2026 Dr Paws — Smart veterinary care, simplified.
