"use client"
import { useState } from "react"
import { useRouter } from "next/navigation"
import { supabase } from "@/lib/supabase"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Loader2, ArrowLeft } from "lucide-react"
import Link from "next/link"

export default function PatientSignUpPage() {
  const router = useRouter()
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [fullName, setFullName] = useState("")
  const [phone, setPhone] = useState("")
  const [address, setAddress] = useState("")
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError(null)
    
    const { data, error: signUpError } = await supabase.auth.signUp({
      email,
      password,
    })

    if (signUpError) {
      // If it's a trigger error, the user may have been created anyway
      if (signUpError.message.includes("Database error") || signUpError.status === 500) {
        const { data: signInData, error: signInError } = await supabase.auth.signInWithPassword({
          email,
          password,
        })
        if (signInError) {
          setError("Signup failed: " + signUpError.message + ". Please try again.")
          setLoading(false)
          return
        }
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
      await supabase.auth.setSession({
        access_token: data.session.access_token,
        refresh_token: data.session.refresh_token,
      })
      await saveProfile(data.user.id)
      router.push("/dashboard")
    } else if (data.user && !data.session) {
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
    const profileData = {
      full_name: fullName,
      phone,
      address,
      role: 'patient' as const,
    }

    // Wait for trigger to create the row
    await new Promise(r => setTimeout(r, 800))

    // Try UPDATE first
    const { error: updateError, count } = await supabase
      .from("profiles")
      .update(profileData)
      .eq('id', userId)
      .select()

    if (updateError || !count) {
      // Row doesn't exist — INSERT
      const { error: insertError } = await supabase.from("profiles").insert({
        id: userId,
        ...profileData,
      })
      if (insertError) {
        // Last resort: upsert
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
      <Card className="w-full max-w-md shadow-xl border-primary/10">
        <CardHeader className="space-y-2">
          <Link href="/auth/signup" className="text-sm text-muted-foreground flex items-center hover:text-primary mb-2 w-fit">
            <ArrowLeft className="h-4 w-4 mr-1" /> Back
          </Link>
          <CardTitle className="text-3xl font-heading text-primary">Pet Owner Sign Up</CardTitle>
          <CardDescription>Join Dr Paws to manage your pet's health</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSignUp} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="fullName">Full Name</Label>
              <Input id="fullName" value={fullName} onChange={e => setFullName(e.target.value)} required placeholder="John Doe" className="rounded-xl" />
            </div>
            
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="phone">Phone Number</Label>
                <Input id="phone" value={phone} onChange={e => setPhone(e.target.value)} required placeholder="+213 555..." className="rounded-xl" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="address">City / Address</Label>
                <Input id="address" value={address} onChange={e => setAddress(e.target.value)} required placeholder="Algiers" className="rounded-xl" />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input id="email" type="email" value={email} onChange={e => setEmail(e.target.value)} required placeholder="john@example.com" className="rounded-xl" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="password">Password</Label>
              <Input id="password" type="password" value={password} onChange={e => setPassword(e.target.value)} required className="rounded-xl" />
            </div>
            
            {error && <p className="text-sm text-destructive font-medium border border-destructive/20 p-2 rounded bg-destructive/10">{error}</p>}
            <Button type="submit" className="w-full rounded-xl mt-4" disabled={loading}>
              {loading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
              {loading ? "Creating account..." : "Create Account"}
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
