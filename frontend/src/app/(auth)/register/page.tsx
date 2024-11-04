import { Metadata } from "next"
import { UserPlus } from "lucide-react"
import { RegisterForm } from "@/components/auth/RegisterForm"

export const metadata: Metadata = {
  title: "Register - MoocFlix",
  description: "Create a new account to start learning",
}

export default function RegisterPage() {
  return (
    <div className="container relative flex-col items-center justify-center md:grid lg:max-w-none lg:grid-cols-2 lg:px-0">
      <div className="relative hidden h-full flex-col bg-muted p-10 text-white dark:border-r lg:flex">
        <div className="absolute inset-0 bg-zinc-900" />
        <div className="relative z-20 flex items-center text-lg font-medium">
          <UserPlus className="mr-2 h-6 w-6" /> MoocFlix
        </div>
        <div className="relative z-20 mt-auto">
          <blockquote className="space-y-2">
            <p className="text-lg">
              &ldquo;Education is the passport to the future, for tomorrow belongs to those who prepare for it today.&rdquo;
            </p>
            <footer className="text-sm">Malcolm X</footer>
          </blockquote>
        </div>
      </div>
      <div className="lg:p-8">
        <div className="mx-auto flex w-full flex-col justify-center space-y-6 sm:w-[350px]">
          <RegisterForm />
        </div>
      </div>
    </div>
  )
}
