import { Link, useSearchParams } from "react-router";
import { AuthForm } from "@aishka/ui/auth-form";
import { Card, Pill } from "@aishka/ui/primitives";
import { useTitle } from "@aishka/ui/title";
import { AFTER_SIGNUP } from "@/config";

/** Крок 3: пароль. Токен — з оплати або з листа. Після — одразу на платформу. */
export function SetPassword() {
  useTitle("Choose a password · AIshka");
  const [params] = useSearchParams();
  const token = params.get("token");

  if (!token) {
    return (
      <main className="mx-auto flex min-h-dvh w-full max-w-[440px] flex-col justify-center px-5 py-12">
        <Card className="p-7">
          <h1 className="mb-2 text-[24px] font-semibold text-ink-strong">This link is incomplete</h1>
          <p className="mb-5 text-[15px] leading-relaxed text-ink-muted">
            Open the link from your email exactly as it was sent, or start again.
          </p>
          <Link to="/start" className="font-semibold text-accent underline-offset-2 hover:underline">
            Start again
          </Link>
        </Card>
      </main>
    );
  }

  return (
    <main className="mx-auto flex min-h-dvh w-full max-w-[440px] flex-col justify-center px-5 py-12">
      <Card className="p-7">
        <Pill tone="mark" className="mb-4">Step 3 of 3</Pill>
        <h1 className="mb-1 text-[28px] font-semibold leading-tight text-ink-strong">
          Choose a password
        </h1>
        <p className="mb-6 text-[15px] text-ink-muted">
          At least 8 characters. You&apos;ll be signed in straight away.
        </p>

        {/* Cookie сесії стають на спільному домені — платформа відкриється вже з входом. */}
        <AuthForm
          endpoint="/api/auth/password/set"
          submitLabel="Save and open my courses"
          hidden={{ token }}
          defaultNext={AFTER_SIGNUP}
          fields={[
            { name: "password", label: "Password", type: "password", autoComplete: "new-password" },
          ]}
        />
      </Card>
    </main>
  );
}
