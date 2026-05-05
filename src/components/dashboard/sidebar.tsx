"use client"
import Link from "next/link"
import { usePathname, useRouter } from "next/navigation"
import { useEffect, useState } from "react"
import { supabase } from "@/lib/supabase"
import { LayoutDashboard, Calendar, Users, HeartPulse, Stethoscope, BarChart3, UserCircle, LogOut } from "lucide-react"
import { BrandLogo } from "@/components/brand-logo"

const DOCTOR_LINKS = [
  { name: "Dashboard", href: "/dashboard", icon: LayoutDashboard },
  { name: "Appointments", href: "/dashboard/appointments", icon: Calendar },
  { name: "Patients", href: "/dashboard/patients", icon: HeartPulse },
  { name: "Pet Owners", href: "/dashboard/pet-owners", icon: Users },
  { name: "Vaccinations", href: "/dashboard/vaccinations", icon: Stethoscope },
  { name: "Medical Records", href: "/dashboard/medical-records", icon: BarChart3 },
]

const PATIENT_LINKS = [
  { name: "Dashboard", href: "/dashboard", icon: LayoutDashboard },
  { name: "My Appointments", href: "/dashboard/appointments", icon: Calendar },
  { name: "My Pets", href: "/dashboard/pets", icon: HeartPulse },
  { name: "Specialists", href: "/dashboard/specialists", icon: Stethoscope },
  { name: "Medical Records", href: "/dashboard/medical-records", icon: BarChart3 },
]

export default function Sidebar() {
  const pathname = usePathname()
  const router = useRouter()
  const [role, setRole] = useState<string | null>(null)

  useEffect(() => {
    const fetchRole = async () => {
      const { data: { session } } = await supabase.auth.getSession()
      if (session) {
        const { data } = await supabase.from('profiles').select('role').eq('id', session.user.id).single()
        if (data) setRole(data.role)
      }
    }
    fetchRole()
  }, [])

  const handleLogout = async () => {
    await supabase.auth.signOut()
    router.push("/")
  }

  const links = role === 'doctor' ? DOCTOR_LINKS : PATIENT_LINKS

  return (
    <div className="w-64 bg-white border-r border-border flex flex-col h-full shrink-0">
      <div className="p-6">
        <Link href="/" className="flex items-center gap-2">
          <div className="h-8 w-8 rounded-lg flex items-center justify-center">
            <BrandLogo className="h-8 w-8" />
          </div>
          <span className="font-heading text-xl font-bold tracking-tight text-[#3D3759]">
            Dr <span className="text-primary">Paws</span>
          </span>
        </Link>
      </div>

      <nav className="flex-1 px-4 py-4 space-y-1 overflow-y-auto">
        {links.map((link) => {
          const isActive = pathname === link.href || (pathname.startsWith(link.href + '/') && link.href !== '/dashboard' && link.href !== '/profile')
          const Icon = link.icon
          return (
            <Link
              key={link.name}
              href={link.href}
              className={`flex items-center gap-3 px-3 py-2.5 rounded-xl font-medium transition-colors ${
                isActive 
                  ? "bg-primary/10 text-primary" 
                  : "text-muted-foreground hover:bg-muted/50 hover:text-foreground"
              }`}
            >
              <Icon className="h-5 w-5" />
              {link.name}
            </Link>
          )
        })}
      </nav>

      <div className="p-4 border-t border-border space-y-1">
        <Link
          href={role === 'doctor' ? "/dashboard/profile" : "/dashboard/patient-profile"}
          className={`flex items-center gap-3 px-3 py-2.5 rounded-xl font-medium transition-colors ${
            pathname === "/dashboard/profile" || pathname === "/dashboard/patient-profile"
              ? "bg-primary/10 text-primary" 
              : "text-muted-foreground hover:bg-muted/50 hover:text-foreground"
          }`}
        >
          <UserCircle className="h-5 w-5" />
          My Profile
        </Link>
        <button
          onClick={handleLogout}
          className="flex items-center gap-3 px-3 py-2.5 rounded-xl font-medium transition-colors text-muted-foreground hover:bg-destructive/10 hover:text-destructive w-full text-left"
        >
          <LogOut className="h-5 w-5" />
          Logout
        </button>
      </div>
    </div>
  )
}
