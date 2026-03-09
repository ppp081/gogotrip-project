import { LoginForm } from "@/components/login-form"

export default function LoginPage() {
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
