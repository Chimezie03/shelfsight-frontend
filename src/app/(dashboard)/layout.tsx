"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
  BookOpen,
  LayoutDashboard,
  ScanLine,
  Map,
  Library,
  LogOut,
  RefreshCw,
  Users,
  BarChart3,
  ChevronLeft,
  ChevronRight,
  Loader2,
} from "lucide-react";

import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { useAuth } from "@/components/auth-provider";

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const router = useRouter();
  const { user, isAuthenticated, isLoading, logout } = useAuth();
  const [isCollapsed, setIsCollapsed] = useState(false);

  const allNavigation = [
    { name: "Dashboard", path: "/dashboard", icon: LayoutDashboard, roles: ["ADMIN", "STAFF", "PATRON"] },
    { name: "AI Book Ingestion", path: "/ingest", icon: ScanLine, roles: ["ADMIN", "STAFF"] },
    { name: "Library Map", path: "/map", icon: Map, roles: ["ADMIN", "STAFF", "PATRON"] },
    { name: "Catalog", path: "/catalog", icon: Library, roles: ["ADMIN", "STAFF", "PATRON"] },
    { name: "Circulation", path: "/circulation", icon: RefreshCw, roles: ["ADMIN", "STAFF"] },
    { name: "Members", path: "/members", icon: Users, roles: ["ADMIN"] },
    { name: "Reports", path: "/reports", icon: BarChart3, roles: ["ADMIN"] },
  ];

  const navigation = allNavigation.filter((item) =>
    item.roles.includes(user?.role ?? "PATRON")
  );

  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      router.replace("/");
    }
  }, [isLoading, isAuthenticated, router]);

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Loader2 className="w-8 h-8 animate-spin text-brand-copper" />
      </div>
    );
  }

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Loader2 className="w-8 h-8 animate-spin text-brand-copper" />
      </div>
    );
  }

  const handleLogout = async () => {
    await logout();
    router.push("/");
  };

  return (
    <div className="min-h-screen bg-background flex">
      {/* Sidebar — dark navy */}
      <aside
        className={`${isCollapsed ? "w-[64px]" : "w-52"} bg-brand-navy flex flex-col transition-all duration-300 ease-in-out`}
      >
        {/* Logo & user */}
        <div className={`p-4 ${isCollapsed ? "px-2.5" : ""}`}>
          <div className={`flex items-center ${isCollapsed ? "justify-center" : "gap-2.5"}`}>
            <div className="w-9 h-9 bg-brand-copper rounded-xl flex items-center justify-center flex-shrink-0 shadow-lg shadow-brand-copper/20">
              <BookOpen className="w-4.5 h-4.5 text-white" />
            </div>
            {!isCollapsed && (
              <div className="min-w-0">
                <h1 className="font-display text-[1rem] font-semibold text-white tracking-tight leading-tight">
                  ShelfSight
                </h1>
                <p className="text-[10px] text-white/50 truncate">
                  {user?.name ?? "Admin Portal"}
                  {user?.role && (
                    <span className="ml-1 text-brand-copper">
                      · {user.role.charAt(0) + user.role.slice(1).toLowerCase()}
                    </span>
                  )}
                </p>
              </div>
            )}
          </div>
        </div>

        {/* Divider */}
        <div className="mx-4 h-px bg-white/10" />

        {/* Navigation */}
        <nav className="flex-1 px-2.5 py-3 space-y-0.5">
          <TooltipProvider delayDuration={0}>
            {navigation.map((item) => {
              const Icon = item.icon;
              const isActive = pathname === item.path;

              const linkContent = (
                <Link
                  key={item.path}
                  href={item.path}
                  className={`w-full flex items-center ${isCollapsed ? "justify-center" : "gap-2.5"} px-2.5 py-2 rounded-lg transition-all duration-200 ${
                    isActive
                      ? "bg-white/12 text-white shadow-sm"
                      : "text-white/60 hover:text-white hover:bg-white/6"
                  }`}
                >
                  <Icon className={`w-[16px] h-[16px] flex-shrink-0 ${isActive ? "text-brand-copper" : ""}`} />
                  {!isCollapsed && (
                    <span className="text-[12px] font-medium">{item.name}</span>
                  )}
                </Link>
              );

              if (isCollapsed) {
                return (
                  <Tooltip key={item.path}>
                    <TooltipTrigger asChild>{linkContent}</TooltipTrigger>
                    <TooltipContent side="right" className="bg-brand-navy text-white border-white/10">
                      <p>{item.name}</p>
                    </TooltipContent>
                  </Tooltip>
                );
              }

              return linkContent;
            })}
          </TooltipProvider>
        </nav>

        {/* Collapse toggle */}
        <div className="px-2.5 py-2">
          <button
            onClick={() => setIsCollapsed(!isCollapsed)}
            className={`w-full flex items-center ${isCollapsed ? "justify-center" : ""} px-2.5 py-1.5 rounded-lg text-white/40 hover:text-white/70 transition-colors`}
            title={isCollapsed ? "Expand sidebar" : "Collapse sidebar"}
          >
            {isCollapsed ? (
              <ChevronRight className="w-4 h-4" />
            ) : (
              <>
                <ChevronLeft className="w-4 h-4 mr-2" />
                <span className="text-xs">Collapse</span>
              </>
            )}
          </button>
        </div>

        {/* Logout */}
        <div className="px-2.5 pb-3">
          <div className="h-px bg-white/10 mb-2.5" />
          {isCollapsed ? (
            <Tooltip>
              <TooltipTrigger asChild>
                <button
                  onClick={handleLogout}
                  className="w-full flex items-center justify-center px-2.5 py-1.5 rounded-lg text-white/40 hover:text-red-400 transition-colors"
                >
                  <LogOut className="w-4 h-4" />
                </button>
              </TooltipTrigger>
              <TooltipContent side="right" className="bg-brand-navy text-white border-white/10">
                <p>Logout</p>
              </TooltipContent>
            </Tooltip>
          ) : (
            <button
              onClick={handleLogout}
              className="w-full flex items-center px-2.5 py-1.5 rounded-lg text-white/40 hover:text-red-400 transition-colors"
            >
              <LogOut className="w-3.5 h-3.5 mr-2" />
              <span className="text-[11px]">Logout</span>
            </button>
          )}
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 overflow-auto">{children}</main>
    </div>
  );
}
