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
    { label: "Total Books", value: "2,847", icon: BookOpen, color: "bg-blue-500" },
    { label: "Active Members", value: "342", icon: Users, color: "bg-green-500" },
    { label: "Books Checked Out", value: "127", icon: Clock, color: "bg-orange-500" },
    { label: "Overdue Items", value: "8", icon: AlertCircle, color: "bg-red-500" },
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
    <div className="p-8">
      <div className="mb-8">
        <div className="flex items-center gap-2 mb-2">
          <ShieldCheck className="w-7 h-7 text-indigo-600" />
          <h1 className="text-3xl font-semibold">Admin Dashboard</h1>
        </div>
        <p className="text-gray-600">Welcome back, {name}! Full system overview and management controls.</p>
      </div>

      {/* Quick Actions */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
        <Link href="/ingest">
          <Card className="hover:border-indigo-300 transition-colors cursor-pointer">
            <CardContent className="pt-4 pb-4 flex items-center gap-3">
              <ScanLine className="w-5 h-5 text-indigo-600" />
              <span className="font-medium text-sm">AI Ingest</span>
            </CardContent>
          </Card>
        </Link>
        <Link href="/map">
          <Card className="hover:border-indigo-300 transition-colors cursor-pointer">
            <CardContent className="pt-4 pb-4 flex items-center gap-3">
              <Map className="w-5 h-5 text-indigo-600" />
              <span className="font-medium text-sm">Library Map</span>
            </CardContent>
          </Card>
        </Link>
        <Link href="/members">
          <Card className="hover:border-indigo-300 transition-colors cursor-pointer">
            <CardContent className="pt-4 pb-4 flex items-center gap-3">
              <Users className="w-5 h-5 text-indigo-600" />
              <span className="font-medium text-sm">Manage Members</span>
            </CardContent>
          </Card>
        </Link>
        <Link href="/reports">
          <Card className="hover:border-indigo-300 transition-colors cursor-pointer">
            <CardContent className="pt-4 pb-4 flex items-center gap-3">
              <BarChart3 className="w-5 h-5 text-indigo-600" />
              <span className="font-medium text-sm">Reports</span>
            </CardContent>
          </Card>
        </Link>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        {stats.map((stat) => {
          const Icon = stat.icon;
          return (
            <Card key={stat.label}>
              <CardContent className="pt-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-600 mb-1">{stat.label}</p>
                    <p className="text-3xl font-semibold">{stat.value}</p>
                  </div>
                  <div className={`${stat.color} w-12 h-12 rounded-lg flex items-center justify-center`}>
                    <Icon className="w-6 h-6 text-white" />
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
          <CardHeader>
            <CardTitle>System Activity</CardTitle>
            <CardDescription>All user actions across the system</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {recentActivity.map((activity, index) => (
                <div key={index} className="flex items-center justify-between py-3 border-b last:border-0">
                  <div className="flex-1">
                    <p className="font-medium text-sm">{activity.action}</p>
                    <p className="text-sm text-gray-600">{activity.title}</p>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="text-sm text-gray-500">{activity.time}</span>
                    <Badge variant={activity.status === "success" ? "default" : activity.status === "pending" ? "secondary" : "outline"}>
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
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="w-5 h-5" />
              AI Recommendations
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {aiRecommendations.map((rec, index) => (
                <div key={index} className="p-3 bg-gray-50 rounded-lg">
                  <div className="flex items-start justify-between mb-2">
                    <p className="font-medium text-sm">{rec.title}</p>
                    <Badge
                      variant={rec.priority === "high" ? "destructive" : rec.priority === "medium" ? "default" : "secondary"}
                      className="text-xs"
                    >
                      {rec.priority}
                    </Badge>
                  </div>
                  <p className="text-xs text-gray-600">{rec.description}</p>
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
    { label: "My Check-outs Today", value: "14", icon: Clock, color: "bg-blue-500" },
    { label: "Pending Returns", value: "23", icon: Library, color: "bg-orange-500" },
    { label: "Items to Shelve", value: "9", icon: BookOpen, color: "bg-green-500" },
    { label: "Overdue Notices", value: "3", icon: AlertCircle, color: "bg-red-500" },
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
    <div className="p-8">
      <div className="mb-8">
        <div className="flex items-center gap-2 mb-2">
          <Settings className="w-7 h-7 text-emerald-600" />
          <h1 className="text-3xl font-semibold">Staff Dashboard</h1>
        </div>
        <p className="text-gray-600">Welcome, {name}! Here&apos;s your daily workflow overview.</p>
      </div>

      {/* Quick Actions */}
      <div className="grid grid-cols-2 md:grid-cols-3 gap-4 mb-8">
        <Link href="/circulation">
          <Card className="hover:border-emerald-300 transition-colors cursor-pointer">
            <CardContent className="pt-4 pb-4 flex items-center gap-3">
              <Clock className="w-5 h-5 text-emerald-600" />
              <span className="font-medium text-sm">Circulation Desk</span>
            </CardContent>
          </Card>
        </Link>
        <Link href="/catalog">
          <Card className="hover:border-emerald-300 transition-colors cursor-pointer">
            <CardContent className="pt-4 pb-4 flex items-center gap-3">
              <Library className="w-5 h-5 text-emerald-600" />
              <span className="font-medium text-sm">Browse Catalog</span>
            </CardContent>
          </Card>
        </Link>
        <Link href="/ingest">
          <Card className="hover:border-emerald-300 transition-colors cursor-pointer">
            <CardContent className="pt-4 pb-4 flex items-center gap-3">
              <ScanLine className="w-5 h-5 text-emerald-600" />
              <span className="font-medium text-sm">AI Ingest</span>
            </CardContent>
          </Card>
        </Link>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        {stats.map((stat) => {
          const Icon = stat.icon;
          return (
            <Card key={stat.label}>
              <CardContent className="pt-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-600 mb-1">{stat.label}</p>
                    <p className="text-3xl font-semibold">{stat.value}</p>
                  </div>
                  <div className={`${stat.color} w-12 h-12 rounded-lg flex items-center justify-center`}>
                    <Icon className="w-6 h-6 text-white" />
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
          <CardHeader>
            <CardTitle>Today&apos;s Tasks</CardTitle>
            <CardDescription>Your shift checklist</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {todaysTasks.map((item, i) => (
                <div key={i} className="flex items-center gap-3 py-2 border-b last:border-0">
                  <div className={`w-2.5 h-2.5 rounded-full flex-shrink-0 ${
                    item.status === "done" ? "bg-green-500" : item.status === "in-progress" ? "bg-yellow-500" : "bg-gray-300"
                  }`} />
                  <div className="flex-1">
                    <p className={`text-sm font-medium ${item.status === "done" ? "line-through text-gray-400" : ""}`}>{item.task}</p>
                  </div>
                  <span className="text-xs text-gray-500">{item.time}</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Recent Circulation */}
        <Card>
          <CardHeader>
            <CardTitle>Recent Circulation</CardTitle>
            <CardDescription>Latest check-outs, returns &amp; renewals</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {recentCirculation.map((item, i) => (
                <div key={i} className="flex items-center justify-between py-2 border-b last:border-0">
                  <div>
                    <p className="text-sm font-medium">{item.action}: <span className="text-gray-600">{item.title}</span></p>
                    <p className="text-xs text-gray-500">Patron: {item.patron}</p>
                  </div>
                  <span className="text-xs text-gray-400">{item.time}</span>
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
    { label: "Books Borrowed", value: "3", icon: BookMarked, color: "bg-violet-500" },
    { label: "Due Soon", value: "1", icon: CalendarClock, color: "bg-amber-500" },
    { label: "Overdue", value: "1", icon: AlertCircle, color: "bg-red-500" },
    { label: "Books Read (Total)", value: "27", icon: Star, color: "bg-emerald-500" },
  ];

  return (
    <div className="p-8">
      <div className="mb-8">
        <div className="flex items-center gap-2 mb-2">
          <BookMarked className="w-7 h-7 text-violet-600" />
          <h1 className="text-3xl font-semibold">My Library</h1>
        </div>
        <p className="text-gray-600">Welcome, {name}! Manage your loans and discover new reads.</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-6 mb-8">
        {stats.map((stat) => {
          const Icon = stat.icon;
          return (
            <Card key={stat.label}>
              <CardContent className="pt-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-600 mb-1">{stat.label}</p>
                    <p className="text-3xl font-semibold">{stat.value}</p>
                  </div>
                  <div className={`${stat.color} w-12 h-12 rounded-lg flex items-center justify-center`}>
                    <Icon className="w-6 h-6 text-white" />
                  </div>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Quick Actions */}
      <div className="grid grid-cols-2 gap-4 mb-8">
        <Link href="/catalog">
          <Card className="hover:border-violet-300 transition-colors cursor-pointer">
            <CardContent className="pt-4 pb-4 flex items-center gap-3">
              <Library className="w-5 h-5 text-violet-600" />
              <span className="font-medium text-sm">Browse Catalog</span>
            </CardContent>
          </Card>
        </Link>
        <Link href="/map">
          <Card className="hover:border-violet-300 transition-colors cursor-pointer">
            <CardContent className="pt-4 pb-4 flex items-center gap-3">
              <Map className="w-5 h-5 text-violet-600" />
              <span className="font-medium text-sm">Library Map</span>
            </CardContent>
          </Card>
        </Link>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* My Current Loans */}
        <Card>
          <CardHeader>
            <CardTitle>My Current Loans</CardTitle>
            <CardDescription>Books you currently have checked out</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {myBooks.map((book, i) => (
                <div key={i} className="flex items-center justify-between py-3 border-b last:border-0">
                  <div>
                    <p className="font-medium text-sm">{book.title}</p>
                    <p className="text-xs text-gray-500">{book.author}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-xs text-gray-500">Due: {book.dueDate}</p>
                    <Badge
                      variant={book.status === "overdue" ? "destructive" : book.status === "due-soon" ? "secondary" : "outline"}
                      className="text-xs mt-1"
                    >
                      {book.status === "overdue" ? `${Math.abs(book.daysLeft)}d overdue` : `${book.daysLeft}d left`}
                    </Badge>
                  </div>
                </div>
              ))}
            </div>
            <Button variant="outline" size="sm" className="w-full mt-4">
              View Full Loan History
            </Button>
          </CardContent>
        </Card>

        {/* Recommendations */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Star className="w-5 h-5 text-amber-500" />
              Recommended for You
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {recommendations.map((rec, i) => (
                <div key={i} className="p-3 bg-gray-50 rounded-lg">
                  <p className="font-medium text-sm">{rec.title}</p>
                  <p className="text-xs text-gray-500 mb-1">by {rec.author}</p>
                  <p className="text-xs text-violet-600">{rec.reason}</p>
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
/*  MAIN PAGE — routes to role-specific dashboard                      */
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
