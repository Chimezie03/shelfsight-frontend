import { Card, CardContent } from "@/components/ui/card";
import { BookOpen, AlertCircle, CheckCircle, DollarSign } from "lucide-react";

interface CirculationStatsProps {
  activeLoansCount: number;
  overdueCount: number;
  returnsTodayCount: number;
  totalOutstandingFines: number;
}

export function CirculationStats({
  activeLoansCount,
  overdueCount,
  returnsTodayCount,
  totalOutstandingFines,
}: CirculationStatsProps) {
  const stats = [
    {
      label: "Active Loans",
      value: activeLoansCount,
      icon: BookOpen,
      bg: "bg-brand-navy/8",
      text: "text-brand-navy",
    },
    {
      label: "Overdue Items",
      value: overdueCount,
      icon: AlertCircle,
      bg: "bg-brand-brick/10",
      text: "text-brand-brick",
    },
    {
      label: "Returns Today",
      value: returnsTodayCount,
      icon: CheckCircle,
      bg: "bg-brand-sage/10",
      text: "text-brand-sage",
    },
    {
      label: "Outstanding Fines",
      value: `$${totalOutstandingFines.toFixed(2)}`,
      icon: DollarSign,
      bg: "bg-brand-amber/10",
      text: "text-brand-amber",
    },
  ];

  return (
    <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
      {stats.map((stat) => (
        <Card key={stat.label}>
          <CardContent className="pt-5 pb-5">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                  {stat.label}
                </p>
                <p className="text-2xl font-display font-semibold tracking-tight mt-1">
                  {stat.value}
                </p>
              </div>
              <div
                className={`w-10 h-10 rounded-xl ${stat.bg} flex items-center justify-center`}
              >
                <stat.icon className={`w-5 h-5 ${stat.text}`} />
              </div>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
