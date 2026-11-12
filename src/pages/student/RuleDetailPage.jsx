// src/pages/student/RuleDetail.jsx
// View/edit page for one grade computation rule, and the "New rule" page
// (grade-rules-spec.txt, PART 4-8). Routes: /student/rules/new and
// /student/rules/:ruleId.
import { useEffect, useState } from "react";
import { Link, useLocation, useNavigate, useParams } from "react-router-dom";
import { XIcon } from "lucide-react";
import { Sidebar } from "@/components/layout/Sidebar";
import { Header } from "@/components/layout/Header";
import { PillEditor } from "@/features/grade-rules/components/PillEditor";
import { RuleFormula } from "@/features/grade-rules/components/RuleFormula";
import { RulePieChart } from "@/features/grade-rules/components/RulePieChart";
import { RuleHierarchyTable } from "@/features/grade-rules/components/RuleHierarchyTable";
import { Dialog } from "@/components/Dialog";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import {
    Field,
    FieldGroup,
    FieldLabel,
    FieldLegend,
    FieldSet,
    FieldTitle,
} from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { DeleteRuleDialog } from "@/features/grade-rules/components/DeleteRuleDialog";
import { saveDbSafely } from "@/services/db";
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
} from "@/lib/rules";
import { useDb } from "@/hooks/useDb";
import { cn } from "@/lib/utils";
import "./RuleDetailPage.css";

// A saved value shown while not editing.
const READONLY_VALUE =
    "flex min-h-control items-center rounded-lg border border-solid border-border bg-muted px-3 py-2 type-small text-foreground";

function detailsOf(rule) {
    return {
        ruleName: rule?.ruleName ?? "",
        tags: rule?.tags ?? [],
        schools: rule?.schools ?? [],
    };
}

// Remounts the editor when the URL changes to another rule, so its state
// always starts from that rule.
export function RuleDetailPage({ isNew = false }) {
    const { ruleId } = useParams();
    return <RuleDetail key={isNew ? "new" : ruleId} ruleId={isNew ? null : ruleId} />;
}

function RuleDetail({ ruleId }) {
    const navigate = useNavigate();
    const location = useLocation();
    const isNew = ruleId === null;
    const [dbData, setDbData] = useDb({ live: false });
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
                        <Link className="rule-back" to="/student/rules">
                            ← All rules
                        </Link>
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
        const saved = saveDbSafely(updatedDb);
        if (!saved.ok) {
            setStatus(`Your changes could not be saved: ${saved.error.message}`);
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
            "Your changes were successfully saved as a new rule.",
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
                : { ...current, schools: [...current.schools, school] },
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
                                <button
                                    type="button"
                                    className="btn-secondary"
                                    onClick={handleDuplicate}
                                >
                                    Duplicate
                                </button>
                                <button
                                    type="button"
                                    className="btn-secondary is-danger"
                                    onClick={() => setShowDelete(true)}
                                >
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
                        {/* Columns follow the width of the page content. */}
                        <div className="@container">
                            <FieldGroup className="grid items-start gap-x-7 gap-y-5 @xl:grid-cols-2 @3xl:grid-cols-3">
                                <Field data-invalid={Boolean(errors.ruleName)} className="gap-1.5">
                                    <FieldLabel
                                        htmlFor={isEditing ? "rule-name" : undefined}
                                        className="font-normal text-muted-foreground"
                                    >
                                        Rule name
                                    </FieldLabel>
                                    {isEditing ? (
                                        <Input
                                            id="rule-name"
                                            className="bg-card max-md:h-control-touch"
                                            value={details.ruleName}
                                            onChange={(event) =>
                                                setDetails((current) => ({
                                                    ...current,
                                                    ruleName: event.target.value,
                                                }))
                                            }
                                            placeholder="e.g. Standard IT Rule (70/30)"
                                            aria-invalid={Boolean(errors.ruleName)}
                                            aria-describedby={
                                                errors.ruleName ? "rule-name-error" : undefined
                                            }
                                        />
                                    ) : (
                                        <span className={READONLY_VALUE}>{details.ruleName}</span>
                                    )}
                                    {errors.ruleName && (
                                        <small
                                            id="rule-name-error"
                                            className="type-small text-destructive"
                                        >
                                            {errors.ruleName}
                                        </small>
                                    )}
                                </Field>

                                <FieldSet className="m-0 min-w-0 gap-1.5 border-0 p-0">
                                    <FieldLegend
                                        variant="label"
                                        className="p-0 font-normal text-muted-foreground"
                                    >
                                        Tags
                                    </FieldLegend>
                                    <div className="flex flex-wrap gap-2">
                                        {isEditing ? (
                                            DEFAULT_TAGS.map((tag) => (
                                                <label
                                                    key={tag}
                                                    className="inline-flex cursor-pointer items-center gap-1.5 rounded-full border border-solid border-border px-3 py-1.5 type-small text-foreground has-data-checked:border-primary has-data-checked:bg-secondary has-data-checked:text-primary max-md:min-h-11"
                                                >
                                                    <Checkbox
                                                        checked={details.tags.includes(tag)}
                                                        onCheckedChange={() => toggleTag(tag)}
                                                    />
                                                    {tag}
                                                </label>
                                            ))
                                        ) : details.tags.length > 0 ? (
                                            details.tags.map((tag) => (
                                                <Badge
                                                    key={tag}
                                                    variant="secondary"
                                                    className="h-auto px-3 py-1.5 type-small"
                                                >
                                                    {tag}
                                                </Badge>
                                            ))
                                        ) : (
                                            <span className={cn(READONLY_VALUE, "w-full")}>
                                                No tags
                                            </span>
                                        )}
                                    </div>
                                </FieldSet>

                                <Field className="gap-1.5">
                                    {isEditing ? (
                                        <FieldLabel
                                            htmlFor="rule-school-input"
                                            className="font-normal text-muted-foreground"
                                        >
                                            Schools that use this rule
                                        </FieldLabel>
                                    ) : (
                                        <FieldTitle className="font-normal text-muted-foreground">
                                            Schools that use this rule
                                        </FieldTitle>
                                    )}
                                    {details.schools.length > 0 && (
                                        <ul className="m-0 flex list-none flex-wrap gap-1.5 p-0">
                                            {details.schools.map((school) => (
                                                <li key={school} className="max-w-full">
                                                    <Badge
                                                        variant="outline"
                                                        className={cn(
                                                            "h-auto max-w-full gap-1 overflow-visible py-1 pl-2.5 type-small font-normal whitespace-normal text-foreground",
                                                            isEditing ? "pr-0.5" : "pr-2.5",
                                                        )}
                                                    >
                                                        {school}
                                                        {isEditing && (
                                                            <Button
                                                                variant="ghost"
                                                                size="icon-xs"
                                                                className="rounded-full text-muted-foreground"
                                                                onClick={() => removeSchool(school)}
                                                                aria-label={`Remove ${school}`}
                                                            >
                                                                <XIcon aria-hidden="true" />
                                                            </Button>
                                                        )}
                                                    </Badge>
                                                </li>
                                            ))}
                                        </ul>
                                    )}
                                    {isEditing ? (
                                        <div className="flex gap-2">
                                            <Input
                                                id="rule-school-input"
                                                className="min-w-0 flex-1 bg-card max-md:h-control-touch"
                                                value={schoolInput}
                                                onChange={(event) =>
                                                    setSchoolInput(event.target.value)
                                                }
                                                onKeyDown={(event) => {
                                                    if (event.key === "Enter") {
                                                        event.preventDefault();
                                                        addSchool();
                                                    }
                                                }}
                                                placeholder="School name"
                                            />
                                            <Button
                                                variant="outline"
                                                className="shrink-0 bg-card max-md:h-control-touch"
                                                onClick={addSchool}
                                            >
                                                Add school
                                            </Button>
                                        </div>
                                    ) : (
                                        details.schools.length === 0 && (
                                            <span className={READONLY_VALUE}>
                                                No schools listed
                                            </span>
                                        )
                                    )}
                                </Field>
                            </FieldGroup>
                        </div>
                    </section>

                    <section className="rule-section" aria-labelledby="rule-criteria-title">
                        <h2 id="rule-criteria-title">Criteria</h2>
                        {isEditing ? (
                            <PillEditor
                                tree={tree}
                                onChange={handleTreeChange}
                                structureLocked={false}
                            />
                        ) : (
                            <RuleHierarchyTable tree={tree} />
                        )}
                        {errors.tree && (
                            <p className="m-0 type-small text-destructive" role="alert">
                                {errors.tree}
                            </p>
                        )}
                        <RuleFormula tree={tree} />
                    </section>

                    <section className="rule-section" aria-labelledby="rule-breakdown-title">
                        <div className="rule-section-heading">
                            <h2 id="rule-breakdown-title">Breakdown</h2>
                            <div className="rules-toggle" role="group" aria-label="Breakdown view">
                                {[
                                    ["pie", "Pie chart"],
                                    ["table", "Table"],
                                ].map(([id, label]) => (
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
                        {view === "pie" ? (
                            <RulePieChart tree={tree} size={240} showLegend />
                        ) : (
                            <RuleHierarchyTable tree={tree} />
                        )}
                    </section>

                    {hasEdits && (
                        <div className="rule-savebar">
                            <p role="status">
                                {status || (!isNew ? "You have unsaved changes." : "")}
                            </p>
                            <div>
                                {!isNew && (
                                    <button
                                        type="button"
                                        className="btn-secondary"
                                        onClick={handleDiscard}
                                    >
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
                            <button
                                type="button"
                                className="rule-impact-cancel"
                                onClick={() => setPendingImpact(null)}
                            >
                                Cancel
                            </button>
                            {pendingImpact.classes.length > 0 ? (
                                <>
                                    <button
                                        type="button"
                                        className="rule-impact-new"
                                        onClick={handleSaveAsNew}
                                    >
                                        Save as new rule
                                    </button>
                                    <button
                                        type="button"
                                        className="rule-impact-confirm"
                                        onClick={applyUpdate}
                                    >
                                        Update anyway
                                    </button>
                                </>
                            ) : (
                                <button
                                    type="button"
                                    className="rule-impact-confirm"
                                    onClick={applyUpdate}
                                >
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
                                {pendingImpact.classes.length === 1 ? "" : "s"}. Updating it
                                recalculates their grades using the new rule:
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
                            counting, because{" "}
                            {pendingImpact.lostTasks.length === 1
                                ? "that criterion was"
                                : "those criteria were"}{" "}
                            removed. The tasks stay saved.
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
