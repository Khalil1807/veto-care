"use client"
import { useEffect, useState } from "react"
import { supabase } from "@/lib/supabase"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Loader2, Camera, CheckCircle2, XCircle, Mail, Phone, MapPin, PawPrint, UserCircle2 } from "lucide-react"

export default function PatientProfilePage() {
  const [profile, setProfile] = useState<any>(null)
  const [pets, setPets] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [formData, setFormData] = useState({
    full_name: "",
    phone: "",
    address: ""
  })
  const [avatarFile, setAvatarFile] = useState<File | null>(null)
  const [avatarPreview, setAvatarPreview] = useState<string | null>(null)
  const [toastMessage, setToastMessage] = useState<{ text: string, type: 'success' | 'error' } | null>(null)

  useEffect(() => {
    const fetchProfileAndPets = async () => {
      const { data: { session } } = await supabase.auth.getSession()
      if (session) {
        let { data: profileData } = await supabase.from('profiles').select('*').eq('id', session.user.id).single()
        if (!profileData) {
          await supabase.from('profiles').insert({ id: session.user.id, role: 'patient' })
          const res = await supabase.from('profiles').select('*').eq('id', session.user.id).single()
          profileData = res.data
        }

        if (profileData) {
          setProfile({ ...profileData, email: session.user.email })
          setFormData({
            full_name: profileData.full_name || "",
            phone: profileData.phone || "",
            address: profileData.address || ""
          })
          setAvatarPreview(profileData.avatar_url || null)
        }

        const { data: petsData } = await supabase.from('pets').select('*').eq('owner_id', session.user.id)
        if (petsData) {
          setPets(petsData)
        }
      }
      setLoading(false)
    }
    fetchProfileAndPets()
  }, [])

  const handleAvatarChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      setAvatarFile(file)
      const reader = new FileReader()
      reader.onloadend = () => setAvatarPreview(reader.result as string)
      reader.readAsDataURL(file)
    }
  }

  const handleSave = async () => {
    if (!profile) return
    setSaving(true)
    
    let avUrl = profile.avatar_url

    if (avatarFile) {
      const fileExt = avatarFile.name.split('.').pop()
      const fileName = `avatar-${profile.id}-${Date.now()}.${fileExt}`
      const { error: uploadError } = await supabase.storage
        .from('health-records')
        .upload(fileName, avatarFile)
      
      if (!uploadError) {
        avUrl = supabase.storage.from('health-records').getPublicUrl(fileName).data.publicUrl
      }
    }

    const { error } = await supabase
      .from('profiles')
      .update({ 
        full_name: formData.full_name,
        phone: formData.phone,
        address: formData.address,
        avatar_url: avUrl
      })
      .eq('id', profile.id)
      
    setSaving(false)
    if (!error) {
      setToastMessage({ text: "Profile updated successfully!", type: 'success' })
    } else {
      setToastMessage({ text: "Failed to update profile.", type: 'error' })
    }
    setTimeout(() => setToastMessage(null), 4000)
  }

  if (loading) return <div className="animate-spin h-8 w-8 border-4 border-primary border-t-transparent rounded-full mx-auto mt-20" />

  return (
    <div className="max-w-4xl mx-auto">
      <div className="mb-8 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold font-heading">My Profile</h1>
          <p className="text-muted-foreground text-sm mt-1">Manage your personal information and contact details.</p>
        </div>
        <Button onClick={handleSave} disabled={saving} className="rounded-xl px-6 bg-primary hover:bg-primary/90 text-white shadow-md">
          {saving ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
          {saving ? "Saving..." : "Save Changes"}
        </Button>
      </div>

      <div className="bg-white rounded-3xl shadow-xl overflow-hidden flex flex-col border border-border">
        <div className="relative h-32 bg-gradient-to-r from-[#064e3b] to-emerald-700 p-6"></div>
        
        <div className="px-8 pb-8 -mt-16 relative">
          <div className="flex flex-col md:flex-row gap-6 items-start">
            <div className="relative group shrink-0">
              <div className="h-32 w-32 rounded-full bg-white border-4 border-white shadow-xl flex items-center justify-center text-primary font-bold overflow-hidden">
                {avatarPreview ? (
                  <img src={avatarPreview} alt="Avatar" className="h-full w-full object-cover" />
                ) : (
                  <UserCircle2 className="h-16 w-16 text-primary/40" />
                )}
              </div>
              <label htmlFor="avatar-upload" className="absolute inset-0 rounded-full bg-black/50 flex flex-col items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer text-white">
                <Camera className="h-6 w-6 mb-1" />
                <span className="text-xs font-semibold">Change</span>
              </label>
              <input id="avatar-upload" type="file" accept="image/*" onChange={handleAvatarChange} className="hidden" />
            </div>
            
            <div className="pt-2 md:pt-16 flex-1">
              <div className="flex flex-col">
                <Input 
                  value={formData.full_name} 
                  onChange={e => setFormData({...formData, full_name: e.target.value})} 
                  placeholder="Your Full Name"
                  className="text-2xl font-bold font-heading text-gray-900 bg-transparent border-none p-0 h-auto focus-visible:ring-0 focus-visible:outline-none w-full max-w-md"
                />
                <div className="inline-flex mt-2 items-center px-3 py-1 bg-primary/10 text-primary font-semibold text-xs rounded-full w-fit">
                  Client since {profile?.created_at ? new Date(profile.created_at).getFullYear() : '2026'}
                </div>
              </div>
            </div>
          </div>

          <div className="mt-10 grid grid-cols-1 md:grid-cols-2 gap-8">
            <div className="bg-muted/30 p-8 rounded-3xl border border-border">
              <h3 className="font-bold text-[#064e3b] mb-6 flex items-center gap-2 text-lg">
                <UserCircle2 className="h-5 w-5" /> Contact Details
              </h3>
              <div className="space-y-6">
                <div className="flex items-start gap-4">
                  <div className="h-10 w-10 rounded-xl bg-white flex items-center justify-center shadow-sm border border-border/50">
                    <Phone className="h-5 w-5 text-primary" />
                  </div>
                  <div className="flex-1">
                    <p className="text-xs font-bold text-muted-foreground uppercase tracking-wider mb-1">Phone Number</p>
                    <Input 
                      value={formData.phone} 
                      onChange={e => setFormData({...formData, phone: e.target.value})} 
                      placeholder="+213..."
                      className="text-sm font-medium bg-transparent border-none p-0 h-auto focus-visible:ring-0 focus-visible:outline-none"
                    />
                  </div>
                </div>

                <div className="flex items-start gap-4">
                  <div className="h-10 w-10 rounded-xl bg-white flex items-center justify-center shadow-sm border border-border/50">
                    <Mail className="h-5 w-5 text-primary" />
                  </div>
                  <div className="flex-1">
                    <p className="text-xs font-bold text-muted-foreground uppercase tracking-wider mb-1">Email (System)</p>
                    <p className="text-sm font-medium text-muted-foreground">Managed by Auth</p>
                    <p className="text-[10px] text-muted-foreground mt-0.5">{profile?.email}</p>
                  </div>
                </div>

                <div className="flex items-start gap-4">
                  <div className="h-10 w-10 rounded-xl bg-white flex items-center justify-center shadow-sm border border-border/50">
                    <MapPin className="h-5 w-5 text-primary" />
                  </div>
                  <div className="flex-1">
                    <p className="text-xs font-bold text-muted-foreground uppercase tracking-wider mb-1">Address</p>
                    <Input 
                      value={formData.address} 
                      onChange={e => setFormData({...formData, address: e.target.value})} 
                      placeholder="Your City / Address"
                      className="text-sm font-medium bg-transparent border-none p-0 h-auto focus-visible:ring-0 focus-visible:outline-none"
                    />
                  </div>
                </div>
              </div>
            </div>

            <div className="bg-muted/30 p-8 rounded-3xl border border-border">
              <h3 className="font-bold text-[#064e3b] mb-6 flex items-center gap-2 text-lg">
                <PawPrint className="h-5 w-5" /> Registered Pets ({pets.length})
              </h3>
              
              {pets.length > 0 ? (
                <div className="space-y-4">
                  {pets.map((pet: any) => (
                    <div key={pet.id} className="bg-white p-4 rounded-2xl border border-border/50 flex items-center justify-between shadow-sm hover:shadow-md transition-shadow">
                      <div>
                        <p className="font-bold text-sm text-gray-900">{pet.name}</p>
                        <p className="text-xs text-muted-foreground">{pet.species} {pet.breed ? `• ${pet.breed}` : ''}</p>
                      </div>
                      {pet.age && (
                        <span className="text-xs bg-primary/10 px-3 py-1 rounded-full font-bold text-primary">
                          {pet.age} yrs
                        </span>
                      )}
                    </div>
                  ))}
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center p-8 bg-white/50 rounded-2xl border border-dashed border-border">
                  <PawPrint className="h-8 w-8 text-muted-foreground/30 mb-2" />
                  <p className="text-sm text-muted-foreground text-center italic">No pets found for this account.</p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {toastMessage && (
        <div className="fixed bottom-8 right-8 z-50 animate-in slide-in-from-bottom-5 fade-in duration-300">
          <div className={`border-l-4 rounded-xl shadow-2xl p-4 flex items-center gap-3 min-w-[250px] ${
            toastMessage.type === 'success' 
              ? 'bg-green-50 border-green-500 text-green-800' 
              : 'bg-red-50 border-red-500 text-red-800'
          }`}>
            {toastMessage.type === 'success' ? (
              <CheckCircle2 className="h-5 w-5 text-green-600" />
            ) : (
              <XCircle className="h-5 w-5 text-red-600" />
            )}
            <p className="font-medium text-sm">{toastMessage.text}</p>
          </div>
        </div>
      )}
    </div>
  )
}
