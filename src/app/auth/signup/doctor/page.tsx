"use client"
import { useState } from "react"
import { useRouter } from "next/navigation"
import { supabase } from "@/lib/supabase"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Loader2, ArrowLeft } from "lucide-react"
import Link from "next/link"

export default function DoctorSignUpPage() {
  const router = useRouter()
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [fullName, setFullName] = useState("")
  const [phone, setPhone] = useState("")
  const [address, setAddress] = useState("")
  const [specialty, setSpecialty] = useState("")
  const [experience, setExperience] = useState("")
  const [bio, setBio] = useState("")
  const [certificateFile, setCertificateFile] = useState<File | null>(null)
  
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError(null)
    
    if (!certificateFile) {
      setError("Medical license or certificate is required for verification.")
      setLoading(false)
      return
    }
    
    // Step 1: Create auth user
    const { data, error: signUpError } = await supabase.auth.signUp({
      email,
      password,
    })

    if (signUpError) {
      // If it's a trigger error, the user may have been created anyway
      if (signUpError.message.includes("Database error") || signUpError.status === 500) {
        // Try to sign in — the auth user may have been created despite the trigger crash
        const { data: signInData, error: signInError } = await supabase.auth.signInWithPassword({
          email,
          password,
        })
        if (signInError) {
          setError("Signup failed: " + signUpError.message + ". Please try again.")
          setLoading(false)
          return
        }
        // Sign-in worked! Continue with profile save using signInData
        if (signInData.user) {
          await saveProfile(signInData.user.id)
        }
        router.push("/dashboard")
        return
      }
      
      setError(signUpError.message)
      setLoading(false)
      return
    }

    if (data.user && data.session) {
      // Set session explicitly so RLS auth.uid() works
      await supabase.auth.setSession({
        access_token: data.session.access_token,
        refresh_token: data.session.refresh_token,
      })
      await saveProfile(data.user.id)
      router.push("/dashboard")
    } else if (data.user && !data.session) {
      // Email confirmation is probably enabled
      // Try signing in directly (some Supabase configs auto-confirm)
      const { data: signInData, error: signInError } = await supabase.auth.signInWithPassword({
        email,
        password,
      })
      if (signInError) {
        setError("Account created! Please check your email to confirm, then log in.")
        setLoading(false)
        return
      }
      if (signInData.user) {
        await saveProfile(signInData.user.id)
      }
      router.push("/dashboard")
    }
  }

  const saveProfile = async (userId: string) => {
    // Upload certificate
    let finalCertUrl = null
    if (certificateFile) {
      const fileExt = certificateFile.name.split('.').pop()
      const fileName = `cert-${userId}-${Date.now()}.${fileExt}`
      const { error: uploadError } = await supabase.storage
        .from('health-records')
        .upload(fileName, certificateFile)
      if (!uploadError) {
        const { data: { publicUrl } } = supabase.storage.from('health-records').getPublicUrl(fileName)
        finalCertUrl = publicUrl
      }
    }

    const profileData = {
      full_name: fullName,
      phone,
      address,
      specialty,
      experience,
      bio,
      role: 'doctor' as const,
      certificate_url: finalCertUrl,
    }

    // Wait for trigger to create the row (if trigger works)
    await new Promise(r => setTimeout(r, 800))

    // Try UPDATE first (trigger may have created the row)
    const { error: updateError, count } = await supabase
      .from("profiles")
      .update(profileData)
      .eq('id', userId)
      .select()

    if (updateError || !count) {
      // Row doesn't exist yet — INSERT it
      const { error: insertError } = await supabase.from("profiles").insert({
        id: userId,
        ...profileData,
      })
      if (insertError) {
        // Last resort: try upsert
        const { error: upsertError } = await supabase.from("profiles").upsert({
          id: userId,
          ...profileData,
        }, { onConflict: 'id' })
        if (upsertError) {
          console.error('All profile save attempts failed:', upsertError)
          setError("Account created but profile save failed. Please log in and update your profile.")
        }
      }
    }
  }

  return (
    <div className="flex flex-1 items-center justify-center min-h-[calc(100vh-4rem)] p-4 bg-background/50 py-12">
      <Card className="w-full max-w-2xl shadow-xl border-primary/10">
        <CardHeader className="space-y-2">
          <Link href="/auth/signup" className="text-sm text-muted-foreground flex items-center hover:text-primary mb-2 w-fit">
            <ArrowLeft className="h-4 w-4 mr-1" /> Back
          </Link>
          <CardTitle className="text-3xl font-heading text-primary">Veterinarian Sign Up</CardTitle>
          <CardDescription>Join Dr Paws as a medical professional</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSignUp} className="space-y-6">
            
            <div className="space-y-4 bg-muted/30 p-4 rounded-xl border border-border">
              <h3 className="font-semibold">Personal Information</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Full Name</Label>
                  <Input value={fullName} onChange={e => setFullName(e.target.value)} required placeholder="Dr. John Doe" className="bg-white rounded-xl" />
                </div>
                <div className="space-y-2">
                  <Label>Phone Number</Label>
                  <Input value={phone} onChange={e => setPhone(e.target.value)} required placeholder="+213 555..." className="bg-white rounded-xl" />
                </div>
                <div className="space-y-2 md:col-span-2">
                  <Label>Clinic Address / City</Label>
                  <Input value={address} onChange={e => setAddress(e.target.value)} required placeholder="123 Vet Clinic St, Algiers" className="bg-white rounded-xl" />
                </div>
              </div>
            </div>

            <div className="space-y-4 bg-muted/30 p-4 rounded-xl border border-border">
              <h3 className="font-semibold">Professional Details</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Specialty</Label>
                  <Input value={specialty} onChange={e => setSpecialty(e.target.value)} required placeholder="e.g. Feline Surgery" className="bg-white rounded-xl" />
                </div>
                <div className="space-y-2">
                  <Label>Years of Experience</Label>
                  <Input value={experience} onChange={e => setExperience(e.target.value)} type="number" required placeholder="e.g. 8" className="bg-white rounded-xl" />
                </div>
                <div className="space-y-2 md:col-span-2">
                  <Label>Professional Bio</Label>
                  <Textarea value={bio} onChange={e => setBio(e.target.value)} placeholder="Tell pet owners about your expertise..." className="bg-white rounded-xl" />
                </div>
                <div className="space-y-2 md:col-span-2">
                  <Label>Medical License / Certificate (Required)</Label>
                  <Input 
                    type="file" 
                    accept="image/*,.pdf" 
                    onChange={e => setCertificateFile(e.target.files?.[0] || null)} 
                    required
                    className="bg-white rounded-xl file:bg-primary/10 file:text-primary file:border-0 file:rounded-md file:px-4 file:py-1 hover:file:bg-primary/20 cursor-pointer" 
                  />
                </div>
              </div>
            </div>

            <div className="space-y-4 bg-muted/30 p-4 rounded-xl border border-border">
              <h3 className="font-semibold">Account Login</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Email</Label>
                  <Input type="email" value={email} onChange={e => setEmail(e.target.value)} required placeholder="dr.john@example.com" className="bg-white rounded-xl" />
                </div>
                <div className="space-y-2">
                  <Label>Password</Label>
                  <Input type="password" value={password} onChange={e => setPassword(e.target.value)} required className="bg-white rounded-xl" />
                </div>
              </div>
            </div>
            
            {error && <p className="text-sm text-destructive font-medium border border-destructive/20 p-2 rounded bg-destructive/10">{error}</p>}
            
            <Button type="submit" className="w-full rounded-xl h-12 text-lg font-bold" disabled={loading}>
              {loading ? <Loader2 className="mr-2 h-5 w-5 animate-spin" /> : null}
              {loading ? "Creating Profile..." : "Create Professional Account"}
            </Button>
          </form>
        </CardContent>
        <CardFooter className="justify-center">
          <p className="text-sm text-muted-foreground">
            Already have an account? <Link href="/auth/login" className="text-primary hover:underline font-medium">Log in</Link>
          </p>
        </CardFooter>
      </Card>
    </div>
  )
}
