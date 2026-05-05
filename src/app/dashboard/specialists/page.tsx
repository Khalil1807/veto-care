"use client"
import { useEffect, useState } from "react"
import { supabase } from "@/lib/supabase"
import { Profile } from "@/lib/types"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent } from "@/components/ui/card"
import Link from "next/link"
import { 
  Search, 
  Stethoscope, 
  MapPin, 
  Star, 
  CalendarPlus, 
  Loader2, 
  Filter,
  ChevronDown,
  UserCircle
} from "lucide-react"

type DoctorProfile = Profile & {
  address?: string | null
  experience?: string | null
  bio?: string | null
}

const SPECIALTIES = [
  "All Specialties",
  "General Practice",
  "Surgery",
  "Dermatology",
  "Cardiology",
  "Ophthalmology",
  "Dentistry",
  "Orthopedics",
  "Neurology",
  "Oncology",
  "Internal Medicine",
  "Emergency & Critical Care",
  "Exotic Animals",
  "Feline Specialist",
  "Equine Specialist",
]

const SPECIALTY_COLORS: Record<string, { bg: string; text: string; border: string }> = {
  "Surgery":                { bg: "bg-red-50",    text: "text-red-700",    border: "border-red-200" },
  "Dermatology":            { bg: "bg-amber-50",  text: "text-amber-700",  border: "border-amber-200" },
  "Cardiology":             { bg: "bg-pink-50",   text: "text-pink-700",   border: "border-pink-200" },
  "Ophthalmology":          { bg: "bg-indigo-50", text: "text-indigo-700", border: "border-indigo-200" },
  "Dentistry":              { bg: "bg-cyan-50",   text: "text-cyan-700",   border: "border-cyan-200" },
  "Orthopedics":            { bg: "bg-orange-50", text: "text-orange-700", border: "border-orange-200" },
  "Neurology":              { bg: "bg-purple-50", text: "text-purple-700", border: "border-purple-200" },
  "Oncology":               { bg: "bg-rose-50",   text: "text-rose-700",   border: "border-rose-200" },
  "Internal Medicine":      { bg: "bg-teal-50",   text: "text-teal-700",   border: "border-teal-200" },
  "Emergency & Critical Care": { bg: "bg-red-50", text: "text-red-700",    border: "border-red-200" },
  "Exotic Animals":         { bg: "bg-lime-50",   text: "text-lime-700",   border: "border-lime-200" },
  "Feline Specialist":      { bg: "bg-violet-50", text: "text-violet-700", border: "border-violet-200" },
  "Equine Specialist":      { bg: "bg-yellow-50", text: "text-yellow-700", border: "border-yellow-200" },
  "General Practice":       { bg: "bg-emerald-50",text: "text-emerald-700",border: "border-emerald-200" },
}

function getSpecialtyColor(specialty: string | null | undefined) {
  if (!specialty) return { bg: "bg-emerald-50", text: "text-emerald-700", border: "border-emerald-200" }
  return SPECIALTY_COLORS[specialty] || { bg: "bg-emerald-50", text: "text-emerald-700", border: "border-emerald-200" }
}

export default function SpecialistsPage() {
  const [doctors, setDoctors] = useState<DoctorProfile[]>([])
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState("")
  const [selectedSpecialty, setSelectedSpecialty] = useState("All Specialties")
  const [showFilterDropdown, setShowFilterDropdown] = useState(false)

  useEffect(() => {
    const fetchDoctors = async () => {
      const { data, error } = await supabase
        .from("profiles")
        .select("*")
        .eq("role", "doctor")
        .order("full_name", { ascending: true })

      if (data) setDoctors(data as DoctorProfile[])
      if (error) console.error("Error fetching doctors:", error)
      setLoading(false)
    }
    fetchDoctors()
  }, [])

  // Filter doctors based on search & specialty
  const filteredDoctors = doctors.filter((doc) => {
    const matchesSearch =
      !searchQuery ||
      doc.full_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      doc.specialty?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      doc.address?.toLowerCase().includes(searchQuery.toLowerCase())

    const matchesSpecialty =
      selectedSpecialty === "All Specialties" ||
      doc.specialty?.toLowerCase() === selectedSpecialty.toLowerCase()

    return matchesSearch && matchesSpecialty
  })

  // Group doctors by specialty
  const grouped = filteredDoctors.reduce<Record<string, DoctorProfile[]>>((acc, doc) => {
    const spec = doc.specialty || "General Practice"
    if (!acc[spec]) acc[spec] = []
    acc[spec].push(doc)
    return acc
  }, {})

  const sortedSpecialties = Object.keys(grouped).sort()

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="h-10 w-10 animate-spin text-primary" />
          <p className="text-muted-foreground font-medium">Loading specialists...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      {/* Header */}
      <div className="mb-10">
        <div className="flex items-center gap-3 mb-2">
          <div className="h-10 w-10 rounded-xl bg-primary/10 flex items-center justify-center">
            <Stethoscope className="h-5 w-5 text-primary" />
          </div>
          <h1 className="text-3xl font-bold font-heading text-foreground">
            Our Specialists
          </h1>
        </div>
        <p className="text-muted-foreground mt-1 ml-[52px]">
          Browse all veterinarians and their specialties. Find the perfect doctor for your pet.
        </p>
      </div>

      {/* Search & Filter Bar */}
      <div className="flex flex-col sm:flex-row gap-3 mb-10">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search by name, specialty, or location..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10 rounded-xl bg-white h-12 border-border shadow-sm"
          />
        </div>
        <div className="relative">
          <Button
            variant="outline"
            className="rounded-xl h-12 px-5 bg-white shadow-sm border-border min-w-[200px] justify-between"
            onClick={() => setShowFilterDropdown(!showFilterDropdown)}
          >
            <span className="flex items-center gap-2">
              <Filter className="h-4 w-4" />
              {selectedSpecialty}
            </span>
            <ChevronDown className={`h-4 w-4 transition-transform ${showFilterDropdown ? 'rotate-180' : ''}`} />
          </Button>
          {showFilterDropdown && (
            <>
              <div className="fixed inset-0 z-40" onClick={() => setShowFilterDropdown(false)} />
              <div className="absolute right-0 top-14 z-50 bg-white rounded-xl border border-border shadow-xl py-2 w-[240px] max-h-[320px] overflow-y-auto">
                {SPECIALTIES.map((spec) => (
                  <button
                    key={spec}
                    onClick={() => {
                      setSelectedSpecialty(spec)
                      setShowFilterDropdown(false)
                    }}
                    className={`w-full text-left px-4 py-2.5 text-sm hover:bg-primary/5 transition-colors ${
                      selectedSpecialty === spec ? "bg-primary/10 text-primary font-semibold" : "text-foreground"
                    }`}
                  >
                    {spec}
                  </button>
                ))}
              </div>
            </>
          )}
        </div>
      </div>

      {/* Results Summary */}
      <div className="mb-6 flex items-center justify-between">
        <p className="text-sm text-muted-foreground">
          Showing <span className="font-bold text-foreground">{filteredDoctors.length}</span>{" "}
          {filteredDoctors.length === 1 ? "specialist" : "specialists"}
          {selectedSpecialty !== "All Specialties" && (
            <span> in <span className="font-semibold text-primary">{selectedSpecialty}</span></span>
          )}
        </p>
        {selectedSpecialty !== "All Specialties" && (
          <Button
            variant="ghost"
            size="sm"
            className="text-xs text-muted-foreground hover:text-foreground"
            onClick={() => setSelectedSpecialty("All Specialties")}
          >
            Clear filter
          </Button>
        )}
      </div>

      {/* Empty State */}
      {filteredDoctors.length === 0 && (
        <div className="flex flex-col items-center justify-center py-20 text-center">
          <div className="h-20 w-20 rounded-full bg-muted/50 flex items-center justify-center mb-6">
            <Stethoscope className="h-10 w-10 text-muted-foreground/50" />
          </div>
          <h3 className="text-xl font-bold text-foreground mb-2">No specialists found</h3>
          <p className="text-muted-foreground max-w-md">
            {searchQuery || selectedSpecialty !== "All Specialties"
              ? "Try adjusting your search or filter to find the right specialist."
              : "No doctors have registered yet. Check back later!"}
          </p>
        </div>
      )}

      {/* Grouped Doctors by Specialty */}
      <div className="space-y-12">
        {sortedSpecialties.map((specialty) => {
          const docs = grouped[specialty]
          const colors = getSpecialtyColor(specialty)

          return (
            <div key={specialty}>
              {/* Specialty Header */}
              <div className="flex items-center gap-3 mb-6">
                <div className={`h-3 w-3 rounded-full ${colors.bg} ${colors.border} border-2`} />
                <h2 className="text-xl font-bold font-heading text-foreground">{specialty}</h2>
                <span className={`text-xs font-bold px-3 py-1 rounded-full ${colors.bg} ${colors.text} ${colors.border} border`}>
                  {docs.length} {docs.length === 1 ? "doctor" : "doctors"}
                </span>
              </div>

              {/* Doctor Cards Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
                {docs.map((doc) => {
                  const specColor = getSpecialtyColor(doc.specialty)
                  return (
                    <Card
                      key={doc.id}
                      className="group overflow-hidden border-border/50 shadow-sm hover:shadow-lg hover:border-primary/20 transition-all duration-300 bg-white"
                    >
                      <CardContent className="p-0">
                        {/* Top accent bar */}
                        <div className={`h-1.5 w-full ${specColor.bg}`} 
                          style={{ background: `linear-gradient(90deg, var(--color-primary), transparent)` }} 
                        />

                        <div className="p-6">
                          <div className="flex items-start gap-4">
                            {/* Avatar */}
                            <div className="relative shrink-0">
                              <div className="h-16 w-16 rounded-2xl bg-primary/10 flex items-center justify-center text-2xl font-bold text-primary overflow-hidden shadow-sm group-hover:shadow-md transition-shadow">
                                {doc.avatar_url ? (
                                  <img
                                    src={doc.avatar_url}
                                    alt={doc.full_name || "Doctor"}
                                    className="h-full w-full object-cover"
                                  />
                                ) : (
                                  <UserCircle className="h-9 w-9 text-primary/60" />
                                )}
                              </div>
                              {/* Online indicator */}
                              <div className="absolute -bottom-0.5 -right-0.5 h-4 w-4 rounded-full bg-emerald-400 border-2 border-white" />
                            </div>

                            {/* Info */}
                            <div className="flex-1 min-w-0">
                              <h3 className="text-lg font-bold text-foreground truncate group-hover:text-primary transition-colors">
                                Dr. {doc.full_name || "Unknown"}
                              </h3>
                              <span className={`inline-flex items-center gap-1 text-xs font-semibold px-2.5 py-1 rounded-full mt-1.5 ${specColor.bg} ${specColor.text} ${specColor.border} border`}>
                                <Stethoscope className="h-3 w-3" />
                                {doc.specialty || "General Practice"}
                              </span>
                            </div>
                          </div>

                          {/* Details */}
                          <div className="mt-5 space-y-2.5">
                            {doc.address && (
                              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                                <MapPin className="h-3.5 w-3.5 shrink-0" />
                                <span className="truncate">{doc.address}</span>
                              </div>
                            )}
                            {doc.experience && (
                              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                                <Star className="h-3.5 w-3.5 shrink-0 text-amber-400" />
                                <span>{doc.experience} years of experience</span>
                              </div>
                            )}
                            {doc.email && (
                              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                                <span className="h-3.5 w-3.5 shrink-0 text-center text-[11px]">✉</span>
                                <span className="truncate">{doc.email}</span>
                              </div>
                            )}
                          </div>

                          {/* Bio preview */}
                          {doc.bio && (
                            <p className="mt-4 text-sm text-muted-foreground line-clamp-2 leading-relaxed">
                              {doc.bio}
                            </p>
                          )}

                          {/* Action */}
                          <div className="mt-5 pt-4 border-t border-border/50">
                            <Link href="/dashboard/appointments/new">
                              <Button
                                variant="outline"
                                className="w-full rounded-xl h-10 text-sm font-semibold border-primary/20 text-primary hover:bg-primary hover:text-white transition-all group-hover:border-primary/40"
                              >
                                <CalendarPlus className="h-4 w-4 mr-2" />
                                Book Appointment
                              </Button>
                            </Link>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  )
                })}
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
