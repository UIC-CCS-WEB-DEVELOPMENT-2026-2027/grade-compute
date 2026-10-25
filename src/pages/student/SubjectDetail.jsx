
import { useState } from "react";
import { useParams } from "react-router-dom";
import Sidebar from "../../components/shared/Sidebar";
import Header from "../../components/shared/Header";
import PageFooter from "../../components/shared/PageFooter";
import CurrentTermRecords from "../../components/student/CurrentTermRecord";
import { getDb } from "../../utils/db";
import { calculateOfficialGrade, getOfficialAssessments } from "../../utils/grades";
import "./SubjectDetail.css";

function SubjectDetail() {
    const [term, setTerm] = useState("Prelim");
    const { subjectId } = useParams();
    const dbData = getDb();
    const student = dbData?.users?.find((user) => user.id === "U1");
    const studentName = student?.name || "Student";
    const firstName = studentName.split(" ")[0];
    const initials = studentName
        .split(" ")
        .map((part) => part[0])
        .slice(0, 2)
        .join("")
        .toUpperCase();
    const terms = ["Prelim", "Midterm", "Finals"];
    const classItem = dbData?.classes?.find((item) => item.id === subjectId);
    const subject = dbData?.subjects?.find(
        (item) => item.id === classItem?.subjectId
    );
    const professor =
        classItem?.professorName ??
        dbData?.users?.find((user) => user.id === classItem?.professorId)?.name ??
        "Awaiting professor assignment";
    const studentRecord = classItem?.studentRecords?.find(
        (record) => record.studentId === "U1"
    );
    const computationRule = dbData?.computationRules?.find(
        (rule) => rule.id === classItem?.computationRuleId
    );

    if (!classItem || !subject || !studentRecord) {
        return (
            <div className="subject-detail-layout">
                <Sidebar />
                <div className="subject-detail-main">
                    <main className="student-dashboard">
                        <h1>Subject not found</h1>
                        <p>This subject is not available for your account.</p>
                    </main>
                </div>
            </div>
        );
    }

    const selectedTermKey = term.toLowerCase();
    const selectedTerm = studentRecord.grades?.[selectedTermKey];
    const officialTasks = getOfficialAssessments(selectedTerm);
    const officialAverage = calculateOfficialGrade(
        studentRecord,
        term,
        computationRule
    );

    return (
        <div className="subject-detail-layout">
            <Sidebar />
            <div className="subject-detail-main">
                <Header />

                <main className="student-dashboard">

            {/* Term Navigation */}
            <div className="subject-term-navigation">
                <div className="term-selector">
                    {terms.map((termName) => (
                        <button
                            key={termName}
                            type="button"
                            className={
                                term === termName ? "selected" : ""
                            }
                            onClick={() => setTerm(termName)}
                        >
                            {termName}
                        </button>
                    ))}
                </div>

                <span className="term-note">
                    Official scores and draft notes are separate
                    for each term.
                </span>
            </div>

            {/* Subject Heading */}
            <section className="subject-overview">

                <div className="subject-semester">
                    FIRST SEMESTER · 2026–2027
                </div>

                <div className="subject-title-row">
                    <div>
                        <h1>{subject.subjectCode} - {subject.subjectName}</h1>

                        <div className="subject-meta">
                            <span className="instructor-avatar">
                                {professor
                                    .split(" ")
                                    .map((part) => part[0])
                                    .slice(0, 2)
                                    .join("")
                                    .toUpperCase()}
                            </span>
                            <span>{professor}</span>
                            <span className="meta-divider">·</span>
                            <span>{classItem.units ?? 3} units</span>
                        </div>
                    </div>

                    <button
                        type="button"
                        className="target-grade-button"
                        onClick={() =>
                            window.dispatchEvent(
                                new CustomEvent("openTargetGrade")
                            )
                        }
                    >
                        ◎ Set Target Grade
                    </button>
                </div>

                {/* Official Grade Summary */}
                <div className="official-grade-card">

                    <div className="official-average">
                        <span>{term} official average</span>
                        <strong>
                            {officialAverage === null
                                ? "—"
                                : officialAverage.toFixed(2)}
                            {officialAverage !== null && <span>%</span>}
                        </strong>
                    </div>

                    <div className="grade-card-divider" />

                    <div className="grade-card-information">
                        <p>
                            <span className="grade-dot blue-dot" />
                            {officialTasks.length} official assessment
                            {officialTasks.length === 1 ? "" : "s"} recorded
                        </p>

                        <small>
                            Official records never include sandbox drafts.
                        </small>
                    </div>

                    <div className="grade-card-legend">
                        <span>
                            <i className="grade-dot dark-dot" />
                            Locked official scores
                        </span>

                        <span>
                            <i className="grade-dot blue-dot" />
                            Private sandbox drafts
                        </span>
                    </div>

                </div>
            </section>

            {/* Current Term Records */}
            <CurrentTermRecords classId={classItem.id} term={term} />

                </main>
                <PageFooter />
            </div>
        </div>
    );
}

export default SubjectDetail;
