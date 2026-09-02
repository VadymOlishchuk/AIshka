import { Link, useSearchParams } from "react-router";
import { AuthForm } from "@aishka/ui/auth-form";
import { Card } from "@aishka/ui/primitives";
import { useTitle } from "@aishka/ui/title";
import { LANDING_URL } from "@/config";

export function Login() {
  useTitle("Sign in · AIshka");
  const [params] = useSearchParams();
  // Дозволяємо повернення лише на власні відносні шляхи — інакше open redirect.
  const next = params.get("next");
  const defaultNext = next && next.startsWith("/") && !next.startsWith("//") ? next : undefined;

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
          defaultNext={defaultNext}
          fields={[
            { name: "email", label: "Email", type: "email", autoComplete: "email" },
            { name: "password", label: "Password", type: "password", autoComplete: "current-password" },
          ]}
        />

        {/* Найчастіший сценарій підтримки: людина зареєструвалась і забула. */}
        <p className="mt-5 text-[14px] text-ink-muted">
          Forgot your password?{" "}
          <Link to="/reset" className="font-semibold text-accent underline-offset-2 hover:underline">
            Send yourself a reset link
          </Link>
          .
        </p>
      </Card>

      <p className="mt-5 text-center text-[14px] text-ink-muted">
        No account yet?{" "}
        <a href={`${LANDING_URL}/register`} className="font-semibold text-accent underline-offset-2 hover:underline">
          Create one
        </a>
      </p>
    </main>
  );
}
