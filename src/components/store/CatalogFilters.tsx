import { useState } from "react";
import { ChevronDown, X } from "lucide-react";
import { cn } from "@/lib/utils";
import { PRICE_RANGES } from "@/lib/catalog-filters";

interface Props {
  sizes: string[];
  size?: string | undefined;
  price?: string | undefined;
  onChange: (next: { size?: string | undefined; price?: string | undefined }) => void;
}

function Chip({ active, onClick, children }: { active: boolean; onClick: () => void; children: React.ReactNode }) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={active}
      className={cn(
        "rounded-full border-2 border-ink px-2.5 py-0.5 text-xs font-semibold whitespace-nowrap transition-all",
        active
          ? "bg-ink text-ink-foreground shadow-[2px_2px_0_0_var(--sunset)]"
          : "bg-paper text-foreground hover:-translate-y-0.5 hover:bg-mustard hover:text-mustard-foreground",
      )}
    >
      {children}
    </button>
  );
}

function Label({ children }: { children: React.ReactNode }) {
  return <span className="eyebrow shrink-0 text-muted-foreground">{children}</span>;
}

export function CatalogFilters({ sizes, size, price, onChange }: Props) {
  const activeCount = (size ? 1 : 0) + (price ? 1 : 0);
  const [open, setOpen] = useState(activeCount > 0);

  return (
    <div className="mb-8">
      <button
        type="button"
        aria-expanded={open}
        aria-controls="catalog-filters-panel"
        onClick={() => setOpen((v) => !v)}
        className={cn(
          "inline-flex items-center gap-2 rounded-full border-2 border-ink px-4 py-1.5 text-sm font-semibold transition-all",
          activeCount > 0
            ? "bg-ink text-ink-foreground shadow-[3px_3px_0_0_var(--sunset)]"
            : "bg-paper text-foreground shadow-[3px_3px_0_0_var(--sunset)] hover:-translate-y-0.5 hover:bg-mustard hover:text-mustard-foreground",
        )}
      >
        Фільтри
        {activeCount > 0 && (
          <span className="rounded-full bg-mustard px-1.5 text-xs text-mustard-foreground">{activeCount}</span>
        )}
        <ChevronDown className={cn("h-4 w-4 transition-transform duration-300", open && "rotate-180")} />
      </button>

      <div
        id="catalog-filters-panel"
        className={cn(
          "grid transition-[grid-template-rows] duration-300 ease-out",
          open ? "grid-rows-[1fr]" : "grid-rows-[0fr]",
        )}
      >
        <div className={cn("overflow-hidden", !open && "invisible")} inert={!open}>
          <div
            className="mt-3 w-fit max-w-full rounded-2xl border-2 border-ink bg-secondary px-3 py-2.5"
            role="group"
            aria-label="Фільтри каталогу"
          >
            <div className="flex flex-wrap items-center gap-x-5 gap-y-2">
              <div className="flex flex-wrap items-center gap-2">
                <Label>Розмір</Label>
                <Chip active={!size} onClick={() => onChange({ size: undefined, price })}>
                  Усі
                </Chip>
                {sizes.map((s) => (
                  <Chip
                    key={s}
                    active={size === s}
                    onClick={() => onChange({ size: size === s ? undefined : s, price })}
                  >
                    {s}
                  </Chip>
                ))}
              </div>

              <div className="flex flex-wrap items-center gap-2">
                <Label>Ціна</Label>
                <Chip active={!price} onClick={() => onChange({ size, price: undefined })}>
                  Усі
                </Chip>
                {PRICE_RANGES.map((r) => (
                  <Chip
                    key={r.id}
                    active={price === r.id}
                    onClick={() => onChange({ size, price: price === r.id ? undefined : r.id })}
                  >
                    {r.label}
                  </Chip>
                ))}
              </div>

              {activeCount > 0 && (
                <button
                  type="button"
                  onClick={() => onChange({})}
                  className="ml-auto inline-flex items-center gap-1 text-xs font-semibold text-primary underline-offset-4 hover:underline"
                >
                  <X className="h-3 w-3" /> Скинути
                </button>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
