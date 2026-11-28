// Legend for a rule's bar or pie chart (AUDIT G16): a coloured dot, the
// criterion name and its share. It repeats what the chart's label says, so
// it is hidden from screen readers.
import { cn } from "@/lib/utils";

// items: [{ id, name, color, value }], value already formatted.
// stacked: one row per item (beside the pie chart) instead of a wrapping line.
export function RuleLegend({ items, stacked = false }) {
    return (
        <ul
            className={cn(
                "m-0 flex list-none flex-wrap gap-x-3.5 gap-y-1 p-0 type-small text-foreground",
                stacked && "max-w-full min-w-40 flex-col",
            )}
            aria-hidden="true"
        >
            {items.map((item) => (
                <li key={item.id} className="inline-flex items-center gap-1.5">
                    <i
                        className="inline-block size-2.5 shrink-0 rounded-full"
                        // The criterion's colour from the rule.
                        style={{ backgroundColor: item.color }}
                    />
                    <span className={cn(stacked && "min-w-0 flex-1")}>{item.name}</span>
                    <strong className="font-normal text-muted-foreground tabular-nums">
                        {item.value}
                    </strong>
                </li>
            ))}
        </ul>
    );
}
