import { Area, AreaChart, CartesianGrid, Legend, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import type { AlertVolumePoint } from "@/types";
import { severityLabels, severityOrder } from "@/lib/labels";
import { severityChartColor } from "@/lib/severity";
import { ChartCard, chartAxisProps, chartTooltipStyle } from "./ChartCard";

export function AlertVolumeChart({ data, description }: { data: AlertVolumePoint[]; description?: string }) {
  const total = data.reduce((sum, point) => sum + severityOrder.reduce((acc, key) => acc + point[key], 0), 0);
  const summary = `Alert volume over ${data.length} days, ${total} alerts in total. ${data
    .map((point) => `${point.date}: ${severityOrder.reduce((acc, key) => acc + point[key], 0)}`)
    .join("; ")}.`;

  return (
    <ChartCard title="Alert volume over time" description={description} summary={summary} isEmpty={total === 0} className="xl:col-span-2">
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart data={data} margin={{ top: 8, right: 8, bottom: 0, left: -18 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" vertical={false} />
          <XAxis dataKey="date" {...chartAxisProps} interval="preserveStartEnd" minTickGap={16} />
          <YAxis allowDecimals={false} {...chartAxisProps} />
          <Tooltip {...chartTooltipStyle} />
          <Legend iconType="circle" iconSize={8} wrapperStyle={{ fontSize: 11 }} />
          {[...severityOrder].reverse().map((severity) => (
            <Area
              key={severity}
              type="monotone"
              dataKey={severity}
              name={severityLabels[severity]}
              stackId="severity"
              stroke={severityChartColor[severity]}
              fill={severityChartColor[severity]}
              fillOpacity={0.25}
              isAnimationActive={false}
            />
          ))}
        </AreaChart>
      </ResponsiveContainer>
    </ChartCard>
  );
}
