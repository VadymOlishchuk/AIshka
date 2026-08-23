import Link from "next/link";
import { requireUser } from "@/core/auth/guards";
import { Card } from "@/components/ui/primitives";

export default async function ProfilePage() {
  const user = await requireUser();

  const rows = [
    { label: "Name", value: user.firstName },
    { label: "Email", value: user.email },
    { label: "Member since", value: user.createdAt.toLocaleDateString("en-GB") },
  ];

  return (
    <main className="mx-auto w-full max-w-[620px] px-5 py-8">
      <h1 className="mb-6 text-[28px] font-semibold text-ink-strong">Profile</h1>

      <Card className="mb-5 divide-y divide-line">
        {rows.map((row) => (
          <div key={row.label} className="flex items-center justify-between px-5 py-4">
            <span className="text-[15px] text-ink-muted">{row.label}</span>
            <span className="text-[15px] font-medium text-ink-strong">{row.value}</span>
          </div>
        ))}
      </Card>

      <Card className="divide-y divide-line">
        <Link
          href="/onboarding/goal"
          className="flex items-center justify-between px-5 py-4 transition hover:bg-canvas"
        >
          <span className="text-[15px] text-ink-strong">Retake the questions</span>
          <span className="text-ink-muted" aria-hidden>›</span>
        </Link>
      </Card>
      <p className="mt-2 px-1 text-[13px] leading-relaxed text-ink-muted">
        Your plan gets rebuilt from the new answers. Lessons you&apos;ve already finished stay
        finished.
      </p>
    </main>
  );
}
