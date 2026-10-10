import { useEffect, useState } from "react";
import { subscribeToDataChanges } from "@/lib/dataEvents";

/** Increments whenever another part of the app reports a successful data change. */
export function useDataVersion(): number {
  const [version, setVersion] = useState(0);
  useEffect(() => subscribeToDataChanges(() => setVersion((value) => value + 1)), []);
  return version;
}
