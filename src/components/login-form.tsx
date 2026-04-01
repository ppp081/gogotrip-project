import { FormEvent, useState } from "react"
import { useNavigate } from "react-router-dom"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Checkbox } from "@/components/ui/checkbox"
import { loginRequest } from "@/api/auth"

export function LoginForm({
  className,
  ...props
}: React.ComponentProps<"form">) {
  const navigate = useNavigate()
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [error, setError] = useState<string | null>(null)
  const [submitting, setSubmitting] = useState(false)

  async function onSubmit(e: FormEvent) {
    e.preventDefault()
    setError(null)
    setSubmitting(true)
    try {
      const user = await loginRequest(email.trim(), password)
      if (!user.is_staff) {
        setError("บัญชีนี้ไม่มีสิทธิ์เข้าแดชบอร์ด")
        return
      }
      navigate("/dashboard", { replace: true })
    } catch (err) {
      setError(err instanceof Error ? err.message : "เข้าสู่ระบบไม่สำเร็จ")
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <form
      {...props}
      className={cn("flex flex-col gap-6", className)}
      onSubmit={onSubmit}
    >
      <div className="flex flex-col items-center gap-2 text-center">
        <h1 className="text-2xl font-bold cursor-default">
          เข้าสู่ระบบผู้ดูแลระบบ
        </h1>
      </div>
      {error ? (
        <p className="rounded-md bg-rose-50 px-3 py-2 text-center text-sm text-rose-700">
          {error}
        </p>
      ) : null}
      <div className="grid gap-6">
        <div className="grid gap-3">
          <Label htmlFor="email">อีเมลหรือชื่อผู้ใช้</Label>
          <Input
            id="email"
            type="text"
            autoComplete="username"
            placeholder="admin@example.com"
            value={email}
            onChange={(ev) => setEmail(ev.target.value)}
            required
          />
        </div>
        <div className="grid gap-3">
          <Label htmlFor="password">รหัสผ่าน</Label>
          <Input
            id="password"
            type="password"
            autoComplete="current-password"
            value={password}
            onChange={(ev) => setPassword(ev.target.value)}
            required
          />
        </div>
        <div className="flex items-center justify-between text-sm">
          <label className="flex items-center gap-2 text-gray-600">
            <Checkbox id="remember" />
            <span>จำการเข้าสู่ระบบ</span>
          </label>
          <span />
        </div>
        <Button type="submit" className="w-full" disabled={submitting}>
          {submitting ? "กำลังเข้าสู่ระบบ…" : "เข้าสู่ระบบ"}
        </Button>
      </div>
    </form>
  )
}
