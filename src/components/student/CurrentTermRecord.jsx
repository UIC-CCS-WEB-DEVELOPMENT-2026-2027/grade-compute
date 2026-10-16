
import { useState } from "react";
import "./CurrentTermRecord.css";

function CurrentTermRecords({ term = "Prelim" }) {
    const [tasks, setTasks] = useState([
        {
            id: 1,
            name: "AT 2 - Operating system installation",
            score: "16",
            max: "20",
            type: "Self Reported",
        },
        {
            id: 2,
            name: "TLA 1 - Hardware identification",
            score: "",
            max: "",
            type: "Self Reported",
        },
        {
            id: 3,
            name: "Practice troubleshooting",
            score: "8",
            max: "10",
            type: "Custom Added",
        },
    ]);

    const [taskName, setTaskName] = useState("");
    const [showAddTask, setShowAddTask] = useState(false);
    const [showBreakdown, setShowBreakdown] = useState(false);

    function updateTask(id, field, value) {
        setTasks((currentTasks) =>
            currentTasks.map((task) =>
                task.id === id
                    ? { ...task, [field]: value }
                    : task
            )
        );
    }

    function addCustomTask(event) {
        event.preventDefault();

        if (!taskName.trim()) {
            return;
        }

        setTasks((currentTasks) => [
            ...currentTasks,
            {
                id: Date.now(),
                name: taskName.trim(),
                score: "",
                max: "",
                type: "Custom Added",
            },
        ]);

        setTaskName("");
        setShowAddTask(false);
    }

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
                Review official scores, add your own notes, and create
                custom tasks for this term.
            </p>

            <div className="records-box">
                <div className="records-header">
                    <span>{term.toUpperCase()} · SCORES &amp; TASKS</span>
                    <span>Score / Max</span>
                </div>

                <div className="record-row">
                    <div className="record-information">
                        <h3>AT 1 - Computer hardware essentials</h3>
                        <p>Professor-recorded assessment</p>
                    </div>

                    <div className="official-score">
                        <strong>18 / 20</strong>
                        <small>🔒 Official · Locked</small>
                    </div>
                </div>

                {tasks.map((task) => (
                    <div
                        className={`record-row ${
                            task.type === "Custom Added"
                                ? "custom-record"
                                : ""
                        }`}
                        key={task.id}
                    >
                        <div className="record-information">
                            <div className="record-title">
                                {task.type === "Custom Added" && (
                                    <span className="custom-prefix">
                                        AT
                                    </span>
                                )}

                                <h3>{task.name}</h3>
                            </div>

                            <p>
                                <span className="record-tag">
                                    {task.type}
                                </span>

                                {task.type === "Custom Added"
                                    ? "Student created · Private"
                                    : "Student entry · Not an official grade"}
                            </p>
                        </div>

                        <div className="score-editor">
                            <div className="score-input-group">
                                <input
                                    type="number"
                                    min="0"
                                    max={
                                        task.max !== ""
                                            ? task.max
                                            : undefined
                                    }
                                    step="any"
                                    placeholder="Score"
                                    aria-label={`Score for ${task.name}`}
                                    value={task.score}
                                    onChange={(event) =>
                                        updateTask(
                                            task.id,
                                            "score",
                                            event.target.value
                                        )
                                    }
                                />

                                <span>/</span>

                                <input
                                    type="number"
                                    min="1"
                                    step="any"
                                    placeholder="Max"
                                    aria-label={`Maximum score for ${task.name}`}
                                    value={task.max}
                                    onChange={(event) =>
                                        updateTask(
                                            task.id,
                                            "max",
                                            event.target.value
                                        )
                                    }
                                />
                            </div>
                        </div>
                    </div>
                ))}

                {showAddTask && (
                    <form
                        className="add-task-form"
                        onSubmit={addCustomTask}
                    >
                        <input
                            type="text"
                            placeholder="Enter custom task name"
                            value={taskName}
                            onChange={(event) =>
                                setTaskName(event.target.value)
                            }
                            aria-label="Custom task name"
                            autoFocus
                            required
                        />

                        <button type="submit">Add</button>

                        <button
                            type="button"
                            className="cancel-task-button"
                            onClick={() => {
                                setShowAddTask(false);
                                setTaskName("");
                            }}
                        >
                            Cancel
                        </button>
                    </form>
                )}

                <button
                    type="button"
                    className="add-task-button"
                    onClick={() => setShowAddTask((previous) => !previous)}
                    aria-expanded={showAddTask}
                >
                    {showAddTask ? "− Cancel Adding Task" : "+ Add Custom Task"}
                </button>

                <p className="records-privacy">
                    ⓘ Self-reported scores and custom tasks are private
                    notes for this term. They do not change official
                    records or the target calculator's formula.
                </p>
            </div>

            <button
                type="button"
                className="breakdown-button"
                onClick={() =>
                    setShowBreakdown((previous) => !previous)
                }
                aria-expanded={showBreakdown}
            >
                <span>{showBreakdown ? "▼" : "▶"}</span>
                {showBreakdown
                    ? "Complete Official Grade Breakdown"
                    : "View Complete Official Grade Breakdown"}
            </button>

            {showBreakdown && (
    <div className="official-breakdown">
        <p className="official-breakdown-intro">
            All professor-recorded assessment results used by the
            calculator are listed below. Private student notes are excluded.
        </p>

        {/* ASSESSMENT TASKS */}
        <section className="breakdown-section">
            <div className="breakdown-section-header">
                <div className="breakdown-section-title">
                    <span className="breakdown-section-icon">✓</span>
                    <h3>Assessment Tasks</h3>
                    <span>ATs</span>
                </div>

                <span className="breakdown-weight">
                    35% of term grade
                </span>
            </div>

            {[
                {
                    name: "AT 1 - Computer hardware essentials",
                    score: "18 / 20",
                    status: "Recorded by professor",
                    recorded: true,
                },
                {
                    name: "AT 2 - Operating system installation",
                    score: "—",
                    status: "Awaiting professor score",
                    recorded: false,
                },
                {
                    name: "AT 3 - Network configuration",
                    score: "—",
                    status: "Awaiting professor score",
                    recorded: false,
                },
            ].map((task, index) => (
                <div className="breakdown-task" key={index}>
                    <div className="breakdown-task-info">
                        <p className="breakdown-task-name">
                            {term} · {task.name}
                        </p>
                        <p className="breakdown-task-status">
                            {term} · {task.status}
                        </p>
                    </div>

                    <div className="breakdown-task-score">
                        <strong>{task.score}</strong>
                        <span>
                            {task.recorded
                                ? "Locked · Official"
                                : "Not yet recorded"}
                        </span>
                    </div>
                </div>
            ))}
        </section>

        {/* TEACHING AND LEARNING ACTIVITIES */}
        <section className="breakdown-section">
            <div className="breakdown-section-header">
                <div className="breakdown-section-title">
                    <span className="breakdown-section-icon">↗</span>
                    <h3>Teaching &amp; Learning Activities</h3>
                    <span>TLAs</span>
                </div>

                <span className="breakdown-weight">
                    35% of term grade
                </span>
            </div>

            {[
                "TLA 1 - Hardware identification",
                "TLA 2 - Troubleshooting workshop",
                "TLA 3 - System maintenance lab",
                "TLA 4 - Network troubleshooting",
            ].map((name, index) => (
                <div className="breakdown-task" key={index}>
                    <div className="breakdown-task-info">
                        <p className="breakdown-task-name">
                            {term} · {name}
                        </p>
                        <p className="breakdown-task-status">
                            {term} · Awaiting professor score
                        </p>
                    </div>

                    <div className="breakdown-task-score">
                        <strong>—</strong>
                        <span>Not yet recorded</span>
                    </div>
                </div>
            ))}
        </section>

        {/* EXAMINATIONS */}
        <section className="breakdown-section">
            <div className="breakdown-section-header">
                <div className="breakdown-section-title">
                    <span className="breakdown-section-icon">≡</span>
                    <h3>Examinations</h3>
                    <span>Exams</span>
                </div>

                <span className="breakdown-weight">
                    30% of term grade
                </span>
            </div>

            <div className="breakdown-task">
                <div className="breakdown-task-info">
                    <p className="breakdown-task-name">
                        {term} Exam
                    </p>
                    <p className="breakdown-task-status">
                        {term} · Awaiting professor score
                    </p>
                </div>

                <div className="breakdown-task-score">
                    <strong>—</strong>
                    <span>Not yet recorded</span>
                </div>
            </div>
        </section>
    </div>
)}
            <p className="sandbox-notice">
                ⓘ Sandbox edits cannot change official records.
            </p>
        </section>
    );
}

export default CurrentTermRecords;
