import { useState } from "react";
import { Link } from "react-router-dom";
import Sidebar from "../../components/shared/Sidebar";
import Header from "../../components/shared/Header";
import { getDb, saveDb } from "../../utils/db";
import { calculateOfficialGrade } from "../../utils/grades";
import "./SubjectMenu.css";

const STUDENT_ID = "U1";

function nextId(items, prefix) {
    const highest = items.reduce((max, item) => {
        const number = Number(item.id?.match(/(\d+)$/)?.[1] ?? 0);
        return Math.max(max, number);
    }, 0);

    return `${prefix}-${highest + 1}`;
}

function createEmptyGrades() {
    const emptyExam = (term) => ({
        id: `${term.toUpperCase()}-EXAM`,
        type: "Exam",
        title: `${term[0].toUpperCase()}${term.slice(1)} Exam`,
        maxScore: 100,
        officialScore: null,
        studentReportedScore: null,
    });

    return {
        prelim: { AT: [], TLA: [], Exam: emptyExam("prelim") },
        midterm: { AT: [], TLA: [], Exam: emptyExam("midterm") },
        finals: { AT: [], TLA: [], Exam: emptyExam("finals") },
    };
}

export default function SubjectMenu() {
    const [dbData, setDbData] = useState(() => getDb());
    const student = dbData?.users?.find((user) => user.id === STUDENT_ID);
    const studentName = student?.name || "Student";
    const firstName = studentName.split(" ")[0];
    const initials = studentName
        .split(" ")
        .map((part) => part[0])
        .slice(0, 2)
        .join("")
        .toUpperCase();
    const [showForm, setShowForm] = useState(false);
    const [subjectCode, setSubjectCode] = useState("");
    const [subjectName, setSubjectName] = useState("");
    const [professorName, setProfessorName] = useState("");
    const [section, setSection] = useState(
        () => getDb()?.users?.find((user) => user.id === STUDENT_ID)?.programSection ?? ""
    );
    const [formError, setFormError] = useState("");
    const [activeFilter, setActiveFilter] = useState("all");
    const [search, setSearch] = useState("");

    if (!dbData) {
        return (
            <div className="subject-detail-layout subject-menu-layout">
                <Sidebar />
                <div className="subject-detail-main">
                    <header className="subject-page-header">
                        <div className="subject-page-greeting">
                            <h1>Welcome back, {firstName}!</h1>
                            <p>A little progress, every day.</p>
                        </div>
                    </header>
                    <main className="subject-menu-main">
                        <p role="alert">Unable to load subject data from local storage.</p>
                    </main>
                    <SubjectMenuFooter />
                </div>
            </div>
        );
    }

    const studentClasses = (dbData.classes ?? []).filter((classItem) =>
        classItem.studentRecords?.some((record) => record.studentId === STUDENT_ID)
    );
    const pendingRequests = (dbData.verificationQueue ?? []).filter(
        (request) =>
            request.requestedByStudentId === STUDENT_ID &&
            request.status === "pending" &&
            !studentClasses.some((classItem) => classItem.subjectId === request.subjectId)
    );
    const subjectRows = studentClasses.flatMap((classItem) => {
        const subject = dbData.subjects?.find(
            (item) => item.id === classItem.subjectId
        );
        const studentRecord = classItem.studentRecords?.find(
            (record) => record.studentId === STUDENT_ID
        );
        if (!subject || !studentRecord) return [];

        const professor =
            classItem.professorName ??
            dbData.users?.find((user) => user.id === classItem.professorId)?.name ??
            "Awaiting assignment";
        const rule = dbData.computationRules?.find(
            (item) => item.id === classItem.computationRuleId
        );
        const prelimGrade = calculateOfficialGrade(studentRecord, "Prelim", rule);

        return [{
            classItem,
            subject,
            professor,
            prelimGrade,
            needsAttention:
                classItem.status !== "verified" ||
                (prelimGrade !== null && prelimGrade < 75),
        }];
    });
    const filteredSubjects = subjectRows.filter(({ subject, professor, needsAttention }) => {
        const matchesFilter = activeFilter === "all" || needsAttention;
        const searchText = `${subject.subjectCode} ${subject.subjectName} ${professor}`.toLowerCase();
        return matchesFilter && searchText.includes(search.trim().toLowerCase());
    });

    function submitSubject(event) {
        event.preventDefault();
        setFormError("");

        const code = subjectCode.trim().toUpperCase();
        const name = subjectName.trim();
        const instructor = professorName.trim();
        const programSection = section.trim();
        if (!code || !name || !instructor || !programSection) {
            setFormError("Please complete every field.");
            return;
        }

        const duplicateCode = (dbData.subjects ?? []).some(
            (subject) => subject.subjectCode.toUpperCase() === code
        );
        if (duplicateCode) {
            setFormError("A subject with that code already exists.");
            return;
        }

        const rule = dbData.computationRules?.[0];
        if (!rule) {
            setFormError("A grading rule is required before creating subjects.");
            return;
        }

        const subjectId = nextId(dbData.subjects ?? [], "SUB");
        const classId = nextId(dbData.classes ?? [], "C");
        const requestId = nextId(dbData.verificationQueue ?? [], "REQ");
        const subject = {
            id: subjectId,
            subjectCode: code,
            subjectName: name,
            defaultComputationRuleId: rule.id,
        };
        const classItem = {
            id: classId,
            subjectId,
            programSection,
            units: 3,
            professorId: null,
            professorName: instructor,
            status: "pending",
            computationRuleId: rule.id,
            studentRecords: [
                {
                    studentId: STUDENT_ID,
                    targetGradeSandbox: { desiredFinalGrade: 90 },
                    grades: createEmptyGrades(),
                },
            ],
        };
        const request = {
            id: requestId,
            requestedByStudentId: STUDENT_ID,
            subjectId,
            subjectCode: code,
            subjectName: name,
            programSection,
            requestedProfessorId: null,
            requestedProfessorName: instructor,
            computationRuleId: rule.id,
            status: "pending",
            createdAt: new Date().toISOString(),
        };
        const updatedDb = {
            ...dbData,
            subjects: [...(dbData.subjects ?? []), subject],
            classes: [...(dbData.classes ?? []), classItem],
            verificationQueue: [...(dbData.verificationQueue ?? []), request],
        };

        try {
            saveDb(updatedDb);
        } catch (error) {
            setFormError(`Could not save the subject: ${error.message}`);
            return;
        }

        setDbData(updatedDb);
        setSubjectCode("");
        setSubjectName("");
        setProfessorName("");
        setShowForm(false);
    }

    return (
        <div className="subject-detail-layout subject-menu-layout">
            <Sidebar />
            <div className="subject-detail-main">
                <Header />

            <main className="subject-menu-main">
                <header className="subject-menu-heading">
                    <div>
                        <h1>My Subjects</h1>
                        <p>Your subjects, progress, and next step.</p>
                    </div>
                    <label className="subject-menu-semester">
                        <span>●</span> First Semester · 2026–2027
                    </label>
                </header>

                <section className="subject-menu-section">
                    <div className="subject-menu-section-heading">
                        <div>
                            <h2>Enrolled Subjects <span>{subjectRows.length}</span></h2>
                            <p>All your subjects for the current semester.</p>
                        </div>
                        <button
                            type="button"
                            className="subject-menu-add-button"
                            onClick={() => {
                                setFormError("");
                                setShowForm((open) => !open);
                            }}
                            aria-expanded={showForm}
                        >
                            {showForm ? "Cancel" : "+ Add Subject"}
                        </button>
                    </div>

                    {showForm && (
                        <form className="subject-request-form" onSubmit={submitSubject}>
                            <h2>New Subject Request</h2>
                            <p>
                                You can view all three terms and add private sandbox
                                entries while your request awaits verification.
                            </p>
                            <div className="subject-request-fields">
                                <label>
                                    Subject code
                                    <input
                                        value={subjectCode}
                                        onChange={(event) => setSubjectCode(event.target.value)}
                                        placeholder="e.g. IT102"
                                        required
                                    />
                                </label>
                                <label>
                                    Subject name
                                    <input
                                        value={subjectName}
                                        onChange={(event) => setSubjectName(event.target.value)}
                                        placeholder="e.g. Data Structures"
                                        required
                                    />
                                </label>
                                <label>
                                    Professor
                                    <input
                                        value={professorName}
                                        onChange={(event) => setProfessorName(event.target.value)}
                                        placeholder="e.g. Prof. Maria Santos"
                                        required
                                    />
                                </label>
                                <label>
                                    Program / section
                                    <input
                                        value={section}
                                        onChange={(event) => setSection(event.target.value)}
                                        required
                                    />
                                </label>
                            </div>
                            {formError && (
                                <p className="subject-request-error" role="alert">
                                    {formError}
                                </p>
                            )}
                            <button type="submit" className="subject-menu-add-button">
                                Add Subject
                            </button>
                        </form>
                    )}

                    <div className="subject-menu-table">
                        <div className="subject-menu-toolbar">
                            <div className="subject-menu-filters" role="tablist" aria-label="Filter subjects">
                                <button
                                    type="button"
                                    role="tab"
                                    aria-selected={activeFilter === "all"}
                                    className={activeFilter === "all" ? "selected" : ""}
                                    onClick={() => setActiveFilter("all")}
                                >
                                    All subjects
                                </button>
                                <button
                                    type="button"
                                    role="tab"
                                    aria-selected={activeFilter === "attention"}
                                    className={activeFilter === "attention" ? "selected" : ""}
                                    onClick={() => setActiveFilter("attention")}
                                >
                                    Needs attention <span>{subjectRows.filter((row) => row.needsAttention).length}</span>
                                </button>
                            </div>
                            <input
                                className="subject-menu-search"
                                type="search"
                                placeholder="Search subjects"
                                value={search}
                                onChange={(event) => setSearch(event.target.value)}
                                aria-label="Search subjects"
                            />
                        </div>

                        <div className="subject-menu-table-scroll">
                            <table>
                                <thead>
                                    <tr>
                                        <th>Subject / Professor</th>
                                        <th>Units</th>
                                        <th>Prelim Grade</th>
                                        <th>Status</th>
                                        <th aria-label="Actions" />
                                    </tr>
                                </thead>
                                <tbody>
                                    {filteredSubjects.map((row) => (
                                        <tr key={row.classItem.id}>
                                            <td>
                                                <Link
                                                    className="subject-menu-subject-link"
                                                    to={`/student/subject/${row.classItem.id}`}
                                                >
                                                    <span className="subject-menu-course-icon" aria-hidden="true">
                                                        &lt;/&gt;
                                                    </span>
                                                    <span>
                                                        <small>{row.subject.subjectCode}</small>
                                                        <strong>{row.subject.subjectName}</strong>
                                                        <small>{row.professor}</small>
                                                    </span>
                                                </Link>
                                            </td>
                                            <td>{row.classItem.units ?? 3}</td>
                                            <td>
                                                {row.prelimGrade === null ? "—" : `${row.prelimGrade.toFixed(1)}%`}
                                                <small className="subject-menu-grade-caption">
                                                    {row.prelimGrade === null ? "No official grade" : "Official grade"}
                                                </small>
                                            </td>
                                            <td>
                                                <span className={`subject-menu-status ${
                                                    row.classItem.status === "verified"
                                                        ? row.needsAttention ? "attention" : "passing"
                                                        : "pending"
                                                }`}>
                                                    {row.classItem.status !== "verified"
                                                        ? "Pending verification"
                                                        : row.prelimGrade === null
                                                            ? "No grade"
                                                            : row.needsAttention
                                                                ? "Below passing"
                                                                : "Passing"}
                                                </span>
                                            </td>
                                            <td>
                                                <Link
                                                    className="subject-menu-row-action"
                                                    to={`/student/subject/${row.classItem.id}`}
                                                    aria-label={`View ${row.subject.subjectCode} terms and sandbox`}
                                                >
                                                    →
                                                </Link>
                                            </td>
                                        </tr>
                                    ))}
                                    {filteredSubjects.length === 0 && (
                                        <tr>
                                            <td className="subject-menu-no-results" colSpan="5">
                                                No subjects match this filter.
                                            </td>
                                        </tr>
                                    )}
                                </tbody>
                            </table>
                        </div>
                    </div>
                </section>

                {pendingRequests.length > 0 && (
                    <section className="subject-menu-section subject-menu-pending-section">
                        <h2>Requests awaiting verification</h2>
                        <ul>
                            {pendingRequests.map((request) => (
                                <li key={request.id}>
                                    {request.subjectCode} · {request.subjectName} — pending
                                </li>
                            ))}
                        </ul>
                    </section>
                )}
            </main>
            <SubjectMenuFooter />
            </div>
        </div>
    );
}

function SubjectMenuFooter() {
    return (
        <footer className="subject-page-footer">
            <span>A clearer picture. A stronger semester.</span>
            <span className="subject-page-footer-brand">
                <span>CompUGrade</span>
                <span aria-hidden="true">·</span>
                <span>Built for your potential.</span>
            </span>
        </footer>
    );
}
