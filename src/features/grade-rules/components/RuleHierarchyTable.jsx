// Hierarchy table of a rule: each criterion,
// indented by level, with its share of its parent and of the whole grade.
import {
    Table,
    TableBody,
    TableCaption,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table";
import { formatPercent, getHierarchyRows } from "@/lib/rules";
import { cn } from "@/lib/utils";

// compact: the small preview on a rule card (shorter headings, tighter rows,
// the caption only for screen readers).
export function RuleHierarchyTable({ tree, compact = false }) {
    const rows = getHierarchyRows(tree);
    const cell = cn(
        "border-0 border-b border-solid border-border text-right whitespace-normal",
        compact ? "px-1.5 py-0.5" : "px-2.5 py-2",
    );

    return (
        <Table
            className={cn(
                "caption-top border-collapse text-foreground tabular-nums",
                !compact && "table-fixed",
            )}
        >
            <TableCaption className={cn("mt-0 mb-2 text-left", compact && "sr-only")}>
                How the grade is divided
            </TableCaption>
            <TableHeader>
                <TableRow className="hover:bg-transparent">
                    <TableHead
                        scope="col"
                        className={cn(
                            cell,
                            "h-auto text-left font-normal text-muted-foreground",
                            !compact && "w-14/25",
                        )}
                    >
                        Criterion
                    </TableHead>
                    <TableHead
                        scope="col"
                        className={cn(
                            cell,
                            "h-auto font-normal text-muted-foreground",
                            !compact && "w-11/50",
                        )}
                    >
                        {compact ? "Of parent" : "Share of parent"}
                    </TableHead>
                    <TableHead
                        scope="col"
                        className={cn(
                            cell,
                            "h-auto font-normal text-muted-foreground",
                            !compact && "w-11/50",
                        )}
                    >
                        {compact ? "Of grade" : "Share of grade"}
                    </TableHead>
                </TableRow>
            </TableHeader>
            <TableBody>
                {rows.map((row) => (
                    <TableRow key={row.id} className="group/row hover:bg-secondary">
                        <TableHead
                            scope="row"
                            className={cn(cell, "h-auto text-left font-normal text-foreground")}
                        >
                            <span
                                className={cn(
                                    "inline-flex items-center gap-2",
                                    !compact && "relative pl-4.5",
                                )}
                                // Indent by the criterion's level in the rule.
                                style={
                                    compact
                                        ? {
                                              paddingLeft: `${(row.depth - 1) * 12}px`,
                                          }
                                        : undefined
                                }
                            >
                                <i
                                    className={cn(
                                        "inline-block size-2.5 shrink-0 rounded-full transition group-hover/row:scale-115 group-hover/row:ring-4 group-hover/row:ring-card motion-reduce:transition-none",
                                        !compact && "absolute left-0",
                                    )}
                                    // The criterion's colour from the rule.
                                    style={{ backgroundColor: row.color }}
                                    aria-hidden="true"
                                />
                                {row.name}
                            </span>
                        </TableHead>
                        <TableCell className={cell}>{formatPercent(row.shareOfParent)}</TableCell>
                        <TableCell className={cell}>{formatPercent(row.effectiveShare)}</TableCell>
                    </TableRow>
                ))}
            </TableBody>
        </Table>
    );
}
