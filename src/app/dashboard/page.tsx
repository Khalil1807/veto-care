"use client"
import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { supabase } from "@/lib/supabase"
import { Profile } from "@/lib/types"
import { Button } from "@/components/ui/button"
import { Calendar, PlusCircle, HeartPulse, Clock, FileText } from "lucide-react"
import Link from "next/link"

export default function DashboardOverview() {
  const router = useRouter()
  const [profile, setProfile] = useState<Profile | null>(null)
  const [loading, setLoading] = useState(true)
  const [stats, setStats] = useState({ pending: 0, totalPets: 0 })

  useEffect(() => {
    const fetchDashboardData = async () => {
      const { data: { session } } = await supabase.auth.getSession()
      if (!session) {
        router.push("/auth/login")
        return
      }
      
      const { data } = await supabase.from('profiles').select('*').eq('id', session.user.id).single()
      if (data) {
        setProfile(data as Profile)
        
        // Fetch specific stats based on role
        if (data.role === 'doctor') {
          const { count: pendingCount } = await supabase.from('appointments').select('*', { count: 'exact', head: true }).eq('vet_id', session.user.id).eq('status', 'pending')
          const { data: apts } = await supabase.from('appointments').select('pet_id').eq('vet_id', session.user.id).not('pet_id', 'is', null)
          
          let totalPets = 0
          if (apts) {
            totalPets = new Set(apts.map(a => a.pet_id)).size
          }
          
          setStats({ pending: pendingCount || 0, totalPets })
        } else {
          // Patient stats
          const { count: pendingCount } = await supabase.from('appointments').select('*', { count: 'exact', head: true }).eq('owner_id', session.user.id).eq('status', 'pending')
          const { count: petsCount } = await supabase.from('pets').select('*', { count: 'exact', head: true }).eq('owner_id', session.user.id)
          
          setStats({ pending: pendingCount || 0, totalPets: petsCount || 0 })
        }
      }
      setLoading(false)
    }
    fetchDashboardData()
  }, [router])

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="animate-spin h-8 w-8 border-4 border-primary border-t-transparent rounded-full" />
      </div>
    )
  }

  const isDoctor = profile?.role === 'doctor'

  return (
    <div className="max-w-6xl mx-auto space-y-8">
      <div>
        <h1 className="text-3xl font-bold font-heading text-foreground">
          Welcome to your Dashboard, <span className="text-primary">{isDoctor ? `Dr. ${profile?.full_name}` : profile?.full_name}</span> 👋
        </h1>
        <p className="text-muted-foreground mt-2">
          {isDoctor 
            ? "Here's an overview of your practice. Use the sidebar to navigate to your appointments and patient records."
            : "Here's an overview of your pet's health. Manage your upcoming visits and health records below."}
        </p>
      </div>

      {!isDoctor && (
        <div className="bg-primary/5 border border-primary/20 rounded-2xl p-6 flex flex-col sm:flex-row items-center justify-between gap-6 shadow-sm">
          <div>
            <h2 className="text-xl font-bold text-primary mb-1">Does your pet need a doctor?</h2>
            <p className="text-muted-foreground text-sm">Find a specialist and book a consultation in minutes.</p>
          </div>
          <Link href="/dashboard/appointments">
            <Button className="rounded-xl bg-primary hover:bg-primary/90 text-white px-8 h-12 text-md shadow-md hover:shadow-lg transition-all w-full sm:w-auto">
              <PlusCircle className="h-5 w-5 mr-2" />
              Book Appointment Now
            </Button>
          </Link>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white p-6 rounded-2xl border border-border shadow-sm flex items-start gap-4 hover:shadow-md transition-shadow">
          <div className="h-12 w-12 rounded-full bg-orange-100 flex items-center justify-center text-orange-600 shrink-0">
            <Clock className="h-6 w-6" />
          </div>
          <div>
            <h3 className="font-bold text-lg mb-1">Appointments</h3>
            <p className="text-3xl font-bold text-foreground">{stats.pending}</p>
            <p className="text-sm text-muted-foreground mt-1">Pending approval</p>
          </div>
        </div>

        <div className="bg-white p-6 rounded-2xl border border-border shadow-sm flex items-start gap-4 hover:shadow-md transition-shadow">
          <div className="h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center text-primary shrink-0">
            <HeartPulse className="h-6 w-6" />
          </div>
          <div>
            <h3 className="font-bold text-lg mb-1">{isDoctor ? "Patients" : "My Pets"}</h3>
            <p className="text-3xl font-bold text-foreground">{stats.totalPets}</p>
            <p className="text-sm text-muted-foreground mt-1">Total registered</p>
          </div>
        </div>
        
        {isDoctor && (
          <div className="bg-white p-6 rounded-2xl border border-border shadow-sm flex items-start gap-4 hover:shadow-md transition-shadow">
            <div className="h-12 w-12 rounded-full bg-blue-100 flex items-center justify-center text-blue-600 shrink-0">
              <FileText className="h-6 w-6" />
            </div>
            <div>
              <h3 className="font-bold text-lg mb-1">Quick Actions</h3>
              <div className="space-y-2 mt-2">
                <Link href="/dashboard/medical-records" className="text-sm text-primary hover:underline flex items-center gap-1">
                  &rarr; Log Medical Record
                </Link>
                <Link href="/dashboard/vaccinations" className="text-sm text-primary hover:underline flex items-center gap-1">
                  &rarr; Add Vaccination
                </Link>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
