// src/components/student/SandboxSubjectPicker.jsx
// Asks which subject to open in the Target Grade Sandbox (opened from the
// sidebar). Render it only while it should be open.
import { Link } from "react-router-dom";
import Dialog from "../shared/Dialog";
import "./SandboxSubjectPicker.css";

function formatGrade(grade) {
    return grade === null ? "No grade yet" : `Expected ${Number(grade.toFixed(1))}%`;
}

// subjects: rows from getEnrolledSubjects() (classId, subjectCode, subjectName, expectedGrade).
// currentClassId: the subject the student is viewing, listed first.
// termKey: term to open, e.g. "midterm" (optional).
// onClose(): closes the picker.
export default function SandboxSubjectPicker({ subjects, currentClassId = null, termKey = null, onClose }) {
    const ordered = [
        ...subjects.filter((row) => row.classId === currentClassId),
        ...subjects.filter((row) => row.classId !== currentClassId),
    ];
    const query = termKey ? `?term=${termKey}` : "";

    return (
        <Dialog
            title={
                <>
                    <span className="sandbox-picker-eyebrow">Target Grade Sandbox</span>
                    Which subject do you want to plan?
                </>
            }
            className="sandbox-picker-dialog"
            onClose={onClose}
            actions={
                <button type="button" className="sandbox-picker-cancel" onClick={onClose}>
                    Cancel
                </button>
            }
        >
            <p className="sandbox-picker-description">
                The sandbox shows the score you need on your remaining tasks to reach your target.
            </p>
            {ordered.length === 0 ? (
                <p>
                    You have no subjects yet. <Link to="/student/subject" onClick={onClose}>Add a subject</Link> first.
                </p>
            ) : (
                <ul className="sandbox-picker-list">
                    {ordered.map((row) => (
                        <li key={row.classId}>
                            {/* The whole card opens the subject's sandbox. */}
                            <Link
                                className="sandbox-picker-option"
                                to={`/student/subject/${row.classId}/sandbox${query}`}
                                onClick={onClose}
                            >
                                <div className="sandbox-picker-text">
                                    <span className="sandbox-picker-code">
                                        {row.subjectCode}
                                        {row.classId === currentClassId && (
                                            <span className="sandbox-picker-current">Viewing now</span>
                                        )}
                                    </span>
                                    <span className="sandbox-picker-name">{row.subjectName}</span>
                                </div>
                                <span className="sandbox-picker-grade">
                                    {formatGrade(row.expectedGrade)}
                                </span>
                            </Link>
                        </li>
                    ))}
                </ul>
            )}
        </Dialog>
    );
}
