"use client";

import { useRouter } from "next/navigation";
import { useState, type FormEvent } from "react";
import { Button } from "@/components/ui/primitives";

type Field = { name: string; label: string; type: string; autoComplete: string };

type Props = {
  endpoint: string;
  fields: Field[];
  submitLabel: string;
  defaultNext?: string;
};

export function AuthForm({ endpoint, fields, submitLabel, defaultNext }: Props) {
  const router = useRouter();
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [formError, setFormError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (pending) return; // повторний клік не створює другий акаунт

    setPending(true);
    setErrors({});
    setFormError(null);

    const data = Object.fromEntries(new FormData(event.currentTarget));

    try {
      const res = await fetch(endpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      const body = await res.json();

      if (!body.ok) {
        if (body.error?.fields) setErrors(body.error.fields);
        else setFormError(body.error?.message ?? "Something went wrong. Please try again.");
        return;
      }

      router.push(defaultNext ?? body.data?.next ?? "/dashboard");
      router.refresh();
    } catch {
      setFormError("Couldn't reach the server. Check your connection and try again.");
    } finally {
      setPending(false);
    }
  }

  return (
    <form onSubmit={onSubmit} noValidate className="flex flex-col gap-4">
      {fields.map((field) => (
        <label key={field.name} className="flex flex-col gap-1.5">
          <span className="text-[14px] font-semibold text-ink-strong">{field.label}</span>
          <input
            name={field.name}
            type={field.type}
            autoComplete={field.autoComplete}
            aria-invalid={Boolean(errors[field.name])}
            className="rounded-[10px] border border-line bg-surface px-4 py-3 text-[16px] outline-none transition focus:border-accent focus:ring-2 focus:ring-accent/25 aria-[invalid=true]:border-error"
          />
          {errors[field.name] ? (
            <span className="text-[13px] text-error" role="alert">
              {errors[field.name]}
            </span>
          ) : null}
        </label>
      ))}

      {formError ? (
        <p className="rounded-[10px] bg-error-tint px-4 py-3 text-[14px] text-ink-strong" role="alert">
          {formError}
        </p>
      ) : null}

      <Button type="submit" disabled={pending} className="mt-1 w-full">
        {pending ? "One moment…" : submitLabel}
      </Button>
    </form>
  );
}
