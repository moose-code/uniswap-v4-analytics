"use client";

import { useState } from "react";
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

interface LiquidityHistogramProps {
  data: Point[];
  tickRange?: number;
  onTickRangeChange?: (range: number) => void;
}

export function LiquidityHistogram({
  data,
  tickRange = 60,
  onTickRangeChange,
}: LiquidityHistogramProps) {
  const [showTicks, setShowTicks] = useState(false);
  const maxUsd = Math.max(0, ...data.map((d) => d.usd || 0));

  return (
    <div className="border border-border/50 rounded-md p-3 bg-secondary/5">
      {/* Controls */}
      <div className="flex items-center justify-end mb-3">
        {onTickRangeChange && (
          <div className="flex items-center gap-3">
            {/* Price/Ticks Toggle */}
            <div className="flex items-center bg-secondary/20 rounded-md p-0.5">
              <button
                className={`px-2 py-1 text-xs rounded transition-all ${
                  !showTicks
                    ? "bg-background shadow-sm text-foreground"
                    : "text-muted-foreground hover:text-foreground"
                }`}
                onClick={() => setShowTicks(false)}
              >
                Price
              </button>
              <button
                className={`px-2 py-1 text-xs rounded transition-all ${
                  showTicks
                    ? "bg-background shadow-sm text-foreground"
                    : "text-muted-foreground hover:text-foreground"
                }`}
                onClick={() => setShowTicks(true)}
              >
                Ticks
              </button>
            </div>

            {/* Range Selector */}
            <div className="flex items-center gap-2">
              <span className="text-xs text-muted-foreground">Range:</span>
              <select
                className="text-xs bg-background border border-border/50 rounded px-2 py-1"
                value={tickRange}
                onChange={(e) => onTickRangeChange(parseInt(e.target.value))}
              >
                <option value={20}>20</option>
                <option value={40}>40</option>
                <option value={60}>60</option>
                <option value={100}>100</option>
                <option value={200}>200</option>
                <option value={500}>500</option>
                <option value={1000}>1000</option>
              </select>
            </div>
          </div>
        )}
      </div>

      <div className="h-56 w-full">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart
            data={data}
            margin={{ top: 8, right: 16, bottom: 8, left: 8 }}
          >
            <XAxis
              dataKey={showTicks ? "tickIdx" : "price"}
              tick={{ fontSize: 10, fill: "hsl(var(--muted-foreground))" }}
              tickFormatter={(v: number) =>
                showTicks
                  ? v.toString()
                  : Number(v).toLocaleString(undefined, {
                      maximumFractionDigits: 2,
                    })
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
              labelFormatter={(label: any, payload: any) => {
                if (payload && payload[0] && payload[0].payload) {
                  const point = payload[0].payload;
                  return showTicks
                    ? `Tick: ${point.tickIdx} (Price: ${Number(point.price).toLocaleString(undefined, { maximumFractionDigits: 2 })})`
                    : `Price: ${Number(point.price).toLocaleString(undefined, { maximumFractionDigits: 2 })}`;
                }
                return showTicks
                  ? `Tick: ${label}`
                  : `Price: ${Number(label).toLocaleString(undefined, { maximumFractionDigits: 2 })}`;
              }}
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
