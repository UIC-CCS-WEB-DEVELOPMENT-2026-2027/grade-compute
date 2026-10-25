// src/components/shared/RuleHierarchyTable.jsx
// Hierarchy table of a rule (grade-rules-spec.txt, PART 7): each criterion,
// indented by level, with its share of its parent and of the whole grade.
import { formatPercent, getHierarchyRows } from "../../utils/rules";
import "./RuleVisuals.css";

export default function RuleHierarchyTable({ tree, compact = false }) {
    const rows = getHierarchyRows(tree);

    return (
        <table className={`rule-table ${compact ? "is-compact" : ""}`}>
            <caption className={compact ? "rule-visually-hidden" : ""}>
                How the grade is divided
            </caption>
            <thead>
                <tr>
                    <th scope="col">Criterion</th>
                    <th scope="col">{compact ? "Of parent" : "Share of parent"}</th>
                    <th scope="col">{compact ? "Of grade" : "Share of grade"}</th>
                </tr>
            </thead>
            <tbody>
                {rows.map((row) => (
                    <tr key={row.id} className={row.hasChildren ? "is-parent" : ""}>
                        <th scope="row">
                            <span style={{ paddingLeft: `${(row.depth - 1) * (compact ? 12 : 20)}px` }}>
                                <i style={{ backgroundColor: row.color }} aria-hidden="true" />
                                {row.name}
                            </span>
                        </th>
                        <td>{formatPercent(row.shareOfParent)}</td>
                        <td>{formatPercent(row.effectiveShare)}</td>
                    </tr>
                ))}
            </tbody>
        </table>
    );
}
