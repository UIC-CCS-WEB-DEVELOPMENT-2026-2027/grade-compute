// src/pages/student/StudentDashboard.jsx

import { PageShell } from "@/components/layout/PageShell";
import { Badge } from "@/components/ui/badge";
import { EnrolledSubjectsTable } from "@/features/subjects/components/EnrolledSubjectsTable";
import { AllSubjectsHistory } from "@/features/history/components/AllSubjectsHistory";
import { getActiveStudentId } from "@/services/session";
import { getCurrentSemester, getEnrolledSubjects } from "@/lib/subjects";
import { useDb } from "@/hooks/useDb";
import "./StudentDashboard.css";

export function StudentDashboard() {
    // Live, so it refreshes when any page saves the database (e.g. a subject is added).
    const [dbData] = useDb();
    const studentId = getActiveStudentId(dbData);
    const semester = getCurrentSemester();
    const student = dbData?.users?.find((user) => user.id === studentId);
    // The dashboard shows the current semester's subjects.
    const subjects = getEnrolledSubjects(dbData, studentId, semester.id);

    return (
        <PageShell>
            {/* --- STUDENT OVERVIEW BANNER --- */}
            <div className="mb-9 flex items-center justify-between gap-5 max-sm:mb-7 max-sm:flex-col max-sm:items-start max-sm:gap-3.5">
                <div>
                    <h1 className="m-0 type-page-title text-foreground">Student Overview</h1>
                    <p className="mt-1 type-small text-muted-foreground">
                        Your subjects, progress, and next step.
                    </p>
                </div>

                <Badge
                    variant="outline"
                    className="h-auto min-h-12 gap-1 rounded-lg bg-card px-3 py-2.5 text-foreground"
                >
                    <span className="text-self-reported-foreground" aria-hidden="true">
                        •
                    </span>
                    <span>{semester.semester}</span>
                    <span className="text-input" aria-hidden="true">
                        ·
                    </span>
                    <span>{semester.academicYear}</span>
                </Badge>
            </div>

            {/* --- GRADE HISTORY (all subjects, one term) --- */}
            <AllSubjectsHistory db={dbData} studentId={studentId} semesterId={semester.id} />

            {/* --- ENROLLED SUBJECTS TABLE SECTION --- */}
            <EnrolledSubjectsTable
                subjects={subjects}
                subtitle={`Your subjects for ${semester.semester}, ${semester.academicYear}.`}
                studentId={studentId}
                initialSection={student?.programSection ?? ""}
            />

            {/* --- RECENT UPDATES SECTION --- */}
            <div className="recent-updates-section">
                <div className="updates-header">
                    <div>
                        <h2 className="updates-title">Recent Updates</h2>
                        <p className="updates-subtitle">The latest from your professors.</p>
                    </div>
                    <div className="grade-activity-indicator">
                        <span className="grade-activity-dot" aria-hidden="true" />
                        Grade activity
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
                                    Introduction to Programming <span className="dot-sep">•</span>{" "}
                                    Prelim grade: 86%
                                </p>
                            </div>
                        </div>
                        <div className="update-right">
                            <span className="update-time">Today, 10:30 AM</span>
                            <span className="update-arrow">↗</span>
                        </div>
                    </div>

                    {/* Update Item 2 */}
                    <div className="update-row">
                        <div className="update-left">
                            <div className="check-icon-circle">✓</div>
                            <div className="update-info">
                                <p className="update-text">
                                    Prof. Maria Santos posted an official grade
                                </p>
                                <p className="update-subtext">
                                    Computer Systems <span className="dot-sep">•</span> Prelim
                                    grade: 72%
                                </p>
                            </div>
                        </div>
                        <div className="update-right">
                            <span className="update-time">Yesterday, 2:15 PM</span>
                            <span className="update-arrow">↗</span>
                        </div>
                    </div>

                    {/* Update Item 3 */}
                    <div className="update-row">
                        <div className="update-left">
                            <div className="check-icon-circle">✓</div>
                            <div className="update-info">
                                <p className="update-text">
                                    Prof. Carlo Reyes posted an official grade
                                </p>
                                <p className="update-subtext">
                                    General Mathematics <span className="dot-sep">•</span> Prelim
                                    grade: 78%
                                </p>
                            </div>
                        </div>
                        <div className="update-right">
                            <span className="update-time">Oct 3, 9:00 AM</span>
                            <span className="update-arrow">↗</span>
                        </div>
                    </div>
                </div>
            </div>
        </PageShell>
    );
}
