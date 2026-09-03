import { Link } from "react-router";
import { useLocation } from "react-router";
import { HomeIcon, LibraryIcon, UserIcon } from "@aishka/ui/icons";
import { SignOutButton } from "@/components/dashboard/SignOutButton";

/**
 * Навігація живе в двох місцях і виглядає однаково: на телефоні — плаваюча
 * капсула внизу, під великим пальцем; на десктопі — та сама капсула зверху.
 *
 * Активний розділ показує іконку й назву, решта згорнуті в іконки.
 *
 * Ширини сталі: неактивний пункт 44px, активний 116px. Сума не залежить від
 * того, який розділ вибрано, тому капсула не стрибає при перемиканні.
 *
 * Підсвітка однакова під будь-яку назву, а вміст у ній центрований — коротке
 * «You» лишає повітря порівну з двох боків, а не дірку справа. Ширину під назву
 * рахували по найдовшому «Library»: 116 - 24 (padding) = 92, назва бере 80.
 *
 * У неактивного пункта назва згорнута в нульову ширину, тож вміст там — сама
 * іконка, і вона стоїть точно посередині своїх 44px. Неактивні пункти взагалі
 * не міняють геометрію, коли активний перемикається: рухається лише він сам.
 */
const LINKS = [
  { href: "/", label: "Home", Icon: HomeIcon, match: "/" },
  { href: "/library", label: "Library", Icon: LibraryIcon, match: "/library" },
];

/** Профіль потрібен лише на телефоні: на десктопі його місце — праворуч у капсулі. */
const MOBILE_LINKS = [
  ...LINKS,
  { href: "/profile", label: "You", Icon: UserIcon, match: "/profile" },
];

function isActive(pathname: string, match: string) {
  return match === "/" ? pathname === "/" : pathname.startsWith(match);
}

function NavItem({
  href,
  label,
  Icon,
  active,
}: {
  href: string;
  label: string;
  Icon: typeof HomeIcon;
  active: boolean;
}) {
  return (
    <Link
      to={href}
      aria-current={active ? "page" : undefined}
      title={label}
      // overflow-hidden ховає назву, поки пункт вузький; крива — та сама, що в iOS.
      className={`flex shrink-0 items-center justify-center overflow-hidden rounded-full px-3 py-2 transition-[width,background-color,color] duration-300 ease-[cubic-bezier(0.32,0.72,0,1)] ${
        active
          ? "w-[116px] bg-accent-tint text-accent"
          : "w-11 bg-transparent text-ink-muted hover:text-ink-strong"
      }`}
    >
      <Icon />
      {/* У згорнутому стані назва має нульову ширину — інакше вона зсувала б
          іконку з центру пункта. Їде тією ж кривою, що й сам пункт. */}
      <span
        className={`overflow-hidden whitespace-nowrap text-[14px] font-bold tracking-[-0.01em] transition-all duration-300 ease-[cubic-bezier(0.32,0.72,0,1)] ${
          active ? "ml-2 max-w-[7rem] opacity-100" : "ml-0 max-w-0 opacity-0"
        }`}
      >
        {label}
      </span>
    </Link>
  );
}

export function NavBar({ firstName }: { firstName: string }) {
  const { pathname } = useLocation();

  // Плеєр навмисно позбавлений навігації: лише прогрес, контент і одна дія.
  if (pathname.includes("/lessons/")) return null;

  return (
    <>
      {/* Телефон: капсула внизу. pb рахує вирізи iPhone, щоб не сіла на смугу жестів. */}
      <nav
        aria-label="Main"
        className="fixed inset-x-0 bottom-0 z-30 flex justify-center px-4 pb-[max(0.75rem,env(safe-area-inset-bottom))] sm:hidden"
      >
        <div className="flex items-center gap-1 rounded-full border border-[rgba(18,20,43,.06)] bg-surface px-2 py-1.5 shadow-[0_14px_40px_rgba(18,20,43,.16)]">
          {MOBILE_LINKS.map((link) => (
            <NavItem key={link.href} {...link} active={isActive(pathname, link.match)} />
          ))}
        </div>
      </nav>

      {/* Десктоп: та сама капсула, лише зверху й з маркою та виходом по краях. */}
      <header className="sticky top-0 z-20 hidden px-4 pt-4 sm:block">
        <nav
          aria-label="Main"
          className="mx-auto grid max-w-[1290px] grid-cols-[1fr_auto_1fr] items-center gap-4 rounded-full border border-[rgba(18,20,43,.06)] bg-surface px-6 py-1.5 shadow-[0_14px_40px_rgba(18,20,43,.08)]"
        >
          <Link
            to="/"
            className="justify-self-start text-[17px] font-extrabold tracking-[-0.03em] text-ink-strong"
          >
            AIshka
          </Link>

          <div className="flex items-center gap-1">
            {LINKS.map((link) => (
              <NavItem key={link.href} {...link} active={isActive(pathname, link.match)} />
            ))}
          </div>

          <div className="flex items-center justify-end gap-2">
            <Link
              to="/profile"
              aria-current={isActive(pathname, "/profile") ? "page" : undefined}
              className={`flex items-center gap-2 rounded-full px-4 py-2 text-[15px] font-bold transition-colors duration-300 ${
                isActive(pathname, "/profile")
                  ? "bg-accent-tint text-accent"
                  : "text-ink-muted hover:text-ink-strong"
              }`}
            >
              <UserIcon />
              {firstName}
            </Link>
            <SignOutButton />
          </div>
        </nav>
      </header>
    </>
  );
}
