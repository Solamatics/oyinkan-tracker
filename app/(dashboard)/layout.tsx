import { Sidebar } from "@/components/Sidebar";

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex min-h-screen">
      <Sidebar />
      <main className="flex-1 overflow-auto">
        <div className="mx-auto max-w-5xl px-4 pt-20 pb-24 sm:px-6 md:py-8">
          {children}
        </div>
      </main>
    </div>
  );
}
