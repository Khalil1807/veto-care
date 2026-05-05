"use client"

import Link from "next/link"
import { usePathname, useRouter } from "next/navigation"
import { useEffect, useState } from "react"
import { supabase } from "@/lib/supabase"
import { Button } from "./ui/button"
import { ShoppingCart, User, LogOut } from "lucide-react"
import { BrandLogo } from "@/components/brand-logo"

export default function Navbar() {
  const pathname = usePathname()
  const router = useRouter()
  const [user, setUser] = useState<any>(null)

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null)
    })

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null)
    })

    return () => subscription.unsubscribe()
  }, [])

  const handleLogout = async () => {
    await supabase.auth.signOut()
    router.push("/")
  }

  if (pathname.startsWith('/dashboard')) return null;

  return (
    <nav className="sticky top-0 z-50 w-full bg-white/90 backdrop-blur-md border-b border-border/40">
      <div className="container mx-auto flex h-24 items-center justify-between px-4 max-w-7xl">
        {/* Logo */}
        <Link href="/" className="flex items-center">
          <BrandLogo className="h-10 w-10 mr-3" />
          <span className="font-heading text-3xl font-bold tracking-tight text-[#064e3b]">
            Dr <span className="text-primary/80">Paws</span>
          </span>
        </Link>

        {/* Links */}
        <div className="hidden lg:flex items-center gap-8">
          <Link href="/" className={`text-[16px] font-medium transition-colors hover:text-primary ${pathname === '/' ? 'text-primary' : 'text-[#064e3b]'}`}>Home</Link>
          <Link href="#about" className="text-[16px] font-medium text-[#064e3b] hover:text-primary transition-colors">About Us</Link>
          <Link href="#services" className="text-[16px] font-medium text-[#064e3b] hover:text-primary transition-colors">Services</Link>
        </div>

        {/* Right side actions */}
        <div className="flex items-center gap-6">
          
          {user ? (
            <div className="flex items-center gap-4">
              <Link href="/dashboard">
                <Button variant="outline" className="rounded-full border-primary text-primary hover:bg-primary/10 px-6 h-12 shadow-none font-bold text-[16px]">
                  Dashboard
                </Button>
              </Link>
              <button onClick={handleLogout} className="h-12 w-12 flex items-center justify-center rounded-full bg-muted/50 text-muted-foreground hover:bg-destructive/10 hover:text-destructive transition-colors">
                <LogOut className="h-5 w-5" />
              </button>
            </div>
          ) : (
            <div className="flex items-center gap-3">
              <Link href="/auth/login">
                <Button variant="ghost" className="rounded-full text-[#064e3b] hover:bg-[#d1fae5] px-6 h-12 font-bold text-[16px]">
                  Sign In
                </Button>
              </Link>
              <Link href="/auth/signup">
                <Button className="rounded-full bg-primary text-white hover:bg-primary/90 px-6 h-12 shadow-none border-none font-bold text-[16px]">
                  Sign Up
                </Button>
              </Link>
            </div>
          )}
        </div>
      </div>
    </nav>
  )
}
