import { Metadata } from "next"
import { LogIn } from "lucide-react"
import { LoginForm } from "@/components/auth/LoginForm"

export const metadata: Metadata = {
  title: "Login - MoocFlix",
  description: "Login to your account",
}

export default function LoginPage() {
  return (
    <div className="container relative flex-col items-center justify-center md:grid lg:max-w-none lg:grid-cols-2 lg:px-0">
      <div className="relative hidden h-full flex-col bg-muted p-10 text-white dark:border-r lg:flex">
        <div className="absolute inset-0 bg-zinc-900" />
        <div className="relative z-20 flex items-center text-lg font-medium">
          <LogIn className="mr-2 h-6 w-6" /> MoocFlix
        </div>
        <div className="relative z-20 mt-auto">
          <blockquote className="space-y-2">
            <p className="text-lg">
              &ldquo;The beautiful thing about learning is that no one can take it away from you.&rdquo;
            </p>
            <footer className="text-sm">B.B. King</footer>
          </blockquote>
        </div>
      </div>
      <div className="lg:p-8">
        <div className="mx-auto flex w-full flex-col justify-center space-y-6 sm:w-[350px]">
          <LoginForm />
        </div>
      </div>
    </div>
  )
}
