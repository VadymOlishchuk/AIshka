import { AuthForm } from "@aishka/ui/auth-form";
import { Card } from "@aishka/ui/primitives";
import { useTitle } from "@aishka/ui/title";
import { MAIN_URL } from "@/config";

/** Крок 1 воронки: лише email та ім'я. Пароль — після оплати, не до. */
export function Start() {
  useTitle("Get started · AIshka");

  return (
    <main className="mx-auto flex min-h-dvh w-full max-w-[440px] flex-col justify-center px-5 py-12">
      <Card className="p-7">
        <h1 className="mb-1 text-[28px] font-semibold leading-tight text-ink-strong">
          Start with your email
        </h1>
        <p className="mb-6 text-[15px] text-ink-muted">
          Payment next, then you choose a password. Two minutes, no card details stored here.
        </p>

        <AuthForm
          endpoint="/api/checkout/start"
          submitLabel="Continue to payment"
          fields={[
            { name: "firstName", label: "First name", type: "text", autoComplete: "given-name" },
            { name: "email", label: "Email", type: "email", autoComplete: "email" },
          ]}
        />
      </Card>

      <p className="mt-5 text-center text-[14px] text-ink-muted">
        Already have an account?{" "}
        <a href={`${MAIN_URL}/login`} className="font-semibold text-accent underline-offset-2 hover:underline">
          Sign in
        </a>
      </p>
    </main>
  );
}
