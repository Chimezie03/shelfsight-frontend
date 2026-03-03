"use client";

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  TrendingUp,
  BookOpen,
  Users,
  Calendar,
  Award,
  Clock,
  DollarSign
} from "lucide-react";
import {
  BarChart,
  Bar,
  LineChart,
  Line,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";

export default function ReportsPage() {
  const circulationData = [
    { month: "Aug", checkouts: 245, returns: 238 },
    { month: "Sep", checkouts: 289, returns: 276 },
    { month: "Oct", checkouts: 312, returns: 305 },
    { month: "Nov", checkouts: 298, returns: 294 },
    { month: "Dec", checkouts: 267, returns: 271 },
    { month: "Jan", checkouts: 324, returns: 318 },
    { month: "Feb", checkouts: 287, returns: 279 },
  ];

  const categoryData = [
    { category: "Fiction", count: 847, color: "#1B2A4A" },
    { category: "Non-Fiction", count: 623, color: "#C4956A" },
    { category: "Science", count: 412, color: "#3D8B7A" },
    { category: "History", count: 356, color: "#D4A026" },
    { category: "Biography", count: 289, color: "#8B6BB5" },
    { category: "Children", count: 320, color: "#5EADBD" },
  ];

  const memberGrowthData = [
    { month: "Aug", members: 312 },
    { month: "Sep", members: 324 },
    { month: "Oct", members: 331 },
    { month: "Nov", members: 338 },
    { month: "Dec", members: 342 },
    { month: "Jan", members: 349 },
    { month: "Feb", members: 342 },
  ];

  const topBooks = [
    { title: "The Great Gatsby", author: "F. Scott Fitzgerald", borrows: 42, category: "Fiction" },
    { title: "Sapiens", author: "Yuval Noah Harari", borrows: 38, category: "Non-Fiction" },
    { title: "1984", author: "George Orwell", borrows: 35, category: "Fiction" },
    { title: "To Kill a Mockingbird", author: "Harper Lee", borrows: 33, category: "Fiction" },
    { title: "A Brief History of Time", author: "Stephen Hawking", borrows: 29, category: "Science" },
  ];

  const shelfUtilization = [
    { section: "A-1", capacity: 150, used: 142, percentage: 95 },
    { section: "A-2", capacity: 150, used: 98, percentage: 65 },
    { section: "B-1", capacity: 150, used: 134, percentage: 89 },
    { section: "B-2", capacity: 150, used: 141, percentage: 94 },
    { section: "C-1", capacity: 200, used: 165, percentage: 83 },
    { section: "C-2", capacity: 200, used: 178, percentage: 89 },
  ];

  return (
    <div className="p-8 ">
      <div className="mb-8 flex items-center justify-between">
        <div>
          <h1 className="font-display text-2xl font-semibold text-foreground tracking-tight mb-1">Reports & Analytics</h1>
          <p className="text-sm text-muted-foreground">Insights and statistics for library performance</p>
        </div>
        <Select defaultValue="30days">
          <SelectTrigger className="w-44">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="7days">Last 7 Days</SelectItem>
            <SelectItem value="30days">Last 30 Days</SelectItem>
            <SelectItem value="90days">Last 90 Days</SelectItem>
            <SelectItem value="year">This Year</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
        <Card>
          <CardContent className="pt-5 pb-5">
            <div className="flex items-center justify-between mb-3">
              <div className="w-10 h-10 rounded-xl bg-brand-navy/8 flex items-center justify-center">
                <BookOpen className="w-5 h-5 text-brand-navy" />
              </div>
              <TrendingUp className="w-4 h-4 text-brand-sage" />
            </div>
            <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Total Circulation</p>
            <p className="text-2xl font-display font-semibold tracking-tight mt-1">2,022</p>
            <p className="text-[11px] text-brand-sage mt-1.5">+8.2% from last month</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-5 pb-5">
            <div className="flex items-center justify-between mb-3">
              <div className="w-10 h-10 rounded-xl bg-brand-copper/10 flex items-center justify-center">
                <Users className="w-5 h-5 text-brand-copper" />
              </div>
              <TrendingUp className="w-4 h-4 text-brand-sage" />
            </div>
            <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Active Members</p>
            <p className="text-2xl font-display font-semibold tracking-tight mt-1">342</p>
            <p className="text-[11px] text-brand-sage mt-1.5">+2.1% from last month</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-5 pb-5">
            <div className="flex items-center justify-between mb-3">
              <div className="w-10 h-10 rounded-xl bg-brand-amber/10 flex items-center justify-center">
                <Clock className="w-5 h-5 text-brand-amber" />
              </div>
              <TrendingUp className="w-4 h-4 text-brand-brick rotate-180" />
            </div>
            <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Avg. Loan Duration</p>
            <p className="text-2xl font-display font-semibold tracking-tight mt-1">9.4d</p>
            <p className="text-[11px] text-brand-amber mt-1.5">-1.2d from last month</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-5 pb-5">
            <div className="flex items-center justify-between mb-3">
              <div className="w-10 h-10 rounded-xl bg-brand-sage/10 flex items-center justify-center">
                <DollarSign className="w-5 h-5 text-brand-sage" />
              </div>
              <TrendingUp className="w-4 h-4 text-brand-sage" />
            </div>
            <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Fines Collected</p>
            <p className="text-2xl font-display font-semibold tracking-tight mt-1">$142</p>
            <p className="text-[11px] text-brand-sage mt-1.5">+5.3% from last month</p>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="circulation" className="space-y-6">
        <TabsList>
          <TabsTrigger value="circulation">Circulation</TabsTrigger>
          <TabsTrigger value="collection">Collection</TabsTrigger>
          <TabsTrigger value="members">Members</TabsTrigger>
          <TabsTrigger value="shelves">Shelves</TabsTrigger>
        </TabsList>

        {/* Circulation Tab */}
        <TabsContent value="circulation" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <Card className="lg:col-span-2">
              <CardHeader className="pb-3">
                <CardTitle className="text-base font-display">Circulation Trends</CardTitle>
                <CardDescription className="text-xs">Check-outs and returns over the last 7 months</CardDescription>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <LineChart data={circulationData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#E2DFD9" />
                    <XAxis dataKey="month" tick={{ fontSize: 12, fill: '#7C8594' }} />
                    <YAxis tick={{ fontSize: 12, fill: '#7C8594' }} />
                    <Tooltip contentStyle={{ borderRadius: '12px', border: '1px solid #E2DFD9', fontSize: '13px' }} />
                    <Legend wrapperStyle={{ fontSize: '12px' }} />
                    <Line type="monotone" dataKey="checkouts" stroke="#1B2A4A" strokeWidth={2} dot={{ r: 3 }} />
                    <Line type="monotone" dataKey="returns" stroke="#C4956A" strokeWidth={2} dot={{ r: 3 }} />
                  </LineChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="flex items-center gap-2 text-base font-display">
                  <Award className="w-4 h-4 text-brand-amber" />
                  Top Books
                </CardTitle>
                <CardDescription className="text-xs">Most borrowed this month</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {topBooks.slice(0, 5).map((book, index) => (
                    <div key={index} className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-2.5">
                          <span className="flex items-center justify-center w-6 h-6 rounded-lg bg-brand-navy/8 text-brand-navy text-[11px] font-semibold">
                            {index + 1}
                          </span>
                          <div>
                            <p className="text-[13px] font-medium">{book.title}</p>
                            <p className="text-[11px] text-muted-foreground">{book.author}</p>
                          </div>
                        </div>
                      </div>
                      <div className="text-right ml-3">
                        <p className="text-[13px] font-semibold text-brand-copper">{book.borrows}</p>
                        <p className="text-[10px] text-muted-foreground">borrows</p>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Card>
              <CardContent className="pt-5 pb-5">
                <div className="flex items-center justify-between mb-2">
                  <div className="w-8 h-8 rounded-lg bg-brand-navy/8 flex items-center justify-center">
                    <Calendar className="w-4 h-4 text-brand-navy" />
                  </div>
                </div>
                <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Due This Week</p>
                <p className="text-xl font-display font-semibold tracking-tight mt-1">47 books</p>
                <p className="text-[11px] text-muted-foreground mt-1">Across 28 members</p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-5 pb-5">
                <div className="flex items-center justify-between mb-2">
                  <div className="w-8 h-8 rounded-lg bg-brand-amber/10 flex items-center justify-center">
                    <Clock className="w-4 h-4 text-brand-amber" />
                  </div>
                </div>
                <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Currently Overdue</p>
                <p className="text-xl font-display font-semibold tracking-tight mt-1">8 books</p>
                <p className="text-[11px] text-brand-amber mt-1">Avg. 4.2 days overdue</p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-5 pb-5">
                <div className="flex items-center justify-between mb-2">
                  <div className="w-8 h-8 rounded-lg bg-brand-sage/10 flex items-center justify-center">
                    <TrendingUp className="w-4 h-4 text-brand-sage" />
                  </div>
                </div>
                <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Return Rate</p>
                <p className="text-xl font-display font-semibold tracking-tight mt-1">97.2%</p>
                <p className="text-[11px] text-brand-sage mt-1">+0.8% from last month</p>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Collection Tab */}
        <TabsContent value="collection" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-base font-display">Collection by Category</CardTitle>
                <CardDescription className="text-xs">Distribution of books across categories</CardDescription>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <PieChart>
                    <Pie
                      data={categoryData}
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      label={({ payload, percent }: { payload?: { category?: string }; percent?: number }) => `${payload?.category ?? ""} ${((percent ?? 0) * 100).toFixed(0)}%`}
                      outerRadius={80}
                      fill="#8884d8"
                      dataKey="count"
                    >
                      {categoryData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip contentStyle={{ borderRadius: '12px', border: '1px solid #E2DFD9', fontSize: '13px' }} />
                  </PieChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-base font-display">Category Performance</CardTitle>
                <CardDescription className="text-xs">Books by category and circulation</CardDescription>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={categoryData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#E2DFD9" />
                    <XAxis dataKey="category" angle={-45} textAnchor="end" height={80} tick={{ fontSize: 11, fill: '#7C8594' }} />
                    <YAxis tick={{ fontSize: 12, fill: '#7C8594' }} />
                    <Tooltip contentStyle={{ borderRadius: '12px', border: '1px solid #E2DFD9', fontSize: '13px' }} />
                    <Bar dataKey="count" fill="#1B2A4A" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Card>
              <CardContent className="pt-5 pb-5">
                <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Total Titles</p>
                <p className="text-2xl font-display font-semibold tracking-tight mt-1">2,847</p>
                <p className="text-[11px] text-muted-foreground mt-1">Across 6 main categories</p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-5 pb-5">
                <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">New Acquisitions</p>
                <p className="text-2xl font-display font-semibold tracking-tight mt-1">24</p>
                <p className="text-[11px] text-brand-copper mt-1">This month via AI ingestion</p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-5 pb-5">
                <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Most Popular Genre</p>
                <p className="text-2xl font-display font-semibold tracking-tight mt-1">Fiction</p>
                <p className="text-[11px] text-muted-foreground mt-1">847 books, 34% borrows</p>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Members Tab */}
        <TabsContent value="members" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-base font-display">Member Growth</CardTitle>
                <CardDescription className="text-xs">New member registrations over time</CardDescription>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <LineChart data={memberGrowthData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#E2DFD9" />
                    <XAxis dataKey="month" tick={{ fontSize: 12, fill: '#7C8594' }} />
                    <YAxis tick={{ fontSize: 12, fill: '#7C8594' }} />
                    <Tooltip contentStyle={{ borderRadius: '12px', border: '1px solid #E2DFD9', fontSize: '13px' }} />
                    <Line type="monotone" dataKey="members" stroke="#C4956A" strokeWidth={2} dot={{ r: 3 }} />
                  </LineChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-base font-display">Member Activity</CardTitle>
                <CardDescription className="text-xs">Engagement and borrowing patterns</CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="p-4 bg-brand-navy/5 rounded-xl">
                  <div className="flex items-center justify-between mb-2">
                    <p className="text-[13px] font-medium">Active Borrowers</p>
                    <Users className="w-4 h-4 text-brand-navy" />
                  </div>
                  <p className="text-xl font-display font-semibold">237</p>
                  <p className="text-[11px] text-muted-foreground mt-0.5">69% of total members</p>
                </div>
                <div className="p-4 bg-brand-sage/5 rounded-xl">
                  <div className="flex items-center justify-between mb-2">
                    <p className="text-[13px] font-medium">Avg. Books per Member</p>
                    <BookOpen className="w-4 h-4 text-brand-sage" />
                  </div>
                  <p className="text-xl font-display font-semibold">8.3</p>
                  <p className="text-[11px] text-muted-foreground mt-0.5">Per year</p>
                </div>
                <div className="p-4 bg-brand-copper/5 rounded-xl">
                  <div className="flex items-center justify-between mb-2">
                    <p className="text-[13px] font-medium">Most Active Member</p>
                    <Award className="w-4 h-4 text-brand-copper" />
                  </div>
                  <p className="text-[15px] font-display font-semibold">Emily Davis</p>
                  <p className="text-[11px] text-muted-foreground mt-0.5">65 books borrowed this year</p>
                </div>
              </CardContent>
            </Card>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <Card>
              <CardContent className="pt-5 pb-5">
                <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">New This Month</p>
                <p className="text-xl font-display font-semibold tracking-tight mt-1">12</p>
                <p className="text-[11px] text-brand-sage mt-1">+20% from last month</p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-5 pb-5">
                <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Renewals Due</p>
                <p className="text-xl font-display font-semibold tracking-tight mt-1">8</p>
                <p className="text-[11px] text-brand-amber mt-1">Expiring this month</p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-5 pb-5">
                <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Suspended Accounts</p>
                <p className="text-xl font-display font-semibold tracking-tight mt-1">3</p>
                <p className="text-[11px] text-brand-brick mt-1">Due to overdue items</p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-5 pb-5">
                <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Member Satisfaction</p>
                <p className="text-xl font-display font-semibold tracking-tight mt-1">4.7/5</p>
                <p className="text-[11px] text-brand-sage mt-1">Based on 89 surveys</p>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Shelves Tab */}
        <TabsContent value="shelves" className="space-y-6">
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base font-display">Shelf Utilization</CardTitle>
              <CardDescription className="text-xs">Capacity and usage across library sections</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-5">
                {shelfUtilization.map((shelf) => (
                  <div key={shelf.section} className="space-y-2">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-[13px] font-medium">{shelf.section}</p>
                        <p className="text-[11px] text-muted-foreground">
                          {shelf.used} / {shelf.capacity} books
                        </p>
                      </div>
                      <div className="flex items-center gap-3">
                        <span className="text-[13px] font-medium">{shelf.percentage}%</span>
                        {shelf.percentage >= 90 && (
                          <span className="text-[10px] text-brand-brick font-medium px-2 py-0.5 bg-brand-brick/8 rounded-full">High</span>
                        )}
                      </div>
                    </div>
                    <div className="w-full bg-secondary rounded-full h-2">
                      <div
                        className={`h-2 rounded-full transition-all ${
                          shelf.percentage >= 90
                            ? "bg-brand-brick"
                            : shelf.percentage >= 75
                            ? "bg-brand-amber"
                            : "bg-brand-sage"
                        }`}
                        style={{ width: `${shelf.percentage}%` }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Card>
              <CardContent className="pt-5 pb-5">
                <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Total Shelf Capacity</p>
                <p className="text-xl font-display font-semibold tracking-tight mt-1">1,000</p>
                <p className="text-[11px] text-muted-foreground mt-1">Across 6 sections</p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-5 pb-5">
                <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Average Utilization</p>
                <p className="text-xl font-display font-semibold tracking-tight mt-1">86%</p>
                <p className="text-[11px] text-brand-amber mt-1">2 sections need attention</p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-5 pb-5">
                <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">AI Recommendations</p>
                <p className="text-xl font-display font-semibold tracking-tight mt-1">4</p>
                <p className="text-[11px] text-brand-copper mt-1">Optimization suggestions</p>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
