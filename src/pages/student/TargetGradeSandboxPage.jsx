import { useEffect, useState } from "react";
import { Link, useParams, useSearchParams } from "react-router-dom";
import Sidebar from "../../components/shared/Sidebar";
import Header from "../../components/shared/Header";
import PageFooter from "../../components/shared/PageFooter";
import TargetGradeSandbox from "../../components/student/TargetGradeSandbox";
import TermNavigation from "../../components/student/TermNavigation";
import { DB_UPDATED_EVENT, getDb } from "../../utils/db";
import { getActiveStudentId } from "../../utils/session";
import { toTermKey } from "../../utils/terms";
import "./SubjectDetail.css";

export default function TargetGradeSandboxPage() {
    const { subjectId } = useParams();
    // Same ?term= as Subject Detail, so both pages stay on the same term.
    const [searchParams, setSearchParams] = useSearchParams();
    const termKey = toTermKey(searchParams.get("term"));
    const [dbData, setDbData] = useState(() => getDb());
    const studentId = getActiveStudentId(dbData);

    useEffect(() => {
        const refresh = () => setDbData(getDb());
        window.addEventListener(DB_UPDATED_EVENT, refresh);
        return () => window.removeEventListener(DB_UPDATED_EVENT, refresh);
    }, []);

    const classItem = dbData?.classes?.find((item) => item.id === subjectId);
    const subject = dbData?.subjects?.find((item) => item.id === classItem?.subjectId);
    const hasStudentRecord = classItem?.studentRecords?.some(
        (record) => record.studentId === studentId
    );
    const rule = dbData?.computationRules?.find((item) => item.id === classItem?.computationRuleId);

    return (
        <div className="subject-detail-layout">
            <Sidebar />
            <div className="subject-detail-main">
                <Header title="Target Grade Sandbox" subtitle={null} />
                <main className="student-dashboard">
                    {classItem && subject && hasStudentRecord ? (
                        <>
                            <div className="sandbox-back-row">
                                <Link
                                    className="term-nav-link sandbox-back-link"
                                    to={`/student/subject/${classItem.id}?term=${termKey}`}
                                >
                                    <span aria-hidden="true">←</span>
                                    Back
                                </Link>
                            </div>

                            <section className="subject-overview sandbox-page-heading">
                                <div className="subject-semester">
                                    TARGET GRADE SANDBOX{rule ? ` · ${rule.ruleName.toUpperCase()}` : ""}
                                </div>
                                <div className="subject-title-row">
                                    <h1>{subject.subjectCode} - {subject.subjectName}</h1>
                                    <TermNavigation
                                        className="sandbox-term-navigation"
                                        termKey={termKey}
                                        onTermChange={(nextTerm) => setSearchParams({ term: nextTerm }, { replace: true })}
                                        note="Private planning space. Official records stay untouched."
                                    />
                                </div>
                            </section>

                            <TargetGradeSandbox classId={classItem.id} termKey={termKey} />
                        </>
                    ) : (
                        <section className="subject-target-grade-section">
                            <h2>Sandbox unavailable</h2>
                            <p>This subject is not available for your account.</p>
                            <Link to="/student/subject" className="target-grade-button">
                                Back to My Subjects
                            </Link>
                        </section>
                    )}
                </main>
                <PageFooter />
            </div>
        </div>
    );
}
