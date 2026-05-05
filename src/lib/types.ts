export type Profile = {
  id: string
  email: string
  full_name: string | null
  phone: string | null
  role: 'patient' | 'doctor'
  specialty?: string | null
  certificate_url?: string | null
  avatar_url?: string | null
  address?: string | null
  experience?: string | null
  bio?: string | null
  created_at?: string
}

export type Pet = {
  id: string
  owner_id: string
  name: string
  species: string | null
  breed: string | null
  age: number | null
  appointments?: any[]
}

export type Appointment = {
  id: string
  owner_id: string
  vet_id: string
  date: string
  pet_name: string // legacy
  pet_id?: string | null
  status: 'pending' | 'confirmed'
  health_record_url: string | null
  vet?: Profile // for joined queries
  owner?: Profile
  pet?: Pet
}
