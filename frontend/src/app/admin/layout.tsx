import DashboardShell from "@/components/layout/DashboardShell";

/** One shell for the whole admin area, so switching pages doesn't rebuild it. */
export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return <DashboardShell type="admin">{children}</DashboardShell>;
}
