import { AdminMobileNav } from "@/components/admin-mobile-nav";

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="pb-[calc(4.5rem+env(safe-area-inset-bottom))] lg:pb-0">
      {children}
      <AdminMobileNav />
    </div>
  );
}
