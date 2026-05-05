"use client"
import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { supabase } from "@/lib/supabase"
import { Profile, Pet } from "@/lib/types"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { CalendarPlus, Loader2, PlusCircle } from "lucide-react"
import Link from "next/link"

const TIME_SLOTS = [
  "09:00", "09:30", "10:00", "10:30", "11:00", "11:30",
  "13:00", "13:30", "14:00", "14:30", "15:00", "15:30", "16:00", "16:30"
]

export default function NewAppointmentPage() {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [vets, setVets] = useState<Profile[]>([])
  const [pets, setPets] = useState<Pet[]>([])
  const [userId, setUserId] = useState<string | null>(null)
  
  // Form state
  const [vetId, setVetId] = useState("")
  const [petId, setPetId] = useState("")
  const [date, setDate] = useState("")
  const [time, setTime] = useState("")
  const [file, setFile] = useState<File | null>(null)

  useEffect(() => {
    const init = async () => {
      const { data: { session } } = await supabase.auth.getSession()
      if (!session) {
        router.push("/auth/login")
        return
      }
      setUserId(session.user.id)
      
      // Fetch vets from profiles
      const { data: vetData } = await supabase.from("profiles").select("*").eq("role", "doctor")
      if (vetData) setVets(vetData as Profile[])

      // Fetch pets
      const { data: petData } = await supabase.from("pets").select("*").eq("owner_id", session.user.id)
      if (petData) setPets(petData as Pet[])
    }
    init()
  }, [router])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!userId || !vetId || !petId || !date || !time) return
    
    setLoading(true)
    let healthRecordUrl = null

    // Handle file upload if present
    if (file) {
      const fileExt = file.name.split('.').pop()
      const fileName = `${userId}-${Date.now()}.${fileExt}`
      const { data: uploadData, error: uploadError } = await supabase.storage
        .from('health-records')
        .upload(fileName, file)
        
      if (uploadError) {
        console.error("Upload error:", uploadError)
        alert("Failed to upload file")
        setLoading(false)
        return
      }
      
      const { data: { publicUrl } } = supabase.storage
        .from('health-records')
        .getPublicUrl(fileName)
        
      healthRecordUrl = publicUrl
    }

    const combinedDateTime = new Date(`${date}T${time}:00`).toISOString()

    // Insert appointment
    const { error } = await supabase.from("appointments").insert({
      owner_id: userId,
      vet_id: vetId,
      pet_id: petId,
      date: combinedDateTime,
      status: "pending",
      health_record_url: healthRecordUrl
    })

    setLoading(false)
    if (error) {
      console.error("Insert error:", {
        message: error.message,
        code: error.code,
        details: error.details,
        hint: error.hint
      })
      alert(error.message || "Failed to book appointment")
    } else {
      router.push("/dashboard")
    }
  }

  return (
    <div className="container mx-auto px-4 py-8 max-w-2xl">
      <Card className="shadow-lg border-primary/10">
        <CardHeader>
          <CardTitle className="text-2xl font-heading flex items-center gap-2">
            <CalendarPlus className="h-6 w-6 text-primary" />
            Book a New Appointment
          </CardTitle>
          <CardDescription>Select a date and an available 1.5 hour time slot.</CardDescription>
        </CardHeader>
        <CardContent>
          {pets.length === 0 ? (
            <div className="text-center py-8 space-y-4">
              <p className="text-muted-foreground">You need to add a pet before booking an appointment.</p>
              <Link href="/profile">
                <Button className="rounded-xl">
                  <PlusCircle className="mr-2 h-4 w-4" /> Go to Profile to Add a Pet
                </Button>
              </Link>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="space-y-2">
                <Label htmlFor="pet">Select Pet</Label>
                <select 
                  value={petId} 
                  onChange={e => setPetId(e.target.value)} 
                  required
                  className="w-full h-10 rounded-xl bg-white border border-input px-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
                >
                  <option value="" disabled>Choose your pet</option>
                  {pets.map(pet => (
                    <option key={pet.id} value={pet.id}>
                      {pet.name} {pet.species ? `(${pet.species})` : ''}
                    </option>
                  ))}
                </select>
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="vet">Select Veterinarian</Label>
                <select 
                  value={vetId} 
                  onChange={e => setVetId(e.target.value)} 
                  required
                  className="w-full h-10 rounded-xl bg-white border border-input px-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
                >
                  <option value="" disabled>Choose a specialist</option>
                  {vets.map(vet => (
                    <option key={vet.id} value={vet.id}>
                      Dr. {vet.full_name} ({vet.specialty || 'General'})
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="date">Date</Label>
                  <Input 
                    id="date" 
                    type="date" 
                    value={date} 
                    onChange={e => setDate(e.target.value)} 
                    required 
                    min={new Date().toISOString().split('T')[0]}
                    className="rounded-xl"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="time">Time Slot (30 min)</Label>
                  <select 
                    value={time} 
                    onChange={e => setTime(e.target.value)} 
                    required
                    className="w-full h-10 rounded-xl bg-white border border-input px-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
                  >
                    <option value="" disabled>Select a time</option>
                    {TIME_SLOTS.map(slot => (
                      <option key={slot} value={slot}>
                        {slot}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="record">Health Record / Scan (Optional)</Label>
                <Input 
                  id="record" 
                  type="file" 
                  accept="image/*,.pdf" 
                  onChange={e => setFile(e.target.files?.[0] || null)} 
                  className="rounded-xl file:bg-primary/10 file:text-primary file:border-0 file:rounded-md file:px-4 file:py-1 hover:file:bg-primary/20 cursor-pointer"
                />
                <p className="text-xs text-muted-foreground">Upload a PDF or image of the health record.</p>
              </div>

              <Button type="submit" className="w-full rounded-xl h-12" disabled={loading}>
                {loading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Booking...
                  </>
                ) : (
                  "Confirm Booking"
                )}
              </Button>
            </form>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
