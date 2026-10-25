import { Link, useParams } from "react-router-dom";
import Sidebar from "../../components/shared/Sidebar";
import Header from "../../components/shared/Header";
import PageFooter from "../../components/shared/PageFooter";
import TargetGradeSandbox from "../../components/student/TargetGradeSandbox";
import { getDb } from "../../utils/db";
import "./SubjectDetail.css";

export default function TargetGradeSandboxPage() {
    const { subjectId } = useParams();
    const dbData = getDb();
    const classItem = dbData?.classes?.find((item) => item.id === subjectId);
    const subject = dbData?.subjects?.find((item) => item.id === classItem?.subjectId);
    const hasStudentRecord = classItem?.studentRecords?.some(
        (record) => record.studentId === "U1"
    );

    return (
        <div className="subject-detail-layout">
            <Sidebar />
            <div className="subject-detail-main">
                <Header
                    title="Target Grade Sandbox"
                    subtitle={null}
                />
                <main className="student-dashboard">
                    {classItem && subject && hasStudentRecord ? (
                        <TargetGradeSandbox classId={classItem.id} variant="page" />
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
