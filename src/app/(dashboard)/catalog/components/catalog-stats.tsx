"use client";

import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { BookOpen } from "lucide-react";
import type { CatalogCopyStats } from "@/types/book";

interface CatalogStatsProps {
  isLoading: boolean;
  /** Server-reported total books (all matching the current filter). */
  total: number;
  /** Server-reported copy aggregates across all matching books. */
  copyStats: CatalogCopyStats | null;
}

export function CatalogStats({ isLoading, total, copyStats }: CatalogStatsProps) {
  const stats = [
    {
      label: "Total Books",
      value: total,
      icon: <BookOpen className="w-5 h-5 text-brand-navy" />,
      iconBg: "bg-brand-navy/8",
    },
    {
      label: "Available",
      value: copyStats?.available ?? 0,
      icon: <div className="w-3 h-3 bg-brand-sage rounded-full" />,
      iconBg: "bg-brand-sage/10",
    },
    {
      label: "Checked Out",
      value: copyStats?.checkedOut ?? 0,
      icon: <div className="w-3 h-3 bg-brand-amber rounded-full" />,
      iconBg: "bg-brand-amber/10",
    },
    {
      label: "Total Copies",
      value: copyStats?.totalCopies ?? 0,
      icon: <BookOpen className="w-4 h-4 text-brand-copper" />,
      iconBg: "bg-brand-copper/10",
    },
  ];

  return (
    <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
      {stats.map((stat) => (
        <Card key={stat.label}>
          <CardContent className="pt-5 pb-5">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                  {stat.label}
                </p>
                {isLoading ? (
                  <Skeleton className="h-8 w-16 mt-1" />
                ) : (
                  <p className="text-2xl font-display font-semibold tracking-tight mt-1">
                    {stat.value}
                  </p>
                )}
              </div>
              <div
                className={`w-10 h-10 rounded-xl ${stat.iconBg} flex items-center justify-center`}
              >
                {stat.icon}
              </div>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
