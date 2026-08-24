import type { ComponentProps, ReactNode } from "react";

/** Дві кнопки на весь продукт: фіолетова рухає по продукту, темна — по уроку. */
export function Button({
  variant = "primary",
  className = "",
  ...props
}: ComponentProps<"button"> & { variant?: "primary" | "lesson" | "ghost" }) {
  const base =
    "inline-flex items-center justify-center gap-2 rounded-[16px] px-6 py-[17px] text-[18px] font-bold transition disabled:cursor-not-allowed disabled:opacity-40 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent";
  const styles = {
    primary: "bg-accent text-white hover:brightness-95",
    lesson: "bg-ink text-white hover:brightness-110",
    ghost: "bg-surface text-ink-strong border border-line hover:bg-canvas",
  } as const;

  return <button className={`${base} ${styles[variant]} ${className}`} {...props} />;
}

export function Card({ children, className = "" }: { children: ReactNode; className?: string }) {
  return (
    <div className={`rounded-[16px] border border-line bg-surface ${className}`}>{children}</div>
  );
}

export function ProgressBar({ value, className = "" }: { value: number; className?: string }) {
  const safe = Number.isFinite(value) ? Math.min(100, Math.max(0, value)) : 0;
  return (
    <div
      className={`h-2 w-full overflow-hidden rounded-full bg-line ${className}`}
      role="progressbar"
      aria-valuenow={Math.round(safe)}
      aria-valuemin={0}
      aria-valuemax={100}
    >
      <div className="h-full rounded-full bg-accent transition-[width]" style={{ width: `${safe}%` }} />
    </div>
  );
}

/**
 * Обкладинка генерується зі слага. Так у каталозі не буває битих картинок
 * і не буває двох однакових плиток — на відміну від бузкової стіни конкурента.
 */
export function GeneratedCover({
  seed,
  label,
  className = "",
}: {
  seed: string;
  label?: string;
  className?: string;
}) {
  let hash = 0;
  for (let i = 0; i < seed.length; i++) hash = (hash * 31 + seed.charCodeAt(i)) >>> 0;
  const hue = hash % 360;
  const second = (hue + 40 + (hash % 60)) % 360;

  return (
    <div
      className={`relative flex items-end overflow-hidden ${className}`}
      style={{
        background: `linear-gradient(135deg, hsl(${hue} 62% 62%), hsl(${second} 70% 48%))`,
      }}
      aria-hidden={label ? undefined : true}
    >
      <div
        className="absolute inset-0 opacity-25"
        style={{
          backgroundImage:
            "radial-gradient(circle at 22% 28%, rgba(255,255,255,.75) 0, transparent 42%), radial-gradient(circle at 78% 72%, rgba(0,0,0,.35) 0, transparent 46%)",
        }}
      />
      {label ? (
        <span className="relative z-10 p-4 text-[13px] font-semibold tracking-wide text-white/95">
          {label}
        </span>
      ) : null}
    </div>
  );
}

/**
 * Плитка іконки юніта або курсу. Якщо іконки немає — падає на генеровану
 * обкладинку зі слага, щоб на місці ніколи не лишався порожній сірий квадрат.
 */
export function IconTile({
  icon,
  seed,
  muted = false,
  size = "text-[30px]",
  className = "",
}: {
  icon?: string | null;
  seed: string;
  muted?: boolean;
  size?: string;
  className?: string;
}) {
  if (!icon) return <GeneratedCover seed={seed} className={className} />;

  return (
    <span
      aria-hidden
      className={`flex items-center justify-center rounded-[12px] bg-canvas ${
        muted ? "opacity-45" : ""
      } ${className}`}
    >
      <span className={`${size} leading-none`}>{icon}</span>
    </span>
  );
}

export function Skeleton({ className = "" }: { className?: string }) {
  return <div className={`animate-pulse rounded-[10px] bg-line/70 ${className}`} />;
}
