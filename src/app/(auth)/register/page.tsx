import Link from "next/link";
import { AuthForm } from "@/components/auth/AuthForm";
import { Card } from "@/components/ui/primitives";

export const metadata = { title: "Create your account · AIshka" };

export default function RegisterPage() {
  return (
    <main className="mx-auto flex min-h-dvh w-full max-w-[440px] flex-col justify-center px-5 py-12">
      <Card className="p-7">
        <h1 className="mb-1 text-[28px] font-semibold leading-tight text-ink-strong">
          Create your account
        </h1>
        <p className="mb-6 text-[15px] text-ink-muted">
          Six quick questions and your plan is ready.
        </p>

        <AuthForm
          endpoint="/api/auth/register"
          submitLabel="Create account"
          fields={[
            { name: "firstName", label: "First name", type: "text", autoComplete: "given-name" },
            { name: "email", label: "Email", type: "email", autoComplete: "email" },
            { name: "password", label: "Password", type: "password", autoComplete: "new-password" },
          ]}
        />
      </Card>

      <p className="mt-5 text-center text-[14px] text-ink-muted">
        Already have an account?{" "}
        <Link href="/login" className="font-semibold text-accent underline-offset-2 hover:underline">
          Sign in
        </Link>
      </p>
    </main>
  );
}
