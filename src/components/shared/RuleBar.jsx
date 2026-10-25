// src/components/shared/RuleBar.jsx
// Flattened bar of a rule's deepest criteria, sized by their share of the
// grade (grade-rules-spec.txt, PART 3 and PART 7).
import { formatPercent, getFlattenedSegments } from "../../utils/rules";
import "./RuleVisuals.css";

export default function RuleBar({ tree, showLegend = true }) {
    const segments = getFlattenedSegments(tree);
    const summary = segments
        .map((segment) => `${segment.name} ${formatPercent(segment.effectiveShare)}`)
        .join(", ");

    return (
        <div className="rule-bar">
            <div className="rule-bar-track" role="img" aria-label={`Grade breakdown: ${summary}`}>
                {segments.map((segment) => (
                    <span
                        key={segment.id}
                        style={{ flexGrow: segment.effectiveShare, backgroundColor: segment.color }}
                    />
                ))}
            </div>
            {showLegend && (
                <ul className="rule-legend" aria-hidden="true">
                    {segments.map((segment) => (
                        <li key={segment.id}>
                            <i style={{ backgroundColor: segment.color }} />
                            <span>{segment.name}</span>
                            <strong>{formatPercent(segment.effectiveShare)}</strong>
                        </li>
                    ))}
                </ul>
            )}
        </div>
    );
}
