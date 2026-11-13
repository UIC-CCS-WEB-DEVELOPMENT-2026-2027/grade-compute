// The setup both grade-history charts share (AUDIT G21): the plot box, the
// grid, the axes, the 75% passing line, and the "Show as a table" fallback.
// Each chart passes its own series (Line, ReferenceLine) as children, and
// its legend and table.
import { CartesianGrid, LineChart, ReferenceLine, XAxis, YAxis } from "recharts";
import { ChevronRightIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ChartContainer } from "@/components/ui/chart";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { resolveColor } from "@/lib/dom/cssColor";
import { PASSING_GRADE } from "@/lib/history";
import { cn } from "@/lib/utils";
import { HistoryEmpty } from "./HistoryEmpty";

// scale: from getChartScale. plotRef: for the point tooltips (usePointHover).
// ariaLabel: the chart described in words. overlay: drawn over the plot (the
// tooltip). emptyMessage: shown instead of the plot when nothing is plotted.
// heightClass: the plot height as a Tailwind class. marginTop: room above
// the plot (for labels drawn over the top line).
export function HistoryChartFrame({
    scale,
    plotRef,
    ariaLabel,
    overlay,
    emptyMessage,
    legend,
    table,
    heightClass = "h-80",
    marginTop = 16,
    children,
}) {
    const colors = {
        grid: resolveColor("var(--border)"),
        muted: resolveColor("var(--muted-foreground)"),
        passing: resolveColor("var(--destructive)"),
    };

    return (
        <>
            {emptyMessage ? (
                <HistoryEmpty>{emptyMessage}</HistoryEmpty>
            ) : (
                <div
                    ref={plotRef}
                    role="img"
                    aria-label={ariaLabel}
                    className="relative min-w-0 rounded-lg border border-border bg-linear-to-b from-muted to-card to-45% pt-3 pr-1"
                >
                    <ChartContainer config={{}} className={cn("aspect-auto w-full", heightClass)}>
                        <LineChart margin={{ top: marginTop, right: 16, bottom: 8, left: 0 }}>
                            <CartesianGrid stroke={colors.grid} vertical={false} />
                            <XAxis
                                dataKey="step"
                                type="number"
                                domain={scale.xDomain}
                                ticks={scale.xTicks}
                                allowDecimals={false}
                                allowDuplicatedCategory={false}
                                tick={{ fill: colors.muted, fontSize: 12 }}
                                stroke={colors.grid}
                                label={{
                                    value: "Tasks",
                                    position: "insideBottomRight",
                                    offset: -4,
                                    fill: colors.muted,
                                    fontSize: 12,
                                }}
                            />
                            <YAxis
                                domain={scale.yDomain}
                                ticks={scale.yTicks}
                                allowDataOverflow
                                unit="%"
                                width={48}
                                tick={{ fill: colors.muted, fontSize: 12 }}
                                stroke={colors.grid}
                            />
                            <ReferenceLine
                                y={PASSING_GRADE}
                                stroke={colors.passing}
                                strokeDasharray="2 4"
                                strokeWidth={1.5}
                                label={{
                                    value: `Passing ${PASSING_GRADE}%`,
                                    position: "insideBottomLeft",
                                    fill: colors.passing,
                                    fontSize: 12,
                                }}
                            />
                            {children}
                        </LineChart>
                    </ChartContainer>
                    {overlay}
                </div>
            )}
            {legend}
            {table && (
                <Collapsible>
                    <CollapsibleTrigger
                        render={
                            <Button
                                variant="outline"
                                size="sm"
                                className="group/table w-fit text-primary"
                            />
                        }
                    >
                        <ChevronRightIcon
                            data-icon="inline-start"
                            aria-hidden="true"
                            className="transition-transform group-aria-expanded/table:rotate-90"
                        />
                        Show as a table
                    </CollapsibleTrigger>
                    <CollapsibleContent className="mt-2.5 flex flex-col gap-3">
                        {table}
                    </CollapsibleContent>
                </Collapsible>
            )}
        </>
    );
}
