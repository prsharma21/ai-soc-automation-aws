import { ChevronDown, LogOut, Settings } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { appConfig } from "@/lib/config";

export function ProfileMenu() {
  const navigate = useNavigate();
  const initials = appConfig.analystName
    .split(" ")
    .map((part) => part[0])
    .join("");

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" className="h-9 gap-2 px-2" aria-label={`Account menu for ${appConfig.analystName}`}>
          <span className="flex h-7 w-7 items-center justify-center rounded-full bg-slate-800 text-xs font-semibold text-white">
            {initials}
          </span>
          <span className="hidden text-left leading-tight md:block">
            <span className="block text-sm font-medium">{appConfig.analystName}</span>
            <span className="block text-2xs text-muted-foreground">Tier 2 SOC Analyst</span>
          </span>
          <ChevronDown className="hidden text-muted-foreground md:block" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-64">
        <DropdownMenuLabel>
          <p className="text-sm font-semibold">{appConfig.analystName}</p>
          <p className="text-xs font-normal text-muted-foreground">Synthetic demo identity · no authentication</p>
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        <DropdownMenuItem onSelect={() => navigate("/settings")}>
          <Settings /> Settings
        </DropdownMenuItem>
        <DropdownMenuItem disabled>
          <LogOut />
          <span className="flex flex-col">
            Sign out
            <span className="text-2xs text-muted-foreground">Unavailable until authentication is configured</span>
          </span>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
