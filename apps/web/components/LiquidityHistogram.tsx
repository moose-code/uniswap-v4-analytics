"use client";

import { useMemo, useState } from "react";
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
  amount0?: number;
  amount1?: number;
  usd0?: number;
  usd1?: number;
};

interface LiquidityHistogramProps {
  data: Point[];
  tickRange?: number;
  onTickRangeChange?: (range: number) => void;
  token0Symbol?: string;
  token1Symbol?: string;
}

export function LiquidityHistogram({
  data,
  tickRange = 60,
  onTickRangeChange,
  token0Symbol = "Token0",
  token1Symbol = "Token1",
}: LiquidityHistogramProps) {
  const [showTicks, setShowTicks] = useState(false);
  const maxUsd = Math.max(0, ...data.map((d) => d.usd || 0));

  // Transform data for consistent bar widths
  const chartData = useMemo(
    () =>
      data.map((d) => ({
        ...d,
        // Always use total USD for bar height to maintain consistent widths
        totalUsd: d.usd,
        // Track components for tooltip and coloring
        usd0Component: d.active ? (d.usd0 ?? 0) : 0,
        usd1Component: d.active ? (d.usd1 ?? 0) : 0,
      })),
    [data]
  );

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
                <option value={2000}>2000</option>
                <option value={5000}>5000</option>
              </select>
            </div>
          </div>
        )}
      </div>

      {/* Legend */}
      <div className="flex items-center justify-center gap-6 mb-3 text-xs">
        <div className="flex items-center gap-2">
          <div
            className="w-3 h-3 rounded"
            style={{ backgroundColor: "hsl(15 75% 65% / 0.7)" }}
          ></div>
          <span className="text-muted-foreground">
            {token0Symbol} Liquidity
          </span>
        </div>
        <div className="flex items-center gap-2">
          <div
            className="w-3 h-3 rounded border-2 border-foreground"
            style={{
              background:
                "linear-gradient(to bottom, hsl(15 75% 65% / 0.8) 50%, hsl(217 70% 70% / 0.8) 50%)",
            }}
          ></div>
          <span className="text-muted-foreground">
            <strong>Active Tick</strong> (Mixed Liquidity)
          </span>
        </div>
        <div className="flex items-center gap-2">
          <div
            className="w-3 h-3 rounded"
            style={{ backgroundColor: "hsl(217 70% 70% / 0.7)" }}
          ></div>
          <span className="text-muted-foreground">
            {token1Symbol} Liquidity
          </span>
        </div>
      </div>

      <div className="h-56 w-full">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart
            data={chartData}
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
                whiteSpace: "pre-line",
                lineHeight: 1.2,
              }}
              labelStyle={{ color: "hsl(var(--foreground))" }}
              formatter={(value: any, name: any, props: any) => {
                if (name !== "totalUsd" || !props || !props.payload)
                  return value;
                const entry = props.payload;
                const activeEntry = data.find((d) => d.active);
                const activeTickIdx = activeEntry?.tickIdx;

                const formatAmt = (amt?: number) =>
                  amt != null
                    ? Number(amt).toLocaleString(undefined, {
                        maximumFractionDigits: 6,
                      })
                    : "-";

                const usdStr = `$${Number(value).toLocaleString(undefined, { maximumFractionDigits: 0 })}`;

                // Handle active tick with breakdown
                if (entry.active) {
                  const part0 = `${formatAmt(entry.amount0)} ${token0Symbol}`;
                  const part1 = `${formatAmt(entry.amount1)} ${token1Symbol}`;
                  const mixedValue = `${usdStr}\n(${part0} • ${part1})`;
                  return [mixedValue, "Mixed Liquidity (Active Tick)"];
                }

                // Below active tick = token1; Above active = token0 (per mapping used for colors)
                let sideLabel = `${token1Symbol} Liquidity`;
                let sideDetail = `(${formatAmt(entry.amount1)} ${token1Symbol})`;
                if (
                  activeTickIdx !== undefined &&
                  entry.tickIdx > activeTickIdx
                ) {
                  sideLabel = `${token0Symbol} Liquidity`;
                  sideDetail = `(${formatAmt(entry.amount0)} ${token0Symbol})`;
                }

                return [`${usdStr} ${sideDetail}`, sideLabel];
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

            {/* Single bar component with custom rendering */}
            <Bar
              dataKey="totalUsd"
              radius={[2, 2, 0, 0]}
              isAnimationActive={false}
            >
              {chartData.map((entry, index) => {
                // Find the active tick to determine position relative to it
                const activeEntry = data.find((d) => d.active);
                const activeTickIdx = activeEntry?.tickIdx;

                if (entry.active) {
                  // For active tick, use gradient with subtle black outline
                  return (
                    <Cell
                      key={`cell-${index}`}
                      fill="url(#activeGradient)"
                      stroke="hsl(var(--foreground))"
                      strokeWidth={0.5}
                    />
                  );
                } else {
                  // Regular coloring for non-active ticks
                  let fillColor;
                  if (activeTickIdx !== undefined) {
                    if (entry.tickIdx > activeTickIdx) {
                      // Above active tick - Token0
                      fillColor = "hsl(15 75% 65% / 0.7)";
                    } else {
                      // Below active tick - Token1
                      fillColor = "hsl(217 70% 70% / 0.7)";
                    }
                  } else {
                    // Fallback
                    fillColor = "hsl(var(--primary) / 0.7)";
                  }
                  return <Cell key={`cell-${index}`} fill={fillColor} />;
                }
              })}
            </Bar>

            {/* Define gradient for active tick */}
            <defs>
              <linearGradient id="activeGradient" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="hsl(15 75% 65% / 0.8)" />
                <stop
                  offset={`${
                    chartData.find((d) => d.active)
                      ? (chartData.find((d) => d.active)!.usd0Component /
                          chartData.find((d) => d.active)!.totalUsd) *
                        100
                      : 50
                  }%`}
                  stopColor="hsl(15 75% 65% / 0.8)"
                />
                <stop
                  offset={`${
                    chartData.find((d) => d.active)
                      ? (chartData.find((d) => d.active)!.usd0Component /
                          chartData.find((d) => d.active)!.totalUsd) *
                        100
                      : 50
                  }%`}
                  stopColor="hsl(217 70% 70% / 0.8)"
                />
                <stop offset="100%" stopColor="hsl(217 70% 70% / 0.8)" />
              </linearGradient>
            </defs>
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
