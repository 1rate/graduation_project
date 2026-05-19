import { Header } from "@/shared/components";
import { Sidebar } from "@/shared/components/Sidebar";
import { Outlet } from "react-router-dom";
export const AppLayout = () => {
  return (
    <div className="flex h-screen">
      <div className="hidden lg:block shrink-0">
        <Sidebar variant="desktop" />
      </div>
      <div className="flex flex-1 flex-col min-w-0">
        <Header />
        <main className="flex-1 overflow-auto p-4 lg:p-6 min-w-0">
          <Outlet />
        </main>
      </div>
    </div>
  );
};
