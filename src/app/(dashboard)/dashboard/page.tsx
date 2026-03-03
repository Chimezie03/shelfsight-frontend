"use client";

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import {
  BookOpen,
  Users,
  Clock,
  TrendingUp,
  AlertCircle,
  ScanLine,
  Map,
  BarChart3,
  ShieldCheck,
  Library,
  Settings,
  BookMarked,
  CalendarClock,
  Star,
  ArrowRight,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/components/auth-provider";
import Link from "next/link";

/* ------------------------------------------------------------------ */
/*  ADMIN DASHBOARD                                                    */
/* ------------------------------------------------------------------ */
function AdminDashboard({ name }: { name: string }) {
  const stats = [
    { label: "Total Books", value: "2,847", icon: BookOpen, accent: "bg-brand-navy/8 text-brand-navy" },
    { label: "Active Members", value: "342", icon: Users, accent: "bg-brand-sage/10 text-brand-sage" },
    { label: "Books Checked Out", value: "127", icon: Clock, accent: "bg-brand-amber/10 text-brand-amber" },
    { label: "Overdue Items", value: "8", icon: AlertCircle, accent: "bg-brand-brick/10 text-brand-brick" },
  ];

  const recentActivity = [
    { action: "Book added via AI", title: "The Great Gatsby", time: "5 min ago", status: "success" },
    { action: "Check-out", title: "To Kill a Mockingbird", time: "12 min ago", status: "info" },
    { action: "AI Classification", title: "Sapiens: A Brief History", time: "18 min ago", status: "pending" },
    { action: "Check-in", title: "1984", time: "25 min ago", status: "success" },
    { action: "Shelf reorganization", title: "Section C - History", time: "1 hour ago", status: "success" },
  ];

  const aiRecommendations = [
    { title: "Shelf capacity warning", description: "Section B (Fiction) is at 94% capacity. Consider redistribution.", priority: "high" },
    { title: "Misplaced items detected", description: "3 Science books found in History section (D-4).", priority: "medium" },
    { title: "Optimize organization", description: "Group related subjects: Philosophy books span 3 sections.", priority: "low" },
  ];

  return (
    <div className="p-8 ">
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center gap-3 mb-1">
          <div className="w-9 h-9 rounded-xl bg-brand-navy/8 flex items-center justify-center">
            <ShieldCheck className="w-5 h-5 text-brand-navy" />
          </div>
          <h1 className="font-display text-2xl font-semibold text-foreground tracking-tight">
            Admin Dashboard
          </h1>
        </div>
        <p className="text-sm text-muted-foreground ml-12">
          Welcome back, {name}. Full system overview and management controls.
        </p>
      </div>

      {/* Quick Actions */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-8">
        {[
          { href: "/ingest", icon: ScanLine, label: "AI Ingest" },
          { href: "/map", icon: Map, label: "Library Map" },
          { href: "/members", icon: Users, label: "Manage Members" },
          { href: "/reports", icon: BarChart3, label: "Reports" },
        ].map((action) => (
          <Link key={action.href} href={action.href}>
            <Card className="group hover:border-brand-copper/40 hover:shadow-md hover:shadow-brand-copper/5 transition-all duration-200 cursor-pointer">
              <CardContent className="py-3.5 px-4 flex items-center gap-3">
                <action.icon className="w-4 h-4 text-brand-copper group-hover:scale-110 transition-transform" />
                <span className="text-[13px] font-medium">{action.label}</span>
                <ArrowRight className="w-3 h-3 ml-auto text-muted-foreground/0 group-hover:text-muted-foreground transition-all" />
              </CardContent>
            </Card>
          </Link>
        ))}
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        {stats.map((stat) => {
          const Icon = stat.icon;
          return (
            <Card key={stat.label}>
              <CardContent className="pt-5 pb-5">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide mb-1">{stat.label}</p>
                    <p className="text-2xl font-display font-semibold tracking-tight">{stat.value}</p>
                  </div>
                  <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${stat.accent}`}>
                    <Icon className="w-5 h-5" />
                  </div>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Recent Activity */}
        <Card className="lg:col-span-2">
          <CardHeader className="pb-3">
            <CardTitle className="text-base font-display">System Activity</CardTitle>
            <CardDescription className="text-xs">All user actions across the system</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-0">
              {recentActivity.map((activity, index) => (
                <div key={index} className="flex items-center justify-between py-3 border-b border-border/60 last:border-0">
                  <div className="flex-1 min-w-0">
                    <p className="text-[13px] font-medium">{activity.action}</p>
                    <p className="text-xs text-muted-foreground truncate">{activity.title}</p>
                  </div>
                  <div className="flex items-center gap-3 ml-4 flex-shrink-0">
                    <span className="text-[11px] text-muted-foreground">{activity.time}</span>
                    <Badge
                      variant={activity.status === "success" ? "default" : activity.status === "pending" ? "secondary" : "outline"}
                      className="text-[10px] px-2 py-0.5"
                    >
                      {activity.status}
                    </Badge>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* AI Recommendations */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-base font-display">
              <TrendingUp className="w-4 h-4 text-brand-copper" />
              AI Recommendations
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {aiRecommendations.map((rec, index) => (
                <div key={index} className="p-3 bg-secondary/60 rounded-xl">
                  <div className="flex items-start justify-between mb-1.5">
                    <p className="text-[13px] font-medium leading-snug">{rec.title}</p>
                    <Badge
                      variant={rec.priority === "high" ? "destructive" : rec.priority === "medium" ? "default" : "secondary"}
                      className="text-[10px] px-2 py-0.5 ml-2 flex-shrink-0"
                    >
                      {rec.priority}
                    </Badge>
                  </div>
                  <p className="text-[11px] text-muted-foreground leading-relaxed">{rec.description}</p>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  STAFF DASHBOARD                                                    */
/* ------------------------------------------------------------------ */
function StaffDashboard({ name }: { name: string }) {
  const stats = [
    { label: "My Check-outs Today", value: "14", icon: Clock, accent: "bg-brand-navy/8 text-brand-navy" },
    { label: "Pending Returns", value: "23", icon: Library, accent: "bg-brand-amber/10 text-brand-amber" },
    { label: "Items to Shelve", value: "9", icon: BookOpen, accent: "bg-brand-sage/10 text-brand-sage" },
    { label: "Overdue Notices", value: "3", icon: AlertCircle, accent: "bg-brand-brick/10 text-brand-brick" },
  ];

  const todaysTasks = [
    { task: "Process returns bin", status: "done", time: "9:00 AM" },
    { task: "Shelve Science section cart", status: "done", time: "10:30 AM" },
    { task: "Assist with AI book ingestion batch", status: "in-progress", time: "11:00 AM" },
    { task: "Inventory check — Section D", status: "pending", time: "2:00 PM" },
    { task: "Close circulation desk", status: "pending", time: "5:00 PM" },
  ];

  const recentCirculation = [
    { action: "Check-out", patron: "Jane Doe", title: "Dune", time: "10 min ago" },
    { action: "Return", patron: "John Smith", title: "Atomic Habits", time: "22 min ago" },
    { action: "Renewal", patron: "Alice Lee", title: "Educated", time: "35 min ago" },
    { action: "Check-out", patron: "Bob Chen", title: "Project Hail Mary", time: "1 hr ago" },
  ];

  return (
    <div className="p-8 ">
      <div className="mb-8">
        <div className="flex items-center gap-3 mb-1">
          <div className="w-9 h-9 rounded-xl bg-brand-sage/10 flex items-center justify-center">
            <Settings className="w-5 h-5 text-brand-sage" />
          </div>
          <h1 className="font-display text-2xl font-semibold text-foreground tracking-tight">
            Staff Dashboard
          </h1>
        </div>
        <p className="text-sm text-muted-foreground ml-12">
          Welcome, {name}. Here&apos;s your daily workflow overview.
        </p>
      </div>

      {/* Quick Actions */}
      <div className="grid grid-cols-2 md:grid-cols-3 gap-3 mb-8">
        {[
          { href: "/circulation", icon: Clock, label: "Circulation Desk" },
          { href: "/catalog", icon: Library, label: "Browse Catalog" },
          { href: "/ingest", icon: ScanLine, label: "AI Ingest" },
        ].map((action) => (
          <Link key={action.href} href={action.href}>
            <Card className="group hover:border-brand-copper/40 hover:shadow-md hover:shadow-brand-copper/5 transition-all duration-200 cursor-pointer">
              <CardContent className="py-3.5 px-4 flex items-center gap-3">
                <action.icon className="w-4 h-4 text-brand-copper group-hover:scale-110 transition-transform" />
                <span className="text-[13px] font-medium">{action.label}</span>
                <ArrowRight className="w-3 h-3 ml-auto text-muted-foreground/0 group-hover:text-muted-foreground transition-all" />
              </CardContent>
            </Card>
          </Link>
        ))}
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        {stats.map((stat) => {
          const Icon = stat.icon;
          return (
            <Card key={stat.label}>
              <CardContent className="pt-5 pb-5">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide mb-1">{stat.label}</p>
                    <p className="text-2xl font-display font-semibold tracking-tight">{stat.value}</p>
                  </div>
                  <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${stat.accent}`}>
                    <Icon className="w-5 h-5" />
                  </div>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Today's Tasks */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base font-display">Today&apos;s Tasks</CardTitle>
            <CardDescription className="text-xs">Your shift checklist</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-0">
              {todaysTasks.map((item, i) => (
                <div key={i} className="flex items-center gap-3 py-2.5 border-b border-border/60 last:border-0">
                  <div className={`w-2 h-2 rounded-full flex-shrink-0 ${
                    item.status === "done" ? "bg-brand-sage" : item.status === "in-progress" ? "bg-brand-amber" : "bg-border"
                  }`} />
                  <div className="flex-1 min-w-0">
                    <p className={`text-[13px] font-medium ${item.status === "done" ? "line-through text-muted-foreground" : ""}`}>{item.task}</p>
                  </div>
                  <span className="text-[11px] text-muted-foreground flex-shrink-0">{item.time}</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Recent Circulation */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base font-display">Recent Circulation</CardTitle>
            <CardDescription className="text-xs">Latest check-outs, returns &amp; renewals</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-0">
              {recentCirculation.map((item, i) => (
                <div key={i} className="flex items-center justify-between py-2.5 border-b border-border/60 last:border-0">
                  <div className="min-w-0">
                    <p className="text-[13px] font-medium">{item.action}: <span className="text-muted-foreground font-normal">{item.title}</span></p>
                    <p className="text-[11px] text-muted-foreground">Patron: {item.patron}</p>
                  </div>
                  <span className="text-[11px] text-muted-foreground flex-shrink-0 ml-4">{item.time}</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  PATRON DASHBOARD                                                   */
/* ------------------------------------------------------------------ */
function PatronDashboard({ name }: { name: string }) {
  const myBooks = [
    { title: "Dune", author: "Frank Herbert", dueDate: "Mar 15, 2026", daysLeft: 12, status: "on-time" },
    { title: "Atomic Habits", author: "James Clear", dueDate: "Mar 8, 2026", daysLeft: 5, status: "due-soon" },
    { title: "The Alchemist", author: "Paulo Coelho", dueDate: "Feb 28, 2026", daysLeft: -3, status: "overdue" },
  ];

  const recommendations = [
    { title: "Project Hail Mary", author: "Andy Weir", reason: "Because you enjoyed Dune" },
    { title: "Sapiens", author: "Yuval Noah Harari", reason: "Popular in Non-Fiction" },
    { title: "The Midnight Library", author: "Matt Haig", reason: "Trending this month" },
  ];

  const stats = [
    { label: "Books Borrowed", value: "3", icon: BookMarked, accent: "bg-brand-navy/8 text-brand-navy" },
    { label: "Due Soon", value: "1", icon: CalendarClock, accent: "bg-brand-amber/10 text-brand-amber" },
    { label: "Overdue", value: "1", icon: AlertCircle, accent: "bg-brand-brick/10 text-brand-brick" },
    { label: "Books Read (Total)", value: "27", icon: Star, accent: "bg-brand-sage/10 text-brand-sage" },
  ];

  return (
    <div className="p-8 ">
      <div className="mb-8">
        <div className="flex items-center gap-3 mb-1">
          <div className="w-9 h-9 rounded-xl bg-brand-navy/8 flex items-center justify-center">
            <BookMarked className="w-5 h-5 text-brand-navy" />
          </div>
          <h1 className="font-display text-2xl font-semibold text-foreground tracking-tight">
            My Library
          </h1>
        </div>
        <p className="text-sm text-muted-foreground ml-12">
          Welcome, {name}. Manage your loans and discover new reads.
        </p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
        {stats.map((stat) => {
          const Icon = stat.icon;
          return (
            <Card key={stat.label}>
              <CardContent className="pt-5 pb-5">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide mb-1">{stat.label}</p>
                    <p className="text-2xl font-display font-semibold tracking-tight">{stat.value}</p>
                  </div>
                  <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${stat.accent}`}>
                    <Icon className="w-5 h-5" />
                  </div>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Quick Actions */}
      <div className="grid grid-cols-2 gap-3 mb-8">
        {[
          { href: "/catalog", icon: Library, label: "Browse Catalog" },
          { href: "/map", icon: Map, label: "Library Map" },
        ].map((action) => (
          <Link key={action.href} href={action.href}>
            <Card className="group hover:border-brand-copper/40 hover:shadow-md hover:shadow-brand-copper/5 transition-all duration-200 cursor-pointer">
              <CardContent className="py-3.5 px-4 flex items-center gap-3">
                <action.icon className="w-4 h-4 text-brand-copper group-hover:scale-110 transition-transform" />
                <span className="text-[13px] font-medium">{action.label}</span>
                <ArrowRight className="w-3 h-3 ml-auto text-muted-foreground/0 group-hover:text-muted-foreground transition-all" />
              </CardContent>
            </Card>
          </Link>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Current Loans */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base font-display">My Current Loans</CardTitle>
            <CardDescription className="text-xs">Books you currently have checked out</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-0">
              {myBooks.map((book, i) => (
                <div key={i} className="flex items-center justify-between py-3 border-b border-border/60 last:border-0">
                  <div className="min-w-0">
                    <p className="text-[13px] font-medium">{book.title}</p>
                    <p className="text-[11px] text-muted-foreground">{book.author}</p>
                  </div>
                  <div className="text-right flex-shrink-0 ml-4">
                    <p className="text-[11px] text-muted-foreground">Due: {book.dueDate}</p>
                    <Badge
                      variant={book.status === "overdue" ? "destructive" : book.status === "due-soon" ? "secondary" : "outline"}
                      className="text-[10px] px-2 py-0.5 mt-1"
                    >
                      {book.status === "overdue" ? `${Math.abs(book.daysLeft)}d overdue` : `${book.daysLeft}d left`}
                    </Badge>
                  </div>
                </div>
              ))}
            </div>
            <Button variant="outline" size="sm" className="w-full mt-4 text-xs">
              View Full Loan History
            </Button>
          </CardContent>
        </Card>

        {/* Recommendations */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-base font-display">
              <Star className="w-4 h-4 text-brand-amber" />
              Recommended for You
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {recommendations.map((rec, i) => (
                <div key={i} className="p-3 bg-secondary/60 rounded-xl">
                  <p className="text-[13px] font-medium">{rec.title}</p>
                  <p className="text-[11px] text-muted-foreground mb-1">by {rec.author}</p>
                  <p className="text-[11px] text-brand-copper font-medium">{rec.reason}</p>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  MAIN PAGE                                                          */
/* ------------------------------------------------------------------ */
export default function DashboardPage() {
  const { user } = useAuth();
  const name = user?.name?.split(" ")[0] ?? "there";
  const role = user?.role ?? "PATRON";

  switch (role) {
    case "ADMIN":
      return <AdminDashboard name={name} />;
    case "STAFF":
      return <StaffDashboard name={name} />;
    case "PATRON":
    default:
      return <PatronDashboard name={name} />;
  }
}
