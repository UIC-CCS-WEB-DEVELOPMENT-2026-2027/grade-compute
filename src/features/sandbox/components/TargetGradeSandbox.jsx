// src/components/student/TargetGradeSandbox.jsx
// Target Grade Sandbox for one subject and term. Works with any grading
// rule: each deepest criterion of the rule gets its own row.
// The math lives in utils/sandbox.js. Sandbox settings and draft scores
// are private to the student and never change official scores. Draft
// scores are stored apart from the real scores and are used only here.
import { useState } from "react";
import { getDb, saveDb } from "@/services/db";
import { updateStudentRecord } from "@/services/records";
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
import { Card, CardContent } from "@/components/ui/card";
import { Field, FieldLabel } from "@/components/ui/field";
import {
    InputGroup,
    InputGroupAddon,
    InputGroupInput,
    InputGroupText,
} from "@/components/ui/input-group";
import { useDb } from "@/hooks/useDb";
import { cn } from "@/lib/utils";
import "./TargetGradeSandbox.css";

function pluralTasks(count) {
    return `${count} ${count === 1 ? "task" : "tasks"}`;
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
    const classItem = dbData?.classes?.find((item) => item.id === classId);
    const studentRecord = classItem?.studentRecords?.find(
        (record) => record.studentId === studentId,
    );
    const rule = dbData?.computationRules?.find((item) => item.id === classItem?.computationRuleId);

    if (!studentRecord) {
        return <p className="sandbox-empty">This subject is not available for your account.</p>;
    }
    if (!rule) {
        return (
            <p className="sandbox-empty">
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
        <div className="sandbox">
            <div className="sandbox-layout">
                {/* Answer first on phones, sticky on the right on wide screens. */}
                <div className="sandbox-result-column">
                    <SandboxResult plan={plan} termLabel={termLabel} />
                </div>

                <div className="sandbox-inputs">
                    {/* Step 1: target and current grades */}
                    <section
                        className="sandbox-card sandbox-summary"
                        aria-labelledby="sandbox-step-target"
                    >
                        <div className="flex flex-col gap-2">
                            <h2 className="sandbox-step" id="sandbox-step-target">
                                <span aria-hidden="true">1</span> Set your {termLabel} target
                            </h2>
                            <Field className="gap-2">
                                <FieldLabel htmlFor="sandbox-target-grade" className="sr-only">
                                    {termLabel} target grade
                                </FieldLabel>
                                <InputGroup className="max-w-24 border-highlight-strong bg-card has-[[data-slot][aria-invalid=true]]:bg-warning-soft max-md:h-control-touch">
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
                                            if (event.key === "Enter") event.currentTarget.blur();
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
                        <div className="sandbox-gauges">
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
                    </section>

                    {/* The plan as a chart: always shown. */}
                    <section
                        className="sandbox-card sandbox-chart-card"
                        id="sandbox-chart"
                        aria-labelledby="sandbox-chart-title"
                    >
                        <h2 className="sandbox-step" id="sandbox-chart-title">
                            Your plan on a chart
                        </h2>
                        <p className="sandbox-help">
                            Solid line: your {termLabel} grade so far. Dotted line: each remaining
                            task at the score in your result. The order of upcoming tasks is a
                            guess, so the end point is what matters.
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
                    </section>

                    {/* Step 2: remaining tasks per criterion */}
                    <section
                        className="sandbox-card sandbox-remaining-card"
                        aria-labelledby="sandbox-step-remaining"
                    >
                        <h2 className="sandbox-step" id="sandbox-step-remaining">
                            <span aria-hidden="true">2</span> Tell us what is left
                        </h2>
                        <p className="sandbox-help">
                            For each criterion, count the tasks you still expect this term. If you
                            already know how you will do on one (for example the exam), enter an
                            expected %. Leave it empty and the sandbox works it out.
                        </p>
                        <div className="sandbox-table-scroll">
                            <table className="sandbox-table">
                                <thead>
                                    <tr>
                                        <th scope="col">Criterion</th>
                                        <th scope="col">Scored so far</th>
                                        <th scope="col">Upcoming tasks</th>
                                        <th scope="col">Expected %</th>
                                        <th scope="col">You need</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {plan.criteria.map((criterion) => (
                                        <tr
                                            key={criterion.id}
                                            className={criterion.counted ? "" : "is-not-counted"}
                                        >
                                            <th scope="row">
                                                <span className="sandbox-criterion-name">
                                                    {criterion.path.join(" › ")}
                                                </span>
                                                <small>
                                                    {formatPercent(
                                                        Math.round(criterion.weight * 10000),
                                                    )}{" "}
                                                    of the term
                                                </small>
                                            </th>
                                            <td className="sandbox-cell-scored">
                                                {criterion.scoredCount === 0 ? (
                                                    <span className="sandbox-muted">None yet</span>
                                                ) : (
                                                    <>
                                                        <span>
                                                            {formatGrade(criterion.scoredAverage)}
                                                        </span>
                                                        <small>
                                                            average of{" "}
                                                            {pluralTasks(criterion.scoredCount)}
                                                        </small>
                                                    </>
                                                )}
                                            </td>
                                            <td className="sandbox-cell-upcoming">
                                                <input
                                                    className="sandbox-number"
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
                                                                            event.target.value,
                                                                        ) || 0,
                                                                    ),
                                                                ),
                                                            ),
                                                        })
                                                    }
                                                />
                                                {criterion.openTasks > 0 && (
                                                    <small>
                                                        + {criterion.openTasks} added without a
                                                        score
                                                    </small>
                                                )}
                                            </td>
                                            <td className="sandbox-cell-expected">
                                                <span className="sandbox-percent-input">
                                                    <input
                                                        className="sandbox-number"
                                                        type="number"
                                                        min="0"
                                                        max="100"
                                                        step="any"
                                                        placeholder="Auto"
                                                        value={criterion.expected ?? ""}
                                                        aria-label={`Expected percentage for remaining ${criterion.name} tasks (leave empty to calculate)`}
                                                        onChange={(event) => {
                                                            const raw = event.target.value;
                                                            const value = Number(raw);
                                                            saveCriterion(criterion.id, {
                                                                expected:
                                                                    raw === "" ||
                                                                    !Number.isFinite(value)
                                                                        ? null
                                                                        : Math.max(
                                                                              0,
                                                                              Math.min(100, value),
                                                                          ),
                                                            });
                                                        }}
                                                    />
                                                    <span aria-hidden="true">%</span>
                                                </span>
                                            </td>
                                            <td className="sandbox-need">
                                                {!criterion.counted ? (
                                                    <span className="sandbox-muted">
                                                        Not counted (no tasks)
                                                    </span>
                                                ) : criterion.slots === 0 ? (
                                                    <span className="sandbox-muted">Done</span>
                                                ) : criterion.usesRequired ? (
                                                    <strong>
                                                        {suggestion === null
                                                            ? "—"
                                                            : formatGrade(suggestion)}
                                                        <small>
                                                            each · {pluralTasks(criterion.slots)}
                                                        </small>
                                                    </strong>
                                                ) : (
                                                    <span>
                                                        {formatGrade(criterion.expected)}
                                                        <small>your estimate</small>
                                                    </span>
                                                )}
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </section>

                    {/* Step 3: try draft scores on tasks already added */}
                    <section
                        className="sandbox-card sandbox-drafts-card"
                        aria-labelledby="sandbox-step-drafts"
                    >
                        <h2 className="sandbox-step" id="sandbox-step-drafts">
                            <span aria-hidden="true">3</span> Try draft scores (optional)
                        </h2>
                        <p className="sandbox-help">
                            Type a score on a task you have already added. The grey number is the
                            score that matches your result. Official scores are locked.
                        </p>
                        {draftCriteria.length === 0 ? (
                            <p className="sandbox-muted">No tasks added for {termLabel} yet.</p>
                        ) : (
                            draftCriteria.map((criterion) => (
                                <div className="sandbox-draft-group" key={criterion.id}>
                                    <h3>{criterion.path.join(" › ")}</h3>
                                    {criterion.tasks.map(({ task }, index) => {
                                        const label =
                                            task.title || `${criterion.name} ${index + 1}`;
                                        const hasOfficial =
                                            task.officialScore !== null &&
                                            task.officialScore !== undefined &&
                                            task.officialScore !== "";
                                        const placeholder = criterion.usesRequired
                                            ? requiredScore(suggestion, task.maxScore ?? 100)
                                            : requiredScore(
                                                  criterion.expected,
                                                  task.maxScore ?? 100,
                                              );
                                        return (
                                            <label
                                                className="sandbox-draft"
                                                key={task.id ?? index}
                                                data-task-id={task.id}
                                            >
                                                <span className="sandbox-draft-name">
                                                    {label}
                                                    {task.description && (
                                                        <small>{task.description}</small>
                                                    )}
                                                </span>
                                                {hasOfficial ? (
                                                    <span className="sandbox-draft-locked">
                                                        {task.officialScore} /{" "}
                                                        {task.maxScore ?? 100}
                                                        <small>official</small>
                                                    </span>
                                                ) : (
                                                    <span className="sandbox-draft-input">
                                                        <input
                                                            type="text"
                                                            inputMode="decimal"
                                                            value={task.studentReportedScore ?? ""}
                                                            aria-invalid={
                                                                invalidScoreId === task.id
                                                            }
                                                            placeholder={
                                                                placeholder === null
                                                                    ? "—"
                                                                    : String(placeholder)
                                                            }
                                                            onChange={(event) =>
                                                                saveDraftScore(
                                                                    task,
                                                                    event.target.value,
                                                                )
                                                            }
                                                            aria-label={`Draft score for ${label}`}
                                                        />
                                                        <span>/ {task.maxScore ?? 100}</span>
                                                    </span>
                                                )}
                                            </label>
                                        );
                                    })}
                                </div>
                            ))
                        )}
                        {saveError && (
                            <p className="sandbox-error" role="alert">
                                {saveError}
                            </p>
                        )}
                    </section>

                    <details className="sandbox-card sandbox-how">
                        <summary>How this is calculated</summary>
                        <p>
                            Each criterion&apos;s grade is the average of its task percentages,
                            weighted by your grading rule. Scored tasks stay as they are (official
                            scores first, then your own). Every remaining task without an expected %
                            gets the same score, and the sandbox finds the lowest score that reaches
                            your target. Criteria with no tasks are left out until you add some.
                            Nothing here changes official records.
                        </p>
                    </details>
                </div>
            </div>
        </div>
    );
}
