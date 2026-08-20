"use client";

import {
  ResponsiveContainer,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
} from "recharts";
import { useTheme } from "@/components/ThemeProvider";

interface DailyRevenue {
  date: string;
  label: string;
  amount: number;
  count: number;
}

interface RevenueChartProps {
  data: DailyRevenue[];
  totalRevenue: number;
}

function formatNaira(amt: number) {
  return new Intl.NumberFormat("en-NG", {
    style: "currency",
    currency: "NGN",
    maximumFractionDigits: 0,
  })
    .format(amt)
    .replace("NGN", "₦");
}

interface CustomTooltipProps {
  active?: boolean;
  payload?: Array<{
    value: number;
    payload: DailyRevenue;
  }>;
}

function CustomTooltip({ active, payload }: CustomTooltipProps) {
  if (active && payload && payload.length) {
    const item = payload[0].payload;
    return (
      <div className="rounded-xl border border-zinc-200 dark:border-[#1e2d47] bg-white/95 dark:bg-[#131f33]/95 p-3.5 backdrop-blur-md shadow-md text-xs">
        <p className="font-semibold text-zinc-400 dark:text-zinc-500">{item.date}</p>
        <p className="mt-1 text-base font-bold text-zinc-900 dark:text-white font-mono">
          {formatNaira(item.amount)}
        </p>
        <p className="mt-0.5 text-[11px] text-zinc-500 dark:text-zinc-400">
          {item.count} {item.count === 1 ? "transaction" : "transactions"}
        </p>
      </div>
    );
  }
  return null;
}

export default function RevenueChart({ data, totalRevenue }: RevenueChartProps) {
  const { resolvedTheme } = useTheme();
  const hasData = data.some((d) => d.amount > 0);
  const isDark = resolvedTheme === "dark";

  return (
    <div className="flex flex-col gap-6 w-full">
      <div className="flex items-center justify-between">
        <div>
          <span className="text-xs font-semibold text-zinc-400 dark:text-zinc-500 uppercase tracking-wider">
            Revenue Performance
          </span>
          <div className="text-2xl font-bold text-zinc-950 dark:text-white tracking-tight mt-1 font-mono">
            {formatNaira(totalRevenue)}
          </div>
        </div>

        <div className="rounded-full border border-zinc-200 dark:border-[#1e2d47] bg-white dark:bg-[#131f33] px-3 py-1 text-xs font-semibold text-zinc-600 dark:text-zinc-400">
          Past 30 Days
        </div>
      </div>

      <div className="h-64 w-full pt-2">
        {!hasData ? (
          <div className="h-full w-full rounded-xl border border-zinc-100 dark:border-[#1e2d47] bg-zinc-50/50 dark:bg-[#0c1524] flex flex-col items-center justify-center text-center p-6 text-zinc-400">
            <span className="text-sm font-semibold text-zinc-600 dark:text-zinc-300">
              No revenue transactions recorded yet
            </span>
            <span className="text-xs text-zinc-400 dark:text-zinc-500 mt-1 max-w-sm">
              Live payments and renewals processed via Paystack will be plotted here in real-time.
            </span>
          </div>
        ) : (
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart
              data={data}
              margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
              <defs>
                <linearGradient id="revenueGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#0F86EE" stopOpacity={isDark ? 0.4 : 0.25} />
                  <stop offset="100%" stopColor="#0F86EE" stopOpacity={0.0} />
                </linearGradient>
              </defs>

              <CartesianGrid
                strokeDasharray="3 3"
                vertical={false}
                stroke={isDark ? "#1e2d47" : "#f4f4f5"}
              />

              <XAxis
                dataKey="label"
                tickLine={false}
                axisLine={false}
                tick={{ fill: isDark ? "#64748b" : "#a1a1aa", fontSize: 11, fontWeight: 500 }}
                interval="preserveStartEnd"
                dy={10}
              />

              <YAxis
                tickLine={false}
                axisLine={false}
                tick={{ fill: isDark ? "#64748b" : "#a1a1aa", fontSize: 11, fontWeight: 500 }}
                tickFormatter={(value) => `₦${value >= 1000 ? `${(value / 1000).toFixed(0)}k` : value}`}
              />

              <Tooltip content={<CustomTooltip />} />

              <Area
                type="monotone"
                dataKey="amount"
                stroke="#0F86EE"
                strokeWidth={2.5}
                fillOpacity={1}
                fill="url(#revenueGradient)"
                activeDot={{
                  r: 5,
                  fill: isDark ? "#111c2e" : "#ffffff",
                  stroke: "#0F86EE",
                  strokeWidth: 2.5,
                }}
              />
            </AreaChart>
          </ResponsiveContainer>
        )}
      </div>
    </div>
  );
}
