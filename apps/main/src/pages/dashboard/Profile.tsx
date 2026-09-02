import { Link, useRouteLoaderData } from "react-router";
import { Card } from "@aishka/ui/primitives";
import { SignOutButton } from "@/components/dashboard/SignOutButton";
import type { Me } from "@aishka/ui/api";
import { useTitle } from "@aishka/ui/title";

export function Profile() {
  useTitle("Profile · AIshka");
  const me = useRouteLoaderData("dashboard") as Me;

  const rows = [
    { label: "Name", value: me.firstName },
    { label: "Email", value: me.email },
    { label: "Member since", value: new Date(me.createdAt).toLocaleDateString("en-GB") },
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
          to="/onboarding/goal"
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

      {/* Вихід тут, бо нижня капсула на телефоні тримає лише навігацію. */}
      <Card className="mt-5 overflow-hidden">
        <SignOutButton variant="row" />
      </Card>
    </main>
  );
}
