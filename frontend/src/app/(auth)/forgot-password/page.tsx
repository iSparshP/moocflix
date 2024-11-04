import { Metadata } from "next"
import { Mail } from "lucide-react"
import { PasswordResetForm } from "@/components/auth/PasswordResetForm"

export const metadata: Metadata = {
  title: "Forgot Password - MoocFlix",
  description: "Reset your password through email verification",
}

export default function ForgotPasswordPage() {
  return (
    <div className="container relative flex-col items-center justify-center md:grid lg:max-w-none lg:grid-cols-2 lg:px-0">
      <div className="relative hidden h-full flex-col bg-muted p-10 text-white dark:border-r lg:flex">
        <div className="absolute inset-0 bg-zinc-900" />
        <div className="relative z-20 flex items-center text-lg font-medium">
          <Mail className="mr-2 h-6 w-6" /> MoocFlix
        </div>
        <div className="relative z-20 mt-auto">
          <blockquote className="space-y-2">
            <p className="text-lg">
              &ldquo;Learning is not attained by chance, it must be sought for with ardor and attended to with diligence.&rdquo;
            </p>
            <footer className="text-sm">Abigail Adams</footer>
          </blockquote>
        </div>
      </div>
      <div className="lg:p-8">
        <div className="mx-auto flex w-full flex-col justify-center space-y-6 sm:w-[350px]">
          <PasswordResetForm />
        </div>
      </div>
    </div>
  )
}
