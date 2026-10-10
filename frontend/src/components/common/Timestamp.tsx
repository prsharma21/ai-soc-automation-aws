import { formatDateTime, formatRelative, parseTimestamp } from "@/lib/format";
import { useCurrentTime } from "@/hooks/useCurrentTime";
import { usePreferences } from "@/hooks/usePreferences";
import { cn } from "@/lib/utils";

interface TimestampProps {
  value: string | null | undefined;
  pattern?: string;
  /** Shows "5 minutes ago" with the absolute time as a tooltip. */
  relative?: boolean;
  className?: string;
}

/** Renders an ISO timestamp in the analyst's preferred time zone. */
export function Timestamp({ value, pattern, relative = false, className }: TimestampProps) {
  const { preferences } = usePreferences();
  const now = useCurrentTime(60_000);
  const date = parseTimestamp(value);
  if (!date) return <span className={className}>—</span>;

  const absolute = formatDateTime(value, preferences.timeZone, pattern ?? "MMM dd yyyy, HH:mm:ss");
  return (
    <time
      dateTime={date.toISOString()}
      title={relative ? absolute : undefined}
      className={cn("whitespace-nowrap tabular-nums", className)}
    >
      {relative ? formatRelative(value, now) : formatDateTime(value, preferences.timeZone, pattern)}
    </time>
  );
}
