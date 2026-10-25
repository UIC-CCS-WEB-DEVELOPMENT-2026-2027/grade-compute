// src/pages/student/StudentDashboard.jsx

import { useEffect, useState } from "react";
import Sidebar from "../../components/shared/Sidebar";
import Header from "../../components/shared/Header";
import PageFooter from "../../components/shared/PageFooter";
import EnrolledSubjectsTable from "../../components/student/EnrolledSubjectsTable";
import { DB_UPDATED_EVENT, getDb } from "../../utils/db";
import { getCurrentSemester, getEnrolledSubjects } from "../../utils/subjects";
import "./StudentDashboard.css";

const STUDENT_ID = "U1";

export default function StudentDashboard() {
    const [dbData, setDbData] = useState(() => getDb());
    const semester = getCurrentSemester();
    const student = dbData?.users?.find((user) => user.id === STUDENT_ID);
    // The dashboard shows the current semester's subjects.
    const subjects = getEnrolledSubjects(dbData, STUDENT_ID, semester.id);

    // Refresh when any page saves the database (e.g. a subject is added).
    useEffect(() => {
        const refresh = () => setDbData(getDb());
        window.addEventListener(DB_UPDATED_EVENT, refresh);
        return () => window.removeEventListener(DB_UPDATED_EVENT, refresh);
    }, []);

    return (
        <div className="dashboard-page">
            <Sidebar />

            {/* Everything right of the sidebar. It takes the remaining width,
                so the header and content always line up with the sidebar. */}
            <div className="dashboard-shell">
                <Header />

            <main className="dashboard-main">
                {/* --- STUDENT OVERVIEW BANNER --- */}
                <div className="overview-banner">
                    <div className="overview-text">
                        <span className="overview-label">
                            YOUR LEARNING JOURNEY
                        </span>
                        <h1 className="overview-title">Student Overview</h1>
                        <p className="overview-subtitle">
                            Your subjects, your progress, your next step.
                        </p>
                    </div>

                    <div className="semester-badge">
                        <span className="badge-dot">•</span>
                        <span className="badge-term">{semester.semester}</span>
                        <span className="badge-divider">|</span>
                        <span className="badge-year">{semester.academicYear}</span>
                    </div>
                </div>

                {/* --- ENROLLED SUBJECTS TABLE SECTION --- */}
                <EnrolledSubjectsTable
                    subjects={subjects}
                    studentId={STUDENT_ID}
                    initialSection={student?.programSection ?? ""}
                />

                {/* --- RECENT UPDATES SECTION --- */}
                <div className="recent-updates-section">
                    <div className="updates-header">
                        <div>
                            <h2 className="updates-title">Recent Updates</h2>
                            <p className="updates-subtitle">
                                The latest from your professors.
                            </p>
                        </div>
                        <div className="grade-activity-indicator">
                            <span className="blue-dot">•</span> Grade activity
                        </div>
                    </div>

                    <div className="updates-card">
                        {/* Update Item 1 */}
                        <div className="update-row">
                            <div className="update-left">
                                <div className="check-icon-circle">✓</div>
                                <div className="update-info">
                                    <p className="update-text">
                                        Prof. Ana Cruz posted an official grade
                                    </p>
                                    <p className="update-subtext">
                                        Introduction to Programming{" "}
                                        <span className="dot-sep">•</span>{" "}
                                        Prelim grade: 86%
                                    </p>
                                </div>
                            </div>
                            <div className="update-right">
                                <span className="update-time">
                                    Today, 10:30 AM
                                </span>
                                <span className="update-arrow">↗</span>
                            </div>
                        </div>

                        {/* Update Item 2 */}
                        <div className="update-row">
                            <div className="update-left">
                                <div className="check-icon-circle">✓</div>
                                <div className="update-info">
                                    <p className="update-text">
                                        Prof. Maria Santos posted an official
                                        grade
                                    </p>
                                    <p className="update-subtext">
                                        Computer Systems{" "}
                                        <span className="dot-sep">•</span>{" "}
                                        Prelim grade: 72%
                                    </p>
                                </div>
                            </div>
                            <div className="update-right">
                                <span className="update-time">
                                    Yesterday, 2:15 PM
                                </span>
                                <span className="update-arrow">↗</span>
                            </div>
                        </div>

                        {/* Update Item 3 */}
                        <div className="update-row">
                            <div className="update-left">
                                <div className="check-icon-circle">✓</div>
                                <div className="update-info">
                                    <p className="update-text">
                                        Prof. Carlo Reyes posted an official
                                        grade
                                    </p>
                                    <p className="update-subtext">
                                        General Mathematics{" "}
                                        <span className="dot-sep">•</span>{" "}
                                        Prelim grade: 78%
                                    </p>
                                </div>
                            </div>
                            <div className="update-right">
                                <span className="update-time">
                                    Oct 3, 9:00 AM
                                </span>
                                <span className="update-arrow">↗</span>
                            </div>
                        </div>
                    </div>

                    {/* Page Disclaimer & Footer Branding */}
                    <div className="dashboard-page-footer">
                        <p className="disclaimer-text">
                            Sample student workspace · Grades shown are
                            demonstration data.
                        </p>
                        <PageFooter className="shared-page-footer--dashboard" />
                    </div>
                </div>
            </main>
            </div>
        </div>
    );
}
