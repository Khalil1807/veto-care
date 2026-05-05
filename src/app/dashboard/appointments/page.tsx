"use client"
import { useEffect, useState } from "react"
import { supabase } from "@/lib/supabase"
import { Profile, Pet, Appointment } from "@/lib/types"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Textarea } from "@/components/ui/textarea"
import { CheckCircle2, PlusCircle, Calendar, Stethoscope, PawPrint, Clock, X, Loader2 } from "lucide-react"

export default function AppointmentsPage() {
  const [appointments, setAppointments] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [role, setRole] = useState<string | null>(null)
  const [showBooking, setShowBooking] = useState(false)
  const [expandedApt, setExpandedApt] = useState<string | null>(null)
  
  // Doctor notes state
  const [aptNotes, setAptNotes] = useState("")
  const [uploading, setUploading] = useState(false)
  const [savingNotes, setSavingNotes] = useState(false)

  // Booking form state
  const [doctors, setDoctors] = useState<Profile[]>([])
  const [myPets, setMyPets] = useState<Pet[]>([])
  const [selectedDoctor, setSelectedDoctor] = useState("")
  const [selectedPet, setSelectedPet] = useState("")
  const [selectedDate, setSelectedDate] = useState("")
  const [aptType, setAptType] = useState("Annual Check-up")
  const [aptLocation, setAptLocation] = useState("")
  const [booking, setBooking] = useState(false)

  useEffect(() => {
    const fetchData = async () => {
      const { data: { session } } = await supabase.auth.getSession()
      if (!session) return

      // Get current user role
      const { data: profileData } = await supabase.from('profiles').select('role').eq('id', session.user.id).single()
      if (profileData) setRole(profileData.role)

      // Fetch appointments based on current role
      let appointmentsQuery = supabase
        .from("appointments")
        .select(`*, vet:profiles!vet_id(id, full_name, specialty, avatar_url), owner:profiles!owner_id(id, full_name), pet:pets(id, name, species)`)
        .order("date", { ascending: true })

      if (profileData?.role === "doctor") {
        appointmentsQuery = appointmentsQuery.eq("vet_id", session.user.id)
      } else if (profileData?.role === "patient") {
        appointmentsQuery = appointmentsQuery.eq("owner_id", session.user.id)
      }

      const { data } = await appointmentsQuery

      if (data) setAppointments(data)

      // If patient, fetch doctors list and pets
      if (profileData?.role === 'patient') {
        const { data: docs } = await supabase.from('profiles').select('*').eq('role', 'doctor')
        if (docs) setDoctors(docs as Profile[])

        const { data: pets } = await supabase.from('pets').select('*').eq('owner_id', session.user.id)
        if (pets) setMyPets(pets as Pet[])
      }

      setLoading(false)
    }
    fetchData()
  }, [])

  const handleBook = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!selectedDoctor || !selectedDate) return
    setBooking(true)

    const { data: { session } } = await supabase.auth.getSession()
    if (!session) return

    const appointmentData: any = {
      owner_id: session.user.id,
      vet_id: selectedDoctor,
      date: selectedDate,
      status: 'pending',
      reason: aptType === 'Health Issue' && aptLocation ? `${aptType} - Details/Location: ${aptLocation}` : aptType,
    }
    if (selectedPet) appointmentData.pet_id = selectedPet

    const { data, error } = await supabase
      .from("appointments")
      .insert(appointmentData)
      .select(`*, vet:profiles!vet_id(id, full_name, specialty, avatar_url), owner:profiles!owner_id(id, full_name), pet:pets(id, name, species)`)
      .single()

    setBooking(false)
    if (error) {
      alert("Failed to book: " + (error.message || JSON.stringify(error)))
    } else if (data) {
      setAppointments([data, ...appointments])
      setShowBooking(false)
      setSelectedDoctor("")
      setSelectedPet("")
      setSelectedDate("")
      setAptType("Annual Check-up")
      setAptLocation("")
    }
  }

  const handleConfirm = async (id: string) => {
    await supabase.from("appointments").update({ status: 'confirmed' }).eq('id', id)
    setAppointments(appointments.map(apt => apt.id === id ? { ...apt, status: 'confirmed' } : apt))
  }

  const handleCancel = async (id: string) => {
    await supabase.from("appointments").delete().eq('id', id)
    setAppointments(appointments.filter(apt => apt.id !== id))
  }

  if (loading) return <div className="animate-spin h-8 w-8 border-4 border-primary border-t-transparent rounded-full mx-auto mt-20" />

  const handleSaveNotes = async (id: string) => {
    setSavingNotes(true)
    const { error } = await supabase.from("appointments").update({ reason: aptNotes }).eq('id', id)
    if (!error) {
      setAppointments(appointments.map(apt => apt.id === id ? { ...apt, reason: aptNotes } : apt))
      setExpandedApt(null)
    }
    setSavingNotes(false)
  }

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>, aptId: string) => {
    if (!e.target.files || e.target.files.length === 0) return
    const file = e.target.files[0]
    setUploading(true)
    
    const fileExt = file.name.split('.').pop()
    const fileName = `report-${aptId}-${Date.now()}.${fileExt}`
    
    const { error: uploadError } = await supabase.storage
      .from('health-records')
      .upload(fileName, file)
      
    if (!uploadError) {
      const { data: { publicUrl } } = supabase.storage.from('health-records').getPublicUrl(fileName)
      
      const { error } = await supabase.from("appointments").update({ health_record_url: publicUrl }).eq('id', aptId)
      if (!error) {
        setAppointments(appointments.map(apt => apt.id === aptId ? { ...apt, health_record_url: publicUrl } : apt))
      }
    } else {
      alert("Error uploading file: " + uploadError.message)
    }
    setUploading(false)
  }

  const pending = appointments.filter(a => a.status === 'pending' || a.status === 'proposed')
  const confirmed = appointments.filter(a => a.status === 'confirmed')

  return (
    <div className="max-w-6xl mx-auto">
      <div className="mb-8 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold font-heading">Appointments</h1>
          <p className="text-muted-foreground text-sm mt-1">
            {role === 'patient' ? 'Book and track your veterinary visits' : 'Manage your daily schedule and visit history'}
          </p>
        </div>
        {role === 'patient' && !showBooking && (
          <Button onClick={() => setShowBooking(true)} className="rounded-xl px-6 bg-primary hover:bg-primary/90 shadow-md">
            <PlusCircle className="h-5 w-5 mr-2" />
            Book Appointment
          </Button>
        )}
      </div>

      {/* Booking Form (Patient Only) */}
      {showBooking && (
        <Card className="mb-8 border-primary/20 shadow-lg bg-[#f0fdf4]">
          <CardHeader className="flex flex-row items-center justify-between">
            <div>
              <CardTitle className="text-lg font-bold text-[#064e3b]">Book a New Appointment</CardTitle>
              <CardDescription className="text-emerald-700/70">Choose your veterinarian, pet, and preferred date.</CardDescription>
            </div>
            <Button variant="ghost" size="icon" onClick={() => setShowBooking(false)} className="rounded-full text-muted-foreground hover:bg-muted">
              <X className="h-5 w-5" />
            </Button>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleBook} className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                
                {/* Select Doctor */}
                <div className="space-y-2">
                  <Label className="text-[#064e3b] font-bold flex items-center gap-2">
                    <Stethoscope className="h-4 w-4" /> Select Veterinarian *
                  </Label>
                  <select 
                    value={selectedDoctor}
                    onChange={e => setSelectedDoctor(e.target.value)}
                    required
                    className="w-full h-10 rounded-xl bg-white border border-emerald-200 px-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
                  >
                    <option value="">-- Choose a doctor --</option>
                    {doctors.map(doc => (
                      <option key={doc.id} value={doc.id}>
                        Dr. {doc.full_name} {doc.specialty ? `(${doc.specialty})` : ''}
                      </option>
                    ))}
                  </select>
                  {doctors.length === 0 && (
                    <p className="text-xs text-orange-600">No doctors registered yet.</p>
                  )}
                </div>

                {/* Select Pet */}
                <div className="space-y-2">
                  <Label className="text-[#064e3b] font-bold flex items-center gap-2">
                    <PawPrint className="h-4 w-4" /> Select Pet (Optional)
                  </Label>
                  <select 
                    value={selectedPet}
                    onChange={e => setSelectedPet(e.target.value)}
                    className="w-full h-10 rounded-xl bg-white border border-emerald-200 px-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
                  >
                    <option value="">-- Choose a pet --</option>
                    {myPets.map(pet => (
                      <option key={pet.id} value={pet.id}>
                        {pet.name} ({pet.species || 'Unknown species'})
                      </option>
                    ))}
                  </select>
                  {myPets.length === 0 && (
                    <p className="text-xs text-orange-600">You haven't added any pets yet. Go to "My Pets" to add one.</p>
                  )}
                </div>

                {/* Select Date */}
                <div className="space-y-2">
                  <Label className="text-[#064e3b] font-bold flex items-center gap-2">
                    <Calendar className="h-4 w-4" /> Date & Time *
                  </Label>
                  <Input 
                    type="datetime-local"
                    value={selectedDate}
                    onChange={e => setSelectedDate(e.target.value)}
                    required
                    min={new Date().toISOString().slice(0, 16)}
                    className="rounded-xl bg-white border-emerald-200"
                  />
                </div>

                {/* Appointment Type */}
                <div className="space-y-2">
                  <Label className="text-[#064e3b] font-bold flex items-center gap-2">
                    <Clock className="h-4 w-4" /> Reason for Visit *
                  </Label>
                  <select 
                    value={aptType}
                    onChange={e => setAptType(e.target.value)}
                    required
                    className="w-full h-10 rounded-xl bg-white border border-emerald-200 px-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
                  >
                    <option value="Annual Check-up">Annual Check-up</option>
                    <option value="Vaccination">Vaccination</option>
                    <option value="Health Issue">Health Issue (Illness/Injury)</option>
                    <option value="Follow-up">Follow-up</option>
                    <option value="Other">Other</option>
                  </select>
                </div>

                {/* Issue Details / Location */}
                {aptType === 'Health Issue' && (
                  <div className="space-y-2 md:col-span-2">
                    <Label className="text-[#064e3b] font-bold flex items-center gap-2">
                      <Stethoscope className="h-4 w-4" /> Issue Details & Location
                    </Label>
                    <Input 
                      value={aptLocation}
                      onChange={e => setAptLocation(e.target.value)}
                      required
                      placeholder="e.g. Left leg limping, skin rash on stomach, vomiting..."
                      className="rounded-xl bg-white border-emerald-200"
                    />
                  </div>
                )}
              </div>

              <div className="flex gap-4 pt-2">
                <Button type="button" variant="outline" onClick={() => setShowBooking(false)} className="rounded-xl flex-1 border-emerald-200 text-emerald-800 hover:bg-emerald-100">
                  Cancel
                </Button>
                <Button type="submit" className="rounded-xl flex-1 bg-primary hover:bg-primary/90 text-white shadow-md" disabled={booking || !selectedDoctor || !selectedDate}>
                  {booking ? "Booking..." : "Confirm Appointment"}
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      )}

      {/* Tabs */}
      <div className="flex items-center gap-6 border-b border-border mb-6">
        <button className="pb-3 text-sm font-medium border-b-2 border-primary text-primary">Pending ({pending.length})</button>
        <button className="pb-3 text-sm font-medium text-muted-foreground hover:text-foreground">Confirmed ({confirmed.length})</button>
      </div>

      {/* Appointments List */}
      <div className="bg-white rounded-2xl border border-border overflow-hidden">
        {appointments.length === 0 ? (
          <div className="p-12 text-center">
            <Calendar className="h-16 w-16 text-muted-foreground/30 mx-auto mb-4" />
            <h3 className="text-xl font-bold text-[#064e3b] mb-2">No appointments yet</h3>
            <p className="text-muted-foreground max-w-sm mx-auto mb-6">
              {role === 'patient' ? 'Book your first appointment with a veterinarian!' : 'No appointments scheduled.'}
            </p>
            {role === 'patient' && (
              <Button onClick={() => setShowBooking(true)} className="rounded-xl bg-primary hover:bg-primary/90 text-white">
                <PlusCircle className="h-5 w-5 mr-2" />
                Book Now
              </Button>
            )}
          </div>
        ) : (
          <div className="divide-y divide-border">
            {appointments.map(apt => (
              <div key={apt.id} className="flex flex-col border-b border-border last:border-0 hover:bg-muted/10 transition-colors">
                <div className="p-6 flex items-start justify-between cursor-pointer" onClick={() => {
                  if (role === 'doctor') {
                    if (expandedApt === apt.id) {
                      setExpandedApt(null)
                    } else {
                      setExpandedApt(apt.id)
                      setAptNotes(apt.reason || "")
                    }
                  }
                }}>
                  <div className="flex gap-4">
                    <div className="h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold shrink-0">
                      {apt.pet?.name?.charAt(0) || apt.vet?.full_name?.charAt(0) || 'A'}
                    </div>
                  <div>
                    <h3 className="font-bold text-lg">{apt.pet?.name || 'General Visit'}</h3>
                    <p className="text-sm text-muted-foreground mt-1">
                      <Calendar className="h-3.5 w-3.5 inline mr-1" />
                      {new Date(apt.date || apt.appointment_date).toLocaleString()}
                    </p>
                    <p className="text-sm text-muted-foreground mt-0.5">
                      {role === 'patient' 
                        ? <>
                            <Stethoscope className="h-3.5 w-3.5 inline mr-1" />
                            Dr. {apt.vet?.full_name || 'Unknown'} {apt.vet?.specialty ? `(${apt.vet.specialty})` : ''}
                          </>
                        : <>
                            Owner: {apt.owner?.full_name || 'Unknown'}
                          </>
                      }
                    </p>
                    {role === 'patient' && apt.reason && (
                      <div className="mt-3 p-3 bg-muted/30 rounded-xl border border-border/50 text-sm">
                        <span className="font-semibold text-muted-foreground block mb-1">Notes:</span>
                        {apt.reason}
                      </div>
                    )}
                  </div>
                </div>
                
                <div className="flex flex-col gap-2 items-end shrink-0">
                  <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold ${
                    apt.status === 'confirmed' 
                      ? 'bg-green-100 text-green-700' 
                      : apt.status === 'proposed'
                        ? 'bg-blue-100 text-blue-700'
                        : 'bg-orange-100 text-orange-700'
                  }`}>
                    {apt.status === 'confirmed' ? 'Confirmed' : apt.status === 'proposed' ? 'Doctor Proposed' : 'Pending'}
                  </span>
                  {role === 'doctor' && apt.status === 'pending' && (
                    <Button size="sm" className="bg-primary hover:bg-primary/90 rounded-xl mt-2" onClick={(e) => { e.stopPropagation(); handleConfirm(apt.id); }}>
                      <CheckCircle2 className="h-4 w-4 mr-2" />
                      Confirm
                    </Button>
                  )}
                  {role === 'patient' && apt.status === 'proposed' && (
                    <div className="flex gap-2 mt-2">
                      <Button size="sm" className="bg-primary hover:bg-primary/90 rounded-xl" onClick={(e) => { e.stopPropagation(); handleConfirm(apt.id); }}>
                        <CheckCircle2 className="h-4 w-4 mr-1" /> Accept
                      </Button>
                      <Button size="sm" variant="outline" className="rounded-xl border-red-200 text-red-600 hover:bg-red-50 px-3" onClick={(e) => { e.stopPropagation(); handleCancel(apt.id); }}>
                        Decline
                      </Button>
                    </div>
                  )}
                </div>
              </div>
              
              {/* Expandable Section for Doctor to add notes/attachments */}
              {role === 'doctor' && expandedApt === apt.id && (
                <div className="px-6 pb-6 pt-2 bg-muted/20">
                  <div className="bg-white p-6 rounded-2xl border border-border grid grid-cols-1 md:grid-cols-2 gap-6 shadow-sm">
                    {/* Attachments Column */}
                    <div>
                      <h4 className="text-xs font-bold text-muted-foreground uppercase tracking-wider mb-3 flex items-center gap-2">
                         Attachments & Reports
                      </h4>
                      <div className="border-2 border-dashed border-border rounded-xl p-6 text-center hover:bg-muted/30 transition-colors">
                        <input 
                          type="file" 
                          id={`file-${apt.id}`} 
                          className="hidden" 
                          onChange={(e) => handleFileUpload(e, apt.id)} 
                          accept=".pdf,.png,.jpg,.jpeg"
                        />
                        <label htmlFor={`file-${apt.id}`} className="cursor-pointer flex flex-col items-center">
                          {uploading ? (
                            <Loader2 className="h-8 w-8 text-primary animate-spin mb-2" />
                          ) : (
                            <svg className="h-8 w-8 text-muted-foreground mb-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                            </svg>
                          )}
                          <p className="text-sm font-medium">Drag & drop a file here, or <span className="text-primary">browse</span></p>
                          <p className="text-xs text-muted-foreground mt-1">Supported formats: PDF, JPG, PNG (Max 10MB)</p>
                        </label>
                      </div>
                      
                      {apt.health_record_url && (
                        <div className="mt-4">
                          <h4 className="text-xs font-bold text-muted-foreground mb-2">Uploaded Files</h4>
                          <a href={apt.health_record_url} target="_blank" rel="noopener noreferrer" className="flex items-center gap-3 p-3 rounded-xl border border-border hover:bg-muted/50 transition-colors text-sm">
                            <div className="bg-blue-100 text-blue-600 p-2 rounded-lg">
                              <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.172 7l-6.586 6.586a2 2 0 102.828 2.828l6.414-6.586a4 4 0 00-5.656-5.656l-6.415 6.585a6 6 0 108.486 8.486L20.5 13" /></svg>
                            </div>
                            <span className="font-medium text-blue-600 truncate flex-1">View Report</span>
                          </a>
                        </div>
                      )}
                    </div>
                    
                    {/* Notes Column */}
                    <div className="flex flex-col h-full">
                      <h4 className="text-xs font-bold text-muted-foreground uppercase tracking-wider mb-3">
                         Notes
                      </h4>
                      <Textarea 
                        value={aptNotes} 
                        onChange={(e) => setAptNotes(e.target.value)} 
                        placeholder="Add notes from the visit, diagnosis, or recommendations..." 
                        className="flex-1 min-h-[150px] rounded-xl border-border resize-none" 
                      />
                      <div className="mt-4 flex justify-end">
                        <Button 
                          onClick={() => handleSaveNotes(apt.id)} 
                          disabled={savingNotes} 
                          className="rounded-xl px-6 bg-primary hover:bg-primary/90"
                        >
                          {savingNotes ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
                          Save Notes
                        </Button>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
