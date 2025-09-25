"use client";

import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ReferenceLine,
  Cell,
} from "recharts";

type Point = {
  price: number;
  usd: number;
  tickIdx: number;
  active?: boolean;
};

export function LiquidityHistogram({ data }: { data: Point[] }) {
  const maxUsd = Math.max(0, ...data.map((d) => d.usd || 0));

  return (
    <div className="border border-border/50 rounded-md p-3 bg-secondary/5">
      <div className="h-56 w-full">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart
            data={data}
            margin={{ top: 8, right: 16, bottom: 8, left: 8 }}
          >
            <XAxis
              dataKey="price"
              tick={{ fontSize: 10, fill: "hsl(var(--muted-foreground))" }}
              tickFormatter={(v: number) =>
                `$${Number(v).toLocaleString(undefined, { maximumFractionDigits: 0 })}`
              }
              axisLine={{ stroke: "hsl(var(--border))" }}
              tickLine={{ stroke: "hsl(var(--border))" }}
            />
            <YAxis
              tick={{ fontSize: 10, fill: "hsl(var(--muted-foreground))" }}
              tickFormatter={(v: number) =>
                `$${Number(v).toLocaleString(undefined, { notation: "compact" })}`
              }
              width={48}
              axisLine={{ stroke: "hsl(var(--border))" }}
              tickLine={{ stroke: "hsl(var(--border))" }}
              domain={[0, maxUsd]}
            />
            <Tooltip
              contentStyle={{
                background: "hsl(var(--popover))",
                border: `1px solid hsl(var(--border))`,
                borderRadius: 6,
              }}
              labelStyle={{ color: "hsl(var(--foreground))" }}
              formatter={(value: any, name: any, props: any) => {
                if (name === "usd") {
                  return [
                    `$${Number(value).toLocaleString(undefined, { maximumFractionDigits: 0 })}`,
                    "USD Liquidity",
                  ];
                }
                return value;
              }}
              labelFormatter={(label: any) =>
                `Price: $${Number(label).toLocaleString(undefined, { maximumFractionDigits: 2 })}`
              }
            />
            <ReferenceLine y={0} stroke="hsl(var(--border))" />
            <Bar dataKey="usd" radius={[2, 2, 0, 0]} isAnimationActive={false}>
              {data.map((entry, index) => (
                <Cell
                  key={`cell-${index}`}
                  fill={
                    entry.active
                      ? "hsl(48 96% 53% / 0.9)"
                      : "hsl(var(--primary) / 0.7)"
                  }
                />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
