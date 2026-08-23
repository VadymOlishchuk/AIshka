import Link from "next/link";
import { AuthForm } from "@/components/auth/AuthForm";
import { Card } from "@/components/ui/primitives";

export const metadata = { title: "Choose a password · AIshka" };

export default async function SetPasswordPage({
  searchParams,
}: {
  searchParams: Promise<{ token?: string }>;
}) {
  const { token } = await searchParams;

  if (!token) {
    return (
      <main className="mx-auto flex min-h-dvh w-full max-w-[440px] flex-col justify-center px-5 py-12">
        <Card className="p-7">
          <h1 className="mb-2 text-[24px] font-semibold text-ink-strong">This link is incomplete</h1>
          <p className="mb-5 text-[15px] leading-relaxed text-ink-muted">
            Open the link from your email exactly as it was sent, or request a new one.
          </p>
          <Link href="/reset" className="font-semibold text-accent underline-offset-2 hover:underline">
            Request a new link
          </Link>
        </Card>
      </main>
    );
  }

  return (
    <main className="mx-auto flex min-h-dvh w-full max-w-[440px] flex-col justify-center px-5 py-12">
      <Card className="p-7">
        <h1 className="mb-1 text-[28px] font-semibold leading-tight text-ink-strong">
          Choose a password
        </h1>
        <p className="mb-6 text-[15px] text-ink-muted">
          At least 8 characters. You&apos;ll be signed in straight away.
        </p>

        <AuthForm
          endpoint="/api/auth/password/set"
          submitLabel="Save and continue"
          hidden={{ token }}
          fields={[
            { name: "password", label: "New password", type: "password", autoComplete: "new-password" },
          ]}
        />
      </Card>
    </main>
  );
}
