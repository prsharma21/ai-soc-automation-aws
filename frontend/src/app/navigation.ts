import {
  BookOpen,
  BrainCircuit,
  ClipboardCheck,
  FolderKanban,
  Gauge,
  LayoutDashboard,
  Radar,
  ScrollText,
  Settings,
  ShieldAlert,
  type LucideIcon,
} from "lucide-react";

export interface NavItem {
  label: string;
  path: string;
  icon: LucideIcon;
}

export interface NavGroup {
  label: string;
  items: NavItem[];
}

export const navGroups: NavGroup[] = [
  {
    label: "Operations",
    items: [
      { label: "SOC Overview", path: "/dashboard", icon: LayoutDashboard },
      { label: "Security Alerts", path: "/alerts", icon: ShieldAlert },
      { label: "Incident Management", path: "/incidents", icon: FolderKanban },
      { label: "AI Investigations", path: "/investigations", icon: BrainCircuit },
    ],
  },
  {
    label: "Intelligence & Response",
    items: [
      { label: "Threat Intelligence", path: "/threat-intelligence", icon: Radar },
      { label: "Response Approvals", path: "/approvals", icon: ClipboardCheck },
      { label: "Playbooks & Knowledge", path: "/playbooks", icon: BookOpen },
    ],
  },
  {
    label: "Governance",
    items: [
      { label: "Evaluation & Metrics", path: "/evaluations", icon: Gauge },
      { label: "Audit Logs", path: "/audit-logs", icon: ScrollText },
      { label: "Settings", path: "/settings", icon: Settings },
    ],
  },
];

export const navItems: NavItem[] = navGroups.flatMap((group) => group.items);
