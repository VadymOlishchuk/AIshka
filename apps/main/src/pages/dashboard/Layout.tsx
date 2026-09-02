import { Outlet, useLoaderData } from "react-router";
import { NavBar } from "@/components/dashboard/NavBar";
import { DashboardFooter } from "@/components/dashboard/Chrome";
import type { Me } from "@aishka/ui/api";

/** Спільна рамка дашборду: капсула навігації, сторінка, підвал. */
export function DashboardLayout() {
  const me = useLoaderData() as Me;

  return (
    <div className="min-h-dvh">
      <NavBar firstName={me.firstName} />
      <Outlet />
      <DashboardFooter />
    </div>
  );
}
