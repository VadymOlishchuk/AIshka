import Image from "next/image";
import Link from "next/link";
import { redirect } from "next/navigation";
import { requireActiveAccess } from "@/core/auth/guards";
import { getBuild } from "@/core/build/service";
import { Button, Card, Eyebrow, Pill } from "@/components/ui/primitives";

/**
 * Головна. Тут навмисно немає відсотка: замість «41%» — скільки артефактів
 * зроблено і що саме наступне. Число артефактів можна показати клієнту,
 * відсоток — ні.
 */
export default async function DashboardHome() {
  const user = await requireActiveAccess();
  if (!user.onboardingDone) redirect("/onboarding");

  const build = await getBuild(user.id);
  if (!build) redirect("/dashboard/journey");

  const remaining = build.total - build.filled;

  return (
    <main className="mx-auto w-full max-w-[1290px] px-5 py-8">
      <h1 className="mb-6 text-[34px] font-extrabold leading-[1.1] text-ink-strong">
        Welcome, {user.firstName}
      </h1>

      {/* Одна темна панель на сторінку — це правило колірної системи. */}
      <section className="mb-10 overflow-hidden rounded-[22px] bg-ink-panel p-7 text-white sm:p-9">
        <div className="gap-8 lg:flex lg:items-start">
          <div className="min-w-0 flex-1">
            <Pill tone="onDark" className="uppercase tracking-[.09em]">
              Your build
            </Pill>

            <h2 className="mb-3 mt-5 text-[28px] font-extrabold leading-[1.15] text-balance">
              {build.title}
            </h2>
            <p className="mb-7 max-w-[60ch] text-[15px] leading-relaxed text-muted-on-dark">
              {build.outcome}
            </p>

            <div className="mb-7 flex flex-wrap items-end gap-x-10 gap-y-4">
              <div>
                <p className="text-[40px] font-extrabold leading-none tabular-nums">
                  {build.filled}
                  <span className="text-muted-on-dark"> / {build.total}</span>
                </p>
                <p className="mt-1.5 text-[13px] text-muted-on-dark">artifacts made</p>
              </div>
              <p className="text-[14px] text-muted-on-dark">
                {remaining > 0 ? `${remaining} slots still empty` : "Nothing left to fill"}
              </p>
            </div>

            {build.next ? (
              <>
                <p className="mb-1 text-[13px] text-muted-on-dark">
                  Next · {build.next.stageTitle} · {build.next.minutes} min
                </p>
                <p className="mb-5 text-[18px] font-bold">{build.next.title}</p>
                <Link href="/dashboard/build">
                  <Button variant="onDark" className="w-full sm:w-auto">
                    Open the build
                  </Button>
                </Link>
              </>
            ) : (
              <Link href="/dashboard/journey/academy">
                <Button variant="onDark" className="w-full sm:w-auto">
                  Browse the library
                </Button>
              </Link>
            )}
          </div>

          {build.coverUrl ? (
            <Image
              src={build.coverUrl}
              alt=""
              width={800}
              height={800}
              priority
              className="mt-8 hidden w-[280px] flex-none rounded-[18px] object-cover lg:mt-0 lg:block"
            />
          ) : null}
        </div>
      </section>

      <section>
        <Eyebrow className="mb-3">Where you are</Eyebrow>
        <h2 className="mb-5 text-[26px] font-extrabold text-ink-strong">The five stages</h2>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {build.stages.map((stage) => {
            const done = stage.slots.filter((s) => s.filled).length;
            const complete = done === stage.slots.length;
            return (
              <Link key={stage.id} href="/dashboard/build" className="group">
                <Card className="h-full p-5 transition group-hover:border-accent/40">
                  <div className="mb-3 flex items-center gap-3">
                    <span aria-hidden className="text-[26px] leading-none">
                      {stage.icon ?? "▫️"}
                    </span>
                    <h3 className="text-[18px] font-bold leading-snug text-ink-strong">
                      {stage.title}
                    </h3>
                  </div>
                  <p className="mb-4 line-clamp-3 text-[14px] leading-relaxed text-ink-muted">
                    {stage.intent}
                  </p>
                  {/* Слоти показані фізично: заповнені суцільні, порожні — пунктир. */}
                  <div className="mb-2.5 flex flex-wrap gap-1.5">
                    {stage.slots.map((slot) => (
                      <span
                        key={slot.id}
                        title={slot.title}
                        className={`h-2.5 w-2.5 rounded-[3px] ${
                          slot.filled
                            ? "bg-accent"
                            : "border border-dashed border-line-strong"
                        }`}
                      />
                    ))}
                  </div>
                  <p className="text-[13px] tabular-nums text-ink-muted">
                    {complete ? "stage complete" : `${done} of ${stage.slots.length} filled`}
                  </p>
                </Card>
              </Link>
            );
          })}
        </div>
      </section>
    </main>
  );
}
