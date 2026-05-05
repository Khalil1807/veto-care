"use client"
import { useEffect, useState } from "react"
import { supabase } from "@/lib/supabase"
import { Profile, Pet } from "@/lib/types"
import { Button } from "@/components/ui/button"
import { UserCircle2, X, MapPin, Phone, Mail, PawPrint } from "lucide-react"

import { useRouter } from "next/navigation"

type PetOwner = Profile & { pets: Pet[] }

export default function PetOwnersPage() {
  const router = useRouter()
  const [owners, setOwners] = useState<PetOwner[]>([])
  const [loading, setLoading] = useState(true)

  const [viewingOwner, setViewingOwner] = useState<PetOwner | null>(null)

  useEffect(() => {
    const fetchPetOwners = async () => {
      const { data: { session } } = await supabase.auth.getSession()
      if (!session) return

      // Security check: Only doctors can access this page
      const { data: profileData } = await supabase.from('profiles').select('role').eq('id', session.user.id).single()
      if (profileData?.role !== 'doctor') {
        router.push('/dashboard')
        return
      }

      // To find pet owners for a doctor, we look at their appointments
      const { data: apts } = await supabase
        .from('appointments')
        .select('owner_id')
        .eq('vet_id', session.user.id)

       if (apts && apts.length > 0) {
         // Get unique owner IDs
         const ownerIds = Array.from(new Set(apts.map(a => a.owner_id)))
         
         // Fetch profiles
         const { data: profilesData, error } = await supabase
           .from('profiles')
           .select('*')
           .in('id', ownerIds)

         if (error) {
           console.error('Error fetching profiles:', error)
         }

         if (profilesData && profilesData.length > 0) {
           // Fetch pets for these owners
           const { data: petsData } = await supabase
             .from('pets')
             .select('*')
             .in('owner_id', ownerIds)

           // Attach pets to owners
           const ownersWithPets = profilesData.map((profile: any) => ({
             ...profile,
             pets: petsData?.filter((pet: any) => pet.owner_id === profile.id) || []
           })) as unknown as PetOwner[]
           
           setOwners(ownersWithPets)
         }
       }
      setLoading(false)
    }
    fetchPetOwners()
  }, [router])

  if (loading) return <div className="animate-spin h-8 w-8 border-4 border-primary border-t-transparent rounded-full mx-auto mt-20" />

  return (
    <div className="max-w-6xl mx-auto">
      <div className="mb-8">
        <h1 className="text-2xl font-bold font-heading">Pet Owners</h1>
        <p className="text-muted-foreground text-sm mt-1">Manage client information and contacts</p>
      </div>

      <div className="grid gap-4">
        {owners.length === 0 ? (
          <div className="bg-white p-12 text-center text-muted-foreground rounded-2xl border border-border">
            No pet owners found. Confirm appointments to see them here.
          </div>
        ) : (
          owners.map(owner => (
            <div key={owner.id} className="bg-white p-6 rounded-2xl border border-border flex items-center justify-between shadow-sm">
              <div className="flex items-center gap-4">
                <div className="h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold overflow-hidden border border-primary/20">
                  {owner.avatar_url ? (
                    <img src={owner.avatar_url} alt={owner.full_name || 'Owner'} className="h-full w-full object-cover" />
                  ) : (
                    <UserCircle2 className="h-6 w-6" />
                  )}
                </div>
                <div>
                  <h3 className="font-bold text-lg">{owner.full_name || 'Unknown Client'}</h3>
                  <p className="text-sm text-muted-foreground mt-0.5">
                    {owner.pets && owner.pets.length > 0 ? (
                      <>Pets: {owner.pets.map(p => `${p.name} (${p.species})`).join(', ')} • {owner.pets.length} registered</>
                    ) : (
                      "No registered pets."
                    )}
                  </p>
                  {owner.phone && <p className="text-sm text-muted-foreground mt-0.5">Contact: {owner.phone}</p>}
                </div>
              </div>
              <Button onClick={() => setViewingOwner(owner)} variant="outline" className="rounded-xl border-primary/20 text-primary hover:bg-primary/5">
                View Profile
              </Button>
            </div>
          ))
        )}
      </div>

      {/* VIEW OWNER PROFILE MODAL */}
      {viewingOwner && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-hidden flex flex-col animate-in fade-in zoom-in-95 duration-200">
            <div className="relative h-32 bg-gradient-to-r from-[#064e3b] to-emerald-700 p-6 flex justify-between items-start">
              <div className="absolute bottom-0 left-1/2 transform -translate-x-1/2 translate-y-1/2 h-32 w-32 rounded-full bg-white border-4 border-white shadow-xl flex items-center justify-center text-primary font-bold overflow-hidden shrink-0">
                {viewingOwner.avatar_url ? (
                  <img src={viewingOwner.avatar_url} alt={viewingOwner.full_name || 'Owner'} className="h-full w-full object-cover" />
                ) : (
                  <UserCircle2 className="h-16 w-16 text-primary/40" />
                )}
              </div>
              <Button variant="ghost" size="icon" onClick={() => setViewingOwner(null)} className="absolute top-4 right-4 text-white/70 hover:bg-white/20 hover:text-white rounded-full">
                <X className="h-5 w-5" />
              </Button>
            </div>
                
            <div className="px-8 pb-8 mt-16 flex-1 overflow-y-auto">
              <div className="text-center">
                <h2 className="text-2xl font-bold font-heading text-gray-900">{viewingOwner.full_name || 'Unknown Client'}</h2>
                <div className="inline-flex mt-2 items-center px-3 py-1 bg-primary/10 text-primary font-semibold text-xs rounded-full">
                  Client since {viewingOwner.created_at ? new Date(viewingOwner.created_at).getFullYear() : new Date().getFullYear()}
                </div>
              </div>

              <div className="mt-8 grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Contact Information */}
                <div className="bg-muted/30 p-6 rounded-2xl border border-border">
                  <h3 className="font-bold text-[#064e3b] mb-4 flex items-center gap-2">
                    <UserCircle2 className="h-5 w-5" /> Contact Details
                  </h3>
                  <div className="space-y-4">
                    <div className="flex items-start gap-3">
                      <Phone className="h-4 w-4 text-muted-foreground mt-0.5" />
                      <div>
                        <p className="text-xs font-bold text-muted-foreground uppercase tracking-wider">Phone Number</p>
                        <p className="text-sm font-medium">{viewingOwner.phone || 'Not provided'}</p>
                      </div>
                    </div>
                    <div className="flex items-start gap-3">
                      <Mail className="h-4 w-4 text-muted-foreground mt-0.5" />
                      <div>
                        <p className="text-xs font-bold text-muted-foreground uppercase tracking-wider">Email (System)</p>
                        <p className="text-sm font-medium text-muted-foreground">Managed by Auth</p>
                      </div>
                    </div>
                    {viewingOwner.address && (
                      <div className="flex items-start gap-3">
                        <MapPin className="h-4 w-4 text-muted-foreground mt-0.5" />
                        <div>
                          <p className="text-xs font-bold text-muted-foreground uppercase tracking-wider">Address</p>
                          <p className="text-sm font-medium">{viewingOwner.address}</p>
                        </div>
                      </div>
                    )}
                  </div>
                </div>

                {/* Pets Information */}
                <div className="bg-muted/30 p-6 rounded-2xl border border-border">
                  <h3 className="font-bold text-[#064e3b] mb-4 flex items-center gap-2">
                    <PawPrint className="h-5 w-5" /> Registered Pets ({viewingOwner.pets?.length || 0})
                  </h3>
                  
                  {viewingOwner.pets && viewingOwner.pets.length > 0 ? (
                    <div className="space-y-3">
                      {viewingOwner.pets.map(pet => (
                        <div key={pet.id} className="bg-white p-3 rounded-xl border border-border/50 flex items-center justify-between">
                          <div>
                            <p className="font-bold text-sm text-gray-900">{pet.name}</p>
                            <p className="text-xs text-muted-foreground">{pet.species} {pet.breed ? `• ${pet.breed}` : ''}</p>
                          </div>
                          {pet.age && (
                            <span className="text-xs bg-muted px-2 py-1 rounded-md font-semibold text-muted-foreground">
                              {pet.age} yrs
                            </span>
                          )}
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-sm text-muted-foreground italic">No pets found for this client.</p>
                  )}
                </div>
              </div>
              
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
