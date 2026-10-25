// src/components/student/EnrolledSubjectsTable.jsx
// The Enrolled Subjects table used on the Dashboard and My Subjects pages.
// Rows come from getEnrolledSubjects() in utils/subjects.js.
// It also holds the "+ Add subject" button and form, so both pages add
// subjects the same way.
import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import AddSubjectForm from "./AddSubjectForm";
import { PASSING_GRADE } from "../../utils/subjects";
import "./EnrolledSubjectsTable.css";

const STATUS_LABELS = {
    passing: "Passing",
    below: "Below passing",
    none: "No grades yet",
};

function formatGrade(grade) {
    return grade === null ? "—" : `${Number(grade.toFixed(1))}%`;
}

// Short label for the icon box: the letters of the subject code ("IT101" -> "IT").
function subjectInitials(subjectCode) {
    const letters = String(subjectCode ?? "").replace(/[^A-Za-z]/g, "");
    return (letters || "?").slice(0, 2).toUpperCase();
}

// subjects: rows from getEnrolledSubjects().
// subtitle: line under the title.
// studentId / initialSection: passed to AddSubjectForm.
// onSubjectAdded(classItem): called after the form saves a subject.
export default function EnrolledSubjectsTable({
    subjects = [],
    subtitle = "All your subjects for the current semester.",
    studentId,
    initialSection = "",
    onSubjectAdded,
}) {
    const navigate = useNavigate();
    const [activeFilter, setActiveFilter] = useState("all");
    const [search, setSearch] = useState("");
    const [showForm, setShowForm] = useState(false);

    const needsAttentionCount = subjects.filter((row) => row.status === "below").length;
    const query = search.trim().toLowerCase();
    const visibleSubjects = subjects.filter((row) => {
        if (activeFilter === "attention" && row.status !== "below") return false;
        const text = `${row.subjectCode} ${row.subjectName} ${row.professor}`.toLowerCase();
        return text.includes(query);
    });

    function handleAdded(classItem) {
        setShowForm(false);
        onSubjectAdded?.(classItem);
    }

    return (
        <section className="enrolled-subjects" aria-labelledby="enrolled-subjects-title">
            <div className="enrolled-header">
                <div>
                    <div className="enrolled-title-row">
                        <h2 className="enrolled-title" id="enrolled-subjects-title">
                            Enrolled Subjects
                        </h2>
                        <span className="enrolled-count">{subjects.length}</span>
                    </div>
                    <p className="enrolled-subtitle">{subtitle}</p>
                </div>
                <button
                    type="button"
                    className="enrolled-add-button"
                    onClick={() => setShowForm((open) => !open)}
                    aria-expanded={showForm}
                >
                    {showForm ? "Close form" : "+ Add subject"}
                </button>
            </div>

            {showForm && (
                <AddSubjectForm
                    studentId={studentId}
                    initialSection={initialSection}
                    onCancel={() => setShowForm(false)}
                    onAdded={handleAdded}
                />
            )}

            <div className="enrolled-controls">
                <div className="enrolled-tabs" role="tablist" aria-label="Filter subjects">
                    <button
                        type="button"
                        role="tab"
                        aria-selected={activeFilter === "all"}
                        className={`enrolled-tab${activeFilter === "all" ? " active" : ""}`}
                        onClick={() => setActiveFilter("all")}
                    >
                        All subjects
                    </button>
                    <button
                        type="button"
                        role="tab"
                        aria-selected={activeFilter === "attention"}
                        className={`enrolled-tab${activeFilter === "attention" ? " active" : ""}`}
                        onClick={() => setActiveFilter("attention")}
                    >
                        Needs attention
                        {needsAttentionCount > 0 && (
                            <span className="enrolled-tab-count">{needsAttentionCount}</span>
                        )}
                    </button>
                </div>
                <input
                    type="search"
                    className="enrolled-search"
                    placeholder="Search subjects..."
                    value={search}
                    onChange={(event) => setSearch(event.target.value)}
                    aria-label="Search subjects"
                />
            </div>

            <div className="enrolled-table-wrapper">
                <table className="enrolled-table">
                    <thead>
                        <tr>
                            <th scope="col">Subject / Professor</th>
                            <th scope="col">Official grade</th>
                            <th scope="col">Expected grade</th>
                            <th scope="col">Status</th>
                            <th scope="col" aria-label="Open subject" />
                        </tr>
                    </thead>
                    <tbody>
                        {visibleSubjects.map((row) => {
                            const detailPath = `/student/subject/${row.classId}`;
                            return (
                                // The row is clickable with a mouse; the links
                                // inside are what keyboards and screen readers use.
                                <tr key={row.classId} onClick={() => navigate(detailPath)}>
                                    <td>
                                        <Link
                                            className="enrolled-subject"
                                            to={detailPath}
                                            onClick={(event) => event.stopPropagation()}
                                        >
                                            <span className="enrolled-icon" aria-hidden="true">
                                                {subjectInitials(row.subjectCode)}
                                            </span>
                                            <span className="enrolled-subject-text">
                                                <span className="enrolled-code">{row.subjectCode}</span>
                                                <span className="enrolled-name">{row.subjectName}</span>
                                                <span className="enrolled-prof">{row.professor}</span>
                                            </span>
                                        </Link>
                                    </td>
                                    <td>
                                        <span className="enrolled-grade-num">
                                            {formatGrade(row.officialGrade)}
                                        </span>
                                        <span className="enrolled-grade-label">
                                            {row.officialGrade === null ? "Not posted yet" : "Posted by professor"}
                                        </span>
                                    </td>
                                    <td>
                                        <span className="enrolled-grade-num expected">
                                            {formatGrade(row.expectedGrade)}
                                        </span>
                                        <span className="enrolled-grade-label">
                                            {row.expectedGrade === null ? "No scores yet" : "With your scores"}
                                        </span>
                                    </td>
                                    <td>
                                        <span className={`enrolled-status ${row.status}`}>
                                            {STATUS_LABELS[row.status]}
                                        </span>
                                    </td>
                                    <td className="enrolled-action">
                                        <Link
                                            className="enrolled-arrow"
                                            to={detailPath}
                                            onClick={(event) => event.stopPropagation()}
                                            aria-label={`Open ${row.subjectCode}`}
                                        >
                                            →
                                        </Link>
                                    </td>
                                </tr>
                            );
                        })}
                        {visibleSubjects.length === 0 && (
                            <tr className="enrolled-empty-row">
                                <td className="enrolled-empty" colSpan="5">
                                    {subjects.length === 0
                                        ? "No subjects yet. Use + Add subject to add your first one."
                                        : "No subjects match this filter."}
                                </td>
                            </tr>
                        )}
                    </tbody>
                </table>
            </div>

            <div className="enrolled-footer">
                <span>
                    • Official grades are posted by your professors. Expected
                    grades fill the gaps with your own scores.
                </span>
                <span>Passing grade: {PASSING_GRADE}%</span>
            </div>
        </section>
    );
}
