import { Cell, Legend, Pie, PieChart, ResponsiveContainer, Tooltip } from "recharts";
import type { CountBySeverity } from "@/types";
import { severityLabels } from "@/lib/labels";
import { severityChartColor } from "@/lib/severity";
import { ChartCard, chartTooltipStyle } from "./ChartCard";

export function SeverityDistributionChart({ data }: { data: CountBySeverity[] }) {
  const rows = data.map((item) => ({ ...item, name: severityLabels[item.severity] }));
  const total = data.reduce((sum, item) => sum + item.count, 0);
  const summary = `Severity distribution: ${rows.map((row) => `${row.name} ${row.count}`).join(", ")}.`;

  return (
    <ChartCard title="Severity distribution" summary={summary} isEmpty={total === 0}>
      <ResponsiveContainer width="100%" height="100%">
        <PieChart>
          <Pie data={rows} dataKey="count" nameKey="name" innerRadius="52%" outerRadius="80%" paddingAngle={2} isAnimationActive={false}>
            {rows.map((row) => (
              <Cell key={row.severity} fill={severityChartColor[row.severity]} />
            ))}
          </Pie>
          <Tooltip {...chartTooltipStyle} />
          <Legend iconType="circle" iconSize={8} wrapperStyle={{ fontSize: 11 }} />
        </PieChart>
      </ResponsiveContainer>
    </ChartCard>
  );
}
