import { Sidebar } from "@/app/dashboard/_components/Sidebar";

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-screen bg-zinc-950">
      <Sidebar />
      <div className="flex-1 pl-60">
        <main className="p-8 max-w-6xl">{children}</main>
      </div>
    </div>
  );
}
