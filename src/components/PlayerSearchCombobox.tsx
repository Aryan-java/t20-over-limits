import { useDeferredValue, useEffect, useId, useMemo, useRef, useState, memo } from "react";
import { Popover, PopoverAnchor, PopoverContent } from "@/components/ui/popover";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Search } from "lucide-react";
import { cn } from "@/lib/utils";
import { searchPlayers, SearchablePlayer } from "@/lib/playerSearch";
import type { PlayerData } from "@/data/playerDatabase";

const MAX_RESULTS = 50;

interface Props {
  onSelect: (player: PlayerData) => void;
  /** Return a reason string to block selection (shown inline). */
  blockReason?: (player: PlayerData) => string | null;
  placeholder?: string;
  autoFocus?: boolean;
}

const ResultRow = memo(({ p, active, reason, id, onPick, onHover }: {
  p: SearchablePlayer; active: boolean; reason: string | null; id: string;
  onPick: () => void; onHover: () => void;
}) => (
  <div
    id={id}
    role="option"
    aria-selected={active}
    aria-disabled={!!reason}
    onMouseDown={(e) => { e.preventDefault(); onPick(); }}
    onMouseEnter={onHover}
    className={cn(
      "flex items-center gap-2 px-3 py-2 cursor-pointer text-sm",
      active && "bg-accent text-accent-foreground",
      reason && "opacity-60 cursor-not-allowed",
    )}
  >
    <span className="text-base leading-none">{p.countryFlag}</span>
    <div className="flex-1 min-w-0">
      <div className="font-medium truncate">{p.name}</div>
      <div className="text-xs text-muted-foreground truncate">
        {p.data.role}
        {p.data.bowlSkill >= 40 && ` · ${p.bowlerType}`}
        {p.team && ` · ${p.team}`}
        {reason && <span className="text-destructive"> · {reason}</span>}
      </div>
    </div>
    <Badge variant="outline" className="text-xs shrink-0">Bat {p.data.batSkill}</Badge>
    <Badge variant="outline" className="text-xs shrink-0">Bowl {p.data.bowlSkill}</Badge>
  </div>
));
ResultRow.displayName = "ResultRow";

const PlayerSearchCombobox = ({ onSelect, blockReason, placeholder = "Search by name, role, country, team...", autoFocus }: Props) => {
  const [query, setQuery] = useState("");
  const [open, setOpen] = useState(false);
  const [active, setActive] = useState(0);
  const [notice, setNotice] = useState<string | null>(null);
  const deferred = useDeferredValue(query);
  const listId = useId();
  const listRef = useRef<HTMLDivElement>(null);

  const results = useMemo(() => searchPlayers(deferred).slice(0, MAX_RESULTS), [deferred]);
  useEffect(() => setActive(0), [deferred]);
  useEffect(() => {
    listRef.current?.querySelector(`[data-idx="${active}"]`)?.scrollIntoView({ block: "nearest" });
  }, [active]);

  const pick = (p: SearchablePlayer) => {
    const reason = blockReason?.(p.data) ?? null;
    if (reason) { setNotice(`${p.name}: ${reason}`); return; }
    onSelect(p.data);
    setNotice(null);
    setQuery("");
    setOpen(false);
  };

  const onKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "ArrowDown") { e.preventDefault(); setOpen(true); setActive((a) => Math.min(a + 1, results.length - 1)); }
    else if (e.key === "ArrowUp") { e.preventDefault(); setActive((a) => Math.max(a - 1, 0)); }
    else if (e.key === "Enter") { e.preventDefault(); if (open && results[active]) pick(results[active]); }
    else if (e.key === "Escape") { if (open) { e.preventDefault(); e.stopPropagation(); setOpen(false); } }
  };

  return (
    <div className="space-y-1">
      <Popover open={open && query.trim().length > 0} onOpenChange={setOpen}>
        <PopoverAnchor asChild>
          <div className="relative">
            <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
            <Input
              role="combobox"
              aria-expanded={open}
              aria-controls={listId}
              aria-activedescendant={results[active] ? `${listId}-${active}` : undefined}
              autoFocus={autoFocus}
              value={query}
              placeholder={placeholder}
              className="pl-10"
              onChange={(e) => { setQuery(e.target.value); setOpen(true); setNotice(null); }}
              onFocus={() => setOpen(true)}
              onBlur={() => setOpen(false)}
              onKeyDown={onKeyDown}
            />
          </div>
        </PopoverAnchor>
        <PopoverContent
          align="start"
          className="p-0 w-[var(--radix-popover-trigger-width)] min-w-[280px] max-w-[95vw]"
          onOpenAutoFocus={(e) => e.preventDefault()}
          onCloseAutoFocus={(e) => e.preventDefault()}
        >
          <div id={listId} role="listbox" ref={listRef} className="max-h-[min(20rem,50vh)] overflow-y-auto py-1">
            {results.length === 0 ? (
              <div className="px-3 py-6 text-center text-sm text-muted-foreground">No players match “{query}”</div>
            ) : results.map((p, i) => (
              <div key={p.name} data-idx={i}>
                <ResultRow
                  id={`${listId}-${i}`}
                  p={p}
                  active={i === active}
                  reason={blockReason?.(p.data) ?? null}
                  onPick={() => pick(p)}
                  onHover={() => setActive(i)}
                />
              </div>
            ))}
          </div>
        </PopoverContent>
      </Popover>
      {notice && <p className="text-xs text-destructive" role="alert">{notice}</p>}
    </div>
  );
};

export default PlayerSearchCombobox;
