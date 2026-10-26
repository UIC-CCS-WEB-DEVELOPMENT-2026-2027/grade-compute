// src/components/shared/RuleCard.jsx
// One rule in the rules collection. The whole card opens the rule; the
// thumbnail shows the rule as a bar, pie chart, or table.
import { Link } from "react-router-dom";
import RuleBar from "./RuleBar";
import RuleFormula from "./RuleFormula";
import RuleHierarchyTable from "./RuleHierarchyTable";
import RulePieChart from "./RulePieChart";
import { ruleToTree } from "../../utils/rules";

export default function RuleCard({ rule, subjectCount, thumbnail, onDuplicate, onDelete }) {
    const tree = ruleToTree(rule);
    const tags = rule.tags ?? [];
    const schools = rule.schools ?? [];

    return (
        <article className="rule-card">
            <div className={`rule-card-thumb is-${thumbnail}`}>
                {thumbnail === "pie" && <RulePieChart tree={tree} size={132} />}
                {thumbnail === "table" && <RuleHierarchyTable tree={tree} compact />}
                {thumbnail === "bar" && <RuleBar tree={tree} />}
            </div>

            <div className="rule-card-body">
                <h2>
                    <Link className="rule-card-link" to={`/student/rules/${rule.id}`}>
                        {rule.ruleName}
                    </Link>
                </h2>
                {tags.length > 0 && (
                    <ul className="rule-card-tags" aria-label="Tags">
                        {tags.map((tag) => (
                            <li key={tag}>{tag}</li>
                        ))}
                    </ul>
                )}
                {schools.length > 0 && (
                    <p className="rule-card-schools">Used at {schools.join(", ")}</p>
                )}
                <RuleFormula rule={rule} />
            </div>

            <footer className="rule-card-footer">
                <span className="rule-card-usage">
                    {subjectCount === 0
                        ? "Not used by any subject"
                        : `Used by ${subjectCount} subject${subjectCount === 1 ? "" : "s"}`}
                </span>
                <span className="rule-card-actions">
                    <button type="button" onClick={onDuplicate}>
                        Duplicate
                    </button>
                    <button type="button" className="is-danger" onClick={onDelete}>
                        Delete
                    </button>
                </span>
            </footer>
        </article>
    );
}
