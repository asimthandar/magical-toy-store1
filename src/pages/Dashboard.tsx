import { Outlet, Navigate, useLocation } from "react-router";
import { BottomNav } from "@/components/BottomNav";
import { useQuery, useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";
import { useEffect } from "react";

export default function Dashboard() {
  const location = useLocation();
  const seedProducts = useMutation(api.products.seed);

  // Seed products on first load
  useEffect(() => {
    seedProducts();
  }, [seedProducts]);

  // Redirect bare /dashboard to /dashboard/search
  if (location.pathname === "/dashboard") {
    return <Navigate to="/dashboard/search" replace />;
  }

  return (
    <div className="min-h-screen bg-background">
      <main className="pb-16">
        <Outlet />
      </main>
      <BottomNav />
    </div>
  );
}
