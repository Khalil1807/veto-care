import Link from "next/link"
import { Button } from "@/components/ui/button"
import { ArrowRight, Heart, Shield, Bone, Clipboard, Dog, PawPrint, Stethoscope } from "lucide-react"
import { supabase } from "@/lib/supabase"

export default async function Home() {

  return (
    <div className="flex flex-col">
      {/* Hero Section */}
      <section className="relative pt-12 pb-32 overflow-hidden bg-[#d1fae5]">
        <div className="container relative z-10 mx-auto px-4 flex flex-col lg:flex-row items-center gap-12 max-w-7xl">
          <div className="flex-1 relative order-2 lg:order-1">
            <img src="https://images.unsplash.com/photo-1583337130417-3346a1be7dee?q=80&w=1000&auto=format&fit=crop" alt="Dog" className="w-full max-w-[450px] mx-auto rounded-[3rem] object-cover aspect-square shadow-2xl" />
            <div className="absolute top-1/2 left-0 -translate-x-1/4 -translate-y-1/2 -z-10 text-[#a7f3d0]">
              <PawPrint className="h-80 w-80 opacity-50" />
            </div>
          </div>
          <div className="flex-1 space-y-6 text-center lg:text-left order-1 lg:order-2">
            <div className="inline-flex items-center rounded-full bg-[#a7f3d0]/60 px-5 py-2 text-sm font-semibold text-[#064e3b] backdrop-blur-sm shadow-sm">
              Welcome
            </div>
            
            <h1 className="text-6xl sm:text-7xl lg:text-[100px] font-bold tracking-tight text-[#064e3b] font-heading leading-[1.05]">
              Pet<br />Doctor
            </h1>
            
            <h3 className="text-xl font-bold text-[#064e3b] mt-6">We love pets like you do :)</h3>
            
            <p className="max-w-md mx-auto lg:mx-0 text-lg text-[#6D6785] leading-relaxed">
              Pets Webflow eCommerce Template is a modern and fresh approach of an online store.
            </p>
            
            <div className="pt-6">
              <Link href="/auth/signup">
                <Button size="lg" className="rounded-full bg-[#10b981] hover:bg-[#059669] text-[#064e3b] h-14 px-8 text-lg font-bold shadow-none border-none group transition-all">
                  Star Here!
                  <ArrowRight className="ml-2 h-5 w-5 group-hover:translate-x-1 transition-transform" />
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Intro Section */}
      <section className="py-28 bg-white text-center">
        <div className="container mx-auto px-4 max-w-6xl">
          <p className="text-[#8B85A7] font-medium mb-2 text-lg">Intro</p>
          <h2 className="text-5xl font-bold font-heading text-[#064e3b] mb-20">Get to know us more</h2>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-12">
            <div className="flex flex-col items-center">
              <div className="w-40 h-40 bg-[#FEF4E3] rounded-t-full rounded-bl-full rounded-br-[60px] flex items-center justify-center mb-8 overflow-hidden transform -rotate-3">
                <span className="text-7xl rotate-3">🏠</span>
              </div>
              <h3 className="text-2xl font-bold text-[#064e3b] mb-4">Pet Experts</h3>
              <p className="text-[#8B85A7] mb-8 leading-relaxed max-w-[260px]">Pets Webflow eCommerce Template is a modern</p>
            </div>
            <div className="flex flex-col items-center">
              <div className="w-40 h-40 bg-[#E1F6F9] rounded-[50px] flex items-center justify-center mb-8 rotate-3">
                <span className="text-7xl -rotate-3">🍲</span>
              </div>
              <h3 className="text-2xl font-bold text-[#064e3b] mb-4">Vet Services</h3>
              <p className="text-[#8B85A7] mb-8 leading-relaxed max-w-[260px]">Pets Webflow eCommerce Template is a modern</p>
            </div>
            <div className="flex flex-col items-center">
              <div className="w-40 h-40 bg-[#FFEAF1] rounded-b-full rounded-tl-[60px] rounded-tr-full flex items-center justify-center mb-8 transform -rotate-6">
                <span className="text-7xl rotate-6">🧴</span>
              </div>
              <h3 className="text-2xl font-bold text-[#064e3b] mb-4">Contact Us</h3>
              <p className="text-[#8B85A7] mb-8 leading-relaxed max-w-[260px]">Pets Webflow eCommerce Template is a modern</p>
            </div>
          </div>
        </div>
      </section>

      {/* About Us 1 */}
      <section className="py-24 bg-white" id="about">
        <div className="container mx-auto px-4 max-w-7xl">
          <div className="text-center mb-16">
            <p className="text-[#8B85A7] font-medium mb-2 text-lg">About Us</p>
            <h2 className="text-5xl font-bold font-heading text-[#064e3b]">What we can do for you</h2>
          </div>
          
          <div className="flex flex-col md:flex-row items-center gap-16 lg:gap-24">
            <div className="flex-1 w-full">
              <img src="https://images.unsplash.com/photo-1544568100-847a948585b9?q=80&w=1000&auto=format&fit=crop" alt="Boy with cat" className="w-full object-cover aspect-[4/3] shadow-none bg-[#F5EDDC]" />
            </div>
            <div className="flex-1 space-y-6">
              <div className="w-20 h-20 bg-[#FEF4E3] rounded-full flex items-center justify-center text-[#D8B06D] mb-8">
                <Heart className="h-10 w-10" />
              </div>
              <h2 className="text-4xl lg:text-5xl font-bold font-heading text-[#064e3b] leading-tight max-w-[400px]">Let us help you with your pet health</h2>
              <p className="text-[#8B85A7] leading-relaxed text-lg max-w-md mt-6">
                We take care of risk and compliance headaches, so you don't have to — including transaction monitoring, merchant KYC
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* About Us 2 */}
      <section className="py-24 bg-white">
        <div className="container mx-auto px-4 max-w-7xl flex flex-col md:flex-row-reverse items-center gap-16 lg:gap-24">
          <div className="flex-1 w-full">
            <img src="https://images.unsplash.com/photo-1576201836106-db1758fd1c97?q=80&w=1000&auto=format&fit=crop" alt="Girl with dog" className="w-full object-cover aspect-[4/3] shadow-none bg-[#F599A4]" />
          </div>
          <div className="flex-1 space-y-6">
            <div className="w-20 h-20 bg-[#FFEAF1] rounded-full flex items-center justify-center text-[#D68BA2] mb-8">
              <Dog className="h-10 w-10" />
            </div>
            <h2 className="text-4xl lg:text-5xl font-bold font-heading text-[#064e3b] leading-tight max-w-[400px]">Let us groom your precious and loved pet</h2>
            <p className="text-[#8B85A7] leading-relaxed text-lg max-w-md mt-6">
              We take care of risk and compliance headaches, so you don't have to — including transaction monitoring, merchant KYC
            </p>
          </div>
        </div>
      </section>

      {/* Services Section */}
      <section className="py-24 bg-white text-center" id="services">
        <div className="container mx-auto px-4 max-w-6xl">
          <p className="text-[#8B85A7] font-medium mb-2 text-lg">Services</p>
          <h2 className="text-5xl font-bold font-heading text-[#064e3b] mb-20">What we can do for you</h2>
          
          <div className="flex flex-wrap justify-center gap-8 md:gap-16 lg:gap-24">
            {[ 
              { icon: <Stethoscope className="h-12 w-12 text-[#2D6673]" />, label: "General Checkup" },
              { icon: <Shield className="h-12 w-12 text-[#2D6673]" />, label: "Vaccinations" },
              { icon: <Heart className="h-12 w-12 text-[#2D6673]" />, label: "Surgery" },
              { icon: <Clipboard className="h-12 w-12 text-[#2D6673]" />, label: "Dental Care" },
              { icon: <PawPrint className="h-12 w-12 text-[#2D6673]" />, label: "Pet Grooming" }
            ].map((s, i) => (
              <div key={i} className="flex flex-col items-center gap-6">
                <div className="w-36 h-36 bg-[#E1F6F9] rounded-full flex items-center justify-center hover:scale-105 transition-transform cursor-pointer">
                  {s.icon}
                </div>
                <p className="font-medium text-[#8B85A7] text-lg">{s.label}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Testimonials */}
      <section className="py-28 bg-[#f0fdf4] text-center">
        <div className="container mx-auto px-4 max-w-7xl">
          <p className="text-[#8B85A7] font-medium mb-2 text-lg">Testimonials</p>
          <h2 className="text-5xl font-bold font-heading text-[#064e3b] mb-16">What people say about us</h2>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {[
              { img: "https://i.pravatar.cc/150?img=5", name: "Laura Sheen", role: "Eyebrows Client", text: "They saved my furry friend's life! Grateful for their expertise and compassion. Highly recommended!" },
              { img: "https://i.pravatar.cc/150?img=12", name: "Laura Sheen", role: "Eyebrows Client", text: "Best pet shop ever! A variety of pet supplies and friendly staff. My fur babies are delighted!" },
              { img: "https://i.pravatar.cc/150?img=11", name: "Laura Sheen", role: "Eyebrows Client", text: "Professional and caring team. Our pets receive top-notch treatment every visit. Thank you for all!" }
            ].map((t, i) => (
              <div key={i} className="bg-white p-8 rounded-xl text-left shadow-sm hover:shadow-md transition-shadow">
                <div className="flex items-center gap-4 mb-8">
                  <img src={t.img} alt={t.name} className="w-14 h-14 rounded-full object-cover" />
                  <div>
                    <h4 className="font-bold text-[#064e3b] text-xl">{t.name}</h4>
                    <p className="text-[#8B85A7]">{t.role}</p>
                  </div>
                </div>
                <p className="text-[#6D6785] leading-relaxed text-lg">"{t.text}"</p>
              </div>
            ))}
          </div>
        </div>
      </section>


    </div>
  )
}
