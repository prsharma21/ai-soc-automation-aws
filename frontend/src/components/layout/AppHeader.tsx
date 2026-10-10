import { Menu } from "lucide-react";
import { Button } from "@/components/ui/button";
import { DataModeBadge } from "@/components/common/DataModeBadge";
import { EnvironmentBadge } from "./EnvironmentBadge";
import { GlobalSearch } from "./GlobalSearch";
import { HeaderClock } from "./HeaderClock";
import { NotificationMenu } from "./NotificationMenu";
import { ProfileMenu } from "./ProfileMenu";

interface AppHeaderProps {
  onOpenMobileNav: () => void;
}

export function AppHeader({ onOpenMobileNav }: AppHeaderProps) {
  return (
    <header className="sticky top-0 z-30 flex h-14 shrink-0 items-center gap-3 border-b bg-card/95 px-3 backdrop-blur sm:px-5">
      <Button variant="ghost" size="icon" className="lg:hidden" onClick={onOpenMobileNav} aria-label="Open navigation">
        <Menu aria-hidden="true" />
      </Button>
      <GlobalSearch />
      <div className="ml-auto flex items-center gap-2 sm:gap-3">
        <EnvironmentBadge className="hidden sm:inline-flex" />
        <EnvironmentBadge compact className="sm:hidden" />
        <DataModeBadge className="hidden md:inline-flex" />
        <HeaderClock />
        <NotificationMenu />
        <ProfileMenu />
      </div>
    </header>
  );
}
