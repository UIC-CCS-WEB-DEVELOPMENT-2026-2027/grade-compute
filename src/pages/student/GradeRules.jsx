// src/pages/student/GradeRules.jsx
// Grade computation rules collection (grade-rules-spec.txt, PART 3).
// Cards open the view/edit page (RuleDetail.jsx).
import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import Sidebar from "../../components/shared/Sidebar";
import Header from "../../components/shared/Header";
import RuleCard from "../../components/shared/RuleCard";
import DeleteRuleDialog from "../../components/shared/DeleteRuleDialog";
import { getDb, saveDb } from "../../utils/db";
import { duplicateRule, getRuleUsage, searchRules } from "../../utils/rules";
import "./GradeRules.css";

const THUMBNAIL_KEY = "compugrade_rule_thumbnail";
const THUMBNAILS = [
    { id: "bar", label: "Bar" },
    { id: "pie", label: "Pie" },
    { id: "table", label: "Table" },
];

// The thumbnail choice is a per-browser convenience, so it lives in its own
// localStorage key, not in the shared database.
function readThumbnail() {
    try {
        const saved = localStorage.getItem(THUMBNAIL_KEY);
        return THUMBNAILS.some((option) => option.id === saved) ? saved : "bar";
    } catch {
        return "bar";
    }
}

function writeThumbnail(value) {
    try {
        localStorage.setItem(THUMBNAIL_KEY, value);
    } catch {
        // Storage unavailable: the choice just won't be remembered.
    }
}

export default function GradeRules() {
    const navigate = useNavigate();
    const [dbData, setDbData] = useState(() => getDb());
    const [query, setQuery] = useState("");
    const [thumbnail, setThumbnail] = useState(readThumbnail);
    const [deleteTarget, setDeleteTarget] = useState(null);
    const [message, setMessage] = useState("");

    const rules = dbData?.computationRules ?? [];
    const visibleRules = searchRules(rules, query);

    function commit(updatedDb) {
        try {
            saveDb(updatedDb);
        } catch (error) {
            setMessage(`Your changes could not be saved: ${error.message}`);
            return false;
        }
        setDbData(updatedDb);
        return true;
    }

    function chooseThumbnail(value) {
        setThumbnail(value);
        writeThumbnail(value);
    }

    function handleDuplicate(ruleId) {
        const result = duplicateRule(dbData, ruleId);
        if (!result.ok) {
            setMessage(result.error);
            return;
        }
        if (commit(result.db)) navigate(`/student/rules/${result.rule.id}`);
    }

    function handleDeleted(updatedDb) {
        const name = deleteTarget?.ruleName;
        setDeleteTarget(null);
        if (commit(updatedDb)) setMessage(`Deleted ${name}.`);
    }

    return (
        <div className="rules-layout">
            <Sidebar />
            <div className="rules-main">
                <Header />
                <main className="rules-content">
                    <header className="rules-heading">
                        <div>
                            <h1>Grade computation rules</h1>
                            <p>How each part of your work adds up to your grade.</p>
                        </div>
                        <Link className="rules-new-button btn-primary" to="/student/rules/new">
                            + New rule
                        </Link>
                    </header>

                    <div className="rules-toolbar">
                        <input
                            className="rules-search"
                            type="search"
                            placeholder="Search by name, tag, or school"
                            value={query}
                            onChange={(event) => setQuery(event.target.value)}
                            aria-label="Search grade computation rules"
                        />
                        <div className="rules-toggle" role="group" aria-label="Card preview">
                            <span aria-hidden="true">Preview</span>
                            {THUMBNAILS.map((option) => (
                                <button
                                    key={option.id}
                                    type="button"
                                    aria-pressed={thumbnail === option.id}
                                    onClick={() => chooseThumbnail(option.id)}
                                >
                                    {option.label}
                                </button>
                            ))}
                        </div>
                    </div>

                    <p className="rules-message" role="status">
                        {message}
                    </p>

                    <aside className="rules-delete-note">
                        <strong>Before deleting a rule:</strong> At least one rule must remain.
                        If subjects use the rule, choose a replacement rule for them.
                    </aside>

                    {visibleRules.length > 0 ? (
                        <div className="rules-grid">
                            {visibleRules.map((rule) => (
                                <RuleCard
                                    key={rule.id}
                                    rule={rule}
                                    thumbnail={thumbnail}
                                    subjectCount={getRuleUsage(dbData, rule.id).classes.length}
                                    onDuplicate={() => handleDuplicate(rule.id)}
                                    onDelete={() => {
                                        setMessage("");
                                        setDeleteTarget(rule);
                                    }}
                                />
                            ))}
                        </div>
                    ) : (
                        <p className="rules-empty">
                            {rules.length === 0
                                ? "No rules yet. Create one to start tracking how your grades add up."
                                : `No rules match "${query.trim()}". Try a rule name, a tag like Undergraduate, or a school.`}
                        </p>
                    )}
                </main>
            </div>

            {deleteTarget && (
                <DeleteRuleDialog
                    db={dbData}
                    rule={deleteTarget}
                    onClose={() => setDeleteTarget(null)}
                    onDeleted={handleDeleted}
                />
            )}
        </div>
    );
}
