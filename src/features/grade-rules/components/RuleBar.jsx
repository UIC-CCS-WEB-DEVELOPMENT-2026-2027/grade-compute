// Flattened bar of a rule's deepest criteria, sized by their share of the
// grade.
import { formatPercent, getFlattenedSegments } from "@/lib/rules";
import { RuleLegend } from "./RuleLegend";

export function RuleBar({ tree, showLegend = true }) {
    const segments = getFlattenedSegments(tree);
    const summary = segments
        .map((segment) => `${segment.name} ${formatPercent(segment.effectiveShare)}`)
        .join(", ");

    return (
        <div className="flex w-full flex-col gap-2.5">
            {/* Same look as the editor: segments with gaps, rounded outer ends. */}
            <div className="flex h-7 gap-1" role="img" aria-label={`Grade breakdown: ${summary}`}>
                {segments.map((segment) => (
                    <span
                        key={segment.id}
                        className="min-w-1.5 basis-0 rounded-sm first:rounded-l-full last:rounded-r-full"
                        // Each segment's share and colour come from the rule.
                        style={{ flexGrow: segment.effectiveShare, backgroundColor: segment.color }}
                    />
                ))}
            </div>
            {showLegend && (
                <RuleLegend
                    items={segments.map((segment) => ({
                        id: segment.id,
                        name: segment.name,
                        color: segment.color,
                        value: formatPercent(segment.effectiveShare),
                    }))}
                />
            )}
        </div>
    );
}
