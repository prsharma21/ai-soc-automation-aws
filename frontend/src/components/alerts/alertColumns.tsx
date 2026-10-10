import { Link } from "react-router-dom";
import type { SecurityAlert } from "@/types";
import type { DataTableColumn } from "@/components/common/DataTable";
import { SeverityBadge } from "@/components/common/SeverityBadge";
import { StatusBadge } from "@/components/common/StatusBadge";
import { Timestamp } from "@/components/common/Timestamp";
import { categoryLabels } from "@/lib/labels";

export const alertColumns: DataTableColumn<SecurityAlert>[] = [
  {
    id: "id",
    header: "Alert",
    sortKey: "id",
    cell: (alert) => (
      <Link
        to={`/alerts/${alert.id}`}
        onClick={(event) => event.stopPropagation()}
        className="font-mono text-xs font-semibold text-primary hover:underline"
      >
        {alert.id}
      </Link>
    ),
  },
  {
    id: "title",
    header: "Title",
    cell: (alert) => (
      <div className="min-w-[14rem] max-w-md">
        <p className="truncate font-medium">{alert.title}</p>
        <p className="truncate text-2xs text-muted-foreground">{categoryLabels[alert.category]} · {alert.source}</p>
      </div>
    ),
  },
  { id: "severity", header: "Severity", sortKey: "severity", cell: (alert) => <SeverityBadge severity={alert.severity} /> },
  { id: "status", header: "Status", sortKey: "status", cell: (alert) => <StatusBadge kind="alert" value={alert.status} /> },
  {
    id: "entity",
    header: "Affected entity",
    cell: (alert) => <span className="block max-w-[12rem] truncate text-xs">{alert.affectedEntity}</span>,
  },
  { id: "sourceIp", header: "Source IP", cell: (alert) => <span className="font-mono text-xs">{alert.sourceIp}</span> },
  {
    id: "detectedAt",
    header: "Detected",
    sortKey: "detectedAt",
    cell: (alert) => <Timestamp value={alert.detectedAt} className="text-xs" />,
  },
];
