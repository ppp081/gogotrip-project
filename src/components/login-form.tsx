import { useNavigate } from "react-router-dom"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Checkbox } from "@/components/ui/checkbox"

export function LoginForm({
  className,
  ...props
}: React.ComponentProps<"form">) {
  const navigate = useNavigate()
  return (
    <form className={cn("flex flex-col gap-6", className)} {...props}>
      <div className="flex flex-col items-center gap-2 text-center">
        <h1
          className="text-2xl font-bold cursor-default"
          onClick={() => navigate("/dashboard")}
        >
          เข้าสู่ระบบบัญชีผู้ใช้
        </h1>

      </div>
      <div className="grid gap-6">
        <div className="grid gap-3">
          <Label htmlFor="email">อีเมล</Label>
          <Input id="email" type="email" placeholder="@example.com" required />
        </div>
        <div className="grid gap-3">
          <Label htmlFor="password">รหัสผ่าน</Label>
          <Input id="password" type="password" required />
        </div>
        <div className="flex items-center justify-between text-sm">
          <label className="flex items-center gap-2 text-gray-600">
            <Checkbox id="remember" />
            <span>จำการเข้าสู่ระบบ</span>
          </label>
          <span />
        </div>
        <Button type="submit" className="w-full">
          เข้าสู่ระบบ
        </Button>

      </div>

    </form>
  )
}
