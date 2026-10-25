import { useState } from "react";
import { getDb, saveDb } from "../../utils/db";
import "./CurrentTermRecord.css";

const STUDENT_ID = "U1";

function termKey(term) {
    return term.toLowerCase();
}

function taskName(task, category) {
    const title = task.title ?? `${category} ${task.sequenceNumber ?? ""}`.trim();
    return task.description ? `${title} - ${task.description}` : title;
}

function CurrentTermRecords({ classId, term = "Prelim" }) {
    const [dbData, setDbData] = useState(() => getDb());
    const [taskNameInput, setTaskNameInput] = useState("");
    const [taskMaxScore, setTaskMaxScore] = useState("");
    const [taskCategory, setTaskCategory] = useState("AT");
    const [showAddTask, setShowAddTask] = useState(false);
    const [showBreakdown, setShowBreakdown] = useState(false);
    const [saveError, setSaveError] = useState("");

    const classItem = dbData?.classes?.find((item) => item.id === classId);
    const studentRecord = classItem?.studentRecords?.find(
        (record) => record.studentId === STUDENT_ID
    );
    const currentTerm = studentRecord?.grades?.[termKey(term)] ?? {
        AT: [],
        TLA: [],
        Exam: {},
    };

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

    function updateSandbox(category, taskId, field, value) {
        const selectedTerm = studentRecord?.grades?.[termKey(term)];
        const selectedAssessment = category === "Exam"
            ? selectedTerm?.Exam
            : selectedTerm?.[category]?.find((task) => task.id === taskId);

        if (selectedAssessment?.officialScore !== null &&
            selectedAssessment?.officialScore !== undefined) {
            setSaveError("This score is locked because it was recorded by a professor.");
            return;
        }

        saveChanges((item) => ({
            ...item,
            studentRecords: item.studentRecords.map((record) => {
                if (record.studentId !== STUDENT_ID) return record;
                const grades = record.grades ?? {};
                const selectedTerm = grades[termKey(term)] ?? {
                    AT: [],
                    TLA: [],
                    Exam: {},
                };
                const updatedTerm = category === "Exam"
                    ? {
                        ...selectedTerm,
                        Exam: {
                            ...(selectedTerm.Exam ?? {}),
                            studentReportedScore: value,
                        },
                    }
                    : {
                        ...selectedTerm,
                        [category]: (selectedTerm[category] ?? []).map((task) =>
                            task.id === taskId ? { ...task, [field]: value } : task
                        ),
                    };

                return {
                    ...record,
                    grades: { ...grades, [termKey(term)]: updatedTerm },
                };
            }),
        }));
    }

    function addCustomTask(event) {
        event.preventDefault();
        const name = taskNameInput.trim();
        const maxScore = Number(taskMaxScore);
        if (!name || !Number.isInteger(maxScore) || maxScore <= 0) {
            setSaveError("Enter a task name and a whole-number maximum score greater than zero.");
            return;
        }

        const customTask = {
            id: `CUSTOM-${Date.now()}`,
            type: taskCategory,
            sequenceNumber: null,
            title: name,
            description: "",
            maxScore,
            officialScore: null,
            studentReportedScore: null,
            isCustomTask: true,
        };

        const saved = saveChanges((item) => ({
            ...item,
            studentRecords: item.studentRecords.map((record) => {
                if (record.studentId !== STUDENT_ID) return record;
                const grades = record.grades ?? {};
                const selectedTerm = grades[termKey(term)] ?? {
                    AT: [],
                    TLA: [],
                    Exam: {},
                };

                return {
                    ...record,
                    grades: {
                        ...grades,
                        [termKey(term)]: {
                            ...selectedTerm,
                            [taskCategory]: [
                                ...(selectedTerm[taskCategory] ?? []),
                                customTask,
                            ],
                        },
                    },
                };
            }),
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

    const breakdownSections = [
        { category: "AT", title: "Assessment Tasks", icon: "✓", weight: "70% of classwork" },
        { category: "TLA", title: "Teaching & Learning Activities", icon: "↗", weight: "30% of classwork" },
    ];
    const exam = {
        title: `${term} Exam`,
        maxScore: 100,
        ...(currentTerm.Exam ?? {}),
    };

    return (
        <section className="current-term-records">
            <header className="records-heading">
                <h2>Current Term Records</h2>
                <p>
                    Professor records stay locked. Your own entries stay private.
                </p>
            </header>

            <div className="grade-weight">
                <div className="weight-group">
                    <strong>70%</strong>
                    <div>
                        <span>Classwork</span>
                        <small>70% ATs + 30% TLAs</small>
                    </div>
                </div>
                <span className="weight-plus">+</span>
                <div className="weight-group exams-group">
                    <strong>30%</strong>
                    <div>
                        <span>Exams</span>
                        <small>{term} exam only</small>
                    </div>
                </div>
            </div>

            <p className="records-description">
                Review official scores, add your own notes, and create custom tasks for this term.
            </p>

            <div className="records-box">
                <div className="records-header">
                    <span>{term.toUpperCase()} · SCORES &amp; TASKS</span>
                    <span>Score / Max</span>
                </div>

                {["AT", "TLA"].map((category) => {
                    const categoryTasks = currentTerm[category] ?? [];
                    return (
                        <section className="term-task-section" key={category}>
                            <h3 className="term-task-heading">
                                {category === "AT"
                                    ? "Assessment Tasks"
                                    : "Teaching & Learning Activities"}
                            </h3>
                            {categoryTasks.length ? categoryTasks.map((task) => {
                                const name = taskName(task, category);
                                const displayName = task.isCustomTask &&
                                    !name.toLowerCase().startsWith(category.toLowerCase())
                                    ? `${category} - ${name}`
                                    : name;
                                const isOfficialLocked = task.officialScore !== null &&
                                    task.officialScore !== undefined;
                                return (
                                <div className={`record-row ${task.isCustomTask ? "custom-record" : ""}`} key={task.id}>
                                    <div className="record-information">
                                        <h3>{displayName}</h3>
                                        <p>
                                            {task.isCustomTask
                                                ? <><span className="record-tag">Custom Addition</span> Student-created · Private</>
                                                : task.officialScore === null || task.officialScore === undefined
                                                    ? <><span className="record-tag">Self Reported</span> Student entry · Not an official grade</>
                                                    : "Professor-recorded assessment"}
                                        </p>
                                    </div>
                                    <div className="official-score">
                                        <strong>
                                            {task.officialScore === null || task.officialScore === undefined
                                                ? "—"
                                                : `${task.officialScore} / ${task.maxScore}`}
                                        </strong>
                                        <small>
                                            {task.officialScore === null || task.officialScore === undefined
                                                ? "No official score"
                                                : "Locked · Official"}
                                        </small>
                                    </div>
                                    {!isOfficialLocked ? (
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
                                                        updateSandbox(category, task.id, "studentReportedScore", event.target.value)
                                                    }
                                                />
                                                <span>/</span>
                                                <span className="sandbox-max-score">
                                                    {task.maxScore ?? "Max"}
                                                </span>
                                            </label>
                                        </div>
                                    ) : null}
                                </div>
                            );
                            }) : (
                                <p className="term-empty">No {category} records for {term} yet.</p>
                            )}
                        </section>
                    );
                })}

                <section className="term-task-section">
                    <h3 className="term-task-heading">Examination</h3>
                    {(
                        <div className="record-row">
                            <div className="record-information">
                                <h3>{exam.title}</h3>
                                <p>Professor-recorded examination</p>
                            </div>
                            <div className="official-score">
                                <strong>
                                    {exam.officialScore === null || exam.officialScore === undefined
                                        ? "—"
                                        : `${exam.officialScore} / ${exam.maxScore}`}
                                </strong>
                                <small>
                                    {exam.officialScore === null || exam.officialScore === undefined
                                        ? "No official score"
                                        : "Locked · Official"}
                                </small>
                            </div>
                            {(exam.officialScore === null || exam.officialScore === undefined) && (
                                <div className="score-editor">
                                    <label className="score-input-group">
                                        <input
                                            type="number"
                                            min="0"
                                            max={exam.maxScore}
                                            step="any"
                                            placeholder="Score"
                                            aria-label={`Private score for ${term} Exam`}
                                            value={exam.studentReportedScore ?? ""}
                                            onChange={(event) =>
                                                updateSandbox("Exam", exam.id, "studentReportedScore", event.target.value)
                                            }
                                        />
                                        <span>/</span>
                                        <span className="sandbox-max-score">
                                            {exam.maxScore}
                                        </span>
                                    </label>
                                </div>
                            )}
                        </div>
                    )}
                </section>

                {showAddTask && (
                    <form className="add-task-form" onSubmit={addCustomTask}>
                        <select
                            value={taskCategory}
                            onChange={(event) => setTaskCategory(event.target.value)}
                            aria-label="Sandbox task category"
                        >
                            <option value="AT">Assessment Task</option>
                            <option value="TLA">Teaching &amp; Learning Activity</option>
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
                            type="text"
                            inputMode="numeric"
                            pattern="[0-9]*"
                            placeholder="Max score"
                            value={taskMaxScore}
                            onChange={(event) => {
                                const value = event.target.value;
                                if (/^\d*$/.test(value)) setTaskMaxScore(value);
                            }}
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
                    {breakdownSections.map(({ category, title, icon, weight }) => {
                        const tasks = (currentTerm[category] ?? []).filter(
                            (task) => !task.isCustomTask
                        );
                        return (
                            <section className="breakdown-section" key={category}>
                                <div className="breakdown-section-header">
                                    <div className="breakdown-section-title">
                                        <span className="breakdown-section-icon">{icon}</span>
                                        <h3>{title}</h3>
                                        <span>{category === "AT" ? "ATs" : "TLAs"}</span>
                                    </div>
                                    <span className="breakdown-weight">{weight}</span>
                                </div>
                                {tasks.length ? tasks.map((task) => (
                                    <div className="breakdown-task" key={task.id}>
                                        <div className="breakdown-task-info">
                                            <p className="breakdown-task-name">
                                                {term} · {taskName(task, category)}
                                            </p>
                                            <p className="breakdown-task-status">
                                                {task.officialScore === null || task.officialScore === undefined
                                                    ? "Awaiting professor score"
                                                    : "Recorded by professor"}
                                            </p>
                                        </div>
                                        <div className="breakdown-task-score">
                                            <strong>
                                                {task.officialScore === null || task.officialScore === undefined
                                                    ? "—"
                                                    : `${task.officialScore} / ${task.maxScore}`}
                                            </strong>
                                            <span>
                                                {task.officialScore === null || task.officialScore === undefined
                                                    ? "Not yet recorded"
                                                    : "Locked · Official"}
                                            </span>
                                        </div>
                                    </div>
                                )) : (
                                    <p className="breakdown-empty">
                                        No official {category} records for {term}.
                                    </p>
                                )}
                            </section>
                        );
                    })}
                    <section className="breakdown-section">
                        <div className="breakdown-section-header">
                            <div className="breakdown-section-title">
                                <span className="breakdown-section-icon">≡</span>
                                <h3>Examination</h3>
                            </div>
                            <span className="breakdown-weight">30% of term grade</span>
                        </div>
                        <div className="breakdown-task">
                            <div className="breakdown-task-info">
                                <p className="breakdown-task-name">
                                    {exam.title}
                                </p>
                                <p className="breakdown-task-status">
                                    {exam.officialScore === null ||
                                    exam.officialScore === undefined
                                        ? "Awaiting professor score"
                                        : "Recorded by professor"}
                                </p>
                            </div>
                            <div className="breakdown-task-score">
                                <strong>
                                    {exam.officialScore === null ||
                                    exam.officialScore === undefined
                                        ? "—"
                                        : `${exam.officialScore} / ${exam.maxScore}`}
                                </strong>
                                <span>
                                    {exam.officialScore === null ||
                                    exam.officialScore === undefined
                                        ? "Not yet recorded"
                                        : "Locked · Official"}
                                </span>
                            </div>
                        </div>
                    </section>
                </div>
            )}
            <p className="sandbox-notice">
                ⓘ Sandbox edits cannot change these records.
            </p>
        </section>
    );
}

export default CurrentTermRecords;
