import { Bar, BarChart, CartesianGrid, Cell, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import type { IncidentStatus, IncidentStatusCount } from "@/types";
import { incidentStatusLabels } from "@/lib/labels";
import { ChartCard, chartAxisProps, chartTooltipStyle } from "./ChartCard";

const statusColor: Record<IncidentStatus, string> = {
  open: "hsl(var(--severity-critical))",
  investigating: "hsl(243 75% 59%)",
  contained: "hsl(var(--severity-medium))",
  resolved: "hsl(var(--success))",
  closed: "hsl(215 16% 60%)",
};

export function IncidentStatusChart({ data }: { data: IncidentStatusCount[] }) {
  const rows = data.map((item) => ({ ...item, name: incidentStatusLabels[item.status] }));
  const total = data.reduce((sum, item) => sum + item.count, 0);
  const summary = `Incident status: ${rows.map((row) => `${row.name} ${row.count}`).join(", ")}.`;

  return (
    <ChartCard title="Incident status" summary={summary} isEmpty={total === 0}>
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={rows} margin={{ top: 8, right: 8, bottom: 0, left: -18 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" vertical={false} />
          <XAxis dataKey="name" {...chartAxisProps} />
          <YAxis allowDecimals={false} {...chartAxisProps} />
          <Tooltip {...chartTooltipStyle} cursor={{ fill: "hsl(var(--muted))" }} />
          <Bar dataKey="count" name="Incidents" radius={[4, 4, 0, 0]} isAnimationActive={false}>
            {rows.map((row) => (
              <Cell key={row.status} fill={statusColor[row.status]} />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </ChartCard>
  );
}
