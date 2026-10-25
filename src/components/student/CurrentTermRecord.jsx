import { useState } from "react";
import { getDb, saveDb } from "../../utils/db";
import { toTaskList } from "../../utils/grades";
import { formatPercent, getHierarchyRows, getRuleLeaves, ruleToTree } from "../../utils/rules";
import "./CurrentTermRecord.css";

const STUDENT_ID = "U1";

function termKey(term) {
    return term.toLowerCase();
}

function taskName(task, category) {
    const title = task.title ?? `${category} ${task.sequenceNumber ?? ""}`.trim();
    return task.description ? `${title} - ${task.description}` : title;
}

function hasOfficialScore(task) {
    return task.officialScore !== null && task.officialScore !== undefined;
}

// Sections come from the subject's grading rule: one per deepest criterion
// (e.g. AT, TLA, Exam, or any custom criterion). Tasks are stored under the
// criterion's id in each term (see grades-guide.txt).
function CurrentTermRecords({ classId, term = "Prelim" }) {
    const [dbData, setDbData] = useState(() => getDb());
    const [taskNameInput, setTaskNameInput] = useState("");
    const [taskMaxScore, setTaskMaxScore] = useState("");
    const [taskCategory, setTaskCategory] = useState("");
    const [showAddTask, setShowAddTask] = useState(false);
    const [showBreakdown, setShowBreakdown] = useState(false);
    const [editingScores, setEditingScores] = useState({});
    const [saveError, setSaveError] = useState("");

    const classItem = dbData?.classes?.find((item) => item.id === classId);
    const studentRecord = classItem?.studentRecords?.find(
        (record) => record.studentId === STUDENT_ID
    );
    const rule = dbData?.computationRules?.find(
        (item) => item.id === classItem?.computationRuleId
    );
    const criteria = getRuleLeaves(rule);
    const criteriaIds = new Set(criteria.map((criterion) => criterion.id));
    const selectedCategory = criteriaIds.has(taskCategory) ? taskCategory : criteria[0]?.id ?? "";
    const currentTerm = studentRecord?.grades?.[termKey(term)] ?? {};
    const tasksFor = (criterionId) => toTaskList(currentTerm[criterionId]);

    // Tasks stored under criteria that are no longer in this rule.
    const uncountedTasks = Object.entries(currentTerm)
        .filter(([criterionId]) => !criteriaIds.has(criterionId))
        .reduce((total, [, tasks]) => total + toTaskList(tasks).length, 0);

    function saveChanges(updateClass) {
        const currentDb = getDb();
        if (!currentDb) {
            setSaveError("Your changes could not be saved because local data is unavailable.");
            return;
        }

        const updatedDb = {
            ...currentDb,
            classes: currentDb.classes.map((item) =>
                item.id === classId ? updateClass(item) : item
            ),
        };

        try {
            saveDb(updatedDb);
        } catch (error) {
            setSaveError(`Unable to save sandbox changes: ${error.message}`);
            return false;
        }

        setDbData(updatedDb);
        setSaveError("");
        return true;
    }

    function updateTerm(updateTermGrades) {
        return saveChanges((item) => ({
            ...item,
            studentRecords: item.studentRecords.map((record) => {
                if (record.studentId !== STUDENT_ID) return record;
                const grades = record.grades ?? {};
                return {
                    ...record,
                    grades: {
                        ...grades,
                        [termKey(term)]: updateTermGrades(grades[termKey(term)] ?? {}),
                    },
                };
            }),
        }));
    }

    function updateSandbox(criterionId, taskId, field, value) {
        updateTerm((selectedTerm) => ({
            ...selectedTerm,
            [criterionId]: toTaskList(selectedTerm[criterionId]).map((task) =>
                task.id === taskId ? { ...task, [field]: value } : task
            ),
        }));
    }

    function addCustomTask(event) {
        event.preventDefault();
        const name = taskNameInput.trim();
        const maxScore = Number(taskMaxScore);
        if (!selectedCategory) {
            setSaveError("This subject's grading rule has no criteria to add tasks to.");
            return;
        }
        if (!name || !Number.isFinite(maxScore) || maxScore <= 0) {
            setSaveError("Enter a task name and a maximum score greater than zero.");
            return;
        }

        const customTask = {
            id: `CUSTOM-${Date.now()}`,
            type: selectedCategory,
            sequenceNumber: null,
            title: name,
            description: "",
            maxScore,
            officialScore: null,
            studentReportedScore: null,
            isCustomTask: true,
        };

        const saved = updateTerm((selectedTerm) => ({
            ...selectedTerm,
            [selectedCategory]: [...toTaskList(selectedTerm[selectedCategory]), customTask],
        }));

        if (saved) {
            setTaskNameInput("");
            setTaskMaxScore("");
            setShowAddTask(false);
        }
    }

    if (!studentRecord) {
        return (
            <section className="current-term-records" role="alert">
                This subject has no student record to display.
            </section>
        );
    }

    if (!rule) {
        return (
            <section className="current-term-records" role="alert">
                This subject&apos;s grading rule no longer exists. Choose another
                rule on the Grade Rules page.
            </section>
        );
    }

    // Top-level criteria for the weight summary, e.g. "70% Classwork (70% AT + 30% TLA)".
    const summaryRows = getHierarchyRows(ruleToTree(rule));
    const topLevel = summaryRows
        .map((row, index) => ({ row, index }))
        .filter(({ row }) => row.depth === 1)
        .map(({ row, index }) => {
            const children = [];
            for (let next = index + 1; next < summaryRows.length && summaryRows[next].depth > 1; next += 1) {
                if (summaryRows[next].depth === 2) children.push(summaryRows[next]);
            }
            return { ...row, children };
        });

    return (
        <section className="current-term-records">
            <header className="records-heading">
                <h2>Current Term Records</h2>
                <p>
                    Professor records stay locked. Your own entries stay private.
                </p>
            </header>

            <div className="grade-weight">
                {topLevel.map((group, index) => (
                    <div className="weight-group-wrap" key={group.id}>
                        {index > 0 && <span className="weight-plus">+</span>}
                        <div className="weight-group">
                            <strong>{formatPercent(group.shareOfParent)}</strong>
                            <div>
                                <span>{group.name}</span>
                                <small>
                                    {group.children.length
                                        ? group.children
                                            .map((child) => `${formatPercent(child.shareOfParent)} ${child.name}`)
                                            .join(" + ")
                                        : `${term} tasks`}
                                </small>
                            </div>
                        </div>
                    </div>
                ))}
            </div>

            <p className="records-description">
                Review official scores, add your own notes, and create custom tasks for this term.
            </p>

            <div className="records-box">
                <div className="records-header">
                    <span>{term.toUpperCase()} · SCORES &amp; TASKS</span>
                    <span>Score / Max</span>
                </div>

                {criteria.map((criterion) => {
                    const category = criterion.name;
                    const categoryTasks = tasksFor(criterion.id);
                    return (
                        <section className="term-task-section" key={criterion.id}>
                            <h3 className="term-task-heading">
                                {criterion.path.join(" › ")}
                            </h3>
                            {categoryTasks.length ? categoryTasks.map((task) => {
                                const name = taskName(task, category);
                                const displayName = task.isCustomTask &&
                                    !name.toLowerCase().startsWith(category.toLowerCase())
                                    ? `${category} - ${name}`
                                    : name;
                                return (
                                <div className={`record-row ${task.isCustomTask ? "custom-record" : ""}`} key={task.id}>
                                    <div className="record-information">
                                        <h3>{displayName}</h3>
                                        <p>
                                            {task.isCustomTask
                                                ? <><span className="record-tag">Custom Addition</span> Student-created · Private</>
                                                : !hasOfficialScore(task)
                                                    ? <><span className="record-tag">Self Reported</span> Student entry · Not an official grade</>
                                                    : "Professor-recorded assessment"}
                                        </p>
                                    </div>
                                    <div className="official-score">
                                        <strong>
                                            {hasOfficialScore(task)
                                                ? `${task.officialScore} / ${task.maxScore}`
                                                : "—"}
                                        </strong>
                                        <small>
                                            {hasOfficialScore(task)
                                                ? "Locked · Official"
                                                : "No official score"}
                                        </small>
                                    </div>
                                    {(!hasOfficialScore(task) ||
                                        task.studentReportedScore !== null &&
                                        task.studentReportedScore !== undefined ||
                                        editingScores[task.id]) ? (
                                        <div className="score-editor">
                                            <label className="score-input-group">
                                                <input
                                                    type="number"
                                                    min="0"
                                                    max={task.maxScore}
                                                    step="any"
                                                    placeholder="Add Score"
                                                    aria-label={`Private score for ${displayName}`}
                                                    value={task.studentReportedScore ?? ""}
                                                    onChange={(event) =>
                                                        updateSandbox(criterion.id, task.id, "studentReportedScore", event.target.value)
                                                    }
                                                />
                                                <span>/</span>
                                                <span className="sandbox-max-score">
                                                    {task.maxScore ?? "Max"}
                                                </span>
                                            </label>
                                        </div>
                                    ) : (
                                        <button
                                            type="button"
                                            className="edit-score-button"
                                            aria-label={`Add a private score for ${displayName}`}
                                            onClick={() => setEditingScores((scores) => ({
                                                ...scores,
                                                [task.id]: true,
                                            }))}
                                        >
                                            <svg viewBox="0 0 16 16" fill="none" aria-hidden="true">
                                                <path d="m10.8 2.2 3 3M2 14l3.2-.7L13.8 4.7a1.4 1.4 0 0 0-2-2L3.2 11.3 2 14Z" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round" />
                                            </svg>
                                        </button>
                                    )}
                                </div>
                            );
                            }) : (
                                <p className="term-empty">No {category} records for {term} yet.</p>
                            )}
                        </section>
                    );
                })}

                {uncountedTasks > 0 && (
                    <p className="term-empty">
                        {uncountedTasks} task{uncountedTasks === 1 ? "" : "s"} from criteria that are no
                        longer in this subject&apos;s grading rule {uncountedTasks === 1 ? "is" : "are"} hidden
                        and not counted.
                    </p>
                )}

                {showAddTask && (
                    <form className="add-task-form" onSubmit={addCustomTask}>
                        <select
                            value={selectedCategory}
                            onChange={(event) => setTaskCategory(event.target.value)}
                            aria-label="Sandbox task category"
                        >
                            {criteria.map((criterion) => (
                                <option key={criterion.id} value={criterion.id}>
                                    {criterion.path.join(" › ")}
                                </option>
                            ))}
                        </select>
                        <input
                            type="text"
                            placeholder="Task name"
                            value={taskNameInput}
                            onChange={(event) => setTaskNameInput(event.target.value)}
                            aria-label="Sandbox task name"
                            required
                        />
                        <input
                            type="number"
                            min="0.01"
                            step="any"
                            placeholder="Max score"
                            value={taskMaxScore}
                            onChange={(event) => setTaskMaxScore(event.target.value)}
                            aria-label="Maximum score"
                            required
                        />
                        <button type="submit">Add</button>
                        <button
                            type="button"
                            className="cancel-task-button"
                            onClick={() => {
                                setShowAddTask(false);
                                setTaskNameInput("");
                                setTaskMaxScore("");
                            }}
                        >
                            Cancel
                        </button>
                    </form>
                )}

                {saveError && (
                    <p className="sandbox-error" role="alert">{saveError}</p>
                )}
                <button
                    type="button"
                    className="add-task-button"
                    onClick={() => {
                        setSaveError("");
                        setShowAddTask((shown) => !shown);
                    }}
                    aria-expanded={showAddTask}
                >
                    {showAddTask ? "Close" : "+ Add Custom Task"}
                </button>
                <p className="records-privacy">
                    ⓘ Self-reported scores and custom tasks are private notes for this term. They do not change official records or the target calculator’s formula.
                </p>
            </div>

            <button
                type="button"
                className="breakdown-button"
                onClick={() => setShowBreakdown((shown) => !shown)}
                aria-expanded={showBreakdown}
            >
                <span>{showBreakdown ? "▼" : "▶"}</span>
                {showBreakdown
                    ? "Hide Official Grade Breakdown"
                    : "View Complete Official Grade Breakdown"}
            </button>

            {showBreakdown && (
                <div className="official-breakdown">
                    <p className="official-breakdown-intro">
                        All professor-recorded assessments used by the calculator are listed here. Private task notes above are excluded.
                    </p>
                    {criteria.map((criterion) => {
                        const tasks = tasksFor(criterion.id).filter((task) => !task.isCustomTask);
                        return (
                            <section className="breakdown-section" key={criterion.id}>
                                <div className="breakdown-section-header">
                                    <div className="breakdown-section-title">
                                        <span className="breakdown-section-icon">
                                            {criterion.name.charAt(0).toUpperCase()}
                                        </span>
                                        <h3>{criterion.path.join(" › ")}</h3>
                                    </div>
                                    <span className="breakdown-weight">
                                        {formatPercent(criterion.effectiveShare)} of term grade
                                    </span>
                                </div>
                                {tasks.length ? tasks.map((task) => (
                                    <div className="breakdown-task" key={task.id}>
                                        <div className="breakdown-task-info">
                                            <p className="breakdown-task-name">
                                                {term} · {taskName(task, criterion.name)}
                                            </p>
                                            <p className="breakdown-task-status">
                                                {hasOfficialScore(task)
                                                    ? "Recorded by professor"
                                                    : "Awaiting professor score"}
                                            </p>
                                        </div>
                                        <div className="breakdown-task-score">
                                            <strong>
                                                {hasOfficialScore(task)
                                                    ? `${task.officialScore} / ${task.maxScore}`
                                                    : "—"}
                                            </strong>
                                            <span>
                                                {hasOfficialScore(task)
                                                    ? "Locked · Official"
                                                    : "Not yet recorded"}
                                            </span>
                                        </div>
                                    </div>
                                )) : (
                                    <p className="breakdown-empty">
                                        No official {criterion.name} records for {term}.
                                    </p>
                                )}
                            </section>
                        );
                    })}
                </div>
            )}
            <p className="sandbox-notice">
                ⓘ Sandbox edits cannot change these records.
            </p>
        </section>
    );
}

export default CurrentTermRecords;
