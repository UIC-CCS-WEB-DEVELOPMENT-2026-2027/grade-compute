// The grade ring used on Subject Detail and in the Target Grade Sandbox
// (AUDIT G6): a label, a ring filled to the grade, and a yellow marker at
// the target.
import { Badge } from "@/components/ui/badge";
import { getGaugeProgress } from "@/lib/format";
import { cn } from "@/lib/utils";

const TONES = {
    official: { ring: "from-primary", text: "text-primary" },
    expected: { ring: "from-highlight-strong", text: "text-highlight-text" },
};

// label: shown above the ring. grade: 0-100 or null. target: 0-100.
// tone: "official" | "expected".
// ariaLabelPrefix and ariaDecimals: the screen-reader label,
// "<prefix>: <grade> percent".
// focusable: the gauge is a tab stop carrying the label, and shows
// `details` on hover or focus (Subject Detail). Otherwise the ring is an
// image carrying the label (the sandbox).
export function GradeGauge({
    label,
    grade,
    target,
    tone = "official",
    ariaLabelPrefix = label,
    ariaDecimals = 0,
    focusable = false,
    details = null,
    className,
}) {
    const ariaLabel = `${ariaLabelPrefix}: ${grade === null ? "no grade yet" : `${grade.toFixed(ariaDecimals)} percent`}`;
    const colors = TONES[tone];

    return (
        <div
            className={cn(
                "group/gauge relative flex min-w-0 flex-col items-center gap-2 rounded-lg outline-none focus-visible:ring-3 focus-visible:ring-ring/50",
                className,
            )}
            tabIndex={focusable ? 0 : undefined}
            aria-label={focusable ? ariaLabel : undefined}
        >
            <Badge
                variant="secondary"
                className="h-auto max-w-full text-center whitespace-normal text-primary"
            >
                {label}
            </Badge>
            <span
                // Not cn(): tailwind-merge would drop the stop positions as
                // clashing with the from- color.
                className={`relative grid size-22 place-items-center rounded-full bg-conic from-(percentage:--grade-progress) to-border to-(percentage:--grade-progress) transition-transform group-hover/gauge:scale-104 group-hover/gauge:drop-shadow-md group-focus-visible/gauge:scale-104 group-focus-visible/gauge:drop-shadow-md motion-reduce:transition-none xl:size-28 ${colors.ring}`}
                // The fill and the marker angle come from this grade and target.
                style={{
                    "--grade-progress": `${getGaugeProgress(grade)}%`,
                    "--target-angle": `${target * 3.6}deg`,
                }}
                data-slot="gauge-ring"
                role={focusable ? undefined : "img"}
                aria-label={focusable ? undefined : ariaLabel}
                aria-hidden={focusable ? "true" : undefined}
            >
                <span className="absolute inset-2 rounded-full bg-card" />
                <strong className={cn("relative type-section-title leading-none", colors.text)}>
                    {grade === null ? "—" : grade.toFixed(0)}
                    {grade !== null && <small className="type-small">%</small>}
                </strong>
                <span className="absolute inset-0 rotate-(--target-angle)">
                    <span className="absolute top-0 left-1/2 h-2.5 w-0.75 -translate-x-1/2 rounded-xs bg-highlight-strong ring-1 ring-card" />
                </span>
            </span>
            {details && (
                <span className="pointer-events-none absolute top-full left-1/2 z-20 mt-1 w-52 -translate-x-1/2 rounded-lg border border-border bg-card p-2.5 type-small text-muted-foreground opacity-0 shadow-card transition-opacity group-hover/gauge:opacity-100 group-focus-visible/gauge:opacity-100 max-md:hidden">
                    {details}
                </span>
            )}
        </div>
    );
}
