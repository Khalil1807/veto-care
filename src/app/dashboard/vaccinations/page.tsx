"use client"
import { useEffect, useState } from "react"
import { supabase } from "@/lib/supabase"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Syringe, PlusCircle, Calendar, CheckCircle2, AlertCircle, Loader2 } from "lucide-react"

export default function VaccinationsPage() {
  const [vaccinations, setVaccinations] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [pets, setPets] = useState<any[]>([])
  const [showAdd, setShowAdd] = useState(false)
  const [saving, setSaving] = useState(false)

  // Form State
  const [selectedPet, setSelectedPet] = useState("")
  const [vaccineName, setVaccineName] = useState("")
  const [dateGiven, setDateGiven] = useState("")
  const [nextDue, setNextDue] = useState("")

  useEffect(() => {
    fetchData()
  }, [])

  const fetchData = async () => {
    const { data: { session } } = await supabase.auth.getSession()
    if (!session) return

    // Fetch vaccinations
    const { data: vaxData, error } = await supabase
      .from('vaccinations')
      .select('*, pet:pets(name, species, owner:profiles!owner_id(full_name))')
      .order('date_given', { ascending: false })

    if (vaxData) setVaccinations(vaxData)

    // Fetch pets for dropdown
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

    setLoading(false)
  }

  const handleSaveVaccine = async (e: React.FormEvent) => {
    e.preventDefault()
    setSaving(true)
    const { data: { session } } = await supabase.auth.getSession()
    if (!session) return

    const { error } = await supabase.from('vaccinations').insert({
      pet_id: selectedPet,
      vet_id: session.user.id,
      vaccine_name: vaccineName,
      date_given: dateGiven || new Date().toISOString(),
      next_due: nextDue || null,
      status: 'completed'
    })

    if (!error) {
      setShowAdd(false)
      setSelectedPet("")
      setVaccineName("")
      setDateGiven("")
      setNextDue("")
      fetchData()
    } else {
      alert("Failed to log vaccination. Ensure the database schema has been updated.")
    }
    setSaving(false)
  }

  if (loading) return <div className="animate-spin h-8 w-8 border-4 border-primary border-t-transparent rounded-full mx-auto mt-20" />

  return (
    <div className="max-w-6xl mx-auto">
      <div className="mb-8 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold font-heading">Vaccinations</h1>
          <p className="text-muted-foreground text-sm mt-1">Manage and schedule pet vaccinations</p>
        </div>
        {!showAdd && (
          <Button onClick={() => setShowAdd(true)} className="rounded-xl px-6 bg-primary hover:bg-primary/90 shadow-md">
            <PlusCircle className="h-5 w-5 mr-2" />
            Log Vaccine
          </Button>
        )}
      </div>

      {showAdd && (
        <Card className="mb-8 border-primary/20 shadow-lg">
          <CardHeader>
            <CardTitle className="text-lg font-bold text-primary">Log New Vaccination</CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSaveVaccine} className="space-y-4">
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
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Vaccine Name *</Label>
                  <Input value={vaccineName} onChange={e => setVaccineName(e.target.value)} required placeholder="e.g. Rabies, DHPP..." className="rounded-xl" />
                </div>
                <div className="space-y-2">
                  <Label>Date Given</Label>
                  <Input type="date" value={dateGiven} onChange={e => setDateGiven(e.target.value)} required className="rounded-xl" />
                </div>
                <div className="space-y-2 md:col-span-2">
                  <Label>Next Due Date (Optional)</Label>
                  <Input type="date" value={nextDue} onChange={e => setNextDue(e.target.value)} className="rounded-xl" />
                </div>
              </div>

              <div className="flex gap-4 pt-2">
                <Button type="button" variant="outline" onClick={() => setShowAdd(false)} className="rounded-xl flex-1">Cancel</Button>
                <Button type="submit" disabled={saving} className="rounded-xl flex-1 bg-primary">
                  {saving ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
                  {saving ? "Saving..." : "Log Vaccine"}
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      )}

      <div className="bg-white rounded-2xl border border-border overflow-hidden">
        {vaccinations.length === 0 ? (
          <div className="p-12 text-center text-muted-foreground">
            <Syringe className="h-16 w-16 mx-auto mb-4 text-muted-foreground/30" />
            <h3 className="text-xl font-bold text-foreground mb-2">No vaccinations logged</h3>
            <p>You haven't logged any vaccinations for your patients yet.</p>
          </div>
        ) : (
          <div className="divide-y divide-border">
            {vaccinations.map(vax => {
              const isDueSoon = vax.next_due && new Date(vax.next_due).getTime() - new Date().getTime() < 30 * 24 * 60 * 60 * 1000;
              return (
                <div key={vax.id} className="p-6 flex items-center justify-between hover:bg-muted/20 transition-colors">
                  <div className="flex gap-4 items-center">
                    <div className="h-12 w-12 rounded-full bg-blue-100 flex items-center justify-center text-blue-600 font-bold shrink-0">
                      <Syringe className="h-6 w-6" />
                    </div>
                    <div>
                      <h3 className="font-bold text-lg">{vax.vaccine_name}</h3>
                      <p className="text-sm font-medium text-foreground">
                        Patient: {vax.pet?.name} ({vax.pet?.species})
                      </p>
                      <p className="text-sm text-muted-foreground mt-0.5">
                        <Calendar className="h-3.5 w-3.5 inline mr-1" />
                        Given: {new Date(vax.date_given).toLocaleDateString()}
                      </p>
                    </div>
                  </div>
                  
                  <div className="flex flex-col items-end gap-2 text-right">
                    {vax.next_due ? (
                      <div className={`flex items-center gap-1.5 text-sm font-medium ${isDueSoon ? 'text-orange-600 bg-orange-50 px-2 py-1 rounded-md' : 'text-muted-foreground'}`}>
                        {isDueSoon ? <AlertCircle className="h-4 w-4" /> : <Calendar className="h-4 w-4" />}
                        Due: {new Date(vax.next_due).toLocaleDateString()}
                      </div>
                    ) : (
                      <span className="text-sm text-muted-foreground italic">No next dose</span>
                    )}
                    <span className="inline-flex items-center text-xs font-semibold text-green-700 bg-green-100 px-2 py-0.5 rounded-full">
                      <CheckCircle2 className="h-3 w-3 mr-1" /> Completed
                    </span>
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}
