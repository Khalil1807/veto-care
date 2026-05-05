"use client"
import Link from "next/link"
import { usePathname } from "next/navigation"
import { ArrowRight } from "lucide-react"
import { BrandLogo } from "@/components/brand-logo"

const Facebook = ({ className }: { className?: string }) => (
  <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}><path d="M18 2h-3a5 5 0 0 0-5 5v3H7v4h3v8h4v-8h3l1-4h-4V7a1 1 0 0 1 1-1h3z"></path></svg>
)

const Twitter = ({ className }: { className?: string }) => (
  <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}><path d="M22 4s-.7 2.1-2 3.4c1.6 10-9.4 17.3-18 11.6 2.2.1 4.4-.6 6-2C3 15.5.5 9.6 3 5c2.2 2.6 5.6 4.1 9 4-.9-4.2 4-6.6 7-3.8 1.1 0 3-1.2 3-1.2z"></path></svg>
)

const Youtube = ({ className }: { className?: string }) => (
  <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}><path d="M22.54 6.42a2.78 2.78 0 0 0-1.94-2C18.88 4 12 4 12 4s-6.88 0-8.6.46a2.78 2.78 0 0 0-1.94 2A29 29 0 0 0 1 11.75a29 29 0 0 0 .46 5.33A2.78 2.78 0 0 0 3.4 19c1.72.46 8.6.46 8.6.46s6.88 0 8.6-.46a2.78 2.78 0 0 0 1.94-2 29 29 0 0 0 .46-5.25 29 29 0 0 0-.46-5.33z"></path><polygon points="9.75 15.02 15.5 11.75 9.75 8.48 9.75 15.02"></polygon></svg>
)

const Linkedin = ({ className }: { className?: string }) => (
  <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}><path d="M16 8a6 6 0 0 1 6 6v7h-4v-7a2 2 0 0 0-2-2 2 2 0 0 0-2 2v7h-4v-7a6 6 0 0 1 6-6z"></path><rect x="2" y="9" width="4" height="12"></rect><circle cx="4" cy="4" r="2"></circle></svg>
)

const Instagram = ({ className }: { className?: string }) => (
  <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}><rect x="2" y="2" width="20" height="20" rx="5" ry="5"></rect><path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z"></path><line x1="17.5" y1="6.5" x2="17.51" y2="6.5"></line></svg>
)

export default function Footer() {
  const pathname = usePathname()
  if (pathname.startsWith('/dashboard')) return null;

  return (
    <footer className="bg-white pt-20 pb-10 border-t border-border/40">
      <div className="container mx-auto px-4 max-w-7xl">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-12 mb-16">
          {/* Logo */}
          <div className="lg:col-span-1">
            <Link href="/" className="inline-block">
              <div className="flex items-center gap-3">
                <BrandLogo className="h-10 w-10" />
                <span className="font-heading text-3xl font-bold tracking-tight text-[#3D3759]">
                  Dr <span className="text-primary/80">Paws</span>
                </span>
              </div>
            </Link>
          </div>

          {/* Company */}
          <div>
            <h3 className="font-bold text-[#3D3759] mb-6 text-xl">Company</h3>
            <ul className="space-y-4">
              <li><Link href="/" className="text-primary hover:text-primary/80 font-medium transition-colors">Home</Link></li>
              <li><Link href="#about" className="text-[#6D6785] hover:text-primary font-medium transition-colors">About Us</Link></li>
              <li><Link href="#services" className="text-[#6D6785] hover:text-primary font-medium transition-colors">Services</Link></li>
            </ul>
          </div>



          {/* Address & Inquiries */}
          <div>
            <h3 className="font-bold text-[#3D3759] mb-6 text-xl">Address</h3>
            <p className="text-[#6D6785] mb-4 font-medium leading-relaxed">Amizour,<br/>Bejaia,<br/>Algeria</p>
            
            <h3 className="font-bold text-[#3D3759] mb-4 text-xl mt-4">Inquiries</h3>
            <p className="text-primary hover:text-primary/80 font-medium mb-2">800-234-567</p>
            <p className="text-primary hover:text-primary/80 font-medium">k_salem@estin.dz</p>
          </div>

          {/* Newsletter & Socials */}
          <div className="lg:col-span-1">
            <h3 className="font-bold text-[#3D3759] mb-6 text-xl">Newsletter</h3>
            <p className="text-[#6D6785] mb-4 font-medium">Stay Updated with our Latest News</p>
            <div className="flex items-center mb-8 relative">
              <input 
                type="email" 
                placeholder="Your email" 
                className="w-full h-12 pl-4 pr-14 rounded-full border border-border bg-transparent outline-none focus:border-primary/50 text-[#3D3759]"
              />
              <button className="absolute right-0 h-12 w-16 bg-[#EAE7F8] text-[#3D3759] rounded-r-full flex items-center justify-center hover:bg-[#DED9F4] transition-colors">
                <ArrowRight className="h-5 w-5" />
              </button>
            </div>

            <h3 className="font-bold text-[#3D3759] mb-4 text-xl">Follow Us</h3>
            <div className="flex items-center gap-2">
              <a href="#" className="flex h-10 w-10 items-center justify-center rounded-full bg-[#EAE7F8] text-[#3D3759] hover:bg-[#DED9F4] transition-colors"><Facebook className="h-4 w-4" /></a>
              <a href="#" className="flex h-10 w-10 items-center justify-center rounded-full bg-[#EAE7F8] text-[#3D3759] hover:bg-[#DED9F4] transition-colors"><Twitter className="h-4 w-4" /></a>
              <a href="#" className="flex h-10 w-10 items-center justify-center rounded-full bg-[#EAE7F8] text-[#3D3759] hover:bg-[#DED9F4] transition-colors"><Youtube className="h-4 w-4" /></a>
              <a href="#" className="flex h-10 w-10 items-center justify-center rounded-full bg-[#EAE7F8] text-[#3D3759] hover:bg-[#DED9F4] transition-colors"><Linkedin className="h-4 w-4" /></a>
              <a href="#" className="flex h-10 w-10 items-center justify-center rounded-full bg-[#EAE7F8] text-[#3D3759] hover:bg-[#DED9F4] transition-colors"><Instagram className="h-4 w-4" /></a>
            </div>
          </div>
        </div>
      </div>
    </footer>
  )
}
