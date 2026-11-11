import { Link, useParams, useSearchParams } from "react-router-dom";
import Sidebar from "@/components/layout/Sidebar";
import Header from "@/components/layout/Header";
import PageFooter from "@/components/layout/PageFooter";
import TargetGradeSandbox from "@/features/sandbox/components/TargetGradeSandbox";
import TermNavigation from "@/features/term-records/components/TermNavigation";
import { getActiveStudentId } from "@/services/session";
import { toTermKey } from "@/lib/terms";
import { useDb } from "@/hooks/useDb";
import "./SubjectDetail.css";

export default function TargetGradeSandboxPage() {
    const { subjectId } = useParams();
    // Same ?term= as Subject Detail, so both pages stay on the same term.
    const [searchParams, setSearchParams] = useSearchParams();
    const termKey = toTermKey(searchParams.get("term"));
    const [dbData] = useDb();
    const studentId = getActiveStudentId(dbData);

    const classItem = dbData?.classes?.find((item) => item.id === subjectId);
    const subject = dbData?.subjects?.find((item) => item.id === classItem?.subjectId);
    const hasStudentRecord = classItem?.studentRecords?.some(
        (record) => record.studentId === studentId,
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
                                    <span aria-hidden="true">
                                        <svg viewBox="0 0 16 16" fill="none">
                                            <path d="M10.5 3.5 6 8l4.5 4.5M6.5 8h7" />
                                        </svg>
                                    </span>
                                    Back
                                </Link>
                            </div>

                            <section className="subject-overview sandbox-page-heading">
                                <div className="subject-semester">
                                    TARGET GRADE SANDBOX
                                    {rule ? ` · ${rule.ruleName.toUpperCase()}` : ""}
                                </div>
                                <div className="subject-title-row">
                                    <h1>
                                        {subject.subjectCode} - {subject.subjectName}
                                    </h1>
                                    <TermNavigation
                                        className="sandbox-term-navigation"
                                        termKey={termKey}
                                        onTermChange={(nextTerm) =>
                                            setSearchParams({ term: nextTerm }, { replace: true })
                                        }
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
