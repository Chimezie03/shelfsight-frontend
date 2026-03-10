"use client";

import { useEffect, useRef, useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { TrendingUp, TrendingDown, Minus } from "lucide-react";
import { motion } from "motion/react";
import {
  AreaChart,
  Area,
  ResponsiveContainer,
} from "recharts";
import { ACCENT_HEX_MAP } from "../constants";

interface KpiCardProps {
  label: string;
  value: string;
  numericValue: number;
  change: number;
  changeLabel: string;
  trend: "up" | "down" | "flat";
  sparklineData: number[];
  icon: React.ReactNode;
  accentColor: string;
  isLoading?: boolean;
  index?: number;
}

function useAnimatedNumber(target: number, duration = 800, enabled = true): number {
  const [current, setCurrent] = useState(0);
  const rafRef = useRef<number>(0);

  useEffect(() => {
    if (!enabled) {
      rafRef.current = requestAnimationFrame(() => setCurrent(target));
      return () => cancelAnimationFrame(rafRef.current);
    }
    const start = performance.now();
    const from = 0;

    function tick(now: number) {
      const elapsed = now - start;
      const progress = Math.min(elapsed / duration, 1);
      const eased = 1 - Math.pow(1 - progress, 3);
      setCurrent(from + (target - from) * eased);
      if (progress < 1) {
        rafRef.current = requestAnimationFrame(tick);
      }
    }

    rafRef.current = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(rafRef.current);
  }, [target, duration, enabled]);

  return current;
}

function formatAnimatedValue(template: string, animated: number): string {
  // template examples: "2,022", "$142", "9.4d", "342"
  const hasPrefix = template.startsWith("$");
  const hasSuffix = template.endsWith("d") || template.endsWith("%");
  const suffix = hasSuffix ? template.slice(-1) : "";
  const prefix = hasPrefix ? "$" : "";
  const isDecimal = template.replace(/[$,d%]/g, "").includes(".");

  if (isDecimal) {
    return `${prefix}${animated.toFixed(1)}${suffix}`;
  }
  return `${prefix}${Math.round(animated).toLocaleString()}${suffix}`;
}

export function KpiCard({
  label,
  value,
  numericValue,
  change,
  changeLabel,
  trend,
  sparklineData,
  icon,
  accentColor,
  isLoading = false,
  index = 0,
}: KpiCardProps) {
  const animatedNum = useAnimatedNumber(numericValue, 800, !isLoading);
  const hex = ACCENT_HEX_MAP[accentColor] || ACCENT_HEX_MAP.navy;
  const sparkData = sparklineData.map((v, i) => ({ v, i }));

  if (isLoading) {
    return (
      <Card>
        <CardContent className="pt-5 pb-5">
          <div className="flex items-center justify-between mb-3">
            <Skeleton className="w-10 h-10 rounded-xl" />
            <Skeleton className="w-20 h-8 rounded" />
          </div>
          <Skeleton className="h-3 w-24 mb-2" />
          <Skeleton className="h-7 w-16 mb-1.5" />
          <Skeleton className="h-3 w-28" />
        </CardContent>
      </Card>
    );
  }

  const TrendIcon = trend === "up" ? TrendingUp : trend === "down" ? TrendingDown : Minus;
  const trendColorClass =
    trend === "up"
      ? "text-brand-sage"
      : trend === "down"
      ? "text-brand-brick"
      : "text-brand-warm-gray";

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35, delay: index * 0.08, ease: "easeOut" }}
    >
      <Card className="overflow-hidden">
        <CardContent className="pt-5 pb-5">
          <div className="flex items-center justify-between mb-3">
            <div
              className="w-10 h-10 rounded-xl flex items-center justify-center"
              style={{ backgroundColor: `${hex}12` }}
            >
              {icon}
            </div>
            <div className="w-20 h-8">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={sparkData}>
                  <defs>
                    <linearGradient id={`spark-${accentColor}-${index}`} x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor={hex} stopOpacity={0.2} />
                      <stop offset="100%" stopColor={hex} stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <Area
                    type="monotone"
                    dataKey="v"
                    stroke={hex}
                    strokeWidth={1.5}
                    fill={`url(#spark-${accentColor}-${index})`}
                    dot={false}
                    isAnimationActive={false}
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>
          <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
            {label}
          </p>
          <p className="text-2xl font-display font-semibold tracking-tight mt-1">
            {formatAnimatedValue(value, animatedNum)}
          </p>
          <div className="flex items-center gap-1 mt-1.5">
            <TrendIcon className={`w-3.5 h-3.5 ${trendColorClass}`} />
            <p className={`text-[11px] ${trendColorClass}`}>
              {change >= 0 ? "+" : ""}
              {change}% {changeLabel}
            </p>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
}
