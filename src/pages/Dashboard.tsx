import { Outlet, Navigate, useLocation } from "react-router";
import { BottomNav } from "@/components/BottomNav";
import { useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";
import { useEffect } from "react";

export default function Dashboard() {
  const location = useLocation();
  const seedProducts = useMutation(api.products.seed);

  // Seed products on first load
  useEffect(() => {
    seedProducts();
  }, [seedProducts]);

  // Redirect bare /dashboard to /dashboard/home
  if (location.pathname === "/dashboard") {
    return <Navigate to="/dashboard/home" replace />;
  }

  return (
    <div className="min-h-screen bg-background">
      <main className="pb-20">
        <Outlet />
      </main>
      <BottomNav />
    </div>
  );
}
