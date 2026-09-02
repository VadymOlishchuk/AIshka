"use client";

import { useRouter } from "next/navigation";
import { SignOutIcon } from "@/components/ui/icons";

/**
 * Вихід стоїть у двох місцях: у капсулі на десктопі й рядком у профілі —
 * бо на телефоні капсула внизу тримає лише навігацію, і кнопці там не місце.
 */
export function SignOutButton({ variant = "compact" }: { variant?: "compact" | "row" }) {
  const router = useRouter();

  async function signOut() {
    await fetch("/api/auth/logout", { method: "POST" });
    router.push("/login");
    router.refresh();
  }

  if (variant === "row") {
    return (
      <button
        onClick={signOut}
        className="flex w-full items-center justify-between px-5 py-4 text-left transition hover:bg-canvas"
      >
        <span className="text-[15px] text-ink-strong">Sign out</span>
        <SignOutIcon className="h-[20px] w-[20px] flex-none text-ink-muted" />
      </button>
    );
  }

  return (
    <button
      onClick={signOut}
      title="Sign out"
      className="rounded-full border border-line px-4 py-1.5 text-[14px] font-semibold text-ink-muted transition hover:border-line-strong hover:text-ink-strong"
    >
      Sign out
    </button>
  );
}
