"use client"
import { useState, useEffect } from "react"
import { supabase } from "@/lib/supabase"
import { Profile, Pet } from "@/lib/types"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Loader2, PlusCircle, Trash2, Dog, Cat, Rabbit, PawPrint, X, FileText, Calendar } from "lucide-react"

export default function PetsPage() {
  const [loading, setLoading] = useState(true)
  const [profile, setProfile] = useState<Profile | null>(null)
  
  // Pets state
  const [pets, setPets] = useState<Pet[]>([])
  const [newPetName, setNewPetName] = useState("")
  const [newPetSpecies, setNewPetSpecies] = useState("")
  const [newPetBreed, setNewPetBreed] = useState("")
  const [newPetAge, setNewPetAge] = useState("")
  const [addingPet, setAddingPet] = useState(false)
  const [showAddForm, setShowAddForm] = useState(false)
  
  // Records state
  const [viewingRecords, setViewingRecords] = useState<Pet | null>(null)
  const [medicalRecords, setMedicalRecords] = useState<any[]>([])
  const [recordsLoading, setRecordsLoading] = useState(false)

  useEffect(() => {
    const fetchData = async () => {
      const { data: { session } } = await supabase.auth.getSession()
      if (!session) return
      
      let { data: profileData } = await supabase
        .from("profiles")
        .select("*")
        .eq("id", session.user.id)
        .single()
        
      if (!profileData) {
        // Fallback for corrupted/missing profiles
        await supabase.from('profiles').insert({ id: session.user.id, role: 'patient', full_name: 'Patient User' })
        const res = await supabase.from('profiles').select('*').eq('id', session.user.id).single()
        profileData = res.data
      }

      if (profileData) {
        setProfile(profileData as Profile)
        
        const { data: petsData } = await supabase
          .from("pets")
          .select("*, appointments(*)")
          .eq("owner_id", session.user.id)
        
        if (petsData) setPets(petsData as Pet[])
      }
      setLoading(false)
    }
    fetchData()
  }, [])

  const handleAddPet = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!profile) {
      alert("Error: Your profile data could not be loaded. This happens if your account wasn't created properly or if the database is missing your information. Please log out, try signing up again, or run the master SQL script.")
      return
    }
    
    if (!newPetName) return
    setAddingPet(true)

    const petData: any = {
      owner_id: profile.id,
      name: newPetName,
      species: newPetSpecies,
      breed: newPetBreed,
    }
    // Only include age if the column exists (avoids PGRST204 error)
    const parsedAge = parseInt(newPetAge)
    if (!isNaN(parsedAge)) petData.age = parsedAge

    const { data, error } = await supabase
      .from("pets")
      .insert(petData)
      .select()
      .single()

    setAddingPet(false)
    if (error) {
      console.error("Pet insert error:", error)
      alert(`Failed to add pet: ${error.message || JSON.stringify(error)}`)
    } else if (data) {
      setPets([...pets, data as Pet])
      setNewPetName("")
      setNewPetSpecies("")
      setNewPetBreed("")
      setNewPetAge("")
      setShowAddForm(false)
    }
  }

  const handleDeletePet = async (petId: string) => {
    const { error } = await supabase.from("pets").delete().eq("id", petId)
    if (!error) {
      setPets(pets.filter(p => p.id !== petId))
    }
  }

  const openRecords = async (pet: Pet) => {
    setViewingRecords(pet)
    setRecordsLoading(true)
    const { data } = await supabase
      .from('medical_records')
      .select('*, vet:profiles!vet_id(full_name, specialty)')
      .eq('pet_id', pet.id)
      .order('date', { ascending: false })
      
    if (data) setMedicalRecords(data)
    setRecordsLoading(false)
  }

  const getPetIcon = (species: string) => {
    const s = species.toLowerCase()
    if (s.includes('dog')) return <Dog className="h-10 w-10 text-primary" />
    if (s.includes('cat')) return <Cat className="h-10 w-10 text-primary" />
    if (s.includes('rabbit')) return <Rabbit className="h-10 w-10 text-primary" />
    return <PawPrint className="h-10 w-10 text-primary" />
  }

  if (loading) return <div className="animate-spin h-8 w-8 border-4 border-primary border-t-transparent rounded-full mx-auto mt-20" />

  return (
    <div className="max-w-6xl mx-auto">
      <div className="mb-8 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold font-heading">My Pets</h1>
          <p className="text-muted-foreground text-sm mt-1">Manage your pets' profiles and health information</p>
        </div>
        {!showAddForm && (
          <Button onClick={() => setShowAddForm(true)} className="rounded-xl px-6 bg-primary hover:bg-primary/90 shadow-md">
            <PlusCircle className="h-5 w-5 mr-2" />
            Add New Pet
          </Button>
        )}
      </div>

      {showAddForm && (
        <Card className="mb-8 border-primary/20 shadow-lg bg-[#f0fdf4]">
          <CardHeader>
            <CardTitle className="text-lg font-bold text-[#064e3b]">Register a New Pet</CardTitle>
            <CardDescription className="text-emerald-700/70">Enter your pet's details below.</CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleAddPet} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <Label htmlFor="petName" className="text-[#064e3b] font-bold">Pet Name *</Label>
                  <input id="petName" value={newPetName} onChange={e => setNewPetName(e.target.value)} required className="w-full h-10 rounded-xl bg-white border border-emerald-200 px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary" placeholder="e.g. Max" />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="petSpecies" className="text-[#064e3b] font-bold">Species</Label>
                  <input id="petSpecies" value={newPetSpecies} onChange={e => setNewPetSpecies(e.target.value)} className="w-full h-10 rounded-xl bg-white border border-emerald-200 px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary" placeholder="e.g. Dog, Cat, Bird" />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="petBreed" className="text-[#064e3b] font-bold">Breed</Label>
                  <input id="petBreed" value={newPetBreed} onChange={e => setNewPetBreed(e.target.value)} className="w-full h-10 rounded-xl bg-white border border-emerald-200 px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary" placeholder="e.g. Golden Retriever" />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="petAge" className="text-[#064e3b] font-bold">Age (Years)</Label>
                  <input id="petAge" type="number" min="0" value={newPetAge} onChange={e => setNewPetAge(e.target.value)} className="w-full h-10 rounded-xl bg-white border border-emerald-200 px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary" placeholder="e.g. 3" />
                </div>
              </div>
              <div className="flex gap-4 pt-4">
                <Button type="button" variant="outline" onClick={() => setShowAddForm(false)} className="rounded-xl flex-1 border-emerald-200 text-emerald-800 hover:bg-emerald-100">
                  Cancel
                </Button>
                <Button type="submit" className="rounded-xl flex-1 bg-primary hover:bg-primary/90 text-white shadow-md" disabled={addingPet || !newPetName}>
                  {addingPet ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                  {addingPet ? "Saving..." : "Save Pet Profile"}
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {pets.length === 0 && !showAddForm ? (
          <div className="col-span-full bg-white p-12 text-center rounded-2xl border border-border shadow-sm">
            <PawPrint className="h-16 w-16 text-muted-foreground/30 mx-auto mb-4" />
            <h3 className="text-xl font-bold text-[#064e3b] mb-2">No pets registered yet</h3>
            <p className="text-muted-foreground max-w-sm mx-auto mb-6">
              Add your pets to keep track of their medical records, vaccinations, and upcoming appointments.
            </p>
            <Button onClick={() => setShowAddForm(true)} className="rounded-xl bg-primary hover:bg-primary/90 text-white">
              <PlusCircle className="h-5 w-5 mr-2" />
              Add Your First Pet
            </Button>
          </div>
        ) : (
          pets.map(pet => (
            <Card key={pet.id} className="overflow-hidden border border-border shadow-sm hover:shadow-md transition-all group relative">
              <div className="absolute top-0 left-0 w-full h-24 bg-gradient-to-br from-primary/20 to-primary/5"></div>
              
              <Button 
                variant="ghost" 
                size="icon" 
                onClick={() => handleDeletePet(pet.id)} 
                className="absolute top-3 right-3 text-destructive/70 hover:text-destructive hover:bg-destructive/10 rounded-full z-10 opacity-0 group-hover:opacity-100 transition-opacity"
              >
                <Trash2 className="h-4 w-4" />
              </Button>

              <CardContent className="p-6 pt-12 relative z-10 text-center flex flex-col items-center">
                <div className="w-20 h-20 bg-white rounded-full flex items-center justify-center shadow-lg border-4 border-white mb-4 -mt-8 text-primary">
                  {getPetIcon(pet.species || '')}
                </div>
                
                <h3 className="text-xl font-bold font-heading text-[#064e3b]">{pet.name}</h3>
                
                <div className="flex items-center justify-center gap-2 mt-2">
                  <span className="px-3 py-1 bg-muted text-muted-foreground text-xs font-semibold rounded-full capitalize">
                    {pet.species || 'Unknown'}
                  </span>
                  {pet.age && (
                    <span className="px-3 py-1 bg-muted text-muted-foreground text-xs font-semibold rounded-full">
                      {pet.age} Years Old
                    </span>
                  )}
                </div>
                
                {pet.breed && (
                  <p className="text-sm text-muted-foreground mt-3 font-medium">Breed: {pet.breed}</p>
                )}
                
                <div className="w-full grid grid-cols-2 gap-2 mt-6 pt-6 border-t border-border/50">
                  <div className="text-center">
                    <p className="text-2xl font-bold text-primary">{pet.appointments?.length || 0}</p>
                    <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">Appointments</p>
                  </div>
                  <div className="text-center">
                    <p className="text-2xl font-bold text-primary">{pet.appointments?.filter((a: any) => a.reason?.toLowerCase().includes('vaccin')).length || 0}</p>
                    <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">Vaccines</p>
                  </div>
                </div>

                <div className="w-full mt-4 pt-4 border-t border-border/50">
                  <Button onClick={() => openRecords(pet)} variant="outline" className="w-full rounded-xl text-primary border-primary/20 hover:bg-primary/5">
                    View Treatments
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>

      {/* VIEW RECORDS MODAL */}
      {viewingRecords && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-2xl max-h-[85vh] overflow-hidden flex flex-col animate-in fade-in zoom-in-95 duration-200">
            <div className="p-6 border-b border-border flex justify-between items-center">
              <div>
                <h2 className="text-xl font-bold text-[#064e3b]">Medical Treatments: {viewingRecords.name}</h2>
                <p className="text-sm text-muted-foreground mt-1">Complete clinical history</p>
              </div>
              <Button variant="ghost" size="icon" onClick={() => setViewingRecords(null)} className="rounded-full">
                <X className="h-5 w-5" />
              </Button>
            </div>
            
            <div className="p-6 overflow-y-auto bg-muted/20 flex-1">
              {recordsLoading ? (
                <div className="flex justify-center p-12">
                  <Loader2 className="h-8 w-8 animate-spin text-primary" />
                </div>
              ) : medicalRecords.length === 0 ? (
                <div className="text-center p-12 bg-white rounded-xl border border-border">
                  <FileText className="h-12 w-12 text-muted-foreground/30 mx-auto mb-3" />
                  <p className="text-muted-foreground">No medical treatments found for this pet.</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {medicalRecords.map(record => (
                    <div key={record.id} className="bg-white p-5 rounded-xl border border-border shadow-sm">
                      <div className="flex justify-between items-start mb-4 border-b border-border/50 pb-4">
                        <div>
                          <p className="text-sm font-bold text-primary flex items-center gap-1.5">
                            <Calendar className="h-4 w-4" /> 
                            {new Date(record.date || record.created_at).toLocaleDateString()}
                          </p>
                          <p className="text-xs text-muted-foreground mt-1">
                            Dr. {record.vet?.full_name || 'Unknown'} {record.vet?.specialty ? `(${record.vet.specialty})` : ''}
                          </p>
                        </div>
                      </div>
                      
                      <div className="space-y-4">
                        <div>
                          <p className="text-xs font-bold text-muted-foreground uppercase tracking-wider mb-1">Diagnosis</p>
                          <p className="text-sm">{record.diagnosis}</p>
                        </div>
                        {record.treatment && (
                          <div>
                            <p className="text-xs font-bold text-muted-foreground uppercase tracking-wider mb-1">Treatment Plan</p>
                            <p className="text-sm">{record.treatment}</p>
                          </div>
                        )}
                        {record.notes && (
                          <div>
                            <p className="text-xs font-bold text-muted-foreground uppercase tracking-wider mb-1">Additional Notes</p>
                            <p className="text-sm bg-muted/50 p-3 rounded-lg border border-border/50">{record.notes}</p>
                          </div>
                        )}
                        {record.attachments && record.attachments.length > 0 && (
                          <div>
                            <p className="text-xs font-bold text-muted-foreground uppercase tracking-wider mb-2">Attachments</p>
                            <div className="flex flex-wrap gap-2">
                              {record.attachments.map((url: string, i: number) => (
                                <a key={i} href={url} target="_blank" rel="noopener noreferrer" className="text-sm bg-white text-blue-600 px-4 py-2 rounded-md border-2 border-emerald-400 hover:bg-emerald-50 transition-colors flex items-center gap-2 font-medium w-fit">
                                  📎 View Attached Report {record.attachments.length > 1 ? i + 1 : ''}
                                </a>
                              ))}
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
