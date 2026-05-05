"use client"
import { useEffect, useState } from "react"
import { supabase } from "@/lib/supabase"
import { Pet, Profile } from "@/lib/types"
import { Button } from "@/components/ui/button"
import { PawPrint, UserCircle } from "lucide-react"
import { useRouter } from "next/navigation"
import { Textarea } from "@/components/ui/textarea"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { X, Loader2, Calendar, FileText } from "lucide-react"

type Patient = Pet & { owner: { full_name: string, phone: string, avatar_url: string } }

export default function PatientsPage() {
  const router = useRouter()
  const [patients, setPatients] = useState<Patient[]>([])
  const [loading, setLoading] = useState(true)

  // Modal States
  const [viewingRecords, setViewingRecords] = useState<Patient | null>(null)
  const [addingNote, setAddingNote] = useState<Patient | null>(null)
  const [medicalRecords, setMedicalRecords] = useState<any[]>([])
  const [recordsLoading, setRecordsLoading] = useState(false)

  // Form States
  const [diagnosis, setDiagnosis] = useState("")
  const [treatment, setTreatment] = useState("")
  const [notes, setNotes] = useState("")
  const [nextSessionDate, setNextSessionDate] = useState("")
  const [uploadingFile, setUploadingFile] = useState(false)
  const [savingNote, setSavingNote] = useState(false)
  const [uploadedUrl, setUploadedUrl] = useState<string | null>(null)

  useEffect(() => {
    const fetchPatients = async () => {
      const { data: { session } } = await supabase.auth.getSession()
      if (!session) return

      // Security check
      const { data: profileData } = await supabase.from('profiles').select('role').eq('id', session.user.id).single()
      if (profileData?.role !== 'doctor') {
        router.push('/dashboard')
        return
      }

      // Find all pets associated with the doctor's appointments
      const { data: apts } = await supabase
        .from('appointments')
        .select('pet_id')
        .eq('vet_id', session.user.id)
        .not('pet_id', 'is', null)

      if (apts && apts.length > 0) {
        const petIds = Array.from(new Set(apts.map(a => a.pet_id)))
        
        const { data: petsData } = await supabase
          .from('pets')
          .select('*, owner:profiles!owner_id(full_name, phone, avatar_url)')
          .in('id', petIds)
          
        if (petsData) {
          setPatients(petsData as unknown as Patient[])
        }
      }
      setLoading(false)
    }
    fetchPatients()
  }, [router])

  const openRecords = async (patient: Patient) => {
    setViewingRecords(patient)
    setRecordsLoading(true)
    const { data } = await supabase
      .from('medical_records')
      .select('*, vet:profiles!vet_id(full_name, specialty)')
      .eq('pet_id', patient.id)
      .order('date', { ascending: false })
      
    if (data) setMedicalRecords(data)
    setRecordsLoading(false)
  }

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files || e.target.files.length === 0) return
    const file = e.target.files[0]
    setUploadingFile(true)
    
    const fileExt = file.name.split('.').pop()
    const fileName = `record-${addingNote?.id}-${Date.now()}.${fileExt}`
    
    const { error: uploadError } = await supabase.storage
      .from('health-records')
      .upload(fileName, file)
      
    if (!uploadError) {
      const { data: { publicUrl } } = supabase.storage.from('health-records').getPublicUrl(fileName)
      setUploadedUrl(publicUrl)
    } else {
      alert("Error uploading file: " + uploadError.message)
    }
    setUploadingFile(false)
  }

  const submitNote = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!addingNote) return
    setSavingNote(true)

    const { data: { session } } = await supabase.auth.getSession()
    if (!session) return

    const { error } = await supabase.from('medical_records').insert({
      pet_id: addingNote.id,
      vet_id: session.user.id,
      owner_id: addingNote.owner_id,
      diagnosis,
      treatment,
      notes,
      attachments: uploadedUrl ? [uploadedUrl] : null
    })

    if (!error && nextSessionDate) {
      await supabase.from('appointments').insert({
        vet_id: session.user.id,
        owner_id: addingNote.owner_id,
        pet_id: addingNote.id,
        date: nextSessionDate.split('T')[0],
        time: nextSessionDate.split('T')[1],
        reason: 'Follow-up / Vaccination',
        status: 'proposed'
      })
    }

    setSavingNote(false)
    if (!error) {
      closeAddingNote()
    } else {
      alert("Failed to save note: " + error.message)
    }
  }

  const closeAddingNote = () => {
    setAddingNote(null)
    setDiagnosis("")
    setTreatment("")
    setNotes("")
    setUploadedUrl(null)
    setNextSessionDate("")
  }

  if (loading) return <div className="animate-spin h-8 w-8 border-4 border-primary border-t-transparent rounded-full mx-auto mt-20" />

  return (
    <div className="max-w-6xl mx-auto">
      <div className="mb-8">
        <h1 className="text-2xl font-bold font-heading">Patients</h1>
        <p className="text-muted-foreground text-sm mt-1">Manage and view all your animal patients</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {patients.length === 0 ? (
          <div className="col-span-full bg-white p-12 text-center text-muted-foreground rounded-2xl border border-border">
            No patients found. Confirm appointments to see them here.
          </div>
        ) : (
          patients.map(patient => (
            <div key={patient.id} className="bg-white rounded-2xl border border-border overflow-hidden shadow-sm hover:shadow-md transition-shadow">
              <div className="h-24 bg-primary/10 flex items-center justify-center">
                <PawPrint className="h-12 w-12 text-primary/40" />
              </div>
              <div className="p-6 relative pt-0 text-center">
                <div className="h-20 w-20 rounded-full bg-white border-4 border-white shadow-md mx-auto -mt-10 flex items-center justify-center text-primary text-2xl font-bold mb-3">
                  {patient.name.charAt(0)}
                </div>
                <h3 className="font-bold text-xl">{patient.name}</h3>
                <p className="text-sm text-muted-foreground font-medium mb-4">
                  {patient.species} {patient.breed ? `• ${patient.breed}` : ''} {patient.age ? `• ${patient.age} yrs` : ''}
                </p>
                
                <div className="bg-muted/50 rounded-xl p-3 text-left mb-4">
                  <p className="text-xs text-muted-foreground mb-1 uppercase font-bold tracking-wider">Owner</p>
                  <div className="flex items-center gap-2">
                    {patient.owner?.avatar_url ? (
                      <img src={patient.owner.avatar_url} alt={patient.owner.full_name} className="h-6 w-6 rounded-full object-cover border border-border" />
                    ) : (
                      <UserCircle className="h-6 w-6 text-primary" />
                    )}
                    <span className="text-sm font-medium">{patient.owner?.full_name || 'Unknown'}</span>
                  </div>
                </div>

                {patient.appointments?.find((a: any) => new Date(a.date) > new Date() && a.status === 'confirmed' && a.reason?.toLowerCase().includes('vaccin')) && (
                  <div className="bg-emerald-50 rounded-xl p-3 text-left mb-4 border border-emerald-100">
                    <p className="text-xs text-emerald-600 mb-1 uppercase font-bold tracking-wider">Next Vaccination</p>
                    <p className="text-sm font-bold text-emerald-800">
                      {new Date(patient.appointments.find((a: any) => new Date(a.date) > new Date() && a.status === 'confirmed' && a.reason?.toLowerCase().includes('vaccin')).date).toLocaleDateString()}
                    </p>
                  </div>
                )}
                
                <div className="flex gap-2">
                  <Button onClick={() => openRecords(patient)} variant="outline" className="flex-1 rounded-xl text-primary border-primary/20 hover:bg-primary/5">
                    Records
                  </Button>
                  <Button onClick={() => setAddingNote(patient)} className="flex-1 rounded-xl bg-primary hover:bg-primary/90">
                    Add Treatment
                  </Button>
                </div>
              </div>
            </div>
          ))
        )}
      </div>

      {/* VIEW RECORDS MODAL */}
      {viewingRecords && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-2xl max-h-[85vh] overflow-hidden flex flex-col animate-in fade-in zoom-in-95 duration-200">
            <div className="p-6 border-b border-border flex justify-between items-center">
              <div>
                <h2 className="text-xl font-bold text-[#064e3b]">Medical Records: {viewingRecords.name}</h2>
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
                  <p className="text-muted-foreground">No medical records found for this pet.</p>
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

      {/* ADD TREATMENT MODAL */}
      {addingNote && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-2xl max-h-[90vh] overflow-hidden flex flex-col animate-in fade-in zoom-in-95 duration-200">
            <div className="p-6 border-b border-border flex justify-between items-center bg-[#f0fdf4]">
              <div>
                <h2 className="text-xl font-bold text-[#064e3b]">Add Treatment: {addingNote.name}</h2>
                <p className="text-sm text-emerald-700/70 mt-1">Record a new clinical visit or treatment</p>
              </div>
              <Button variant="ghost" size="icon" onClick={closeAddingNote} className="rounded-full">
                <X className="h-5 w-5" />
              </Button>
            </div>
            
            <div className="p-6 overflow-y-auto flex-1">
              <form onSubmit={submitNote} className="space-y-6">
                <div className="space-y-2">
                  <Label htmlFor="diagnosis" className="text-[#064e3b] font-bold">Diagnosis / Assessment *</Label>
                  <Input 
                    id="diagnosis"
                    value={diagnosis}
                    onChange={e => setDiagnosis(e.target.value)}
                    required
                    placeholder="e.g. Early stage gingivitis..."
                    className="rounded-xl border-emerald-200"
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="treatment" className="text-[#064e3b] font-bold">Treatment Plan *</Label>
                  <Textarea 
                    id="treatment"
                    value={treatment}
                    onChange={e => setTreatment(e.target.value)}
                    required
                    placeholder="e.g. Schedule dental cleaning, apply oral gel twice daily..."
                    className="rounded-xl border-emerald-200 min-h-[100px]"
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="notes" className="text-[#064e3b] font-bold">Additional Notes (Optional)</Label>
                  <Textarea 
                    id="notes"
                    value={notes}
                    onChange={e => setNotes(e.target.value)}
                    placeholder="Owner mentioned pet has been lethargic..."
                    className="rounded-xl border-emerald-200 min-h-[80px]"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="next-session" className="text-[#064e3b] font-bold">Schedule Next Vaccination / Follow-Up (Optional)</Label>
                  <Input 
                    id="next-session"
                    type="datetime-local"
                    value={nextSessionDate}
                    onChange={e => setNextSessionDate(e.target.value)}
                    min={new Date().toISOString().slice(0, 16)}
                    className="rounded-xl border-emerald-200"
                  />
                  <p className="text-xs text-emerald-700/70 font-medium">This will automatically book and confirm an appointment for the patient.</p>
                </div>
                
                <div className="space-y-2">
                  <Label className="text-[#064e3b] font-bold block mb-2">Attachment (Optional)</Label>
                  <div className="flex flex-col gap-3">
                    {uploadedUrl ? (
                      <div className="flex items-center justify-between bg-white p-3 rounded-lg border-2 border-emerald-400 max-w-md">
                        <span className="text-sm text-emerald-700 font-medium truncate flex-1 flex items-center gap-2">
                           📎 File attached successfully
                        </span>
                        <Button type="button" variant="ghost" size="sm" onClick={() => setUploadedUrl(null)} className="text-red-500 hover:text-red-700 hover:bg-red-50 h-8">Remove</Button>
                      </div>
                    ) : (
                      <>
                        <input 
                          type="file" 
                          id="record-file" 
                          className="hidden" 
                          onChange={handleFileUpload} 
                          accept=".pdf,.png,.jpg,.jpeg"
                          disabled={uploadingFile}
                        />
                        <label htmlFor="record-file" className="cursor-pointer inline-block">
                          <div className="text-sm bg-white text-blue-600 px-4 py-2 rounded-md border-2 border-emerald-400 hover:bg-emerald-50 transition-colors flex items-center gap-2 font-medium w-fit">
                            {uploadingFile ? <Loader2 className="h-4 w-4 animate-spin text-blue-600" /> : "📎"} 
                            {uploadingFile ? "Uploading..." : "Add Attached Report"}
                          </div>
                        </label>
                      </>
                    )}
                  </div>
                </div>
                
                <div className="pt-4 flex gap-4 border-t border-border">
                  <Button type="button" variant="outline" onClick={closeAddingNote} className="flex-1 rounded-xl border-emerald-200 text-emerald-800">
                    Cancel
                  </Button>
                  <Button type="submit" disabled={savingNote || uploadingFile || !diagnosis || !treatment} className="flex-1 rounded-xl bg-primary hover:bg-primary/90 text-white shadow-md">
                    {savingNote ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : null}
                    Save Record
                  </Button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
