"use client"
import { useEffect, useState } from "react"
import { supabase } from "@/lib/supabase"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { FileText, PlusCircle, Calendar, UserCircle, Loader2, Trash2, Eye } from "lucide-react"

export default function MedicalRecordsPage() {
  const [records, setRecords] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [pets, setPets] = useState<any[]>([])
  const [showAdd, setShowAdd] = useState(false)
  const [saving, setSaving] = useState(false)
  const [deletingRecordId, setDeletingRecordId] = useState<string | null>(null)
  const [removedRecords, setRemovedRecords] = useState<any[]>([])
  const [deletionMessage, setDeletionMessage] = useState("")
  const [undoing, setUndoing] = useState(false)
  const [previewRecord, setPreviewRecord] = useState<any | null>(null)
  const [role, setRole] = useState<string | null>(null)

  // Form State
  const [selectedPet, setSelectedPet] = useState("")
  const [diagnosis, setDiagnosis] = useState("")
  const [treatment, setTreatment] = useState("")
  const [notes, setNotes] = useState("")

  useEffect(() => {
    fetchData()
  }, [])

  const fetchData = async () => {
    const { data: { session } } = await supabase.auth.getSession()
    if (!session) return

    const { data: profile } = await supabase.from('profiles').select('role').eq('id', session.user.id).single()
    const userRole = profile?.role || 'patient'
    setRole(userRole)

    // Fetch records
    const { data: recordsData, error } = await supabase
      .from('medical_records')
      .select('*, pet:pets(name, species, owner:profiles!owner_id(full_name)), vet:profiles!vet_id(full_name, specialty)')
      .order('date', { ascending: false })

    if (recordsData) setRecords(recordsData)

    // Fetch pets for dropdown (only if doctor)
    if (userRole === 'doctor') {
    const { data: apts } = await supabase
      .from('appointments')
      .select('pet_id')
      .eq('vet_id', session.user.id)
      .not('pet_id', 'is', null)

    if (apts && apts.length > 0) {
      const petIds = Array.from(new Set(apts.map(a => a.pet_id)))
      const { data: petsData } = await supabase
        .from('pets')
        .select('id, name, species, owner:profiles!owner_id(full_name)')
        .in('id', petIds)
      
      if (petsData) setPets(petsData)
    }
    }

    setLoading(false)
  }

  const handleSaveRecord = async (e: React.FormEvent) => {
    e.preventDefault()
    setSaving(true)
    const { data: { session } } = await supabase.auth.getSession()
    if (!session) return

    const { error } = await supabase.from('medical_records').insert({
      pet_id: selectedPet,
      vet_id: session.user.id,
      diagnosis,
      treatment,
      notes
    })

    if (!error) {
      setShowAdd(false)
      setSelectedPet("")
      setDiagnosis("")
      setTreatment("")
      setNotes("")
      fetchData()
    } else {
      alert("Failed to save record. Ensure the database schema has been updated.")
    }
    setSaving(false)
  }

  const handleDeleteRecord = async (recordId: string) => {
    const shouldDelete = window.confirm("Remove this medical record permanently?")
    if (!shouldDelete) return

    const recordToRemove = records.find((record) => record.id === recordId)
    setDeletingRecordId(recordId)
    const { error } = await supabase
      .from("medical_records")
      .delete()
      .eq("id", recordId)

    if (!error) {
      setRecords((prev) => prev.filter((record) => record.id !== recordId))
      if (recordToRemove) {
        setRemovedRecords((prev) => [recordToRemove, ...prev].slice(0, 5))
        setDeletionMessage(`Record for ${recordToRemove.pet?.name || "pet"} was removed.`)
      }
    } else {
      alert("Failed to remove record. Please try again.")
    }

    setDeletingRecordId(null)
  }

  const handleUndoRemove = async () => {
    if (removedRecords.length === 0) return

    const latestRemoved = removedRecords[0]
    const restorePayload = {
      id: latestRemoved.id,
      pet_id: latestRemoved.pet_id,
      vet_id: latestRemoved.vet_id,
      diagnosis: latestRemoved.diagnosis,
      treatment: latestRemoved.treatment,
      notes: latestRemoved.notes,
      date: latestRemoved.date,
      attachments: latestRemoved.attachments
    }

    setUndoing(true)
    const { error } = await supabase.from("medical_records").insert(restorePayload)

    if (!error) {
      setRecords((prev) => [latestRemoved, ...prev])
      setRemovedRecords((prev) => prev.slice(1))
      setDeletionMessage("")
    } else {
      alert("Failed to undo removal. Please try again.")
    }
    setUndoing(false)
  }

  if (loading) return <div className="animate-spin h-8 w-8 border-4 border-primary border-t-transparent rounded-full mx-auto mt-20" />

  return (
    <div className="max-w-6xl mx-auto">
      <div className="mb-8 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold font-heading">Medical Records</h1>
          <p className="text-muted-foreground text-sm mt-1">
            {role === 'doctor' ? 'Track diagnoses and treatments for your patients' : 'View your pets\' complete clinical history'}
          </p>
        </div>
        {role === 'doctor' && !showAdd && (
          <Button onClick={() => setShowAdd(true)} className="rounded-xl px-6 bg-primary hover:bg-primary/90 shadow-md">
            <PlusCircle className="h-5 w-5 mr-2" />
            Add Record
          </Button>
        )}
      </div>
      {deletionMessage && (
        <p className="mb-4 text-sm font-medium text-red-600">{deletionMessage}</p>
      )}

      {showAdd && (
        <Card className="mb-8 border-primary/20 shadow-lg">
          <CardHeader>
            <CardTitle className="text-lg font-bold text-primary">New Medical Record</CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSaveRecord} className="space-y-4">
              <div className="space-y-2">
                <Label>Select Patient *</Label>
                <select 
                  value={selectedPet}
                  onChange={e => setSelectedPet(e.target.value)}
                  required
                  className="w-full h-10 rounded-xl bg-white border border-border px-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
                >
                  <option value="">-- Choose a patient --</option>
                  {pets.map(pet => (
                    <option key={pet.id} value={pet.id}>
                      {pet.name} ({pet.species}) - Owner: {pet.owner?.full_name}
                    </option>
                  ))}
                </select>
              </div>
              
              <div className="space-y-2">
                <Label>Diagnosis *</Label>
                <Input value={diagnosis} onChange={e => setDiagnosis(e.target.value)} required placeholder="Primary diagnosis..." className="rounded-xl" />
              </div>

              <div className="space-y-2">
                <Label>Treatment Plan</Label>
                <Textarea value={treatment} onChange={e => setTreatment(e.target.value)} placeholder="Medications, procedures..." className="rounded-xl min-h-[100px]" />
              </div>

              <div className="space-y-2">
                <Label>Additional Notes</Label>
                <Textarea value={notes} onChange={e => setNotes(e.target.value)} placeholder="Observations, follow-up instructions..." className="rounded-xl min-h-[100px]" />
              </div>

              <div className="flex gap-4 pt-2">
                <Button type="button" variant="outline" onClick={() => setShowAdd(false)} className="rounded-xl flex-1">Cancel</Button>
                <Button type="submit" disabled={saving} className="rounded-xl flex-1 bg-primary">
                  {saving ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
                  {saving ? "Saving..." : "Save Record"}
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      )}

      {role === "doctor" && removedRecords.length > 0 && (
        <Card className="mb-6 border-red-100 bg-red-50/30">
          <CardHeader>
            <CardTitle className="text-base text-red-700">Recently Removed Records</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {removedRecords.map((record) => (
              <div key={record.id} className="rounded-lg border border-red-100 bg-white p-3 text-sm">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="font-semibold text-foreground">{record.pet?.name || "Unknown Pet"}</p>
                    <p className="text-muted-foreground">
                      {new Date(record.date || record.created_at).toLocaleDateString()} - {record.diagnosis}
                    </p>
                  </div>
                  <Button
                    type="button"
                    variant="outline"
                    className="rounded-md"
                    onClick={() => setPreviewRecord(record)}
                  >
                    <Eye className="h-4 w-4 mr-2" />
                    Preview
                  </Button>
                </div>
              </div>
            ))}
            <div className="pt-2">
              <Button
                type="button"
                onClick={handleUndoRemove}
                disabled={undoing}
                className="w-full rounded-lg bg-red-600 hover:bg-red-700"
              >
                {undoing ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : null}
                {undoing ? "Undoing..." : "Undo Last Remove"}
              </Button>
            </div>
          </CardContent>
        </Card>
      )}
      <Dialog open={!!previewRecord} onOpenChange={(open) => !open && setPreviewRecord(null)}>
        <DialogContent className="sm:max-w-xl">
          <DialogHeader>
            <DialogTitle>Removed Record Preview</DialogTitle>
            <DialogDescription className="text-red-600">
              This record is removed. You can review details before using Undo.
            </DialogDescription>
          </DialogHeader>
          {previewRecord && (
            <div className="space-y-3 text-sm">
              <p><span className="font-semibold">Pet:</span> {previewRecord.pet?.name || "Unknown Pet"}</p>
              <p><span className="font-semibold">Date:</span> {new Date(previewRecord.date || previewRecord.created_at).toLocaleDateString()}</p>
              <p><span className="font-semibold">Diagnosis:</span> {previewRecord.diagnosis || "-"}</p>
              <p><span className="font-semibold">Treatment:</span> {previewRecord.treatment || "-"}</p>
              <p><span className="font-semibold">Notes:</span> {previewRecord.notes || "-"}</p>
              {previewRecord.attachments && previewRecord.attachments.length > 0 && (
                <div>
                  <p className="font-semibold mb-1">Attachments</p>
                  <div className="flex flex-wrap gap-2">
                    {previewRecord.attachments.map((url: string, i: number) => (
                      <a
                        key={i}
                        href={url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-xs bg-white text-blue-600 px-3 py-1.5 rounded-md border border-blue-200 hover:bg-blue-50"
                      >
                        View File {previewRecord.attachments.length > 1 ? i + 1 : ""}
                      </a>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>

      <div className="space-y-4">
        {records.length === 0 ? (
          <div className="bg-white p-12 text-center text-muted-foreground rounded-2xl border border-border">
            <FileText className="h-16 w-16 mx-auto mb-4 text-muted-foreground/30" />
            <h3 className="text-xl font-bold text-foreground mb-2">No records found</h3>
            <p>There are no medical records to display.</p>
          </div>
        ) : (
          records.map(record => (
            <div key={record.id} className="bg-white rounded-2xl border border-border p-6 shadow-sm flex flex-col md:flex-row gap-6">
              <div className="md:w-64 shrink-0 border-r border-border pr-6">
                <div className="flex items-center gap-3 mb-4">
                  <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold">
                    {record.pet?.name?.charAt(0) || 'P'}
                  </div>
                  <div>
                    <h3 className="font-bold">{record.pet?.name || 'Unknown Pet'}</h3>
                    <p className="text-xs text-muted-foreground">{record.pet?.species}</p>
                  </div>
                </div>
                <div className="space-y-2 text-sm text-muted-foreground">
                  <p className="flex items-center gap-2"><Calendar className="h-4 w-4" /> {new Date(record.date || record.created_at).toLocaleDateString()}</p>
                  <p className="flex items-center gap-2">
                    <UserCircle className="h-4 w-4" /> 
                    {role === 'doctor' ? `Owner: ${record.pet?.owner?.full_name}` : `Dr. ${record.vet?.full_name || 'Unknown'}`}
                  </p>
                </div>
              </div>
              <div className="flex-1 space-y-4">
                {role === "doctor" && (
                  <div className="flex justify-end">
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => handleDeleteRecord(record.id)}
                      disabled={deletingRecordId === record.id}
                      className="rounded-lg border-red-200 text-red-600 hover:bg-red-50 hover:text-red-700"
                    >
                      {deletingRecordId === record.id ? (
                        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      ) : (
                        <Trash2 className="h-4 w-4 mr-2" />
                      )}
                      {deletingRecordId === record.id ? "Removing..." : "Remove Record"}
                    </Button>
                  </div>
                )}
                <div>
                  <h4 className="text-xs font-bold uppercase tracking-wider text-muted-foreground mb-1">Diagnosis</h4>
                  <p className="font-medium text-foreground">{record.diagnosis}</p>
                </div>
                {record.treatment && (
                  <div>
                    <h4 className="text-xs font-bold uppercase tracking-wider text-muted-foreground mb-1">Treatment</h4>
                    <p className="text-muted-foreground text-sm">{record.treatment}</p>
                  </div>
                )}
                {record.notes && (
                  <div>
                    <h4 className="text-xs font-bold uppercase tracking-wider text-muted-foreground mb-1">Notes</h4>
                    <p className="text-muted-foreground text-sm">{record.notes}</p>
                  </div>
                )}
                {record.attachments && record.attachments.length > 0 && (
                  <div className="pt-2">
                    <h4 className="text-xs font-bold uppercase tracking-wider text-muted-foreground mb-2">Attachments</h4>
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
          ))
        )}
      </div>
    </div>
  )
}
