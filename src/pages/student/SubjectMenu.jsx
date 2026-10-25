import { useEffect, useState } from "react";
import Sidebar from "../../components/shared/Sidebar";
import Header from "../../components/shared/Header";
import PageFooter from "../../components/shared/PageFooter";
import EnrolledSubjectsTable from "../../components/student/EnrolledSubjectsTable";
import { DB_UPDATED_EVENT, getDb } from "../../utils/db";
import {
    getClassSemesterId,
    getCurrentSemester,
    getEnrolledSubjects,
    getSemesterOptions,
} from "../../utils/subjects";
import "./SubjectMenu.css";

const STUDENT_ID = "U1";
const SEMESTER_OPTIONS = getSemesterOptions();
const DEFAULT_SEMESTER_ID = getCurrentSemester().id;

export default function SubjectMenu() {
    const [dbData, setDbData] = useState(() => getDb());
    const student = dbData?.users?.find((user) => user.id === STUDENT_ID);
    const studentName = student?.name || "Student";
    const firstName = studentName.split(" ")[0];
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

    const subjects = getEnrolledSubjects(dbData, STUDENT_ID, selectedSemesterId);
    const selectedSemester = SEMESTER_OPTIONS.find((option) => option.id === selectedSemesterId);
    const pendingRequests = (dbData.verificationQueue ?? []).filter(
        (request) =>
            request.requestedByStudentId === STUDENT_ID &&
            request.status === "pending" &&
            !(dbData.classes ?? []).some((classItem) => classItem.subjectId === request.subjectId)
    );

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

                <EnrolledSubjectsTable
                    subjects={subjects}
                    subtitle={
                        selectedSemester
                            ? `Your subjects for ${selectedSemester.semester}, ${selectedSemester.academicYear}.`
                            : "Your subjects for this semester."
                    }
                    studentId={STUDENT_ID}
                    initialSection={studentSection}
                    // New subjects go into the current semester, so show it.
                    onSubjectAdded={(classItem) => setSelectedSemesterId(getClassSemesterId(classItem))}
                />

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
