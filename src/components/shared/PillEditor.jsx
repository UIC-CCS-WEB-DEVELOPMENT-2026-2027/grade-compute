// src/components/shared/PillEditor.jsx
// The "pill" grade computation rule editor (grade-rules-spec.txt, PART 4-6).
// It draws one pill for the total grade, then one pill for every criterion
// that has subcriteria, indented by depth.
//
// Props:
// - tree: criteria tree from rules.js (ruleToTree() or createDefaultTree())
// - onChange(newTree): called with the updated tree after every valid edit
// - structureLocked: true hides add, delete, rename, and split (Phase 1)
import PillLevel from "./PillLevel";
import "./PillEditor.css";

function getLevels(node, depth = 0) {
    if (!node?.children?.length) return [];
    return [
        { id: node.id, depth },
        ...node.children.flatMap((child) => getLevels(child, depth + 1)),
    ];
}

export default function PillEditor({ tree, onChange, structureLocked = true }) {
    const levels = getLevels(tree);

    return (
        <div className="pill-editor">
            {levels.map((level) => (
                <PillLevel
                    key={level.id}
                    tree={tree}
                    levelId={level.id}
                    depth={level.depth}
                    structureLocked={structureLocked}
                    onChange={onChange}
                />
            ))}
            <p className="pill-hint">
                Type a percentage or drag a handle. The difference comes from the
                criterion on the right, or from the left for the last one. Hover
                over, tap, or tab to a parent name to see its full breakdown.
            </p>
        </div>
    );
}
