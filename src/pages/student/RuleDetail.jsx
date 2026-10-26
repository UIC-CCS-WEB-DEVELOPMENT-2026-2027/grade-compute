// src/pages/student/RuleDetail.jsx
// View/edit page for one grade computation rule, and the "New rule" page
// (grade-rules-spec.txt, PART 4-8). Routes: /student/rules/new and
// /student/rules/:ruleId.
import { useEffect, useState } from "react";
import { Link, useLocation, useNavigate, useParams } from "react-router-dom";
import Sidebar from "../../components/shared/Sidebar";
import Header from "../../components/shared/Header";
import PillEditor from "../../components/shared/PillEditor";
import RuleFormula from "../../components/shared/RuleFormula";
import RulePieChart from "../../components/shared/RulePieChart";
import RuleHierarchyTable from "../../components/shared/RuleHierarchyTable";
import Dialog from "../../components/shared/Dialog";
import DeleteRuleDialog from "../../components/shared/DeleteRuleDialog";
import { getDb, saveDb } from "../../utils/db";
import {
    DEFAULT_TAGS,
    buildRuleMath,
    createDefaultTree,
    createRule,
    duplicateRule,
    getCopyName,
    getRuleChangeImpact,
    getRuleUsage,
    isCopiedRule,
    ruleToTree,
    updateRule,
    validateRuleDetails,
} from "../../utils/rules";
import "./GradeRules.css";
import "./RuleDetail.css";

function detailsOf(rule) {
    return {
        ruleName: rule?.ruleName ?? "",
        tags: rule?.tags ?? [],
        schools: rule?.schools ?? [],
    };
}

// Remounts the editor when the URL changes to another rule, so its state
// always starts from that rule.
export default function RuleDetailPage({ isNew = false }) {
    const { ruleId } = useParams();
    return <RuleDetail key={isNew ? "new" : ruleId} ruleId={isNew ? null : ruleId} />;
}

function RuleDetail({ ruleId }) {
    const navigate = useNavigate();
    const location = useLocation();
    const isNew = ruleId === null;
    const [dbData, setDbData] = useState(() => getDb());
    const rule = isNew ? null : dbData?.computationRules?.find((item) => item.id === ruleId);

    const [details, setDetails] = useState(() => detailsOf(rule));
    const [tree, setTree] = useState(() => (rule ? ruleToTree(rule) : createDefaultTree()));
    const [saved, setSaved] = useState(() => JSON.stringify({ details: detailsOf(rule), tree }));
    const [schoolInput, setSchoolInput] = useState("");
    const [view, setView] = useState("pie");
    const [errors, setErrors] = useState({});
    const [status, setStatus] = useState(() => location.state?.notice ?? "");
    const [isEditing, setIsEditing] = useState(isNew);
    const [pendingImpact, setPendingImpact] = useState(null);
    const [showDelete, setShowDelete] = useState(false);

    useEffect(() => {
        if (location.state?.notice) {
            navigate(location.pathname, { replace: true, state: null });
        }
    }, [location.pathname, location.state, navigate]);

    if (!isNew && !rule) {
        return (
            <div className="rules-layout">
                <Sidebar />
                <div className="rules-main">
                    <Header />
                    <main className="rules-content">
                        <Link className="rule-back" to="/student/rules">← All rules</Link>
                        <h1>Rule not found</h1>
                        <p>This rule may have been deleted. Go back to see all rules.</p>
                    </main>
                </div>
            </div>
        );
    }

    const hasEdits = JSON.stringify({ details, tree }) !== saved;
    const isDirty = isNew || hasEdits;
    const usage = isNew ? null : getRuleUsage(dbData, rule.id);

    function commit(updatedDb) {
        try {
            saveDb(updatedDb);
        } catch (error) {
            setStatus(`Your changes could not be saved: ${error.message}`);
            return false;
        }
        setDbData(updatedDb);
        return true;
    }

    // Checks name, tags, schools, and criteria before any save.
    function validate() {
        const detailCheck = validateRuleDetails(dbData, details, rule?.id ?? null);
        const math = buildRuleMath(tree);
        const nextErrors = { ...detailCheck.errors, ...(math.ok ? {} : { tree: math.error }) };
        setErrors(nextErrors);
        if (Object.keys(nextErrors).length > 0) {
            setStatus("Fix the highlighted fields, then save again.");
            return false;
        }
        return true;
    }

    function saveNewRule(ruleName, successNotice = "") {
        const result = createRule(dbData, { ...details, ruleName, tree });
        if (!result.ok) {
            setErrors(result.errors);
            setStatus(result.error);
            return;
        }
        if (commit(result.db)) {
            navigate(`/student/rules/${result.rule.id}`, {
                replace: isNew,
                state: successNotice ? { notice: successNotice } : null,
            });
        }
    }

    function applyUpdate() {
        setPendingImpact(null);
        const result = updateRule(dbData, rule.id, { ...details, tree });
        if (!result.ok) {
            setErrors(result.errors);
            setStatus(result.error);
            return;
        }
        if (commit(result.db)) {
            const savedDetails = detailsOf(result.rule);
            setDetails(savedDetails);
            setSaved(JSON.stringify({ details: savedDetails, tree }));
            setStatus("Changes saved.");
            setIsEditing(false);
        }
    }

    function handleSave() {
        setStatus("");
        if (!validate()) return;
        if (isNew) {
            saveNewRule(details.ruleName);
            return;
        }
        const impact = getRuleChangeImpact(dbData, rule.id, tree);
        if (impact.classes.length > 0 || isCopy) {
            setPendingImpact({ ...impact, isCopy });
            return;
        }
        applyUpdate();
    }

    function handleSaveAsNew() {
        setPendingImpact(null);
        setStatus("");
        const sameName = details.ruleName.trim().toLowerCase() === rule.ruleName.toLowerCase();
        saveNewRule(
            sameName ? getCopyName(dbData, rule.ruleName) : details.ruleName,
            "Your changes were successfully saved as a new rule."
        );
    }

    function handleDuplicate() {
        const result = duplicateRule(dbData, rule.id);
        if (result.ok && commit(result.db)) navigate(`/student/rules/${result.rule.id}`);
    }

    function handleDiscard() {
        const original = JSON.parse(saved);
        setDetails(original.details);
        setTree(original.tree);
        setErrors({});
        setStatus("Changes discarded.");
        setIsEditing(false);
    }

    function cancelEditing() {
        if (hasEdits) {
            handleDiscard();
            return;
        }
        setStatus("");
        setIsEditing(false);
    }

    function toggleTag(tag) {
        setDetails((current) => ({
            ...current,
            tags: current.tags.includes(tag)
                ? current.tags.filter((item) => item !== tag)
                : [...current.tags, tag],
        }));
    }

    function addSchool() {
        const school = schoolInput.trim();
        if (!school) return;
        setDetails((current) =>
            current.schools.some((item) => item.toLowerCase() === school.toLowerCase())
                ? current
                : { ...current, schools: [...current.schools, school] }
        );
        setSchoolInput("");
    }

    function removeSchool(school) {
        setDetails((current) => ({
            ...current,
            schools: current.schools.filter((item) => item !== school),
        }));
    }

    function handleTreeChange(nextTree) {
        setTree(nextTree);
        setErrors((current) => ({ ...current, tree: undefined }));
    }

    const subjectCount = usage?.classes.length ?? 0;
    const isCopy = !isNew && isCopiedRule(rule);

    return (
        <div className="rules-layout">
            <Sidebar />
            <div className="rules-main">
                <Header />
                <main className="rules-content rule-detail">
                    <Link className="rule-back rule-back-button" to="/student/rules">
                        <span aria-hidden="true">
                            <svg viewBox="0 0 16 16" fill="none">
                                <path d="M10.5 3.5 6 8l4.5 4.5M6.5 8h7" />
                            </svg>
                        </span>
                        All rules
                    </Link>

                    <header className="rule-detail-heading">
                        <div>
                            <h1>{isNew ? "New rule" : rule.ruleName}</h1>
                            <p>
                                {isNew
                                    ? "Split the grade into criteria, then save the rule to use it for your subjects."
                                    : subjectCount === 0
                                        ? "Not used by any subject yet."
                                        : `Used by ${usage.classes.map((item) => item.subjectCode).join(", ")}.`}
                            </p>
                        </div>
                        {!isNew && (
                            <div className="rule-detail-tools">
                                {isEditing ? (
                                    <button
                                        type="button"
                                        className="btn-secondary"
                                        onClick={cancelEditing}
                                    >
                                        Cancel editing
                                    </button>
                                ) : (
                                    <button
                                        type="button"
                                        className="btn-primary"
                                        onClick={() => {
                                            setStatus("");
                                            setIsEditing(true);
                                        }}
                                    >
                                        Edit
                                    </button>
                                )}
                                <button type="button" className="btn-secondary" onClick={handleDuplicate}>
                                    Duplicate
                                </button>
                                <button type="button" className="btn-secondary is-danger" onClick={() => setShowDelete(true)}>
                                    Delete
                                </button>
                            </div>
                        )}
                    </header>
                    {status && !hasEdits && (
                        <p className="rule-save-success" role="status">
                            {status}
                        </p>
                    )}

                    <section className="rule-section" aria-labelledby="rule-details-title">
                        <h2 id="rule-details-title">Details</h2>
                        <div className="rule-details-grid">
                            <label className="rule-field">
                                <span>Rule name</span>
                                {isEditing ? (
                                    <input
                                        value={details.ruleName}
                                        onChange={(event) =>
                                            setDetails((current) => ({ ...current, ruleName: event.target.value }))
                                        }
                                        placeholder="e.g. Standard IT Rule (70/30)"
                                        aria-invalid={Boolean(errors.ruleName)}
                                        aria-describedby={errors.ruleName ? "rule-name-error" : undefined}
                                    />
                                ) : (
                                    <span className="rule-readonly-value">{details.ruleName}</span>
                                )}
                                {errors.ruleName && (
                                    <small id="rule-name-error" className="rule-field-error">{errors.ruleName}</small>
                                )}
                            </label>

                            <fieldset className="rule-field">
                                <legend>Tags</legend>
                                <div className="rule-tag-options">
                                    {isEditing
                                        ? DEFAULT_TAGS.map((tag) => (
                                            <label key={tag} className="rule-tag-option">
                                                <input
                                                    type="checkbox"
                                                    checked={details.tags.includes(tag)}
                                                    onChange={() => toggleTag(tag)}
                                                />
                                                {tag}
                                            </label>
                                        ))
                                        : details.tags.length > 0
                                            ? details.tags.map((tag) => (
                                                <span key={tag} className="rule-tag-option is-readonly">{tag}</span>
                                            ))
                                            : <span className="rule-readonly-value">No tags</span>}
                                </div>
                            </fieldset>

                            <div className="rule-field rule-schools">
                                <span>Schools that use this rule</span>
                                {details.schools.length > 0 && (
                                    <ul>
                                        {details.schools.map((school) => (
                                            <li key={school}>
                                                {school}
                                                {isEditing && (
                                                    <button
                                                        type="button"
                                                        onClick={() => removeSchool(school)}
                                                        aria-label={`Remove ${school}`}
                                                    >
                                                        ×
                                                    </button>
                                                )}
                                            </li>
                                        ))}
                                    </ul>
                                )}
                                {isEditing
                                    ? (
                                        <div className="rule-school-add">
                                            <input
                                                id="rule-school-input"
                                                value={schoolInput}
                                                onChange={(event) => setSchoolInput(event.target.value)}
                                                onKeyDown={(event) => {
                                                    if (event.key === "Enter") {
                                                        event.preventDefault();
                                                        addSchool();
                                                    }
                                                }}
                                                placeholder="School name"
                                            />
                                            <button type="button" className="btn-secondary" onClick={addSchool}>
                                                Add school
                                            </button>
                                        </div>
                                    )
                                    : details.schools.length === 0 && (
                                        <span className="rule-readonly-value">No schools listed</span>
                                    )}
                            </div>
                        </div>
                    </section>

                    <section className="rule-section" aria-labelledby="rule-criteria-title">
                        <h2 id="rule-criteria-title">Criteria</h2>
                        {isEditing
                            ? <PillEditor tree={tree} onChange={handleTreeChange} structureLocked={false} />
                            : <RuleHierarchyTable tree={tree} />}
                        {errors.tree && <p className="rule-field-error" role="alert">{errors.tree}</p>}
                        <RuleFormula tree={tree} />
                    </section>

                    <section className="rule-section" aria-labelledby="rule-breakdown-title">
                        <div className="rule-section-heading">
                            <h2 id="rule-breakdown-title">Breakdown</h2>
                            <div className="rules-toggle" role="group" aria-label="Breakdown view">
                                {[["pie", "Pie chart"], ["table", "Table"]].map(([id, label]) => (
                                    <button
                                        key={id}
                                        type="button"
                                        aria-pressed={view === id}
                                        onClick={() => setView(id)}
                                    >
                                        {label}
                                    </button>
                                ))}
                            </div>
                        </div>
                        {view === "pie"
                            ? <RulePieChart tree={tree} size={240} showLegend />
                            : <RuleHierarchyTable tree={tree} />}
                    </section>

                    {hasEdits && (
                        <div className="rule-savebar">
                            <p role="status">{status || (!isNew ? "You have unsaved changes." : "")}</p>
                            <div>
                                {!isNew && (
                                    <button type="button" className="btn-secondary" onClick={handleDiscard}>
                                        Discard changes
                                    </button>
                                )}
                                {!isNew && (
                                    <button
                                        type="button"
                                        className="btn-secondary"
                                        onClick={() => validate() && handleSaveAsNew()}
                                    >
                                        Save as new rule
                                    </button>
                                )}
                                <button
                                    type="button"
                                    className="btn-primary"
                                    onClick={handleSave}
                                    disabled={!isDirty}
                                >
                                    {isNew ? "Create rule" : "Save changes"}
                                </button>
                            </div>
                        </div>
                    )}
                </main>
            </div>

            {pendingImpact && (
                <Dialog
                    title={
                        <>
                            <span className="rule-impact-eyebrow">
                                {pendingImpact.classes.length > 0 ? "Rule update" : "Copied rule"}
                            </span>
                            {pendingImpact.classes.length > 0
                                ? "Update this rule for every subject?"
                                : "Save changes to this copy?"}
                        </>
                    }
                    className="rule-impact-dialog"
                    onClose={() => setPendingImpact(null)}
                    actions={
                        <>
                            <button type="button" className="rule-impact-cancel" onClick={() => setPendingImpact(null)}>
                                Cancel
                            </button>
                            {pendingImpact.classes.length > 0 ? (
                                <>
                                    <button type="button" className="rule-impact-new" onClick={handleSaveAsNew}>
                                        Save as new rule
                                    </button>
                                    <button type="button" className="rule-impact-confirm" onClick={applyUpdate}>
                                        Update anyway
                                    </button>
                                </>
                            ) : (
                                <button type="button" className="rule-impact-confirm" onClick={applyUpdate}>
                                    Save changes
                                </button>
                            )}
                        </>
                    }
                >
                    {pendingImpact.classes.length > 0 ? (
                        <>
                            <p className="rule-impact-description">
                                This rule is used by {pendingImpact.classes.length} subject
                                {pendingImpact.classes.length === 1 ? "" : "s"}. Updating it recalculates
                                their grades using the new rule:
                            </p>
                            <ul className="rule-impact-subjects">
                                {pendingImpact.classes.map((item) => (
                                    <li key={item.classId}>
                                        <span className="rule-impact-code">{item.subjectCode}</span>
                                        <span className="rule-impact-name">
                                            {item.subjectName}
                                            {item.programSection && ` (${item.programSection})`}
                                        </span>
                                    </li>
                                ))}
                            </ul>
                        </>
                    ) : (
                        <p className="rule-impact-description">
                            Saving updates this copy only. The original rule will stay unchanged.
                        </p>
                    )}
                    {pendingImpact.lostTaskCount > 0 && (
                        <p className="app-dialog-warning">
                            {pendingImpact.lostTaskCount} recorded task
                            {pendingImpact.lostTaskCount === 1 ? "" : "s"} in{" "}
                            {pendingImpact.lostTasks.map((item) => item.name).join(", ")} will stop
                            counting, because {pendingImpact.lostTasks.length === 1 ? "that criterion was" : "those criteria were"} removed.
                            The tasks stay saved.
                        </p>
                    )}
                    {pendingImpact.classes.length > 0 && (
                        <p className="rule-impact-note">
                            To keep these subjects unchanged, save your edits as a new rule instead.
                        </p>
                    )}
                </Dialog>
            )}

            {showDelete && (
                <DeleteRuleDialog
                    db={dbData}
                    rule={rule}
                    onClose={() => setShowDelete(false)}
                    onDeleted={(updatedDb) => {
                        setShowDelete(false);
                        if (commit(updatedDb)) navigate("/student/rules");
                    }}
                />
            )}
        </div>
    );
}
