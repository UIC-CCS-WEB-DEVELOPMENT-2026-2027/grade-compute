// The legend under a grade-history chart: one pill per item, with a small
// mark drawn like the line or dot it explains.
import { cn } from "@/lib/utils";

// items: [{ mark, text }]. mark: the classes that draw the mark.
export function HistoryLegend({ items }) {
    return (
        <p className="m-0 flex flex-wrap gap-2 type-caption font-normal text-muted-foreground">
            {items.map(({ mark, text }) => (
                <span
                    key={text}
                    className="inline-flex items-center gap-1.5 rounded-full border border-border bg-card px-2 py-1"
                >
                    <i className={cn("inline-block", mark)} aria-hidden="true" /> {text}
                </span>
            ))}
        </p>
    );
}
