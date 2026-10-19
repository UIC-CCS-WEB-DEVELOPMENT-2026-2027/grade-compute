
import { useState } from "react";
import Sidebar from "../../components/shared/Sidebar";
import CurrentTermRecords from "../../components/student/CurrentTermRecord";
import "./SubjectDetail.css";

function SubjectDetail() {
    const [term, setTerm] = useState("Prelim");

    const terms = ["Prelim", "Midterm", "Finals"];

    return (
        <div className="flex-row" style={{ minHeight: "100vh", gap: 0 }}>
            <Sidebar />
            <main className="student-dashboard" style={{ flex: 1, minWidth: 0 }}>

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

            {/* Breadcrumb */}
            <div className="subject-breadcrumb">
                <span>← My Subjects</span>
                <span>/</span>
                <span>Subject details</span>
            </div>

            {/* Subject Heading */}
            <section className="subject-overview">

                <div className="subject-semester">
                    FIRST SEMESTER · 2026–2027
                </div>

                <div className="subject-title-row">
                    <div>
                        <h1>IT101 - Computer Systems</h1>

                        <div className="subject-meta">
                            <span className="instructor-avatar">
                                MS
                            </span>
                            <span>Prof. Maria Santos</span>
                            <span className="meta-divider">·</span>
                            <span>3 units</span>
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
                        <span>Official recorded average</span>
                        <strong>89.50<span>%</span></strong>
                    </div>

                    <div className="grade-card-divider" />

                    <div className="grade-card-information">
                        <p>
                            <span className="grade-dot blue-dot" />
                            4% of term grade weight recorded
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
            <CurrentTermRecords term={term} />

            </main>
        </div>
    );
}

export default SubjectDetail;

