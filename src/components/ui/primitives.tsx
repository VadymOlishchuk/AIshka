import type { ComponentProps, ReactNode } from "react";
import { Emoji } from "@/components/ui/emoji";

/**
 * Кнопка — єдине місце, де живе насичений індиго. Тінь кольорова, не чорна:
 * саме це відрізняє систему від дефолтного бутстрапу.
 * Усередині темної панелі індиго на індиго не читається, тому кнопка
 * інвертується в лавандову — варіант "onDark".
 */
export function Button({
  variant = "primary",
  className = "",
  ...props
}: ComponentProps<"button"> & { variant?: "primary" | "lesson" | "onDark" | "ghost" }) {
  const base =
    "inline-flex items-center justify-center gap-2 rounded-full px-[26px] py-[13px] text-[15px] font-bold transition disabled:cursor-not-allowed disabled:opacity-40 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent";
  const styles = {
    primary: "bg-accent text-white shadow-[0_8px_22px_rgba(79,63,255,.28)] hover:brightness-110",
    lesson: "bg-accent text-white shadow-[0_8px_22px_rgba(79,63,255,.28)] hover:brightness-110",
    onDark: "bg-accent-tint text-accent hover:brightness-105",
    ghost: "bg-surface text-ink-strong border border-line hover:bg-paper-alt",
  } as const;

  return <button className={`${base} ${styles[variant]} ${className}`} {...props} />;
}

/** Надзаголовок секції — лавандова плашка з індиговим текстом. */
export function Eyebrow({ children, className = "" }: { children: ReactNode; className?: string }) {
  return <p className={`eyebrow ${className}`}>{children}</p>;
}

/**
 * Дрібний ярлик. Лавандовий — стан «виділено», сірий — нейтральний,
 * суцільний індиго — те, на що треба звернути увагу зараз.
 */
export function Pill({
  children,
  tone = "mark",
  className = "",
}: {
  children: ReactNode;
  tone?: "mark" | "muted" | "solid" | "onDark";
  className?: string;
}) {
  const tones = {
    mark: "bg-accent-tint text-accent",
    muted: "bg-paper-alt text-ink-muted",
    solid: "bg-accent text-white",
    onDark: "bg-white/12 text-white",
  } as const;

  return (
    <span
      className={`inline-flex items-center rounded-full px-[13px] py-1.5 text-[12.5px] font-semibold ${tones[tone]} ${className}`}
    >
      {children}
    </span>
  );
}

export function Card({ children, className = "" }: { children: ReactNode; className?: string }) {
  return (
    <div
      className={`rounded-[20px] border border-[rgba(18,20,43,.06)] bg-surface shadow-[0_14px_40px_rgba(18,20,43,.08)] ${className}`}
    >
      {children}
    </div>
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
 * Обкладинка генерується зі слага, коли немає своєї картинки. Система
 * забороняє другий насичений колір і градієнти, тому варіативність тут
 * тримається на геометрії, а не на кольорі: лавандове тло, індиговий знак,
 * положення й форма знака залежать від слага.
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

  const x = 24 + (hash % 52); // положення знака
  const y = 22 + ((hash >> 5) % 56);
  const r = 26 + ((hash >> 11) % 20); // розмір
  const rotated = ((hash >> 3) & 1) === 1; // коло або скруглений квадрат

  return (
    <div
      className={`relative overflow-hidden bg-accent-tint ${className}`}
      aria-hidden={label ? undefined : true}
    >
      <svg viewBox="0 0 100 100" preserveAspectRatio="none" className="absolute inset-0 h-full w-full">
        {rotated ? (
          <rect
            x={x - r / 2}
            y={y - r / 2}
            width={r}
            height={r}
            rx={r / 4}
            fill="var(--color-accent)"
            opacity="0.22"
            transform={`rotate(${(hash >> 7) % 40} ${x} ${y})`}
          />
        ) : (
          <circle cx={x} cy={y} r={r / 2} fill="var(--color-accent)" opacity="0.22" />
        )}
        <circle
          cx={100 - x}
          cy={100 - y}
          r={r / 3.4}
          fill="var(--color-accent)"
          opacity="0.14"
        />
      </svg>
      {label ? (
        <span className="absolute bottom-0 left-0 p-4 text-[13px] font-semibold text-accent">
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
      className={`flex items-center justify-center rounded-[12px] bg-accent-tint ${
        muted ? "opacity-45" : ""
      } ${className}`}
    >
      {/* 72% плитки: об'ємний значок має власне поле, впритул він виглядає тісно. */}
      <Emoji symbol={icon} className="h-[72%] w-[72%] object-contain" fallbackSize={size} />
    </span>
  );
}

export function Skeleton({ className = "" }: { className?: string }) {
  return <div className={`animate-pulse rounded-[10px] bg-line/70 ${className}`} />;
}
