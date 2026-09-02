import { Link } from "react-router";
import { AuthForm } from "@aishka/ui/auth-form";
import { Card } from "@aishka/ui/primitives";
import { useTitle } from "@aishka/ui/title";

export function Reset() {
  useTitle("Reset your password · AIshka");

  return (
    <main className="mx-auto flex min-h-dvh w-full max-w-[440px] flex-col justify-center px-5 py-12">
      <Card className="p-7">
        <h1 className="mb-1 text-[28px] font-semibold leading-tight text-ink-strong">
          Reset your password
        </h1>
        <p className="mb-6 text-[15px] text-ink-muted">
          Enter the email you signed up with and we&apos;ll send you a link.
        </p>

        <AuthForm
          endpoint="/api/auth/password/forgot"
          submitLabel="Send the link"
          successMessage="If that email has an account, a reset link is on its way. The link works for 30 minutes."
          fields={[{ name: "email", label: "Email", type: "email", autoComplete: "email" }]}
        />
      </Card>

      <p className="mt-5 text-center text-[14px] text-ink-muted">
        <Link to="/login" className="font-semibold text-accent underline-offset-2 hover:underline">
          Back to sign in
        </Link>
      </p>
    </main>
  );
}
