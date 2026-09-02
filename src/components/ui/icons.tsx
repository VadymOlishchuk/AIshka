import type { ReactNode, SVGProps } from "react";

/**
 * Іконки навігації. Емодзі прибрані свідомо: вони по-різному малюються на
 * macOS, Windows і Android, ламають вертикальний ритм рядка й читаються як
 * тимчасова заглушка. Тут один штрих, один розмір, колір успадковується.
 */
function Glyph({ children, ...props }: SVGProps<SVGSVGElement> & { children: ReactNode }) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={1.8}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden
      className="h-5 w-5 flex-none"
      {...props}
    >
      {children}
    </svg>
  );
}

export function HomeIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <Glyph {...props}>
      <path d="M3 10a2 2 0 0 1 .7-1.5l7-6a2 2 0 0 1 2.6 0l7 6A2 2 0 0 1 21 10v9a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
      <path d="M15 21v-7a1 1 0 0 0-1-1h-4a1 1 0 0 0-1 1v7" />
    </Glyph>
  );
}

/** Збірка — коробка, яку користувач наповнює слотами. */
export function BuildIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <Glyph {...props}>
      <path d="M21 8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16Z" />
      <path d="m3.3 7 8.7 5 8.7-5" />
      <path d="M12 22V12" />
    </Glyph>
  );
}

export function LibraryIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <Glyph {...props}>
      <path d="M4 4v16" />
      <path d="M8.5 4v16" />
      <path d="M13 4v16" />
      <path d="m17.5 4.6 3.2 14.8" />
    </Glyph>
  );
}

export function UserIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <Glyph {...props}>
      <path d="M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2" />
      <circle cx="12" cy="7" r="4" />
    </Glyph>
  );
}

export function SignOutIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <Glyph {...props}>
      <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
      <path d="m16 17 5-5-5-5" />
      <path d="M21 12H9" />
    </Glyph>
  );
}

/** Кількість уроків. */
export function LessonsIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <Glyph {...props}>
      <path d="M4 5.5A1.5 1.5 0 0 1 5.5 4H10a2 2 0 0 1 2 2v13a1.5 1.5 0 0 0-1.5-1.5h-5A1.5 1.5 0 0 1 4 16z" />
      <path d="M20 5.5A1.5 1.5 0 0 0 18.5 4H14a2 2 0 0 0-2 2v13a1.5 1.5 0 0 1 1.5-1.5h5A1.5 1.5 0 0 0 20 16z" />
    </Glyph>
  );
}

/** Тривалість. */
export function ClockIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <Glyph {...props}>
      <circle cx="12" cy="12" r="9" />
      <path d="M12 7.5V12l3 1.8" />
    </Glyph>
  );
}

/** Курс пройдено. */
export function CheckIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <Glyph {...props}>
      <path d="m4.5 12.5 5 5 10-11" />
    </Glyph>
  );
}

/** Стрілка «увійти в курс». Виїжджає праворуч на ховері картки. */
export function ArrowIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <Glyph {...props}>
      <path d="M5 12h13" />
      <path d="m12.5 6 6 6-6 6" />
    </Glyph>
  );
}

/** Серія днів. Замість емодзі-вогника: він на кожній ОС свій. */
export function FlameIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <Glyph {...props}>
      <path d="M12 3c.6 3.2 2.3 4.3 3.7 5.8A6.9 6.9 0 0 1 18 13.6 6.2 6.2 0 0 1 12 20a6.2 6.2 0 0 1-6-6.4c0-1.8.9-3.3 1.9-4.3 0 1.3.7 2.3 1.8 2.6C9.3 9.4 10.4 5.9 12 3" />
    </Glyph>
  );
}
