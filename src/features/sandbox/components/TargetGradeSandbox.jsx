// src/components/student/TargetGradeSandbox.jsx
// Target Grade Sandbox for one subject and term. Works with any grading
// rule: each deepest criterion of the rule gets its own row.
// The math lives in utils/sandbox.js. Sandbox settings and draft scores
// are private to the student and never change official scores. Draft
// scores are stored apart from the real scores and are used only here.
import { useState } from "react";
import { getDb, saveDb } from "@/services/db";
import { getStudentClass, updateStudentRecord } from "@/services/records";
import { calculateOfficialGrade, calculateUnofficialGrade } from "@/lib/grades";
import { formatPercent } from "@/lib/rules";
import { getActiveStudentId } from "@/services/session";
import {
    getSandboxPlan,
    MAX_UPCOMING,
    requiredScore,
    setDraftScore,
    updateSandboxSettings,
    withDraftScores,
} from "@/lib/sandbox";
import { focusTaskRow } from "@/lib/dom/focusTask";
import { getGradeHistory, getPlanPoints } from "@/lib/history";
import { validateScore } from "@/lib/scores";
import { getSandboxTarget } from "@/lib/targets";
import { TERM_LABELS } from "@/lib/terms";
import { HistoryChart } from "@/features/history/components/HistoryChart";
import { formatGrade } from "@/lib/format";
import { GradeGauge } from "@/components/GradeGauge";
import { ChevronRightIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { Field, FieldLabel } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import {
    InputGroup,
    InputGroupAddon,
    InputGroupInput,
    InputGroupText,
} from "@/components/ui/input-group";
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table";
import { useDb } from "@/hooks/useDb";
import { cn } from "@/lib/utils";

function pluralTasks(count) {
    return `${count} ${count === 1 ? "task" : "tasks"}`;
}

// The four step cards: white fading to muted, as before.
const STEP_CARD = "gap-0 bg-linear-145 from-card from-55% to-muted shadow-card";
const CRITERIA_COLUMNS = ["Criterion", "Scored so far", "Upcoming tasks", "Expected %", "You need"];
// Criteria table cells. When the sandbox is narrow, each criterion becomes a
// small card: the header row is hidden and each cell shows its own label.
const CELL = "py-3 whitespace-normal @max-xl:p-0";
const CELL_LABEL =
    "mb-1 hidden type-caption tracking-wide text-muted-foreground uppercase @max-xl:block";
const CELL_NOTE = "mt-0.5 block type-small text-muted-foreground";
const NUMBER_INPUT = "w-18 bg-card tabular-nums hover:bg-muted";
const DRAFT_NOTE = "block type-small text-muted-foreground";

// A step heading inside a sandbox card, numbered for the three steps.
function SandboxStep({ id, number, children }) {
    return (
        <h2 id={id} className="m-0 flex items-center gap-2 type-card-title text-foreground">
            {number && (
                <span
                    aria-hidden="true"
                    className="inline-grid size-6 shrink-0 place-items-center rounded-full bg-secondary type-caption font-bold text-primary"
                >
                    {number}
                </span>
            )}
            {children}
        </h2>
    );
}

// The result card's colours for each tone: the card, and its divider lines.
const RESULT_TONES = {
    required: {
        card: "border-0 bg-primary text-primary-foreground",
        line: "border-primary-foreground/20",
    },
    reached: {
        card: "border-0 bg-success text-success-foreground",
        line: "border-success-foreground/20",
    },
    impossible: {
        card: "border-warning/35 bg-warning-soft text-foreground",
        line: "border-warning/35",
    },
    empty: {
        card: "border-0 bg-muted text-foreground shadow-none",
        line: "border-border",
    },
};

// The answer card. Kept separate so it is easy to find in the code too.
function SandboxResult({ plan, termLabel }) {
    const { status, target, required, projected, best, requiredSlots, criteria } = plan;
    const requiredCriteria = criteria.filter(
        (criterion) => criterion.counted && criterion.usesRequired,
    );

    let tone = "required";
    let headline = formatGrade(required);
    let message = `Score at least ${formatGrade(required)} on each of your ${pluralTasks(requiredSlots)} left this term.`;
    if (status === "impossible") {
        tone = "impossible";
        headline = "Out of reach";
        message = `Even 100% on every remaining task gives ${formatGrade(best)}. Try a lower target, or add upcoming tasks if there are more.`;
    } else if (status === "reached") {
        tone = "reached";
        headline = "Reached";
        message = `You reach ${formatGrade(target)} even with 0% on the remaining tasks.`;
    } else if (status === "complete") {
        tone = projected >= target ? "reached" : "impossible";
        headline = formatGrade(projected);
        message = `No task is left to plan. This is your projected ${termLabel} grade, using your scores and expected percentages.`;
    } else if (status === "empty") {
        tone = "empty";
        headline = "—";
        message = "Add upcoming tasks below to see the score you need.";
    }

    const colors = RESULT_TONES[tone];

    return (
        <section aria-labelledby="sandbox-result-label" aria-live="polite">
            <Card className={cn("gap-0 shadow-hover", colors.card)}>
                <CardContent>
                    <p
                        className="m-0 type-caption tracking-wider uppercase"
                        id="sandbox-result-label"
                    >
                        Your result · To reach {formatGrade(target)} in {termLabel}
                    </p>
                    <p className="m-0 mt-1.5 type-page-title tabular-nums">{headline}</p>
                    {status === "required" && (
                        <p className="m-0 mt-1 type-body font-semibold">
                            needed on each remaining task
                        </p>
                    )}
                    <p className="m-0 mt-3 type-small">{message}</p>

                    {status === "required" && requiredCriteria.length > 0 && (
                        <ul
                            className={cn(
                                "m-0 mt-4 list-none border-0 border-t border-solid p-0 pt-3 type-small",
                                colors.line,
                            )}
                            aria-label="Remaining tasks this applies to"
                        >
                            {requiredCriteria.map((criterion) => (
                                <li
                                    key={criterion.id}
                                    className="flex justify-between gap-3 py-0.5"
                                >
                                    <span>{criterion.path.join(" › ")}</span>
                                    <span className="shrink-0 font-semibold">
                                        {pluralTasks(criterion.slots)}
                                    </span>
                                </li>
                            ))}
                        </ul>
                    )}

                    {projected !== null && status !== "complete" && status !== "empty" && (
                        <p
                            className={cn(
                                "m-0 mt-4 flex items-baseline justify-between gap-3 border-0 border-t border-solid pt-3 type-small",
                                colors.line,
                            )}
                        >
                            Projected {termLabel} grade
                            <strong className="type-section-title leading-none">
                                {formatGrade(projected)}
                            </strong>
                        </p>
                    )}
                </CardContent>
            </Card>
        </section>
    );
}

// classId: the class to plan. termKey: "prelim" | "midterm" | "finals".
export function TargetGradeSandbox({ classId, termKey = "prelim" }) {
    const [dbData, setDbData] = useDb();
    const studentId = getActiveStudentId(dbData);
    const [saveError, setSaveError] = useState("");
    const [targetInput, setTargetInput] = useState(null);
    const [targetError, setTargetError] = useState("");
    const [invalidScoreId, setInvalidScoreId] = useState("");

    const termLabel = TERM_LABELS[termKey] ?? "Prelim";
    const { record: studentRecord, rule } = getStudentClass(dbData, classId, studentId);

    if (!studentRecord) {
        return (
            <p className="m-0 type-body text-muted-foreground">
                This subject is not available for your account.
            </p>
        );
    }
    if (!rule) {
        return (
            <p className="m-0 type-body text-muted-foreground">
                This subject has no grading rule yet. Choose one on the Grade Rules page.
            </p>
        );
    }

    // Draft scores feed the sandbox only: the result, the gauges and the
    // chart use this record. Saved records and official grades never see them.
    const sandboxRecord = withDraftScores(studentRecord, termKey);
    const target = getSandboxTarget(studentRecord, termKey);
    const plan = getSandboxPlan(sandboxRecord, rule, termKey, target);
    const officialGrade = calculateOfficialGrade(studentRecord, termKey, rule);
    const expectedGrade = calculateUnofficialGrade(sandboxRecord, termKey, rule);
    const suggestion = plan.status === "required" ? plan.required : null;
    const historyPoints = getGradeHistory(sandboxRecord, rule, termKey);
    const planPoints = getPlanPoints(
        sandboxRecord,
        rule,
        termKey,
        target,
        historyPoints.length,
    ).points;

    // Applies a change to this student's record and saves it.
    function saveRecord(updateRecord, errorPrefix) {
        const currentDb = getDb();
        if (!currentDb) return;
        const updatedDb = updateStudentRecord(currentDb, classId, studentId, updateRecord);
        try {
            saveDb(updatedDb);
            setDbData(updatedDb);
            setSaveError("");
        } catch (error) {
            setSaveError(`${errorPrefix}: ${error.message}`);
        }
    }

    function saveSettings(updates) {
        saveRecord(
            (record) => updateSandboxSettings(record, termKey, updates),
            "Unable to save sandbox settings",
        );
    }

    function saveCriterion(criterionId, values) {
        saveSettings({ criteria: { [criterionId]: values } });
    }

    function commitTarget() {
        if (targetInput === null) return;
        const value = Number(targetInput);
        if (targetInput.trim() === "" || !Number.isFinite(value) || value < 0 || value > 100) {
            setTargetError("Enter a target grade from 0 to 100.");
            setTargetInput(null);
            return;
        }
        setTargetError("");
        setTargetInput(null);
        saveSettings({ sandboxDesiredFinalGrade: value });
    }

    // Stores a draft for the task. The real self-reported score is untouched.
    function saveDraftScore(task, value) {
        const check = validateScore(value, task.maxScore ?? 100);
        if (!check.ok) {
            setInvalidScoreId(task.id);
            setSaveError(`Enter a score between 0 and ${check.maxScore}.`);
            return;
        }
        setInvalidScoreId("");
        saveRecord(
            (record) => setDraftScore(record, termKey, task.id, value),
            "Unable to save draft score",
        );
    }

    const draftCriteria = plan.criteria.filter((criterion) => criterion.tasks.length > 0);

    return (
        // Layout follows the space next to the sidebar, not the window width.
        <div className="@container text-foreground">
            <div className="flex flex-col gap-6 @2xl:flex-row @2xl:items-start">
                {/* Answer first on phones, on the right on wide screens. */}
                <div className="@2xl:order-last @2xl:w-80 @2xl:shrink-0">
                    <SandboxResult plan={plan} termLabel={termLabel} />
                </div>

                <div className="flex min-w-0 flex-1 flex-col gap-4">
                    {/* Step 1: target and current grades */}
                    <section aria-labelledby="sandbox-step-target">
                        <Card className="gap-0">
                            <CardContent className="grid items-center gap-5 @xl:grid-cols-5">
                                <div className="flex flex-col gap-2 @xl:col-span-2">
                                    <SandboxStep id="sandbox-step-target" number={1}>
                                        Set your {termLabel} target
                                    </SandboxStep>
                                    <Field className="gap-2">
                                        <FieldLabel
                                            htmlFor="sandbox-target-grade"
                                            className="sr-only"
                                        >
                                            {termLabel} target grade
                                        </FieldLabel>
                                        <InputGroup className="max-w-24 border-highlight-strong bg-card has-[[data-slot][aria-invalid=true]]:bg-warning-soft">
                                            <InputGroupInput
                                                id="sandbox-target-grade"
                                                className="font-bold text-primary"
                                                type="number"
                                                min="0"
                                                max="100"
                                                step="any"
                                                value={targetInput ?? String(target)}
                                                aria-invalid={Boolean(targetError)}
                                                aria-describedby={
                                                    targetError
                                                        ? "sandbox-target-error"
                                                        : "sandbox-target-hint"
                                                }
                                                onChange={(event) => {
                                                    setTargetInput(event.target.value);
                                                    setTargetError("");
                                                }}
                                                onBlur={commitTarget}
                                                onKeyDown={(event) => {
                                                    if (event.key === "Enter")
                                                        event.currentTarget.blur();
                                                }}
                                            />
                                            <InputGroupAddon align="inline-end">
                                                <InputGroupText
                                                    className="text-highlight-text"
                                                    aria-hidden="true"
                                                >
                                                    %
                                                </InputGroupText>
                                            </InputGroupAddon>
                                        </InputGroup>
                                        {targetError ? (
                                            <small
                                                id="sandbox-target-error"
                                                className="type-small text-destructive"
                                                role="alert"
                                            >
                                                {targetError}
                                            </small>
                                        ) : (
                                            <small
                                                id="sandbox-target-hint"
                                                className="type-small text-highlight-text"
                                            >
                                                Yellow marker shows your target
                                            </small>
                                        )}
                                    </Field>
                                </div>
                                <div className="flex flex-wrap items-center justify-start gap-4 @xl:col-span-3 @xl:justify-evenly">
                                    <GradeGauge
                                        label={`${termLabel} official`}
                                        grade={officialGrade}
                                        target={target}
                                    />
                                    <GradeGauge
                                        label={`${termLabel} expected`}
                                        grade={expectedGrade}
                                        target={target}
                                        tone="expected"
                                    />
                                </div>
                            </CardContent>
                        </Card>
                    </section>

                    {/* The plan as a chart: always shown. */}
                    <section id="sandbox-chart" aria-labelledby="sandbox-chart-title">
                        <Card className={STEP_CARD}>
                            <CardContent>
                                <SandboxStep id="sandbox-chart-title">
                                    Your plan on a chart
                                </SandboxStep>
                                <p className="m-0 mt-1.5 mb-1 max-w-2xl type-small text-muted-foreground">
                                    Solid line: your {termLabel} grade so far. Dotted line: each
                                    remaining task at the score in your result. The order of
                                    upcoming tasks is a guess, so the end point is what matters.
                                </p>
                                <HistoryChart
                                    points={historyPoints}
                                    planPoints={planPoints}
                                    showPlan
                                    emphasizePlan
                                    target={target}
                                    targetLabel="Target"
                                    termLabel={termLabel}
                                    onSelect={(point) => focusTaskRow(point.taskId)}
                                    heightClass="h-70"
                                />
                            </CardContent>
                        </Card>
                    </section>

                    {/* Step 2: remaining tasks per criterion */}
                    <section aria-labelledby="sandbox-step-remaining">
                        <Card className={STEP_CARD}>
                            <CardContent>
                                <SandboxStep id="sandbox-step-remaining" number={2}>
                                    Tell us what is left
                                </SandboxStep>
                                <p className="m-0 mt-1.5 mb-4 max-w-2xl type-small text-muted-foreground">
                                    For each criterion, count the tasks you still expect this term.
                                    If you already know how you will do on one (for example the
                                    exam), enter an expected %. Leave it empty and the sandbox works
                                    it out.
                                </p>
                                <div className="overflow-hidden rounded-lg border border-border bg-card">
                                    <Table className="border-collapse @max-xl:block">
                                        <TableHeader className="@max-xl:sr-only">
                                            <TableRow className="hover:bg-transparent">
                                                {CRITERIA_COLUMNS.map((column) => (
                                                    <TableHead
                                                        key={column}
                                                        scope="col"
                                                        className="h-auto bg-muted py-3 type-caption tracking-wide text-muted-foreground uppercase"
                                                    >
                                                        {column}
                                                    </TableHead>
                                                ))}
                                            </TableRow>
                                        </TableHeader>
                                        <TableBody className="@max-xl:block">
                                            {plan.criteria.map((criterion) => {
                                                const dimmed = criterion.counted
                                                    ? ""
                                                    : "opacity-60";
                                                return (
                                                    <TableRow
                                                        key={criterion.id}
                                                        className="hover:bg-muted focus-within:bg-secondary focus-within:*:first:shadow-row-active @max-xl:grid @max-xl:grid-cols-2 @max-xl:gap-x-4 @max-xl:gap-y-3 @max-xl:p-4"
                                                    >
                                                        <TableHead
                                                            scope="row"
                                                            className={cn(
                                                                "h-auto py-3 font-normal whitespace-normal @max-xl:col-span-2 @max-xl:p-0",
                                                                dimmed,
                                                            )}
                                                        >
                                                            <span className="type-body font-semibold text-muted-foreground">
                                                                {criterion.path.join(" › ")}
                                                            </span>
                                                            <small className={CELL_NOTE}>
                                                                {formatPercent(
                                                                    Math.round(
                                                                        criterion.weight * 10000,
                                                                    ),
                                                                )}{" "}
                                                                of the term
                                                            </small>
                                                        </TableHead>
                                                        <TableCell className={cn(CELL, dimmed)}>
                                                            <span className={CELL_LABEL}>
                                                                Scored so far
                                                            </span>
                                                            {criterion.scoredCount === 0 ? (
                                                                <span className="text-muted-foreground">
                                                                    None yet
                                                                </span>
                                                            ) : (
                                                                <>
                                                                    <span>
                                                                        {formatGrade(
                                                                            criterion.scoredAverage,
                                                                        )}
                                                                    </span>
                                                                    <small className={CELL_NOTE}>
                                                                        average of{" "}
                                                                        {pluralTasks(
                                                                            criterion.scoredCount,
                                                                        )}
                                                                    </small>
                                                                </>
                                                            )}
                                                        </TableCell>
                                                        <TableCell className={CELL}>
                                                            <span className={CELL_LABEL}>
                                                                Upcoming tasks
                                                            </span>
                                                            <Input
                                                                className={NUMBER_INPUT}
                                                                type="number"
                                                                min="0"
                                                                max={MAX_UPCOMING}
                                                                step="1"
                                                                value={criterion.upcoming}
                                                                aria-label={`Upcoming ${criterion.name} tasks not added yet`}
                                                                onChange={(event) =>
                                                                    saveCriterion(criterion.id, {
                                                                        upcoming: Math.max(
                                                                            0,
                                                                            Math.min(
                                                                                MAX_UPCOMING,
                                                                                Math.round(
                                                                                    Number(
                                                                                        event.target
                                                                                            .value,
                                                                                    ) || 0,
                                                                                ),
                                                                            ),
                                                                        ),
                                                                    })
                                                                }
                                                            />
                                                            {criterion.openTasks > 0 && (
                                                                <small className={CELL_NOTE}>
                                                                    + {criterion.openTasks} added
                                                                    without a score
                                                                </small>
                                                            )}
                                                        </TableCell>
                                                        <TableCell className={CELL}>
                                                            <span className={CELL_LABEL}>
                                                                Expected %
                                                            </span>
                                                            <InputGroup className="w-24 bg-card hover:bg-muted">
                                                                <InputGroupInput
                                                                    className="tabular-nums"
                                                                    type="number"
                                                                    min="0"
                                                                    max="100"
                                                                    step="any"
                                                                    placeholder="Auto"
                                                                    value={criterion.expected ?? ""}
                                                                    aria-label={`Expected percentage for remaining ${criterion.name} tasks (leave empty to calculate)`}
                                                                    onChange={(event) => {
                                                                        const raw =
                                                                            event.target.value;
                                                                        const value = Number(raw);
                                                                        saveCriterion(
                                                                            criterion.id,
                                                                            {
                                                                                expected:
                                                                                    raw === "" ||
                                                                                    !Number.isFinite(
                                                                                        value,
                                                                                    )
                                                                                        ? null
                                                                                        : Math.max(
                                                                                              0,
                                                                                              Math.min(
                                                                                                  100,
                                                                                                  value,
                                                                                              ),
                                                                                          ),
                                                                            },
                                                                        );
                                                                    }}
                                                                />
                                                                <InputGroupAddon align="inline-end">
                                                                    <InputGroupText aria-hidden="true">
                                                                        %
                                                                    </InputGroupText>
                                                                </InputGroupAddon>
                                                            </InputGroup>
                                                        </TableCell>
                                                        <TableCell className={cn(CELL, dimmed)}>
                                                            <span className={CELL_LABEL}>
                                                                You need
                                                            </span>
                                                            {!criterion.counted ? (
                                                                <span className="text-muted-foreground">
                                                                    Not counted (no tasks)
                                                                </span>
                                                            ) : criterion.slots === 0 ? (
                                                                <span className="text-muted-foreground">
                                                                    Done
                                                                </span>
                                                            ) : criterion.usesRequired ? (
                                                                <strong className="type-body font-bold whitespace-nowrap text-primary">
                                                                    {suggestion === null
                                                                        ? "—"
                                                                        : formatGrade(suggestion)}
                                                                    <small className={CELL_NOTE}>
                                                                        each ·{" "}
                                                                        {pluralTasks(
                                                                            criterion.slots,
                                                                        )}
                                                                    </small>
                                                                </strong>
                                                            ) : (
                                                                <span>
                                                                    {formatGrade(
                                                                        criterion.expected,
                                                                    )}
                                                                    <small className={CELL_NOTE}>
                                                                        your estimate
                                                                    </small>
                                                                </span>
                                                            )}
                                                        </TableCell>
                                                    </TableRow>
                                                );
                                            })}
                                        </TableBody>
                                    </Table>
                                </div>
                            </CardContent>
                        </Card>
                    </section>

                    {/* Step 3: try draft scores on tasks already added */}
                    <section aria-labelledby="sandbox-step-drafts">
                        <Card className={STEP_CARD}>
                            <CardContent>
                                <SandboxStep id="sandbox-step-drafts" number={3}>
                                    Try draft scores (optional)
                                </SandboxStep>
                                <p className="m-0 mt-1.5 mb-4 type-small text-muted-foreground">
                                    Type a score on a task you have already added. The grey number
                                    is the score that matches your result. Official scores are
                                    locked.
                                </p>
                                {draftCriteria.length === 0 ? (
                                    <p className="m-0 type-small text-muted-foreground">
                                        No tasks added for {termLabel} yet.
                                    </p>
                                ) : (
                                    <div className="flex flex-col gap-4">
                                        {draftCriteria.map((criterion) => (
                                            <div
                                                className="overflow-hidden rounded-lg border border-border bg-card"
                                                key={criterion.id}
                                            >
                                                <h3 className="m-0 bg-muted px-3 py-2.5 type-caption font-bold tracking-wide text-muted-foreground uppercase">
                                                    {criterion.path.join(" › ")}
                                                </h3>
                                                {criterion.tasks.map(({ task }, index) => {
                                                    const label =
                                                        task.title ||
                                                        `${criterion.name} ${index + 1}`;
                                                    const hasOfficial =
                                                        task.officialScore !== null &&
                                                        task.officialScore !== undefined &&
                                                        task.officialScore !== "";
                                                    const placeholder = criterion.usesRequired
                                                        ? requiredScore(
                                                              suggestion,
                                                              task.maxScore ?? 100,
                                                          )
                                                        : requiredScore(
                                                              criterion.expected,
                                                              task.maxScore ?? 100,
                                                          );
                                                    return (
                                                        <label
                                                            className="flex items-center justify-between gap-3 border-0 border-b border-solid border-border px-3 py-2.5 transition-colors last:border-b-0 hover:bg-muted focus-within:bg-secondary focus-within:shadow-row-active task-highlighted:animate-record-highlight motion-reduce:task-highlighted:animate-none motion-reduce:task-highlighted:bg-highlight-soft"
                                                            key={task.id ?? index}
                                                            data-task-id={task.id}
                                                        >
                                                            <span className="min-w-0 type-body font-semibold wrap-anywhere text-muted-foreground">
                                                                {label}
                                                                {task.description && (
                                                                    <small
                                                                        className={cn(
                                                                            DRAFT_NOTE,
                                                                            "font-normal",
                                                                        )}
                                                                    >
                                                                        {task.description}
                                                                    </small>
                                                                )}
                                                            </span>
                                                            {hasOfficial ? (
                                                                <span className="type-small font-semibold whitespace-nowrap text-foreground text-right">
                                                                    {task.officialScore} /{" "}
                                                                    {task.maxScore ?? 100}
                                                                    <small className={DRAFT_NOTE}>
                                                                        official
                                                                    </small>
                                                                </span>
                                                            ) : (
                                                                <InputGroup className="w-36 shrink-0 border-self-reported bg-card has-aria-invalid:bg-warning-soft">
                                                                    <InputGroupInput
                                                                        className="text-center text-self-reported-foreground tabular-nums"
                                                                        type="text"
                                                                        inputMode="decimal"
                                                                        value={
                                                                            task.studentReportedScore ??
                                                                            ""
                                                                        }
                                                                        aria-invalid={
                                                                            invalidScoreId ===
                                                                            task.id
                                                                        }
                                                                        placeholder={
                                                                            placeholder === null
                                                                                ? "—"
                                                                                : String(
                                                                                      placeholder,
                                                                                  )
                                                                        }
                                                                        onChange={(event) =>
                                                                            saveDraftScore(
                                                                                task,
                                                                                event.target.value,
                                                                            )
                                                                        }
                                                                        aria-label={`Draft score for ${label}`}
                                                                    />
                                                                    <InputGroupAddon
                                                                        align="inline-end"
                                                                        className="tabular-nums"
                                                                    >
                                                                        <InputGroupText>
                                                                            / {task.maxScore ?? 100}
                                                                        </InputGroupText>
                                                                    </InputGroupAddon>
                                                                </InputGroup>
                                                            )}
                                                        </label>
                                                    );
                                                })}
                                            </div>
                                        ))}
                                    </div>
                                )}
                                {saveError && (
                                    <p
                                        className="m-0 mt-2 type-small text-destructive"
                                        role="alert"
                                    >
                                        {saveError}
                                    </p>
                                )}
                            </CardContent>
                        </Card>
                    </section>

                    <Card size="sm" className="gap-0">
                        <CardContent>
                            <Collapsible>
                                <CollapsibleTrigger
                                    render={
                                        <Button
                                            variant="ghost"
                                            className="group/how text-primary hover:bg-secondary hover:text-primary aria-expanded:bg-transparent aria-expanded:text-primary"
                                        />
                                    }
                                >
                                    <ChevronRightIcon
                                        data-icon="inline-start"
                                        aria-hidden="true"
                                        className="transition-transform group-aria-expanded/how:rotate-90 motion-reduce:transition-none"
                                    />
                                    How this is calculated
                                </CollapsibleTrigger>
                                <CollapsibleContent>
                                    <p className="m-0 mt-3 border-0 border-t border-solid border-border pt-3 type-small text-muted-foreground">
                                        Each criterion&apos;s grade is the average of its task
                                        percentages, weighted by your grading rule. Scored tasks
                                        stay as they are (official scores first, then your own).
                                        Every remaining task without an expected % gets the same
                                        score, and the sandbox finds the lowest score that reaches
                                        your target. Criteria with no tasks are left out until you
                                        add some. Nothing here changes official records.
                                    </p>
                                </CollapsibleContent>
                            </Collapsible>
                        </CardContent>
                    </Card>
                </div>
            </div>
        </div>
    );
}
