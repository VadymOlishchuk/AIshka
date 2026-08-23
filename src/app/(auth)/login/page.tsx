import Link from "next/link";
import { AuthForm } from "@/components/auth/AuthForm";
import { Card } from "@/components/ui/primitives";

export const metadata = { title: "Sign in · AIshka" };

export default function LoginPage() {
  return (
    <main className="mx-auto flex min-h-dvh w-full max-w-[440px] flex-col justify-center px-5 py-12">
      <Card className="p-7">
        <h1 className="mb-1 text-[28px] font-semibold leading-tight text-ink-strong">
          Welcome back
        </h1>
        <p className="mb-6 text-[15px] text-ink-muted">Pick up where you left off.</p>

        <AuthForm
          endpoint="/api/auth/login"
          submitLabel="Sign in"
          fields={[
            { name: "email", label: "Email", type: "email", autoComplete: "email" },
            { name: "password", label: "Password", type: "password", autoComplete: "current-password" },
          ]}
        />

        {/* Найчастіший сценарій підтримки: людина зареєструвалась і забула. */}
        <p className="mt-5 text-[14px] text-ink-muted">
          Forgot your password? Enter the email you signed up with and we&apos;ll send a reset link.
        </p>
      </Card>

      <p className="mt-5 text-center text-[14px] text-ink-muted">
        No account yet?{" "}
        <Link href="/register" className="font-semibold text-accent underline-offset-2 hover:underline">
          Create one
        </Link>
      </p>
    </main>
  );
}
