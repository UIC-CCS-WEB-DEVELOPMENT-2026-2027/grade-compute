import { useEffect, useRef, useState } from "react";
import { Link, useParams, useSearchParams } from "react-router-dom";
import Sidebar from "../../components/shared/Sidebar";
import Header from "../../components/shared/Header";
import PageFooter from "../../components/shared/PageFooter";
import CurrentTermRecords from "../../components/student/CurrentTermRecord";
import DraftInput from "../../components/shared/DraftInput";
import TermNavigation from "../../components/student/TermNavigation";
import { DB_UPDATED_EVENT, getDb, saveDb } from "../../utils/db";
import congratulationAudio from "../../assets/congrats_voice .mp3";
import {
    calculateOfficialGrade,
    calculateUnofficialGrade,
    getOfficialAssessments,
} from "../../utils/grades";
import { getTermLabel, toTermKey } from "../../utils/terms";
import "./SubjectDetail.css";

const CONFETTI_COLORS = ["#406093", "#e9c936", "#5ca878", "#f47b62", "#8a6bd1"];
const CONFETTI_PIECES = Array.from({ length: 44 }, (_, index) => ({
    left: `${(index * 37) % 100}%`,
    delay: `${(index % 11) * 0.08}s`,
    duration: `${2.3 + (index % 7) * 0.22}s`,
    color: CONFETTI_COLORS[index % CONFETTI_COLORS.length],
    rotation: `${(index * 53) % 360}deg`,
}));

function SubjectDetail() {
    // The selected term lives in the URL (?term=midterm), so the sandbox
    // can link back to the same term.
    const [searchParams, setSearchParams] = useSearchParams();
    const termKey = toTermKey(searchParams.get("term"));
    const term = getTermLabel(termKey);
    const [celebration, setCelebration] = useState("");
    const [targetGradeError, setTargetGradeError] = useState("");
    const [dbData, setDbData] = useState(() => getDb());
    const previousAchievement = useRef(null);
    const celebrationAudioRef = useRef(null);
    const { subjectId } = useParams();

    useEffect(() => {
        const refreshDbData = () => setDbData(getDb());
        window.addEventListener(DB_UPDATED_EVENT, refreshDbData);
        return () => window.removeEventListener(DB_UPDATED_EVENT, refreshDbData);
    }, []);

    useEffect(() => {
        const currentDb = dbData;
        const currentClass = currentDb?.classes?.find((item) => item.id === subjectId);
        const currentRecord = currentClass?.studentRecords?.find(
            (record) => record.studentId === "U1"
        );
        const currentRule = currentDb?.computationRules?.find(
            (rule) => rule.id === currentClass?.computationRuleId
        );
        if (!currentRecord) return;

        const currentTerm = term.toLowerCase();
        const currentTarget = Number(
            currentRecord.targetGradeSandbox?.terms?.[currentTerm]?.desiredFinalGrade ??
            currentRecord.targetGradeSandbox?.desiredFinalGrade ??
            90
        );
        const officialGrade = calculateOfficialGrade(currentRecord, term, currentRule);
        const expectedGrade = calculateUnofficialGrade(currentRecord, term, currentRule);
        const officialReached = officialGrade !== null && officialGrade >= currentTarget;
        const expectedReached = expectedGrade !== null && expectedGrade >= currentTarget;
        const key = `${subjectId}:${currentTerm}`;
        const previous = previousAchievement.current;

        if (previous?.key === key) {
            const officialJustReached = !previous.officialReached && officialReached;
            const expectedJustReached = !previous.expectedReached && expectedReached;
            if (officialJustReached || expectedJustReached) {
                setCelebration(
                    officialJustReached && expectedJustReached
                        ? "Both your official and expected grades reached the target!"
                        : officialJustReached
                            ? "Your official grade reached the target!"
                            : "Your expected grade reached the target!"
                );
            }
        }

        previousAchievement.current = {
            key,
            officialReached,
            expectedReached,
        };
    }, [dbData, subjectId, term]);

    useEffect(() => {
        if (!celebration) return undefined;
        const timeoutId = window.setTimeout(() => setCelebration(""), 6000);
        return () => window.clearTimeout(timeoutId);
    }, [celebration]);

    useEffect(() => {
        const audio = celebrationAudioRef.current;
        if (!audio) return undefined;

        if (!celebration) {
            audio.pause();
            audio.currentTime = 0;
            return undefined;
        }

        audio.currentTime = 0;
        audio.play().catch((error) => {
            if (error.name !== "NotAllowedError") {
                console.error("Unable to play the grade celebration audio.", error);
            }
        });

        return () => {
            audio.pause();
            audio.currentTime = 0;
        };
    }, [celebration]);

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
    const expectedAverage = calculateUnofficialGrade(
        studentRecord,
        term,
        computationRule
    );
    const officialProgress = officialAverage === null
        ? 0
        : Math.min(100, Math.max(0, officialAverage));
    const expectedProgress = expectedAverage === null
        ? 0
        : Math.min(100, Math.max(0, expectedAverage));
    const targetGradeConfig = studentRecord.targetGradeSandbox ?? {};
    const targetGrade = Number(
        targetGradeConfig.terms?.[selectedTermKey]?.desiredFinalGrade ??
        targetGradeConfig.desiredFinalGrade ??
        90
    );

    function updateTargetGrade(value) {
        if (value === "") return;
        const nextGrade = Number(value);
        if (!Number.isFinite(nextGrade) || nextGrade < 0 || nextGrade > 100) return;

        const currentDb = getDb();
        if (!currentDb) return;
        const updatedDb = {
            ...currentDb,
            classes: currentDb.classes.map((item) => item.id !== classItem.id ? item : ({
                ...item,
                studentRecords: item.studentRecords.map((record) =>
                    record.studentId !== "U1" ? record : ({
                        ...record,
                        targetGradeSandbox: {
                            ...(record.targetGradeSandbox ?? {}),
                            terms: {
                                ...(record.targetGradeSandbox?.terms ?? {}),
                                [selectedTermKey]: {
                                    ...(record.targetGradeSandbox?.terms?.[selectedTermKey] ?? {}),
                                    desiredFinalGrade: nextGrade,
                                },
                            },
                        },
                    })
                ),
            })),
        };

        try {
            saveDb(updatedDb);
            setDbData(updatedDb);
            setTargetGradeError("");
        } catch (error) {
            setTargetGradeError(`Unable to save target grade: ${error.message}`);
        }
    }

    return (
        <div className="subject-detail-layout">
            <audio ref={celebrationAudioRef} src={congratulationAudio} preload="auto" />
            <Sidebar />
            <div className="subject-detail-main">
                <Header />

                <main className="student-dashboard">

            {/* Term Navigation */}
            <TermNavigation
                termKey={termKey}
                onTermChange={(nextTerm) => setSearchParams({ term: nextTerm }, { replace: true })}
                action={
                    <Link
                        className="term-nav-link"
                        to={`/student/subject/${classItem.id}/sandbox?term=${termKey}`}
                    >
                        <svg viewBox="0 0 24 24" fill="none" aria-hidden="true">
                            <circle cx="12" cy="12" r="8.5" stroke="currentColor" strokeWidth="1.8" />
                            <circle cx="12" cy="12" r="4.5" stroke="currentColor" strokeWidth="1.8" />
                            <circle cx="12" cy="12" r="1" fill="currentColor" />
                        </svg>
                        Target grade sandbox
                    </Link>
                }
                note="Official scores and draft notes are separate for each term."
            />

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
                </div>

                {/* Official Grade Summary */}
                <div className="official-grade-card">
                    <div className="grade-gauges" aria-label={`${term} grades`}>
                        <label className="grade-target-control">
                            <span>Target grade</span>
                            <span className="grade-target-input-wrap">
                                {/* Saved on blur / Enter, so a half-typed target
                                    (e.g. "8" on the way to "85") can't trigger
                                    the celebration. */}
                                <DraftInput
                                    type="number"
                                    min="0"
                                    max="100"
                                    step="1"
                                    value={targetGrade}
                                    aria-label={`${term} target grade`}
                                    onCommit={updateTargetGrade}
                                />
                                <span aria-hidden="true">%</span>
                            </span>
                            <small>Yellow marker shows your target</small>
                            {targetGradeError && (
                                <small className="grade-target-error" role="alert">
                                    {targetGradeError}
                                </small>
                            )}
                        </label>
                        <div
                            className="grade-gauge official-gauge"
                            tabIndex="0"
                            aria-label={`Official grade: ${officialAverage === null ? "no grade yet" : `${officialAverage.toFixed(2)} percent`}`}
                        >
                            <span className="grade-gauge-label">{term} official</span>
                            <span
                                className="grade-gauge-ring"
                                style={{
                                    "--grade-progress": `${officialProgress}%`,
                                    "--target-angle": `${targetGrade * 3.6}deg`,
                                }}
                                aria-hidden="true"
                            >
                                <strong>
                                    {officialAverage === null ? "—" : officialAverage.toFixed(0)}
                                    {officialAverage !== null && <small>%</small>}
                                </strong>
                                <span className="grade-gauge-target-marker" />
                            </span>
                            <span className="grade-gauge-details">
                                Professor-recorded scores only. These grades are locked.
                            </span>
                        </div>

                        <div
                            className="grade-gauge expected-gauge"
                            tabIndex="0"
                            aria-label={`Expected grade: ${expectedAverage === null ? "no grade yet" : `${expectedAverage.toFixed(2)} percent`}`}
                        >
                            <span className="grade-gauge-label">{term} expected</span>
                            <span
                                className="grade-gauge-ring"
                                style={{
                                    "--grade-progress": `${expectedProgress}%`,
                                    "--target-angle": `${targetGrade * 3.6}deg`,
                                }}
                                aria-hidden="true"
                            >
                                <strong>
                                    {expectedAverage === null ? "—" : expectedAverage.toFixed(0)}
                                    {expectedAverage !== null && <small>%</small>}
                                </strong>
                                <span className="grade-gauge-target-marker" />
                            </span>
                            <span className="grade-gauge-details">
                                Includes student-reported draft scores with official scores taking priority.
                            </span>
                        </div>
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
            {celebration && (
                <div
                    className="grade-celebration-backdrop"
                    role="presentation"
                    onMouseDown={(event) => {
                        if (event.target === event.currentTarget) setCelebration("");
                    }}
                >
                    <div className="grade-celebration-confetti" aria-hidden="true">
                        {CONFETTI_PIECES.map((piece, index) => (
                            <span
                                key={index}
                                style={{
                                    "--confetti-left": piece.left,
                                    "--confetti-delay": piece.delay,
                                    "--confetti-duration": piece.duration,
                                    "--confetti-color": piece.color,
                                    "--confetti-rotation": piece.rotation,
                                }}
                            />
                        ))}
                    </div>
                    <section
                        className="grade-celebration-card"
                        role="dialog"
                        aria-modal="true"
                        aria-labelledby="grade-celebration-title"
                    >
                        <button
                            type="button"
                            className="grade-celebration-close"
                            aria-label="Close congratulations"
                            onClick={() => setCelebration("")}
                        >
                            ×
                        </button>
                        <span className="grade-celebration-sparkle" aria-hidden="true">✦</span>
                        <p className="grade-celebration-eyebrow">TARGET ACHIEVED</p>
                        <h2 id="grade-celebration-title">Congratulations!</h2>
                        <p>{celebration}</p>
                        <span className="grade-celebration-trophy" aria-hidden="true">🏆</span>
                    </section>
                </div>
            )}
        </div>
    );
}

export default SubjectDetail;
