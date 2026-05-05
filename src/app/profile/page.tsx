"use client"
import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { supabase } from "@/lib/supabase"
import { Profile, Pet } from "@/lib/types"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { User, Loader2, Save, PlusCircle, Trash2, FileText, Camera } from "lucide-react"

export default function ProfilePage() {
  const router = useRouter()
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [profile, setProfile] = useState<Profile | null>(null)
  
  const [fullName, setFullName] = useState("")
  const [phone, setPhone] = useState("")
  const [specialty, setSpecialty] = useState("")
  const [certificateFile, setCertificateFile] = useState<File | null>(null)
  const [avatarFile, setAvatarFile] = useState<File | null>(null)
  const [avatarPreview, setAvatarPreview] = useState<string | null>(null)



  useEffect(() => {
    const fetchData = async () => {
      const { data: { session } } = await supabase.auth.getSession()
      if (!session) {
        router.push("/auth/login")
        return
      }
      
      const { data: profileData } = await supabase
        .from("profiles")
        .select("*")
        .eq("id", session.user.id)
        .single()
        
      if (profileData) {
        setProfile(profileData as Profile)
        setFullName(profileData.full_name || "")
        setPhone(profileData.phone || "")
        setSpecialty(profileData.specialty || "")
        setAvatarPreview(profileData.avatar_url || null)
      }

      setLoading(false)
    }
    fetchData()
  }, [router])

  const handleAvatarChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      setAvatarFile(file)
      const reader = new FileReader()
      reader.onloadend = () => {
        setAvatarPreview(reader.result as string)
      }
      reader.readAsDataURL(file)
    }
  }

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!profile) return
    setSaving(true)
    
    let certUrl = profile.certificate_url
    let avUrl = profile.avatar_url

    // Upload Certificate
    if (certificateFile && profile.role === 'doctor') {
      const fileExt = certificateFile.name.split('.').pop()
      const fileName = `cert-${profile.id}-${Date.now()}.${fileExt}`
      const { error: uploadError } = await supabase.storage
        .from('health-records')
        .upload(fileName, certificateFile)
      
      if (!uploadError) {
        certUrl = supabase.storage.from('health-records').getPublicUrl(fileName).data.publicUrl
      }
    }

    // Upload Avatar
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
      .from("profiles")
      .update({ 
        full_name: fullName, 
        phone: phone,
        specialty: profile.role === 'doctor' ? specialty : null,
        certificate_url: profile.role === 'doctor' ? certUrl : null,
        avatar_url: avUrl
      })
      .eq("id", profile.id)
      
    setSaving(false)
    if (error) {
      alert("Failed to update profile. Make sure you ran the SQL Migration script!")
      console.error(error)
    } else {
      setProfile({
        ...profile, 
        full_name: fullName, 
        phone, 
        specialty, 
        certificate_url: certUrl, 
        avatar_url: avUrl
      })
      alert("Profile updated successfully")
    }
  }


  if (loading) {
    return (
      <div className="flex flex-1 items-center justify-center min-h-[calc(100vh-4rem)]">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    )
  }

  return (
    <div className={`container mx-auto px-4 py-12 ${profile?.role === 'patient' ? 'max-w-4xl grid md:grid-cols-2 gap-8' : 'max-w-xl'}`}>
      {/* Profile Section */}
      <Card className="shadow-xl border-primary/10 h-fit">
        <CardHeader>
          <CardTitle className="text-2xl font-heading flex items-center gap-2">
            <User className="h-6 w-6 text-primary" />
            My Profile
          </CardTitle>
          <CardDescription>
            {profile?.role === 'doctor' ? 'Manage your veterinary profile.' : 'Manage your personal information.'}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSave} className="space-y-6">
            
            {/* Avatar Upload */}
            <div className="flex flex-col items-center justify-center gap-4 mb-6">
              <div className="relative h-24 w-24 rounded-full overflow-hidden border-4 border-primary/20 bg-muted flex items-center justify-center group">
                {avatarPreview ? (
                  <img src={avatarPreview} alt="Avatar" className="h-full w-full object-cover" />
                ) : (
                  <User className="h-10 w-10 text-muted-foreground" />
                )}
                <label htmlFor="avatar" className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer">
                  <Camera className="h-6 w-6 text-white" />
                </label>
              </div>
              <input id="avatar" type="file" accept="image/*" onChange={handleAvatarChange} className="hidden" />
              <p className="text-xs text-muted-foreground">Click to change profile picture</p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input id="email" value={profile?.email || ""} disabled className="rounded-xl bg-muted/50" />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="fullName">Full Name</Label>
              <Input id="fullName" value={fullName} onChange={e => setFullName(e.target.value)} required className="rounded-xl" />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="phone">Phone Number</Label>
              <Input id="phone" value={phone} onChange={e => setPhone(e.target.value)} placeholder="+1 234 567 8900" className="rounded-xl" />
            </div>

            {profile?.role === 'doctor' && (
              <>
                <div className="space-y-2">
                  <Label htmlFor="specialty">Specialty</Label>
                  <Input id="specialty" value={specialty} onChange={e => setSpecialty(e.target.value)} required className="rounded-xl" />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="certificate">Upload New Certificate (Optional)</Label>
                  <Input 
                    id="certificate" 
                    type="file" 
                    accept="image/*,.pdf" 
                    onChange={e => setCertificateFile(e.target.files?.[0] || null)} 
                    className="rounded-xl file:bg-primary/10 file:text-primary file:border-0 file:rounded-md file:px-4 file:py-1 hover:file:bg-primary/20 cursor-pointer" 
                  />
                  {profile.certificate_url && (
                    <a href={profile.certificate_url} target="_blank" rel="noreferrer" className="text-sm text-primary flex items-center gap-1 mt-2 hover:underline">
                      <FileText className="h-4 w-4" /> View Current Certificate
                    </a>
                  )}
                </div>
              </>
            )}

            <Button type="submit" className="w-full rounded-xl h-12" disabled={saving}>
              {saving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />}
              {saving ? "Saving..." : "Save Changes"}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}
