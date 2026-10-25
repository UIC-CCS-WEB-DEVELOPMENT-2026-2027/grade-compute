import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import Sidebar from "../../components/shared/Sidebar";
import Header from "../../components/shared/Header";
import PageFooter from "../../components/shared/PageFooter";
import AddSubjectForm from "../../components/student/AddSubjectForm";
import { DB_UPDATED_EVENT, getDb, saveDb } from "../../utils/db";
import { calculateOfficialGrade } from "../../utils/grades";
import { nextId } from "../../utils/rules";
import "./SubjectMenu.css";

const STUDENT_ID = "U1";
const SEMESTERS = [
    { id: "first", semester: "First Semester", startMonth: 7, endMonth: 11 },
    { id: "second", semester: "Second Semester", startMonth: 0, endMonth: 4 },
    { id: "summer", semester: "Summer", startMonth: 5, endMonth: 6 },
];

function getAcademicYearStart(year, month) {
    return month >= 7 ? year : year - 1;
}

const now = new Date();
const currentMonth = now.getMonth();
const currentAcademicYearStart = getAcademicYearStart(now.getFullYear(), currentMonth);
const academicYear = `${currentAcademicYearStart}–${currentAcademicYearStart + 1}`;
const SEMESTER_OPTIONS = SEMESTERS.map((semester) => ({
    ...semester,
    id: `${semester.id}-${academicYear}`,
    academicYear,
    isCurrent: currentMonth >= semester.startMonth && currentMonth <= semester.endMonth,
}));
const CURRENT_SEMESTER = SEMESTER_OPTIONS.find((semester) => semester.isCurrent);
const DEFAULT_SEMESTER_ID = CURRENT_SEMESTER.id;

function semesterId(classItem) {
    const semesterName = classItem.semester ?? SEMESTERS[0].semester;
    const year = classItem.academicYear ?? academicYear;
    const semester = SEMESTERS.find(
        (option) => option.semester === semesterName
    );
    return semester ? `${semester.id}-${year}` : undefined;
}

// Tasks are added per criterion of the subject's grading rule, so each term
// starts empty. See grades.js for the stored shape.
function createEmptyGrades() {
    return { prelim: {}, midterm: {}, finals: {} };
}

export default function SubjectMenu() {
    const [dbData, setDbData] = useState(() => getDb());
    const student = dbData?.users?.find((user) => user.id === STUDENT_ID);
    const studentName = student?.name || "Student";
    const firstName = studentName.split(" ")[0];
    const [showForm, setShowForm] = useState(false);
    const [subjectCode, setSubjectCode] = useState("");
    const [subjectName, setSubjectName] = useState("");
    const [professorName, setProfessorName] = useState("");
    const [section, setSection] = useState(
        () => getDb()?.users?.find((user) => user.id === STUDENT_ID)?.programSection ?? ""
    );
    const [ruleId, setRuleId] = useState(
        () => getDb()?.computationRules?.[0]?.id ?? ""
    );
    const [formError, setFormError] = useState("");
    const [activeFilter, setActiveFilter] = useState("all");
    const [search, setSearch] = useState("");
    const [selectedSemesterId, setSelectedSemesterId] = useState(DEFAULT_SEMESTER_ID);
    const studentSection = student?.programSection ?? "";

    useEffect(() => {
        const refreshDbData = () => setDbData(getDb());
        window.addEventListener(DB_UPDATED_EVENT, refreshDbData);
        return () => window.removeEventListener(DB_UPDATED_EVENT, refreshDbData);
    }, []);

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
                    <PageFooter />
                </div>
            </div>
        );
    }

    const studentClasses = (dbData.classes ?? []).filter((classItem) =>
        semesterId(classItem) === selectedSemesterId
    ).filter((classItem) =>
        classItem.studentRecords?.some((record) => record.studentId === STUDENT_ID)
    );
    const pendingRequests = (dbData.verificationQueue ?? []).filter(
        (request) =>
            request.requestedByStudentId === STUDENT_ID &&
            request.status === "pending" &&
            !(dbData.classes ?? []).some((classItem) => classItem.subjectId === request.subjectId)
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

    function submitSubject({ subjectCode: code, subjectName: name, professorName: instructor, section: programSection }) {
        const currentDb = getDb() ?? dbData;
        const duplicateCode = (currentDb.subjects ?? []).some(
            (subject) => subject.subjectCode.toUpperCase() === code
        );
        if (duplicateCode) {
            return { fieldErrors: { subjectCode: "A subject with that code already exists." } };
        }

        const rule = currentDb.computationRules?.[0];
        if (!rule) {
            return { formError: "A grading rule is required before creating subjects." };
        const rule = dbData.computationRules?.find((item) => item.id === ruleId);
        if (!rule) {
            setFormError("Choose a grading rule for this subject.");
            return;
        }

        const subjectId = nextId(currentDb.subjects ?? [], "SUB");
        const classId = nextId(currentDb.classes ?? [], "C");
        const requestId = nextId(currentDb.verificationQueue ?? [], "REQ");
        const subject = {
            id: subjectId,
            subjectCode: code,
            subjectName: name,
            defaultComputationRuleId: rule.id,
        };
        const classItem = {
            id: classId,
            subjectId,
            semester: CURRENT_SEMESTER.semester,
            academicYear: CURRENT_SEMESTER.academicYear,
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
            ...currentDb,
            subjects: [...(currentDb.subjects ?? []), subject],
            classes: [...(currentDb.classes ?? []), classItem],
            verificationQueue: [...(currentDb.verificationQueue ?? []), request],
        };

        try {
            saveDb(updatedDb);
        } catch (error) {
            return { formError: `Could not save the subject: ${error.message}` };
        }

        setDbData(getDb() ?? updatedDb);
        setSelectedSemesterId(semesterId(classItem));
        setShowForm(false);
        return null;
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
                        <span aria-hidden="true">●</span>
                        <select
                            value={selectedSemesterId}
                            onChange={(event) => setSelectedSemesterId(event.target.value)}
                            aria-label="View subjects by semester"
                        >
                            {SEMESTER_OPTIONS.map((option) => (
                                <option key={option.id} value={option.id} disabled={!option.isCurrent}>
                                    {option.semester} · {option.academicYear}
                                </option>
                            ))}
                        </select>
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
                                setShowForm((open) => !open);
                            }}
                            aria-expanded={showForm}
                        >
                            {showForm ? "Cancel" : "+ Add Subject"}
                        </button>
                    </div>

                    {showForm && (
                        <AddSubjectForm
                            initialSection={studentSection}
                            onCancel={() => setShowForm(false)}
                            onSubmit={submitSubject}
                        />
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
                                <label>
                                    Grading rule
                                    <select
                                        value={ruleId}
                                        onChange={(event) => setRuleId(event.target.value)}
                                        required
                                    >
                                        {(dbData.computationRules ?? []).map((rule) => (
                                            <option key={rule.id} value={rule.id}>
                                                {rule.ruleName}
                                            </option>
                                        ))}
                                    </select>
                                    <Link className="subject-request-rule-link" to="/student/rules">
                                        View or create grading rules
                                    </Link>
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
            <PageFooter />
            </div>
        </div>
    );
}
