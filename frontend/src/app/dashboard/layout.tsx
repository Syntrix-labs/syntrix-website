import DashboardShell from "@/components/layout/DashboardShell";

/** One shell for the whole client area, so switching pages doesn't rebuild it. */
export default function ClientDashboardLayout({ children }: { children: React.ReactNode }) {
  return <DashboardShell>{children}</DashboardShell>;
}
