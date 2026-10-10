import { Clock } from "lucide-react";
import { useCurrentTime } from "@/hooks/useCurrentTime";
import { usePreferences } from "@/hooks/usePreferences";
import { formatDateTime } from "@/lib/format";

export function HeaderClock() {
  const now = useCurrentTime();
  const { preferences } = usePreferences();

  return (
    <div className="hidden items-center gap-1.5 text-xs text-muted-foreground xl:flex">
      <Clock className="h-3.5 w-3.5" aria-hidden="true" />
      <time dateTime={now.toISOString()} className="tabular-nums">
        {formatDateTime(now.toISOString(), preferences.timeZone, "EEE MMM dd, HH:mm")}
      </time>
    </div>
  );
}
