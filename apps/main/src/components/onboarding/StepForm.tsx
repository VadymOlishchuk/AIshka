import { useNavigate } from "react-router";
import { useState } from "react";
import { Button } from "@aishka/ui/primitives";
import type { OnboardingStep } from "@aishka/core/plan/onboarding";

export function StepForm({ step, saved }: { step: OnboardingStep; saved: string | string[] | null }) {
  const navigate = useNavigate();
  const [picked, setPicked] = useState<string[]>(
    saved === null ? [] : Array.isArray(saved) ? saved : [saved],
  );
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function submit(value: string | string[]) {
    if (pending) return;
    setPending(true);
    setError(null);

    try {
      const res = await fetch("/api/onboarding", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ step: step.slug, value }),
      });
      const body = await res.json();

      if (!body.ok) {
        setError(body.error?.message ?? "Something went wrong. Please try again.");
        return;
      }
      navigate(body.data.next);
    } catch {
      setError("Couldn't reach the server. Check your connection and try again.");
    } finally {
      setPending(false);
    }
  }

  function choose(id: string) {
    if (step.type === "single") {
      setPicked([id]);
      // Одиночний вибір веде далі одразу — кнопка тут була б зайвим кліком.
      void submit(id);
      return;
    }
    setPicked((current) =>
      current.includes(id) ? current.filter((x) => x !== id) : [...current, id],
    );
  }

  return (
    <div className="flex flex-col gap-3">
      <div className="flex flex-col gap-2.5" role={step.type === "single" ? "radiogroup" : "group"}>
        {step.options.map((option) => {
          const active = picked.includes(option.id);
          return (
            <button
              key={option.id}
              type="button"
              onClick={() => choose(option.id)}
              disabled={pending}
              aria-pressed={active}
              className={`flex items-center gap-3 rounded-[10px] border px-4 py-4 text-left text-[16px] transition disabled:opacity-60 ${
                active
                  ? "border-accent bg-accent-tint text-ink-strong"
                  : "border-line bg-surface text-ink-strong hover:border-accent/50"
              }`}
            >
              {option.icon ? <span aria-hidden className="text-[20px]">{option.icon}</span> : null}
              <span className="flex-1">{option.label}</span>
              <span
                aria-hidden
                className={`h-5 w-5 flex-none rounded-full border-2 ${
                  active ? "border-accent bg-accent" : "border-line"
                }`}
              />
            </button>
          );
        })}
      </div>

      {error ? (
        <p className="rounded-[10px] bg-error-tint px-4 py-3 text-[14px]" role="alert">
          {error}
        </p>
      ) : null}

      {step.type === "multi" ? (
        <Button
          onClick={() => submit(picked)}
          disabled={pending || picked.length === 0}
          className="mt-2 w-full"
        >
          {step.cta ?? "Continue"}
        </Button>
      ) : null}
    </div>
  );
}
