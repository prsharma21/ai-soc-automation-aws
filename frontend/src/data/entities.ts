import type { SyntheticAsset, SyntheticUser } from "@/types";

/** Fictional identities. Every address uses the reserved example.test domain. */
export const syntheticUsers: SyntheticUser[] = [
  { id: "USR-001", displayName: "Riley Chen (sim)", email: "riley.chen@corp.example.test", department: "IT Operations", title: "Systems Administrator", usualLocation: "Austin, US", privileged: true },
  { id: "USR-002", displayName: "Taylor Brooks (sim)", email: "taylor.brooks@corp.example.test", department: "Engineering", title: "Software Engineer", usualLocation: "Austin, US", privileged: false },
  { id: "USR-003", displayName: "Jordan Avery (sim)", email: "jordan.avery@corp.example.test", department: "Finance", title: "Finance Director", usualLocation: "Chicago, US", privileged: true },
  { id: "USR-004", displayName: "Casey Morgan (sim)", email: "casey.morgan@corp.example.test", department: "Sales", title: "Account Executive", usualLocation: "Denver, US", privileged: false },
  { id: "USR-005", displayName: "Quinn Patel (sim)", email: "quinn.patel@corp.example.test", department: "Human Resources", title: "HR Partner", usualLocation: "Chicago, US", privileged: false },
  { id: "USR-006", displayName: "Sam Okafor (sim)", email: "sam.okafor@corp.example.test", department: "Finance", title: "Financial Analyst", usualLocation: "Chicago, US", privileged: false },
  { id: "USR-007", displayName: "Drew Kim (sim)", email: "drew.kim@corp.example.test", department: "Engineering", title: "DevOps Engineer", usualLocation: "Seattle, US", privileged: true },
  { id: "USR-008", displayName: "Morgan Silva (sim)", email: "morgan.silva@corp.example.test", department: "Sales", title: "Regional Sales Lead", usualLocation: "Miami, US", privileged: false },
  { id: "USR-009", displayName: "Avery Novak (sim)", email: "avery.novak@corp.example.test", department: "Legal", title: "Counsel", usualLocation: "New York, US", privileged: false },
  { id: "USR-010", displayName: "Jamie Ruiz (sim)", email: "jamie.ruiz@corp.example.test", department: "Marketing", title: "Marketing Manager", usualLocation: "Denver, US", privileged: false },
];

const assetSpecs: Array<Omit<SyntheticAsset, "id" | "ip"> & { octet: number }> = [
  { hostname: "wks-sim-0101", kind: "workstation", os: "Windows 11", ownerId: "USR-001", criticality: "medium", octet: 101 },
  { hostname: "wks-sim-0102", kind: "workstation", os: "macOS 15", ownerId: "USR-002", criticality: "low", octet: 102 },
  { hostname: "wks-sim-0103", kind: "workstation", os: "Windows 11", ownerId: "USR-003", criticality: "high", octet: 103 },
  { hostname: "wks-sim-0104", kind: "workstation", os: "Windows 11", ownerId: "USR-004", criticality: "low", octet: 104 },
  { hostname: "wks-sim-0147", kind: "workstation", os: "Windows 11", ownerId: "USR-002", criticality: "medium", octet: 147 },
  { hostname: "wks-sim-0106", kind: "workstation", os: "Windows 11", ownerId: "USR-006", criticality: "medium", octet: 106 },
  { hostname: "wks-sim-0107", kind: "workstation", os: "Ubuntu 24.04", ownerId: "USR-007", criticality: "medium", octet: 107 },
  { hostname: "wks-sim-0108", kind: "workstation", os: "macOS 15", ownerId: "USR-008", criticality: "low", octet: 108 },
  { hostname: "wks-sim-0109", kind: "workstation", os: "Windows 11", ownerId: "USR-009", criticality: "medium", octet: 109 },
  { hostname: "wks-sim-0110", kind: "workstation", os: "macOS 15", ownerId: "USR-010", criticality: "low", octet: 110 },
  { hostname: "srv-sim-app-01", kind: "server", os: "Amazon Linux 2023", ownerId: null, criticality: "high", octet: 11 },
  { hostname: "srv-sim-fin-db", kind: "server", os: "Amazon Linux 2023", ownerId: null, criticality: "high", octet: 12 },
  { hostname: "srv-sim-file-02", kind: "server", os: "Windows Server 2022", ownerId: null, criticality: "medium", octet: 13 },
  { hostname: "srv-sim-hr-app", kind: "server", os: "Amazon Linux 2023", ownerId: null, criticality: "high", octet: 14 },
  { hostname: "srv-sim-build-03", kind: "server", os: "Ubuntu 24.04", ownerId: null, criticality: "medium", octet: 15 },
  { hostname: "ec2-sim-web-01", kind: "cloud", os: "Amazon Linux 2023", ownerId: null, criticality: "high", octet: 21 },
  { hostname: "ec2-sim-batch-02", kind: "cloud", os: "Amazon Linux 2023", ownerId: null, criticality: "low", octet: 22 },
  { hostname: "vpn-sim-gw-01", kind: "network", os: "Appliance OS", ownerId: null, criticality: "high", octet: 2 },
  { hostname: "fw-sim-edge-01", kind: "network", os: "Appliance OS", ownerId: null, criticality: "high", octet: 1 },
  { hostname: "proxy-sim-01", kind: "network", os: "Appliance OS", ownerId: null, criticality: "medium", octet: 3 },
];

export const syntheticAssets: SyntheticAsset[] = assetSpecs.map(({ octet, ...spec }, index) => ({
  ...spec,
  id: `AST-${String(index + 1).padStart(3, "0")}`,
  ip: `10.20.${spec.kind === "workstation" ? 40 : 10}.${octet}`,
}));

export function userById(id: string): SyntheticUser {
  const user = syntheticUsers.find((candidate) => candidate.id === id);
  if (!user) throw new Error(`Unknown synthetic user ${id}`);
  return user;
}

export function assetByHostname(hostname: string): SyntheticAsset {
  const asset = syntheticAssets.find((candidate) => candidate.hostname === hostname);
  if (!asset) throw new Error(`Unknown synthetic asset ${hostname}`);
  return asset;
}

export const analysts = ["Demo Analyst", "K. Ramos (sim)", "L. Okoye (sim)", "T. Nguyen (sim)"] as const;

/** RFC 5737 documentation ranges; never routable on the internet. */
export const externalIpPool = [
  "203.0.113.12",
  "203.0.113.45",
  "203.0.113.77",
  "203.0.113.130",
  "198.51.100.24",
  "198.51.100.61",
  "198.51.100.140",
  "192.0.2.44",
  "192.0.2.87",
] as const;
