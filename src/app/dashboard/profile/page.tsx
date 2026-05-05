"use client"
import { useEffect, useState } from "react"
import { supabase } from "@/lib/supabase"
import { Profile } from "@/lib/types"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Loader2, Sparkles, Stethoscope, FileText, Star, CheckCircle2, Circle, Camera } from "lucide-react"
import { useRouter } from "next/navigation"

export default function ProfilePage() {
  const router = useRouter()
  const [profile, setProfile] = useState<Profile | null>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [avatarFile, setAvatarFile] = useState<File | null>(null)
  const [avatarPreview, setAvatarPreview] = useState<string | null>(null)
  const [formData, setFormData] = useState({
    specialty: "",
    address: "Amizour, Bejaia",
    experience: "8",
    bio: ""
  })

  useEffect(() => {
    const fetchProfile = async () => {
      const { data: { session } } = await supabase.auth.getSession()
      if (session) {
        const { data } = await supabase.from('profiles').select('*').eq('id', session.user.id).single()
        if (data) {
          // Security check: Only doctors can access this page
          if (data.role !== 'doctor') {
            router.push('/dashboard')
            return
          }
          
          setProfile(data as Profile)
          setAvatarPreview(data.avatar_url || null)
          setFormData({
            specialty: data.specialty || "",
            address: data.address || "",
            experience: data.experience || "",
            bio: data.bio || ""
          })
        }
      }
      setLoading(false)
    }
    fetchProfile()
  }, [])

  const handleAvatarChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    setAvatarFile(file)

    // Preview immediately while we upload on save
    const reader = new FileReader()
    reader.onloadend = () => {
      setAvatarPreview(reader.result as string)
    }
    reader.readAsDataURL(file)
  }

  const handleSave = async () => {
    if (!profile) return
    setSaving(true)

    let avatar_url = profile.avatar_url
    if (avatarFile) {
      const fileExt = avatarFile.name.split('.').pop()
      const fileName = `avatar-${profile.id}-${Date.now()}.${fileExt}`

      const { error: uploadError } = await supabase.storage
        .from("health-records")
        .upload(fileName, avatarFile)

      if (!uploadError) {
        const { data } = supabase.storage.from("health-records").getPublicUrl(fileName)
        avatar_url = data.publicUrl
      }
    }

    const { error } = await supabase
      .from("profiles")
      .update({
        specialty: formData.specialty,
        address: formData.address,
        experience: formData.experience,
        bio: formData.bio,
        avatar_url
      })
      .eq("id", profile.id)
      
    setSaving(false)

    if (!error) {
      setProfile((prev) => (prev ? { ...prev, avatar_url } : prev))
      setAvatarPreview(avatar_url || null)
      setAvatarFile(null)
    }
  }

  if (loading) return <div className="animate-spin h-8 w-8 border-4 border-primary border-t-transparent rounded-full mx-auto mt-20" />

  const checklist = [
    { id: 'specialty', label: 'Specialty', checked: !!formData.specialty.trim() },
    { id: 'experience', label: 'Experience', checked: !!formData.experience.trim() },
    { id: 'address', label: 'Clinic Address', checked: !!formData.address.trim() },
    { id: 'bio', label: 'Bio / CV', checked: !!formData.bio.trim() },
  ];
  const completedCount = checklist.filter(c => c.checked).length;
  const completionPercentage = Math.round((completedCount / checklist.length) * 100);

  return (
    <div className="max-w-6xl mx-auto">
      <div className="mb-8 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold font-heading flex items-center gap-2">
            My Public Profile
          </h1>
          <p className="text-muted-foreground text-sm mt-1">Manage what pet owners see when they browse for a doctor</p>
        </div>
        <Button onClick={handleSave} disabled={saving} className="rounded-xl px-6">
          {saving ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
          {saving ? "Saving..." : "Save Changes"}
        </Button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-6">
          <div className="bg-white p-8 rounded-2xl border border-border shadow-sm">
            <h2 className="font-bold text-lg flex items-center gap-2 mb-6">
              <span className="h-8 w-8 rounded-xl bg-primary/10 flex items-center justify-center text-primary"><Stethoscope className="h-4 w-4" /></span>
              Professional Details
              <span className="text-xs font-normal text-muted-foreground ml-2">(Visible to pet owners searching for a doctor)</span>
            </h2>
            
            <div className="grid grid-cols-2 gap-6">
              <div className="space-y-2">
                <Label>SPECIALTY</Label>
                <Input 
                  value={formData.specialty} 
                  onChange={e => setFormData({...formData, specialty: e.target.value})} 
                  placeholder="e.g. Feline Specialist, Surgery" 
                  className="rounded-xl bg-muted/30"
                />
              </div>
              <div className="space-y-2">
                <Label>YEARS OF EXPERIENCE</Label>
                <Input 
                  value={formData.experience} 
                  onChange={e => setFormData({...formData, experience: e.target.value})} 
                  placeholder="e.g. 8" 
                  className="rounded-xl bg-muted/30"
                />
              </div>
              <div className="col-span-2 space-y-2">
                <Label>CLINIC ADDRESS</Label>
                <Input 
                  value={formData.address} 
                  onChange={e => setFormData({...formData, address: e.target.value})} 
                  placeholder="e.g. 12 Animal Care Lane, Algiers" 
                  className="rounded-xl bg-muted/30"
                />
              </div>
            </div>
          </div>

          <div className="bg-white p-8 rounded-2xl border border-border shadow-sm">
            <h2 className="font-bold text-lg flex items-center gap-2 mb-6">
              <span className="h-8 w-8 rounded-xl bg-purple-100 flex items-center justify-center text-purple-600"><FileText className="h-4 w-4" /></span>
              Professional Bio & CV
              <span className="text-xs font-normal text-muted-foreground ml-2">(Tell pet owners about your education, experience, and approach)</span>
            </h2>
            
            <Textarea 
              value={formData.bio}
              onChange={e => setFormData({...formData, bio: e.target.value})}
              placeholder="Write a compelling bio — include your education, years in practice, areas of expertise, your philosophy of care, and any specializations."
              className="min-h-[150px] rounded-xl bg-muted/30 resize-none"
            />
          </div>
        </div>

        <div className="space-y-6">
          <div className="bg-white p-6 rounded-2xl border border-border shadow-sm relative overflow-hidden">
            <div className="absolute top-0 left-0 w-full h-20 bg-primary/10"></div>
            <p className="text-xs font-bold text-muted-foreground uppercase tracking-wider mb-6 relative z-10">Preview</p>
            
            <div className="relative z-10 flex flex-col items-center text-center mt-4">
              <div className="relative h-24 w-24 rounded-full bg-white border-4 border-white shadow-lg overflow-hidden flex items-center justify-center text-3xl font-bold text-primary bg-primary/20">
                {avatarPreview || profile?.avatar_url ? (
                  <img
                    src={avatarPreview || (profile?.avatar_url as string)}
                    alt="Avatar"
                    className="h-full w-full object-cover"
                  />
                ) : (
                  profile?.full_name?.charAt(0) || "D"
                )}

                <label
                  htmlFor="avatar-upload"
                  className="absolute bottom-1 right-1 h-9 w-9 rounded-full bg-black/40 hover:bg-black/55 flex items-center justify-center cursor-pointer transition-colors"
                >
                  <Camera className="h-4 w-4 text-white" />
                </label>
                <input
                  id="avatar-upload"
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={handleAvatarChange}
                />
              </div>
              <h3 className="font-bold text-xl mt-4">Dr. {profile?.full_name}</h3>
              <p className="text-primary font-medium mt-1">{formData.specialty || 'Specialty not set'}</p>
              
              <div className="flex items-center gap-1 mt-2">
                {Array(5).fill(0).map((_, i) => <Star key={i} className="h-4 w-4 fill-yellow-400 text-yellow-400" />)}
                <span className="text-muted-foreground text-sm ml-2 font-medium">4.9</span>
              </div>
            </div>
            
            <div className="mt-8 pt-6 border-t border-border">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-bold">PROFILE COMPLETION</span>
                <span className={`text-sm font-bold ${completionPercentage === 100 ? 'text-green-600' : completionPercentage === 0 ? 'text-red-500' : 'text-primary'}`}>
                  {completionPercentage}%
                </span>
              </div>
              <div className="w-full bg-muted rounded-full h-2 mb-6">
                <div 
                  className={`h-2 rounded-full transition-all duration-500 ${completionPercentage === 100 ? 'bg-green-500' : completionPercentage === 0 ? 'bg-red-500 w-[2%]' : 'bg-primary'}`} 
                  style={{ width: `${Math.max(completionPercentage, 2)}%` }}
                ></div>
              </div>

              <div className="space-y-2 mt-4 text-sm">
                {checklist.map(item => (
                  <div key={item.id} className="flex items-center gap-3">
                    {item.checked ? (
                      <CheckCircle2 className="h-5 w-5 text-green-500" />
                    ) : (
                      <Circle className="h-5 w-5 text-muted-foreground/30" />
                    )}
                    <span className={item.checked ? "text-muted-foreground line-through" : "text-foreground font-medium"}>
                      {item.label}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>
          
          <div className="bg-green-50 border border-green-200 p-6 rounded-2xl">
            <h4 className="font-bold text-green-800 flex items-center gap-2 mb-3">
              <Sparkles className="h-4 w-4" /> Tips
            </h4>
            <ul className="text-sm text-green-700 space-y-2 list-disc pl-4">
              <li>Add a specialty to appear in filtered searches.</li>
              <li>A complete bio increases booking rates by 3x.</li>
              <li>Keep your address up-to-date for easy navigation.</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  )
}
