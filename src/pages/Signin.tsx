import { useEffect, useState } from "react"
import { Navigate } from "react-router-dom"
import { LoginForm } from "@/components/login-form"
import { meRequest } from "@/api/auth"

export default function LoginPage() {
  const [checking, setChecking] = useState(true)
  const [alreadyStaff, setAlreadyStaff] = useState(false)

  useEffect(() => {
    let cancelled = false
    meRequest()
      .then((d) => {
        if (cancelled) return
        if (d.authenticated && d.user?.is_staff) setAlreadyStaff(true)
      })
      .finally(() => {
        if (!cancelled) setChecking(false)
      })
    return () => {
      cancelled = true
    }
  }, [])

  if (checking) {
    return (
      <div className="grid min-h-svh min-w-screen place-items-center text-slate-600">
        กำลังโหลด…
      </div>
    )
  }
  if (alreadyStaff) {
    return <Navigate to="/dashboard" replace />
  }

  return (
    <div className="grid min-h-svh min-w-screen lg:grid-cols-2">
        <div className="flex flex-col gap-4 p-6 md:p-10">
            <div className="flex justify-center gap-2 md:justify-start">
            <span className="text-2xl font-bold text-primary">GoGo Trip</span>
            </div>
            <div className="flex flex-1 items-center justify-center">
            <div className="w-full max-w-xs">
                <LoginForm />
            </div>
            </div>
        </div>
        <div className="bg-muted relative hidden lg:block">
            <img
            src="/original-cover.webp"
            alt="Image"
            className="absolute inset-0 h-full w-full object-cover"
            />
        </div>
    </div>
  )
}
