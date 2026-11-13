// src/pages/student/RuleDetail.jsx
// View/edit page for one grade computation rule, and the "New rule" page
// (grade-rules-spec.txt, PART 4-8). Routes: /student/rules/new and
// /student/rules/:ruleId.
import { useEffect, useState } from "react";
import { useLocation, useNavigate, useParams } from "react-router-dom";
import { XIcon } from "lucide-react";
import { BackLink } from "@/components/BackLink";
import { PageShell } from "@/components/layout/PageShell";
import { PillEditor } from "@/features/grade-rules/components/PillEditor";
import { RuleFormula } from "@/features/grade-rules/components/RuleFormula";
import { RulePieChart } from "@/features/grade-rules/components/RulePieChart";
import { RuleHierarchyTable } from "@/features/grade-rules/components/RuleHierarchyTable";
import { Alert } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardFooter } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Empty, EmptyHeader } from "@/components/ui/empty";
import {
    Field,
    FieldGroup,
    FieldLabel,
    FieldLegend,
    FieldSet,
    FieldTitle,
} from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { Separator } from "@/components/ui/separator";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import { DeleteRuleButton } from "@/features/grade-rules/components/DeleteRuleButton";
import { DeleteRuleDialog } from "@/features/grade-rules/components/DeleteRuleDialog";
import { RuleDialog } from "@/features/grade-rules/components/RuleDialog";
import { RuleSubjectList } from "@/features/grade-rules/components/RuleSubjectList";
import { RuleWarning } from "@/features/grade-rules/components/RuleWarning";
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

// The page's three sections (Details, Criteria, Breakdown) inside one card.
const SECTION = "flex flex-col gap-5 px-(--card-spacing) py-6";
const SECTION_TITLE = "m-0 type-section-title text-foreground";
// The page's buttons: 44px below md.
const ACTION = "max-md:h-control-touch";

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
            <PageShell showFooter={false}>
                <div className="flex flex-col gap-7">
                    <div>
                        <BackLink to="/student/rules" className="max-md:h-control-touch">
                            All rules
                        </BackLink>
                    </div>
                    <Empty className="rounded-xl border border-solid border-border bg-card">
                        <EmptyHeader>
                            <h1 className="m-0 type-page-title text-foreground">Rule not found</h1>
                            <p className="m-0 type-body text-muted-foreground">
                                This rule may have been deleted. Go back to see all rules.
                            </p>
                        </EmptyHeader>
                    </Empty>
                </div>
            </PageShell>
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
        // The Grade Rules pages have no footer.
        <PageShell showFooter={false}>
            <div className="flex flex-col gap-7">
                <div>
                    <BackLink to="/student/rules" className="max-md:h-control-touch">
                        All rules
                    </BackLink>
                </div>

                <header className="flex flex-wrap items-end justify-between gap-4">
                    <div>
                        <h1 className="m-0 type-page-title text-foreground">
                            {isNew ? "New rule" : rule.ruleName}
                        </h1>
                        <p className="m-0 mt-1.5 type-body text-muted-foreground">
                            {isNew
                                ? "Split the grade into criteria, then save the rule to use it for your subjects."
                                : subjectCount === 0
                                  ? "Not used by any subject yet."
                                  : `Used by ${usage.classes.map((item) => item.subjectCode).join(", ")}.`}
                        </p>
                    </div>
                    {!isNew && (
                        <div className="flex flex-wrap gap-2">
                            {isEditing ? (
                                <Button
                                    variant="outline"
                                    className={ACTION}
                                    onClick={cancelEditing}
                                >
                                    Cancel editing
                                </Button>
                            ) : (
                                <Button
                                    className={ACTION}
                                    onClick={() => {
                                        setStatus("");
                                        setIsEditing(true);
                                    }}
                                >
                                    Edit
                                </Button>
                            )}
                            <Button variant="outline" className={ACTION} onClick={handleDuplicate}>
                                Duplicate
                            </Button>
                            <DeleteRuleButton
                                className={ACTION}
                                onClick={() => setShowDelete(true)}
                            />
                        </div>
                    )}
                </header>
                {status && !hasEdits && (
                    <Alert
                        role="status"
                        className="border-0 border-l-4 border-solid border-primary bg-secondary px-3.5 py-2.5 text-primary"
                    >
                        {status}
                    </Alert>
                )}

                <Card className="gap-0 py-0">
                    <section className={SECTION} aria-labelledby="rule-details-title">
                        <h2 id="rule-details-title" className={SECTION_TITLE}>
                            Details
                        </h2>
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
                                                    className="inline-flex cursor-pointer items-center gap-1.5 rounded-full border border-solid border-border px-3 py-1.5 type-small text-foreground has-data-checked:border-primary has-data-checked:bg-secondary has-data-checked:text-primary tap:min-h-11"
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
                                                                className="relative rounded-full text-muted-foreground tap:after:absolute tap:after:-inset-2.75"
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

                    <Separator />
                    <section className={SECTION} aria-labelledby="rule-criteria-title">
                        <h2 id="rule-criteria-title" className={SECTION_TITLE}>
                            Criteria
                        </h2>
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

                    <Separator />
                    <section className={SECTION} aria-labelledby="rule-breakdown-title">
                        <div className="flex flex-wrap items-center justify-between gap-3">
                            <h2 id="rule-breakdown-title" className={SECTION_TITLE}>
                                Breakdown
                            </h2>
                            <ToggleGroup
                                aria-label="Breakdown view"
                                value={[view]}
                                // Pressing the selected view again keeps it selected.
                                onValueChange={(value) => {
                                    if (value[0]) setView(value[0]);
                                }}
                                spacing={0.5}
                                className="rounded-lg border border-border bg-muted p-0.5"
                            >
                                {[
                                    ["pie", "Pie chart"],
                                    ["table", "Table"],
                                ].map(([id, label]) => (
                                    <ToggleGroupItem
                                        key={id}
                                        value={id}
                                        size="sm"
                                        className="px-3 font-normal text-foreground hover:bg-secondary hover:text-primary aria-pressed:bg-primary aria-pressed:text-primary-foreground max-md:h-control-touch"
                                    >
                                        {label}
                                    </ToggleGroupItem>
                                ))}
                            </ToggleGroup>
                        </div>
                        {view === "pie" ? (
                            <RulePieChart tree={tree} size={240} showLegend />
                        ) : (
                            <RuleHierarchyTable tree={tree} />
                        )}
                    </section>

                    {hasEdits && (
                        <CardFooter className="flex-wrap justify-between gap-3 py-3.5">
                            <p className="m-0 type-small text-muted-foreground" role="status">
                                {status || (!isNew ? "You have unsaved changes." : "")}
                            </p>
                            <div className="flex flex-wrap gap-2">
                                {!isNew && (
                                    <Button
                                        variant="outline"
                                        className={ACTION}
                                        onClick={handleDiscard}
                                    >
                                        Discard changes
                                    </Button>
                                )}
                                {!isNew && (
                                    <Button
                                        variant="outline"
                                        className={ACTION}
                                        onClick={() => validate() && handleSaveAsNew()}
                                    >
                                        Save as new rule
                                    </Button>
                                )}
                                <Button className={ACTION} onClick={handleSave} disabled={!isDirty}>
                                    {isNew ? "Create rule" : "Save changes"}
                                </Button>
                            </div>
                        </CardFooter>
                    )}
                </Card>
            </div>

            {pendingImpact && (
                <RuleDialog
                    eyebrow={pendingImpact.classes.length > 0 ? "Rule update" : "Copied rule"}
                    title={
                        pendingImpact.classes.length > 0
                            ? "Update this rule for every subject?"
                            : "Save changes to this copy?"
                    }
                    onClose={() => setPendingImpact(null)}
                    actions={
                        pendingImpact.classes.length > 0 ? (
                            <>
                                <Button
                                    variant="outline"
                                    className={ACTION}
                                    onClick={handleSaveAsNew}
                                >
                                    Save as new rule
                                </Button>
                                <Button
                                    className={cn(ACTION, "hover:shadow-card")}
                                    onClick={applyUpdate}
                                >
                                    Update anyway
                                </Button>
                            </>
                        ) : (
                            <Button
                                className={cn(ACTION, "hover:shadow-card")}
                                onClick={applyUpdate}
                            >
                                Save changes
                            </Button>
                        )
                    }
                >
                    {pendingImpact.classes.length > 0 ? (
                        <>
                            <p className="m-0 type-small text-muted-foreground">
                                This rule is used by {pendingImpact.classes.length} subject
                                {pendingImpact.classes.length === 1 ? "" : "s"}. Updating it
                                recalculates their grades using the new rule:
                            </p>
                            <RuleSubjectList classes={pendingImpact.classes} />
                        </>
                    ) : (
                        <p className="m-0 type-small text-muted-foreground">
                            Saving updates this copy only. The original rule will stay unchanged.
                        </p>
                    )}
                    {pendingImpact.lostTaskCount > 0 && (
                        <RuleWarning>
                            {pendingImpact.lostTaskCount} recorded task
                            {pendingImpact.lostTaskCount === 1 ? "" : "s"} in{" "}
                            {pendingImpact.lostTasks.map((item) => item.name).join(", ")} will stop
                            counting, because{" "}
                            {pendingImpact.lostTasks.length === 1
                                ? "that criterion was"
                                : "those criteria were"}{" "}
                            removed. The tasks stay saved.
                        </RuleWarning>
                    )}
                    {pendingImpact.classes.length > 0 && (
                        <p className="m-0 type-small text-muted-foreground">
                            To keep these subjects unchanged, save your edits as a new rule instead.
                        </p>
                    )}
                </RuleDialog>
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
        </PageShell>
    );
}
