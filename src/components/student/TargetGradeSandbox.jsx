// src/components/student/TargetGradeSandbox.jsx
// Target Grade Sandbox for one subject and term. Works with any grading
// rule: each deepest criterion of the rule gets its own row.
// The math lives in utils/sandbox.js. Sandbox settings and draft scores
// are private to the student and never change official scores.
import { useEffect, useState } from "react";
import { DB_UPDATED_EVENT, getDb, saveDb } from "../../utils/db";
import { calculateOfficialGrade, calculateUnofficialGrade } from "../../utils/grades";
import { formatPercent } from "../../utils/rules";
import { getActiveStudentId } from "../../utils/session";
import {
    getSandboxPlan,
    getSandboxTarget,
    MAX_UPCOMING,
    requiredScore,
    updateSandboxSettings,
} from "../../utils/sandbox";
import "./TargetGradeSandbox.css";

const TERM_LABELS = { prelim: "Prelim", midterm: "Midterm", finals: "Finals" };

function formatGrade(value) {
    return value === null || value === undefined ? "—" : `${Number(value.toFixed(2))}%`;
}

function pluralTasks(count) {
    return `${count} ${count === 1 ? "task" : "tasks"}`;
}

function Gauge({ label, grade, target, className }) {
    const progress = grade === null ? 0 : Math.min(100, Math.max(0, grade));
    return (
        <div className={`grade-gauge ${className}`}>
            <span className="grade-gauge-label">{label}</span>
            <span
                className="grade-gauge-ring"
                role="img"
                style={{ "--grade-progress": `${progress}%`, "--target-angle": `${target * 3.6}deg` }}
                aria-label={`${label}: ${grade === null ? "no grade yet" : `${grade.toFixed(0)} percent`}`}
            >
                <strong>
                    {grade === null ? "—" : grade.toFixed(0)}
                    {grade !== null && <small>%</small>}
                </strong>
                <span className="grade-gauge-target-marker" />
            </span>
        </div>
    );
}

// The answer card. Kept separate so it is easy to find in the code too.
function SandboxResult({ plan, termLabel }) {
    const { status, target, required, projected, best, requiredSlots, criteria } = plan;
    const requiredCriteria = criteria.filter((criterion) => criterion.counted && criterion.usesRequired);

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

    return (
        <section
            className={`sandbox-result sandbox-result--${tone}`}
            aria-labelledby="sandbox-result-label"
            aria-live="polite"
        >
            <p className="sandbox-result-label" id="sandbox-result-label">
                Your result · To reach {formatGrade(target)} in {termLabel}
            </p>
            <p className="sandbox-result-value">{headline}</p>
            {status === "required" && (
                <p className="sandbox-result-unit">needed on each remaining task</p>
            )}
            <p className="sandbox-result-message">{message}</p>

            {status === "required" && requiredCriteria.length > 0 && (
                <ul className="sandbox-result-list" aria-label="Remaining tasks this applies to">
                    {requiredCriteria.map((criterion) => (
                        <li key={criterion.id}>
                            <span>{criterion.path.join(" › ")}</span>
                            <span>{pluralTasks(criterion.slots)}</span>
                        </li>
                    ))}
                </ul>
            )}

            {projected !== null && status !== "complete" && status !== "empty" && (
                <p className="sandbox-result-projection">
                    Projected {termLabel} grade
                    <strong>{formatGrade(projected)}</strong>
                </p>
            )}
        </section>
    );
}

// classId: the class to plan. termKey: "prelim" | "midterm" | "finals".
export default function TargetGradeSandbox({ classId, termKey = "prelim" }) {
    const [dbData, setDbData] = useState(() => getDb());
    const studentId = getActiveStudentId(dbData);
    const [saveError, setSaveError] = useState("");
    const [targetInput, setTargetInput] = useState(null);
    const [targetError, setTargetError] = useState("");
    const [invalidScoreId, setInvalidScoreId] = useState("");

    useEffect(() => {
        const refresh = () => setDbData(getDb());
        window.addEventListener(DB_UPDATED_EVENT, refresh);
        return () => window.removeEventListener(DB_UPDATED_EVENT, refresh);
    }, []);

    const termLabel = TERM_LABELS[termKey] ?? "Prelim";
    const classItem = dbData?.classes?.find((item) => item.id === classId);
    const studentRecord = classItem?.studentRecords?.find((record) => record.studentId === studentId);
    const rule = dbData?.computationRules?.find((item) => item.id === classItem?.computationRuleId);

    if (!studentRecord) {
        return <p className="sandbox-empty">This subject is not available for your account.</p>;
    }
    if (!rule) {
        return <p className="sandbox-empty">This subject has no grading rule yet. Choose one on the Grade Rules page.</p>;
    }

    const target = getSandboxTarget(studentRecord, termKey);
    const plan = getSandboxPlan(studentRecord, rule, termKey, target);
    const officialGrade = calculateOfficialGrade(studentRecord, termKey, rule);
    const expectedGrade = calculateUnofficialGrade(studentRecord, termKey, rule);
    const suggestion = plan.status === "required" ? plan.required : null;

    // Applies a change to this student's record and saves it.
    function saveRecord(updateRecord, errorPrefix) {
        const currentDb = getDb();
        if (!currentDb) return;
        const updatedDb = {
            ...currentDb,
            classes: currentDb.classes.map((item) => item.id !== classId ? item : {
                ...item,
                studentRecords: item.studentRecords.map((record) =>
                    record.studentId === studentId ? updateRecord(record) : record
                ),
            }),
        };
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
            "Unable to save sandbox settings"
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

    function saveDraftScore(criterionId, task, value) {
        const maxScore = Number(task.maxScore ?? 100);
        if (value !== "") {
            const score = Number(value);
            const maxIntegerDigits = String(Math.trunc(maxScore)).length;
            if (!/^(?:\d+(?:\.\d*)?|\.\d+)$/.test(value) ||
                !Number.isFinite(score) ||
                score < 0 ||
                score > maxScore ||
                value.split(".")[0].length > maxIntegerDigits) {
                setInvalidScoreId(task.id);
                setSaveError(`Enter a score between 0 and ${maxScore}.`);
                return;
            }
        }
        setInvalidScoreId("");
        saveRecord((record) => {
            const grades = record.grades ?? {};
            const termGrades = grades[termKey] ?? {};
            const tasks = Array.isArray(termGrades[criterionId]) ? termGrades[criterionId] : [];
            return {
                ...record,
                grades: {
                    ...grades,
                    [termKey]: {
                        ...termGrades,
                        [criterionId]: tasks.map((item) =>
                            item.id === task.id ? { ...item, studentReportedScore: value } : item
                        ),
                    },
                },
            };
        }, "Unable to save draft score");
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
                    <section className="sandbox-card sandbox-summary" aria-labelledby="sandbox-step-target">
                        <div className="sandbox-target">
                            <h2 className="sandbox-step" id="sandbox-step-target">
                                <span aria-hidden="true">1</span> Set your {termLabel} target
                            </h2>
                            <label className="sandbox-target-input">
                                <span className="sandbox-sr-only">{termLabel} target grade</span>
                                <input
                                    type="number"
                                    min="0"
                                    max="100"
                                    step="any"
                                    value={targetInput ?? String(target)}
                                    aria-invalid={Boolean(targetError)}
                                    aria-describedby={targetError ? "sandbox-target-error" : "sandbox-target-hint"}
                                    onChange={(event) => {
                                        setTargetInput(event.target.value);
                                        setTargetError("");
                                    }}
                                    onBlur={commitTarget}
                                    onKeyDown={(event) => {
                                        if (event.key === "Enter") event.currentTarget.blur();
                                    }}
                                />
                                <span aria-hidden="true">%</span>
                            </label>
                            {targetError ? (
                                <small id="sandbox-target-error" className="sandbox-error" role="alert">
                                    {targetError}
                                </small>
                            ) : (
                                <small id="sandbox-target-hint">Yellow marker shows your target</small>
                            )}
                        </div>
                        <div className="sandbox-gauges">
                            <Gauge label={`${termLabel} official`} grade={officialGrade} target={target} className="official-gauge" />
                            <Gauge label={`${termLabel} expected`} grade={expectedGrade} target={target} className="expected-gauge" />
                        </div>
                    </section>

                    {/* Step 2: remaining tasks per criterion */}
                    <section className="sandbox-card" aria-labelledby="sandbox-step-remaining">
                        <h2 className="sandbox-step" id="sandbox-step-remaining">
                            <span aria-hidden="true">2</span> Tell us what is left
                        </h2>
                        <p className="sandbox-help">
                            For each criterion, count the tasks you still expect this term.
                            If you already know how you will do on one (for example the exam),
                            enter an expected %. Leave it empty and the sandbox works it out.
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
                                        <tr key={criterion.id} className={criterion.counted ? "" : "is-not-counted"}>
                                            <th scope="row">
                                                <span className="sandbox-criterion-name">{criterion.path.join(" › ")}</span>
                                                <small>{formatPercent(Math.round(criterion.weight * 10000))} of the term</small>
                                            </th>
                                            <td>
                                                {criterion.scoredCount === 0 ? (
                                                    <span className="sandbox-muted">None yet</span>
                                                ) : (
                                                    <>
                                                        <span>{formatGrade(criterion.scoredAverage)}</span>
                                                        <small>average of {pluralTasks(criterion.scoredCount)}</small>
                                                    </>
                                                )}
                                            </td>
                                            <td>
                                                <input
                                                    className="sandbox-number"
                                                    type="number"
                                                    min="0"
                                                    max={MAX_UPCOMING}
                                                    step="1"
                                                    value={criterion.upcoming}
                                                    aria-label={`Upcoming ${criterion.name} tasks not added yet`}
                                                    onChange={(event) => saveCriterion(criterion.id, {
                                                        upcoming: Math.max(0, Math.min(MAX_UPCOMING, Math.round(Number(event.target.value) || 0))),
                                                    })}
                                                />
                                                {criterion.openTasks > 0 && (
                                                    <small>+ {criterion.openTasks} added without a score</small>
                                                )}
                                            </td>
                                            <td>
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
                                                                expected: raw === "" || !Number.isFinite(value)
                                                                    ? null
                                                                    : Math.max(0, Math.min(100, value)),
                                                            });
                                                        }}
                                                    />
                                                    <span aria-hidden="true">%</span>
                                                </span>
                                            </td>
                                            <td className="sandbox-need">
                                                {!criterion.counted ? (
                                                    <span className="sandbox-muted">Not counted (no tasks)</span>
                                                ) : criterion.slots === 0 ? (
                                                    <span className="sandbox-muted">Done</span>
                                                ) : criterion.usesRequired ? (
                                                    <strong>
                                                        {suggestion === null ? "—" : formatGrade(suggestion)}
                                                        <small>each · {pluralTasks(criterion.slots)}</small>
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
                    <section className="sandbox-card" aria-labelledby="sandbox-step-drafts">
                        <h2 className="sandbox-step" id="sandbox-step-drafts">
                            <span aria-hidden="true">3</span> Try draft scores (optional)
                        </h2>
                        <p className="sandbox-help">
                            Type a score on a task you have already added. The grey number is
                            the score that matches your result. Official scores are locked.
                        </p>
                        {draftCriteria.length === 0 ? (
                            <p className="sandbox-muted">No tasks added for {termLabel} yet.</p>
                        ) : draftCriteria.map((criterion) => (
                            <div className="sandbox-draft-group" key={criterion.id}>
                                <h3>{criterion.path.join(" › ")}</h3>
                                {criterion.tasks.map(({ task }, index) => {
                                    const label = task.title || `${criterion.name} ${index + 1}`;
                                    const hasOfficial = task.officialScore !== null &&
                                        task.officialScore !== undefined && task.officialScore !== "";
                                    const placeholder = criterion.usesRequired
                                        ? requiredScore(suggestion, task.maxScore ?? 100)
                                        : requiredScore(criterion.expected, task.maxScore ?? 100);
                                    return (
                                        <label className="sandbox-draft" key={task.id ?? index}>
                                            <span className="sandbox-draft-name">
                                                {label}
                                                {task.description && <small>{task.description}</small>}
                                            </span>
                                            {hasOfficial ? (
                                                <span className="sandbox-draft-locked">
                                                    {task.officialScore} / {task.maxScore ?? 100}
                                                    <small>official</small>
                                                </span>
                                            ) : (
                                                <span className="sandbox-draft-input">
                                                    <input
                                                        type="text"
                                                        inputMode="decimal"
                                                        value={task.studentReportedScore ?? ""}
                                                        aria-invalid={invalidScoreId === task.id}
                                                        placeholder={placeholder === null ? "—" : String(placeholder)}
                                                        onChange={(event) => saveDraftScore(criterion.id, task, event.target.value)}
                                                        aria-label={`Draft score for ${label}`}
                                                    />
                                                    <span>/ {task.maxScore ?? 100}</span>
                                                </span>
                                            )}
                                        </label>
                                    );
                                })}
                            </div>
                        ))}
                        {saveError && <p className="sandbox-error" role="alert">{saveError}</p>}
                    </section>

                    <details className="sandbox-card sandbox-how">
                        <summary>How this is calculated</summary>
                        <p>
                            Each criterion&apos;s grade is the average of its task percentages, weighted by
                            your grading rule. Scored tasks stay as they are (official scores first, then
                            your own). Every remaining task without an expected % gets the same score, and
                            the sandbox finds the lowest score that reaches your target. Criteria with no
                            tasks are left out until you add some. Nothing here changes official records.
                        </p>
                    </details>
                </div>
            </div>
        </div>
    );
}
