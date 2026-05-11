import { Header } from "@/shared/components";
import { Sidebar } from "@/shared/components/Sidebar";
import { Outlet } from "react-router-dom";
export const AppLayout = () => {
  return (
    <div className="flex h-screen">
      <div className="hidden lg:block">
        <Sidebar variant="desktop" />
      </div>
      <div className="flex flex-1 flex-col">
        <Header />
        <main className="flex-1 overflow-auto p-6">
          <Outlet />
        </main>
      </div>
    </div>
  );
};
