import { Outlet } from "react-router-dom";
import { TopNav } from "./TopNav";

export const ProtectedLayout = () => {
  return (
    <div className="min-h-screen bg-slate-950 text-white">
      <TopNav />
      <main className="p-6">
        <Outlet />
      </main>
    </div>
  );
};
