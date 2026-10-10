import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import type { CategoryCount } from "@/types";
import { categoryLabels } from "@/lib/labels";
import { ChartCard, chartAxisProps, chartTooltipStyle } from "./ChartCard";

export function CategoryChart({ data }: { data: CategoryCount[] }) {
  const rows = data.map((item) => ({ ...item, name: categoryLabels[item.category] }));
  const summary = `Alert categories: ${rows.map((row) => `${row.name} ${row.count}`).join(", ")}.`;

  return (
    <ChartCard title="Alert categories" summary={summary} isEmpty={rows.length === 0}>
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={rows} layout="vertical" margin={{ top: 4, right: 12, bottom: 0, left: 8 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" horizontal={false} />
          <XAxis type="number" allowDecimals={false} {...chartAxisProps} />
          <YAxis type="category" dataKey="name" width={110} {...chartAxisProps} />
          <Tooltip {...chartTooltipStyle} cursor={{ fill: "hsl(var(--muted))" }} />
          <Bar dataKey="count" name="Alerts" fill="hsl(var(--primary))" radius={[0, 4, 4, 0]} isAnimationActive={false} />
        </BarChart>
      </ResponsiveContainer>
    </ChartCard>
  );
}
