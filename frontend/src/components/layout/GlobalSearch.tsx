import { useState, type FormEvent } from "react";
import { Search } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { Input } from "@/components/ui/input";

/** Maps a free-text query to the most specific destination. */
export function resolveSearchTarget(rawQuery: string): string | null {
  const query = rawQuery.trim();
  if (!query) return null;
  const upper = query.toUpperCase();
  if (/^ALT-\d+$/.test(upper)) return `/alerts/${upper}`;
  if (/^INC-\d+$/.test(upper)) return `/incidents/${upper}`;
  if (/^INV-\d+$/.test(upper)) return `/investigations/${upper}`;
  const encoded = encodeURIComponent(query);
  const looksLikeIndicator =
    /^\d{1,3}(\.\d{1,3}){3}$/.test(query) || /^[a-f0-9]{32,64}$/i.test(query) || /^[a-z0-9-]+(\.[a-z0-9-]+)+$/i.test(query);
  if (looksLikeIndicator) return `/threat-intelligence?search=${encoded}`;
  return `/alerts?search=${encoded}`;
}

export function GlobalSearch() {
  const [query, setQuery] = useState("");
  const navigate = useNavigate();

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const target = resolveSearchTarget(query);
    if (!target) return;
    navigate(target);
    setQuery("");
  }

  return (
    <form role="search" onSubmit={handleSubmit} className="relative w-full max-w-md">
      <label htmlFor="global-search" className="sr-only">
        Search alerts, incidents, investigations, and indicators
      </label>
      <Search
        className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground"
        aria-hidden="true"
      />
      <Input
        id="global-search"
        type="search"
        value={query}
        onChange={(event) => setQuery(event.target.value)}
        placeholder="Search ALT-, INC-, INV- IDs, IPs, domains, hashes…"
        className="h-9 bg-muted/50 pl-9"
        autoComplete="off"
      />
    </form>
  );
}
