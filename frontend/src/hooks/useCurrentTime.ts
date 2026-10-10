import { useEffect, useState } from "react";
import { currentTime } from "@/lib/config";

export function useCurrentTime(intervalMs = 30_000): Date {
  const [now, setNow] = useState(() => currentTime());

  useEffect(() => {
    const id = window.setInterval(() => setNow(currentTime()), intervalMs);
    return () => window.clearInterval(id);
  }, [intervalMs]);

  return now;
}
