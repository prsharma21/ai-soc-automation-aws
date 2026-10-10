import { useEffect, useId, useState } from "react";
import { Search, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { NativeSelect, type SelectOption } from "@/components/ui/native-select";
import { useDebouncedValue } from "@/hooks/useDebouncedValue";

export interface FilterConfig {
  id: string;
  label: string;
  value: string;
  options: SelectOption[];
  onChange: (value: string) => void;
}

interface SearchAndFiltersProps {
  searchValue: string;
  onSearchChange: (value: string) => void;
  searchPlaceholder: string;
  searchLabel?: string;
  filters?: FilterConfig[];
  isFiltered?: boolean;
  onClear?: () => void;
}

export function SearchAndFilters({
  searchValue,
  onSearchChange,
  searchPlaceholder,
  searchLabel = "Search",
  filters = [],
  isFiltered = false,
  onClear,
}: SearchAndFiltersProps) {
  const searchId = useId();
  const [draft, setDraft] = useState(searchValue);
  const debounced = useDebouncedValue(draft, 250);

  useEffect(() => {
    setDraft(searchValue);
  }, [searchValue]);

  useEffect(() => {
    if (debounced !== searchValue) onSearchChange(debounced);
    // Only push debounced edits; external resets are synced by the effect above.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [debounced]);

  return (
    <div className="flex flex-col gap-3 border-b p-3 lg:flex-row lg:items-end">
      <div className="min-w-0 flex-1 space-y-1">
        <label htmlFor={searchId} className="text-2xs font-semibold uppercase tracking-wide text-muted-foreground">
          {searchLabel}
        </label>
        <div className="relative">
          <Search
            className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground"
            aria-hidden="true"
          />
          <Input
            id={searchId}
            type="search"
            value={draft}
            onChange={(event) => setDraft(event.target.value)}
            placeholder={searchPlaceholder}
            className="pl-9"
            autoComplete="off"
          />
        </div>
      </div>
      {filters.length > 0 && (
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4 lg:flex lg:flex-none">
          {filters.map((filter) => (
            <FilterSelect key={filter.id} filter={filter} />
          ))}
        </div>
      )}
      {onClear && (
        <Button
          variant="ghost"
          size="sm"
          className="h-9 self-start lg:self-end"
          onClick={() => {
            setDraft("");
            onClear();
          }}
          disabled={!isFiltered}
        >
          <X /> Clear filters
        </Button>
      )}
    </div>
  );
}

function FilterSelect({ filter }: { filter: FilterConfig }) {
  const id = useId();
  return (
    <div className="min-w-[9rem] space-y-1">
      <label htmlFor={id} className="text-2xs font-semibold uppercase tracking-wide text-muted-foreground">
        {filter.label}
      </label>
      <NativeSelect
        id={id}
        value={filter.value}
        options={filter.options}
        onChange={(event) => filter.onChange(event.target.value)}
      />
    </div>
  );
}
