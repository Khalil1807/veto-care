"use client"
import Link from "next/link"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Dog, Stethoscope } from "lucide-react"

export default function SignUpChoicePage() {
  return (
    <div className="flex flex-1 items-center justify-center min-h-[calc(100vh-4rem)] p-4 bg-background/50">
      <div className="w-full max-w-3xl space-y-8 text-center">
        <div>
          <h1 className="text-4xl font-heading font-bold text-primary mb-2">Join Dr Paws</h1>
          <p className="text-muted-foreground text-lg">How do you want to use Dr Paws?</p>
        </div>

        <div className="grid md:grid-cols-2 gap-6">
          <Link href="/auth/signup/patient" className="block group">
            <Card className="h-full border-2 border-transparent group-hover:border-primary transition-all hover:shadow-lg cursor-pointer bg-white">
              <CardContent className="p-8 flex flex-col items-center text-center space-y-6">
                <div className="w-24 h-24 bg-primary/10 rounded-full flex items-center justify-center text-primary group-hover:scale-110 transition-transform">
                  <Dog className="w-12 h-12" />
                </div>
                <div>
                  <h3 className="text-2xl font-bold font-heading mb-2">I am a Pet Owner</h3>
                  <p className="text-muted-foreground">
                    Book appointments, track vaccinations, and manage your pet's health records all in one place.
                  </p>
                </div>
              </CardContent>
            </Card>
          </Link>

          <Link href="/auth/signup/doctor" className="block group">
            <Card className="h-full border-2 border-transparent group-hover:border-primary transition-all hover:shadow-lg cursor-pointer bg-white">
              <CardContent className="p-8 flex flex-col items-center text-center space-y-6">
                <div className="w-24 h-24 bg-primary/10 rounded-full flex items-center justify-center text-primary group-hover:scale-110 transition-transform">
                  <Stethoscope className="w-12 h-12" />
                </div>
                <div>
                  <h3 className="text-2xl font-bold font-heading mb-2">I am a Veterinarian</h3>
                  <p className="text-muted-foreground">
                    Manage your schedule, connect with pet owners, and build your professional online presence.
                  </p>
                </div>
              </CardContent>
            </Card>
          </Link>
        </div>

        <p className="text-sm text-muted-foreground mt-8">
          Already have an account? <Link href="/auth/login" className="text-primary hover:underline font-medium">Log in</Link>
        </p>
      </div>
    </div>
  )
}
