import type { ReactNode } from "react";
import { SectionCard } from "@/components/common/SectionCard";
import { EmptyState } from "@/components/common/EmptyState";
import { BarChart3 } from "lucide-react";

interface ChartCardProps {
  title: string;
  description?: string;
  /** Text alternative read by screen readers instead of the SVG. */
  summary: string;
  isEmpty?: boolean;
  actions?: ReactNode;
  children: ReactNode;
  className?: string;
}

export function ChartCard({ title, description, summary, isEmpty = false, actions, children, className }: ChartCardProps) {
  return (
    <SectionCard title={title} description={description} actions={actions} className={className}>
      {isEmpty ? (
        <EmptyState icon={BarChart3} title="No data for this chart" bordered={false} className="py-8" />
      ) : (
        <figure className="m-0">
          <div className="h-56 w-full" aria-hidden="true">
            {children}
          </div>
          <figcaption className="sr-only">{summary}</figcaption>
        </figure>
      )}
    </SectionCard>
  );
}

export const chartAxisProps = {
  tick: { fontSize: 11, fill: "hsl(var(--muted-foreground))" },
  tickLine: false,
  axisLine: { stroke: "hsl(var(--border))" },
} as const;

export const chartTooltipStyle = {
  contentStyle: {
    borderRadius: 6,
    border: "1px solid hsl(var(--border))",
    fontSize: 12,
    boxShadow: "0 2px 8px rgb(0 0 0 / 0.08)",
  },
} as const;
