// src/components/shared/RulePieChart.jsx
// Nested pie chart of a rule (grade-rules-spec.txt, PART 7). The inner ring
// is the top-level criteria; each outer ring splits them further. Slice
// sizes are each criterion's share of the total grade.
import { Pie, PieChart } from "recharts";
import { resolveColor } from "@/lib/dom/cssColor";
import { formatPercent, getHierarchyRows, getPieRings } from "@/lib/rules";
import "./RuleVisuals.css";

export default function RulePieChart({ tree, size = 220, showLegend = false }) {
    const rings = getPieRings(tree);
    const rows = getHierarchyRows(tree);
    const outer = size / 2 - 2;
    const hole = size * 0.14;
    const ringWidth = (outer - hole) / Math.max(rings.length, 1);
    const gap = resolveColor("var(--card)");
    const summary = rows
        .map((row) => `${row.name} ${formatPercent(row.effectiveShare)}`)
        .join(", ");

    return (
        <figure className="rule-pie">
            <div role="img" aria-label={`Nested pie chart: ${summary}`}>
                <PieChart width={size} height={size} accessibilityLayer={false}>
                    {rings.map((ring, index) => (
                        <Pie
                            key={index}
                            data={ring.map((slice) => ({
                                ...slice,
                                fill: resolveColor(slice.color),
                                // Parents are lighter, so the outer ring reads as their parts.
                                fillOpacity: slice.hasChildren ? 0.5 : 1,
                                stroke: gap,
                            }))}
                            dataKey="value"
                            nameKey="name"
                            cx="50%"
                            cy="50%"
                            innerRadius={hole + index * ringWidth}
                            outerRadius={hole + (index + 1) * ringWidth - 2}
                            startAngle={90}
                            endAngle={-270}
                            strokeWidth={2}
                            isAnimationActive={false}
                        />
                    ))}
                </PieChart>
            </div>
            {showLegend && (
                <ul className="rule-legend rule-legend-stacked" aria-hidden="true">
                    {rows.map((row) => (
                        <li key={row.id}>
                            <i style={{ backgroundColor: row.color }} />
                            <span>{row.name}</span>
                            <strong>{formatPercent(row.effectiveShare)}</strong>
                        </li>
                    ))}
                </ul>
            )}
        </figure>
    );
}
