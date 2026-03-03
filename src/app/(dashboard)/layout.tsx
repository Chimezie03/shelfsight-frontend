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
import { Button } from "@/components/ui/button";
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

  // Redirect unauthenticated users to login
  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      router.replace("/");
    }
  }, [isLoading, isAuthenticated, router]);

  // Show spinner while auth state is loading
  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <Loader2 className="w-8 h-8 animate-spin text-indigo-600" />
      </div>
    );
  }

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <Loader2 className="w-8 h-8 animate-spin text-indigo-600" />
      </div>
    );
  }

  const handleLogout = async () => {
    await logout();
    router.push("/");
  };

  return (
    <div className="min-h-screen bg-gray-50 flex">
      {/* Sidebar */}
      <aside
        className={`${isCollapsed ? "w-20" : "w-64"} bg-white border-r border-gray-200 flex flex-col transition-all duration-300`}
      >
        <div
          className={`p-6 border-b border-gray-200 ${isCollapsed ? "px-4" : ""}`}
        >
          <div
            className={`flex items-center ${isCollapsed ? "justify-center" : "gap-3"}`}
          >
            <div className="w-10 h-10 bg-indigo-600 rounded-lg flex items-center justify-center flex-shrink-0">
              <BookOpen className="w-6 h-6 text-white" />
            </div>
            {!isCollapsed && (
              <div>
                <h1 className="font-semibold text-lg">ShelfSight</h1>
                <p className="text-xs text-gray-500">
                  {user?.name ?? "Admin Portal"}
                  {user?.role && (
                    <span className="ml-1 text-indigo-600">
                      · {user.role.charAt(0) + user.role.slice(1).toLowerCase()}
                    </span>
                  )}
                </p>
              </div>
            )}
          </div>
        </div>

        <nav className="flex-1 p-4 space-y-1">
          <TooltipProvider delayDuration={0}>
            {navigation.map((item) => {
              const Icon = item.icon;
              const isActive = pathname === item.path;

              const linkContent = (
                <Link
                  key={item.path}
                  href={item.path}
                  className={`w-full flex items-center ${isCollapsed ? "justify-center" : "gap-3"} px-4 py-3 rounded-lg transition-colors ${
                    isActive
                      ? "bg-indigo-50 text-indigo-700"
                      : "text-gray-700 hover:bg-gray-100"
                  }`}
                >
                  <Icon className="w-5 h-5 flex-shrink-0" />
                  {!isCollapsed && (
                    <span className="font-medium">{item.name}</span>
                  )}
                </Link>
              );

              if (isCollapsed) {
                return (
                  <Tooltip key={item.path}>
                    <TooltipTrigger asChild>{linkContent}</TooltipTrigger>
                    <TooltipContent side="right">
                      <p>{item.name}</p>
                    </TooltipContent>
                  </Tooltip>
                );
              }

              return linkContent;
            })}
          </TooltipProvider>
        </nav>

        {/* Collapse Toggle Button */}
        <div className="p-4 border-t border-gray-200">
          <Button
            variant="ghost"
            className={`w-full ${isCollapsed ? "justify-center px-0" : "justify-start"}`}
            onClick={() => setIsCollapsed(!isCollapsed)}
            title={isCollapsed ? "Expand sidebar" : "Collapse sidebar"}
          >
            {isCollapsed ? (
              <ChevronRight className="w-5 h-5" />
            ) : (
              <>
                <ChevronLeft className="w-5 h-5 mr-3" />
                Collapse
              </>
            )}
          </Button>
        </div>

        <div className="p-4 border-t border-gray-200">
          {isCollapsed ? (
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="ghost"
                  className="w-full justify-center px-0"
                  onClick={handleLogout}
                >
                  <LogOut className="w-5 h-5" />
                </Button>
              </TooltipTrigger>
              <TooltipContent side="right">
                <p>Logout</p>
              </TooltipContent>
            </Tooltip>
          ) : (
            <Button
              variant="ghost"
              className="w-full justify-start"
              onClick={handleLogout}
            >
              <LogOut className="w-5 h-5 mr-3" />
              Logout
            </Button>
          )}
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 overflow-auto">{children}</main>
    </div>
  );
}
