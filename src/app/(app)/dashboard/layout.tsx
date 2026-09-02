import type { ReactNode } from "react";
import { requireUser } from "@/core/auth/guards";
import { NavBar } from "@/components/dashboard/NavBar";
import { DashboardFooter } from "@/components/dashboard/Chrome";

export default async function DashboardLayout({ children }: { children: ReactNode }) {
  const user = await requireUser();

  return (
    <div className="min-h-dvh">
      <NavBar firstName={user.firstName} />
      {children}
      <DashboardFooter />
    </div>
  );
}
