"use client"
import { useEffect, useState, useRef } from "react"
import { supabase } from "@/lib/supabase"
import { Input } from "@/components/ui/input"
import { Search, Bell, X, Calendar, CheckCircle, Menu } from "lucide-react"
import Link from "next/link"

type Notification = {
  id: string;
  message: string;
  time: Date;
  read: boolean;
  link: string;
}

export default function Header({ onMenuClick }: { onMenuClick?: () => void }) {
  const [profile, setProfile] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [notifications, setNotifications] = useState<Notification[]>([])
  const [showDropdown, setShowDropdown] = useState(false)
  const [toast, setToast] = useState<Notification | null>(null)
  const dropdownRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    let activeChannel: any = null;

    const fetchProfile = async () => {
      const { data: { session } } = await supabase.auth.getSession()
      if (!session) {
        setLoading(false)
        return
      }

      const { data } = await supabase.from('profiles').select('*').eq('id', session.user.id).single()
      setProfile(data)

      if (data?.role === 'doctor') {
        // Fetch existing pending appointments
        const { data: apts } = await supabase
          .from('appointments')
          .select('id, created_at, pet:pets(name)')
          .eq('vet_id', session.user.id)
          .eq('status', 'pending')
          .order('created_at', { ascending: false })
          .limit(5)

        if (apts) {
          setNotifications(apts.map(apt => ({
            id: apt.id,
            message: `New appointment request for ${(apt.pet as any)?.name || 'a patient'}`,
            time: new Date(apt.created_at),
            read: false,
            link: '/dashboard/appointments'
          })))
        }

        // Subscribe to real-time inserts for new appointments
        activeChannel = supabase.channel(`appointments-insert-${Date.now()}`)
          .on('postgres_changes', { 
            event: 'INSERT', 
            schema: 'public', 
            table: 'appointments',
            filter: `vet_id=eq.${session.user.id}`
          }, (payload) => {
            const newNotif: Notification = {
              id: payload.new.id,
              message: "A patient just requested a new appointment!",
              time: new Date(payload.new.created_at || Date.now()),
              read: false,
              link: '/dashboard/appointments'
            }
            
            setNotifications(prev => [newNotif, ...prev])
            
            // Show toast popup
            setToast(newNotif)
            setTimeout(() => setToast(null), 5000)
          })
          .subscribe()
      } else if (data?.role === 'patient') {
        // Fetch existing confirmed appointments
        const { data: apts } = await supabase
          .from('appointments')
          .select('id, created_at, vet:profiles!vet_id(full_name)')
          .eq('owner_id', session.user.id)
          .eq('status', 'confirmed')
          .order('created_at', { ascending: false })
          .limit(5)

        if (apts) {
          setNotifications(apts.map(apt => ({
            id: apt.id,
            message: `Appointment with Dr. ${(apt.vet as any)?.full_name || 'the vet'} confirmed!`,
            time: new Date(apt.created_at),
            read: true, // assume historical ones are read
            link: '/dashboard/appointments'
          })))
        }

        // Subscribe to real-time updates for confirmed appointments
        activeChannel = supabase.channel(`appointments-update-${Date.now()}`)
          .on('postgres_changes', { 
            event: 'UPDATE', 
            schema: 'public', 
            table: 'appointments',
            filter: `owner_id=eq.${session.user.id}`
          }, (payload) => {
            if (payload.new.status === 'confirmed' && payload.old.status !== 'confirmed') {
              const newNotif: Notification = {
                id: payload.new.id,
                message: "Your appointment request has been confirmed!",
                time: new Date(),
                read: false,
                link: '/dashboard/appointments'
              }
              setNotifications(prev => [newNotif, ...prev])
              setToast(newNotif)
              setTimeout(() => setToast(null), 5000)
            }
          })
          .on('postgres_changes', {
            event: 'INSERT',
            schema: 'public',
            table: 'appointments',
            filter: `owner_id=eq.${session.user.id}`
          }, (payload) => {
            if (payload.new.status === 'confirmed') {
              const newNotif: Notification = {
                id: payload.new.id,
                message: "A new appointment/vaccination was scheduled for you!",
                time: new Date(),
                read: false,
                link: '/dashboard/appointments'
              }
              setNotifications(prev => [newNotif, ...prev])
              setToast(newNotif)
              setTimeout(() => setToast(null), 5000)
            }
          })
          .subscribe()
      }
      
      setLoading(false)
    }
    
    fetchProfile()

    return () => {
      if (activeChannel) {
        supabase.removeChannel(activeChannel)
      }
    }
  }, [])

  // Close dropdown when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setShowDropdown(false)
      }
    }
    document.addEventListener("mousedown", handleClickOutside)
    return () => document.removeEventListener("mousedown", handleClickOutside)
  }, [])

  const unreadCount = notifications.filter(n => !n.read).length

  const markAllRead = () => {
    setNotifications(notifications.map(n => ({ ...n, read: true })))
  }

  return (
    <>
      <header className="h-20 bg-white border-b border-border flex items-center justify-between px-4 md:px-8 shrink-0 relative z-30">
        <div className="flex items-center gap-4">
          <button 
            onClick={onMenuClick}
            className="p-2 -ml-2 rounded-xl text-muted-foreground hover:bg-muted lg:hidden transition-colors"
          >
            <Menu className="h-6 w-6" />
          </button>
          <div className="flex-1"></div>
        </div>

        <div className="flex items-center gap-6 relative">
          
          <div ref={dropdownRef}>
            <button 
              onClick={() => setShowDropdown(!showDropdown)}
              className={`relative p-2 rounded-full transition-colors ${showDropdown ? 'bg-primary/10 text-primary' : 'text-muted-foreground hover:bg-muted'}`}
            >
              <Bell className="h-5 w-5" />
              {unreadCount > 0 && (
                <span className="absolute top-1 right-1 h-3 w-3 bg-destructive rounded-full border-2 border-white flex items-center justify-center text-[8px] text-white font-bold">
                  {unreadCount}
                </span>
              )}
            </button>

            {/* Notifications Dropdown */}
            {showDropdown && (
              <div className="absolute top-full right-14 mt-2 w-80 bg-white border border-border rounded-2xl shadow-xl overflow-hidden z-50">
                <div className="p-4 border-b border-border flex items-center justify-between bg-muted/20">
                  <h3 className="font-bold text-sm">Notifications</h3>
                  {unreadCount > 0 && (
                    <button onClick={markAllRead} className="text-xs text-primary hover:underline">
                      Mark all read
                    </button>
                  )}
                </div>
                <div className="max-h-[300px] overflow-y-auto">
                  {notifications.length === 0 ? (
                    <div className="p-6 text-center text-muted-foreground text-sm">
                      <Bell className="h-8 w-8 mx-auto mb-2 opacity-20" />
                      No new notifications
                    </div>
                  ) : (
                    <div className="divide-y divide-border">
                      {notifications.map((notif, i) => (
                        <Link 
                          href={notif.link} 
                          key={`${notif.id}-${i}`}
                          onClick={() => {
                            setNotifications(notifications.map(n => n.id === notif.id ? { ...n, read: true } : n))
                            setShowDropdown(false)
                          }}
                          className={`flex gap-3 p-4 hover:bg-muted/30 transition-colors ${!notif.read ? 'bg-primary/5' : ''}`}
                        >
                          <div className={`h-8 w-8 rounded-full flex items-center justify-center shrink-0 ${!notif.read ? 'bg-primary/20 text-primary' : 'bg-muted text-muted-foreground'}`}>
                            <Calendar className="h-4 w-4" />
                          </div>
                          <div>
                            <p className={`text-sm ${!notif.read ? 'font-bold' : 'font-medium text-muted-foreground'}`}>{notif.message}</p>
                            <p className="text-xs text-muted-foreground mt-1">{notif.time.toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}</p>
                          </div>
                        </Link>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>

          <Link href={profile?.role === 'doctor' ? '/dashboard/profile' : '/dashboard/patient-profile'} className="flex items-center gap-3 pl-6 border-l border-border hover:opacity-80 transition-opacity">
            <div className="text-right">
              <p className="text-sm font-bold text-foreground leading-none">
                {loading ? 'Loading...' : (profile?.full_name || 'User')}
              </p>
              <p className="text-xs text-muted-foreground mt-1 capitalize">
                {loading ? '...' : (profile?.role || 'Patient')}
              </p>
            </div>
            <div className="h-10 w-10 rounded-full bg-primary/20 text-primary flex items-center justify-center font-bold text-lg overflow-hidden border border-primary/20">
              {profile?.avatar_url ? (
                <img src={profile.avatar_url} alt="Avatar" className="h-full w-full object-cover" />
              ) : (
                profile?.full_name?.charAt(0) || 'U'
              )}
            </div>
          </Link>
        </div>
      </header>

      {/* Floating Toast Notification */}
      {toast && (
        <div className="fixed top-24 right-8 z-50 animate-in slide-in-from-top-5 fade-in duration-300">
          <div className="bg-white border-l-4 border-primary rounded-xl shadow-2xl p-4 flex items-start gap-4 max-w-sm">
            <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center text-primary shrink-0">
              <Bell className="h-5 w-5 animate-bounce" />
            </div>
            <div className="flex-1">
              <h4 className="font-bold text-sm text-foreground">New Notification</h4>
              <p className="text-sm text-muted-foreground mt-0.5">{toast.message}</p>
              <Link 
                href={toast.link} 
                className="text-xs font-bold text-primary hover:underline mt-2 inline-block"
                onClick={() => setToast(null)}
              >
                View Details &rarr;
              </Link>
            </div>
            <button onClick={() => setToast(null)} className="text-muted-foreground hover:text-foreground">
              <X className="h-4 w-4" />
            </button>
          </div>
        </div>
      )}
    </>
  )
}
