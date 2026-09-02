import { redirect } from "next/navigation";
import { requireActiveAccess } from "@/core/auth/guards";
import { getBuild } from "@/core/build/service";
import { Card, Eyebrow } from "@/components/ui/primitives";
import { SlotCard } from "@/components/build/SlotCard";

/**
 * Збірка. Тут навмисно немає жодного відсотка й жодної смужки прогресу —
 * видно, що саме ще не зроблено, а не наскільки «все загалом» просунулось.
 */
export default async function BuildPage() {
  const user = await requireActiveAccess();
  const build = await getBuild(user.id);
  if (!build) redirect("/dashboard");

  return (
    <main className="mx-auto w-full max-w-[900px] px-5 py-8">
      <Eyebrow className="mb-3">Your build</Eyebrow>
      <h1 className="mb-3 text-[34px] font-extrabold leading-[1.1] text-ink-strong text-balance">
        {build.title}
      </h1>
      <p className="mb-2 max-w-[64ch] text-[16px] leading-relaxed text-ink-muted">
        {build.outcome}
      </p>
      <p className="mb-8 text-[14px] text-ink-muted">{build.estimate}</p>

      {/* Рахунок артефактів, а не відсоток: «9 з 22» — це предмети, «41%» — ні. */}
      <Card className="mb-9 flex flex-wrap items-center gap-x-8 gap-y-3 p-6">
        <div>
          <p className="text-[32px] font-extrabold leading-none tabular-nums text-ink-strong">
            {build.filled}
            <span className="text-ink-muted"> / {build.total}</span>
          </p>
          <p className="mt-1.5 text-[13px] text-ink-muted">artifacts made</p>
        </div>
        {build.next ? (
          <div className="min-w-0 flex-1 border-l border-line pl-8">
            <p className="text-[13px] text-ink-muted">Next up · {build.next.stageTitle}</p>
            <p className="truncate text-[16px] font-bold text-ink-strong">{build.next.title}</p>
          </div>
        ) : (
          <p className="text-[16px] font-bold text-ink-strong">Every slot is filled. 🏁</p>
        )}
      </Card>

      <div className="grid gap-8">
        {build.stages.map((stage, i) => {
          const done = stage.slots.filter((s) => s.filled).length;
          return (
            <section key={stage.id}>
              <div className="mb-3 flex items-baseline gap-3">
                <span aria-hidden className="text-[22px] leading-none">
                  {stage.icon ?? "▫️"}
                </span>
                <h2 className="text-[22px] font-extrabold text-ink-strong">{stage.title}</h2>
                <span className="ml-auto text-[13px] tabular-nums text-ink-muted">
                  {done} of {stage.slots.length}
                </span>
              </div>
              <p className="mb-4 max-w-[68ch] text-[14.5px] leading-relaxed text-ink-muted">
                {stage.intent}
              </p>
              <div className="grid gap-2.5">
                {stage.slots.map((slot) => (
                  <SlotCard
                    key={slot.id}
                    slot={slot}
                    open={build.next?.id === slot.id}
                  />
                ))}
              </div>
              {i < build.stages.length - 1 ? <div className="mt-8 h-px bg-line" /> : null}
            </section>
          );
        })}
      </div>
    </main>
  );
}
