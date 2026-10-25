import { useEffect, useMemo, useState } from "react";
import { DB_UPDATED_EVENT, getDb, saveDb } from "../../utils/db";
import {
    calculateOfficialGrade,
    calculateUnofficialGrade,
} from "../../utils/grades";
import "./TargetGradeSandbox.css";

const STUDENT_ID = "U1";
const TERMS = ["Prelim", "Midterm", "Finals"];

function scoreOf(task) {
    const value = task?.officialScore ?? task?.studentReportedScore;
    if (value === null || value === undefined || value === "") return null;
    const score = Number(value);
    const max = Number(task?.maxScore);
    return Number.isFinite(score) && Number.isFinite(max) && max > 0
        ? (score / max) * 100
        : null;
}

function getRequiredDraftScore(termData, weights, target, expectedExamScore, upcomingAT, upcomingTLA) {
    const categories = [
        { key: "AT", weight: weights.AT, upcoming: upcomingAT },
        { key: "TLA", weight: weights.TLA, upcoming: upcomingTLA },
    ];
    let achievedContribution = 0;
    let remainingContribution = 0;

    categories.forEach(({ key, weight, upcoming }) => {
        if (!Number.isFinite(weight) || weight <= 0) return;
        const tasks = termData?.[key] ?? [];
        const missing = tasks.filter((task) => scoreOf(task) === null).length + upcoming;
        const total = tasks.length + upcoming;
        if (!total) return;
        const knownTotal = tasks.reduce((sum, task) => sum + (scoreOf(task) ?? 0), 0);
        achievedContribution += weight * knownTotal / total;
        remainingContribution += weight * missing / total;
    });

    const exam = termData?.Exam ?? {};
    const officialExam = scoreOf({ ...exam, studentReportedScore: null });
    const examScore = officialExam ?? Math.max(0, Math.min(100, expectedExamScore));
    achievedContribution += (weights.Exam ?? 0) * examScore;

    if (!remainingContribution) return null;
    return Math.max(0, Math.min(100, (target - achievedContribution) / remainingContribution));
}

export default function TargetGradeSandbox({ classId, subjects, onClassChange, variant = "sidebar" }) {
    const [dbData, setDbData] = useState(() => getDb());
    const [term, setTerm] = useState("Prelim");
    const [saveError, setSaveError] = useState("");
    const [targetGradeInput, setTargetGradeInput] = useState("90");
    const [targetGradeError, setTargetGradeError] = useState("");
    const [invalidScoreId, setInvalidScoreId] = useState("");
    const termKey = term.toLowerCase();
    const classItem = dbData?.classes?.find((item) => item.id === classId);
    const studentRecord = classItem?.studentRecords?.find(
        (record) => record.studentId === STUDENT_ID
    );
    const subject = dbData?.subjects?.find((item) => item.id === classItem?.subjectId);
    const rule = dbData?.computationRules?.find(
        (item) => item.id === classItem?.computationRuleId
    ) ?? dbData?.computationRules?.[0];
    const config = studentRecord?.targetGradeSandbox ?? {};
    const termConfig = config.terms?.[termKey] ?? {};
    const targetGrade = Number(
        termConfig.sandboxDesiredFinalGrade ?? config.sandboxDesiredFinalGrade ?? 90
    );
    const expectedExamScore = Number(termConfig.expectedExamScore ?? 100);
    const upcomingAT = Number(termConfig.upcomingAT ?? 1);
    const upcomingTLA = Number(termConfig.upcomingTLA ?? 2);
    const termData = studentRecord?.grades?.[termKey] ?? { AT: [], TLA: [], Exam: {} };
    const weights = rule?.effectiveMultipliers;
    const officialGrade = calculateOfficialGrade(studentRecord, term, rule);
    const expectedGrade = calculateUnofficialGrade(studentRecord, term, rule);
    const officialProgress = officialGrade === null ? 0 : Math.min(100, Math.max(0, officialGrade));
    const expectedProgress = expectedGrade === null ? 0 : Math.min(100, Math.max(0, expectedGrade));
    const requiredDraftScore = useMemo(() => {
        if (!weights) return null;
        return getRequiredDraftScore(
            termData,
            weights,
            targetGrade,
            expectedExamScore,
            upcomingAT,
            upcomingTLA
        );
    }, [termData, weights, targetGrade, expectedExamScore, upcomingAT, upcomingTLA]);
    const draftRows = useMemo(() => ["AT", "TLA"].flatMap((category) =>
        (termData[category] ?? []).map((task, index) => ({
            category,
            task,
            label: task.title || `${category} draft ${index + 1}`,
            suggestion: scoreOf(task) === null ? requiredDraftScore : null,
        }))
    ), [termData, requiredDraftScore]);

    useEffect(() => {
        const refresh = () => setDbData(getDb());
        window.addEventListener(DB_UPDATED_EVENT, refresh);
        return () => window.removeEventListener(DB_UPDATED_EVENT, refresh);
    }, []);

    useEffect(() => {
        setTargetGradeInput(String(targetGrade));
    }, [targetGrade, term]);

    function saveSandboxConfig(updates) {
        const currentDb = getDb();
        const currentClass = currentDb?.classes?.find((item) => item.id === classId);
        if (!currentDb || !currentClass) return;
        const updatedDb = {
            ...currentDb,
            classes: currentDb.classes.map((item) => item.id !== classId ? item : ({
                ...item,
                studentRecords: item.studentRecords.map((record) => record.studentId !== STUDENT_ID
                    ? record
                    : ({
                        ...record,
                        targetGradeSandbox: {
                            ...(record.targetGradeSandbox ?? {}),
                            terms: {
                                ...(record.targetGradeSandbox?.terms ?? {}),
                                [termKey]: {
                                    ...(record.targetGradeSandbox?.terms?.[termKey] ?? {}),
                                    ...updates,
                                },
                            },
                        },
                    })),
            })),
        };
        try {
            saveDb(updatedDb);
            setDbData(updatedDb);
            setSaveError("");
        } catch (error) {
            setSaveError(`Unable to save sandbox settings: ${error.message}`);
        }
    }

    function saveDraftScore(category, taskId, value) {
        const currentDb = getDb();
        if (!currentDb) return;
        const selectedAssessment = termData[category]?.find((task) => task.id === taskId);
        const maxScore = Number(selectedAssessment?.maxScore ?? 100);
        if (value !== "") {
            const score = Number(value);
            const integerDigits = value.split(".")[0].length;
            const maxIntegerDigits = String(Math.trunc(maxScore)).length;
            if (!/^(?:\d+(?:\.\d*)?|\.\d+)$/.test(value) ||
                !Number.isFinite(score) ||
                score < 0 ||
                score > maxScore ||
                integerDigits > maxIntegerDigits) {
                setInvalidScoreId(`${category}-${taskId}`);
                setSaveError(`Enter a score between 0 and ${maxScore}, using no more than ${maxIntegerDigits} digits before the decimal.`);
                return;
            }
        }
        setInvalidScoreId("");
        const updatedDb = {
            ...currentDb,
            classes: currentDb.classes.map((item) => item.id !== classId ? item : ({
                ...item,
                studentRecords: item.studentRecords.map((record) => {
                    if (record.studentId !== STUDENT_ID) return record;
                    const grades = record.grades ?? {};
                    const selectedTerm = grades[termKey] ?? { AT: [], TLA: [], Exam: {} };
                    return {
                        ...record,
                        grades: {
                            ...grades,
                            [termKey]: {
                                ...selectedTerm,
                                [category]: (selectedTerm[category] ?? []).map((task) =>
                                    task.id === taskId ? { ...task, studentReportedScore: value } : task
                                ),
                            },
                        },
                    };
                }),
            })),
        };
        try {
            saveDb(updatedDb);
            setDbData(updatedDb);
            setSaveError("");
        } catch (error) {
            setSaveError(`Unable to save draft score: ${error.message}`);
        }
    }

    if (subjects && !subjects.length) {
        return (
            <section className={`sidebar-sandbox-panel ${variant === "page" ? "is-page-sandbox" : ""}`}>
                {variant !== "page" && <header className="sidebar-sandbox-heading">
                    <span aria-hidden="true">◎</span>
                    <div>
                        <small>PRIVATE · NOT AN OFFICIAL RECORD</small>
                        <h2>Target Grade Sandbox</h2>
                    </div>
                </header>}
                <p className="sidebar-sandbox-empty">Add a subject to start using the sandbox.</p>
            </section>
        );
    }

    if (!studentRecord && subjects) {
        return (
            <section className={`sidebar-sandbox-panel ${variant === "page" ? "is-page-sandbox" : ""}`}>
                {variant !== "page" && <header className="sidebar-sandbox-heading">
                    <span aria-hidden="true">◎</span>
                    <div>
                        <small>PRIVATE · NOT AN OFFICIAL RECORD</small>
                        <h2>Target Grade Sandbox</h2>
                    </div>
                </header>}
                <label className="sidebar-sandbox-field">
                    <span>Select subject</span>
                    <select
                        value={classId ?? ""}
                        onChange={(event) => onClassChange(event.target.value)}
                    >
                        {subjects.map((item) => (
                            <option key={item.classId} value={item.classId}>
                                {item.subjectCode} · {item.subjectName}
                            </option>
                        ))}
                    </select>
                </label>
                <p className="sidebar-sandbox-empty">Choose a subject to see its sandbox.</p>
            </section>
        );
    }

    const projectedAverage = (() => {
        const parts = [];
        ["AT", "TLA"].forEach((category) => {
            const tasks = termData[category] ?? [];
            const upcomingCount = category === "AT" ? upcomingAT : upcomingTLA;
            const scores = [
                ...tasks.map(scoreOf).map((score) => score ?? requiredDraftScore),
                ...Array.from({ length: upcomingCount }, () => requiredDraftScore),
            ];
            if (scores.length && scores.every((score) => score !== null)) {
                const weight = Number(weights?.[category] ?? 0);
                parts.push({ grade: scores.reduce((sum, score) => sum + score, 0) / scores.length, weight });
            }
        });
        const exam = termData.Exam ?? {};
        const examScore = scoreOf({ ...exam, studentReportedScore: null }) ??
            (Number.isFinite(expectedExamScore) ? expectedExamScore : null);
        if (examScore !== null) parts.push({ grade: examScore, weight: Number(weights?.Exam ?? 0) });
        const totalWeight = parts.reduce((sum, part) => sum + part.weight, 0);
        return totalWeight
            ? parts.reduce((sum, part) => sum + part.grade * part.weight, 0) / totalWeight
            : null;
    })();

    return (
        <section className={`sidebar-sandbox-panel ${variant === "page" ? "is-page-sandbox" : ""}`}>
            {variant !== "page" && <header className="sidebar-sandbox-heading">
                <span aria-hidden="true">◎</span>
                <div>
                    <small>PRIVATE · NOT AN OFFICIAL RECORD</small>
                    <h2>Target Grade Sandbox</h2>
                </div>
            </header>}
            {subjects && (
                <label className="sidebar-sandbox-field">
                    <span>Select subject</span>
                    <select
                        value={classId}
                        onChange={(event) => onClassChange(event.target.value)}
                    >
                        {subjects.map((item) => (
                            <option key={item.classId} value={item.classId}>
                                {item.subjectCode} · {item.subjectName}
                            </option>
                        ))}
                    </select>
                </label>
            )}
            {variant !== "page" && (
                <p className="sidebar-sandbox-intro">
                    Try draft scores for {subject?.subjectCode}. Your official records stay untouched.
                </p>
            )}
            <section className="sandbox-grade-summary" aria-label={`${term} target and grades`}>
                <div className="sandbox-grade-target-control">
                    <label htmlFor="sandbox-target-grade">Target grade</label>
                    <div className="sandbox-grade-target-input">
                        <input
                            id="sandbox-target-grade"
                            type="number"
                            min="0"
                            max="100"
                            step="any"
                            value={targetGradeInput}
                            aria-invalid={Boolean(targetGradeError)}
                            aria-describedby={targetGradeError ? "sandbox-target-grade-error" : undefined}
                            onChange={(event) => {
                                setTargetGradeInput(event.target.value);
                                setTargetGradeError("");
                            }}
                            onBlur={() => {
                                const value = Number(targetGradeInput);
                                if (
                                    targetGradeInput === "" ||
                                    !Number.isFinite(value) ||
                                    value < 0 ||
                                    value > 100
                                ) {
                                    setTargetGradeError("Enter a target grade from 0 to 100.");
                                    setTargetGradeInput(String(targetGrade));
                                    return;
                                }
                                saveSandboxConfig({ sandboxDesiredFinalGrade: value });
                            }}
                            onKeyDown={(event) => {
                                if (event.key === "Enter") event.currentTarget.blur();
                            }}
                        />
                        <span>%</span>
                    </div>
                    {targetGradeError && (
                        <small id="sandbox-target-grade-error" className="sandbox-target-grade-error" role="alert">
                            {targetGradeError}
                        </small>
                    )}
                    {variant !== "page" && <small>Yellow marker shows your target</small>}
                    <label className="sandbox-term-select">
                        <span>Term</span>
                        <select value={term} onChange={(event) => setTerm(event.target.value)}>
                            {TERMS.map((option) => <option key={option} value={option}>{option}</option>)}
                        </select>
                    </label>
                </div>
                <div className="sandbox-grade-gauges">
                    <div className="grade-gauge official-gauge">
                        <span className="grade-gauge-label">{term} official</span>
                        <span
                            className="grade-gauge-ring"
                            role="img"
                            style={{
                                "--grade-progress": `${officialProgress}%`,
                                "--target-angle": `${targetGrade * 3.6}deg`,
                            }}
                            aria-label={`Official grade ${officialGrade === null ? "not available" : `${officialGrade.toFixed(0)} percent`}`}
                        >
                            <strong>
                                {officialGrade === null ? "—" : officialGrade.toFixed(0)}
                                {officialGrade !== null && <small>%</small>}
                            </strong>
                            <span className="grade-gauge-target-marker" />
                        </span>
                    </div>
                    <div className="grade-gauge expected-gauge">
                        <span className="grade-gauge-label">{term} expected</span>
                        <span
                            className="grade-gauge-ring"
                            role="img"
                            style={{
                                "--grade-progress": `${expectedProgress}%`,
                                "--target-angle": `${targetGrade * 3.6}deg`,
                            }}
                            aria-label={`Expected grade ${expectedGrade === null ? "not available" : `${expectedGrade.toFixed(0)} percent`}`}
                        >
                            <strong>
                                {expectedGrade === null ? "—" : expectedGrade.toFixed(0)}
                                {expectedGrade !== null && <small>%</small>}
                            </strong>
                            <span className="grade-gauge-target-marker" />
                        </span>
                    </div>
                </div>
            </section>
            <article className="sidebar-sandbox-card">
                {variant !== "page" && <small>START WITH YOUR EXAM EXPECTATION</small>}
                <h3>{term} Exam</h3>
                <label className="sidebar-sandbox-score">
                    <span>Expected exam score</span>
                    <input
                        type="number"
                        min="0"
                        max="100"
                        value={expectedExamScore}
                        onChange={(event) => saveSandboxConfig({
                            expectedExamScore: Math.max(0, Math.min(100, Number(event.target.value))),
                        })}
                    />
                    <span>/ 100</span>
                </label>
            </article>
            <h3 className="sidebar-sandbox-subheading">How many upcoming activities?</h3>
            <div className="sidebar-sandbox-counts">
                <label className="sidebar-sandbox-field">
                    <span>Upcoming ATs</span>
                    <input
                        type="number"
                        min="0"
                        max="20"
                        value={upcomingAT}
                        onChange={(event) => saveSandboxConfig({
                            upcomingAT: Math.max(0, Math.min(20, Number(event.target.value))),
                        })}
                    />
                </label>
                <label className="sidebar-sandbox-field">
                    <span>Upcoming TLAs</span>
                    <input
                        type="number"
                        min="0"
                        max="20"
                        value={upcomingTLA}
                        onChange={(event) => saveSandboxConfig({
                            upcomingTLA: Math.max(0, Math.min(20, Number(event.target.value))),
                        })}
                    />
                </label>
            </div>
            <div className="sidebar-sandbox-target">
                <small>{term.toUpperCase()} TARGET · {targetGrade}%</small>
                <strong>{requiredDraftScore === null ? "—" : `${requiredDraftScore.toFixed(2)}%`}</strong>
                {variant !== "page" && <p>Suggested average for unentered activities.</p>}
            </div>
            <div className="sidebar-sandbox-drafts">
                <small>AT &amp; TLA DRAFT SCORES</small>
                {draftRows.length ? draftRows.map(({ category, task, label, suggestion }) => (
                    <label className="sidebar-sandbox-draft" key={task.id}>
                        <span>{label}<small>{category} · {task.maxScore ?? 100} points</small></span>
                        <span className="sidebar-sandbox-draft-input">
                            {task.officialScore !== null && task.officialScore !== undefined ? (
                                <span className="sidebar-sandbox-locked-score">
                                    {task.officialScore} / {task.maxScore ?? 100}
                                </span>
                            ) : (
                                <>
                                    <input
                                        type="text"
                                        inputMode="decimal"
                                        min="0"
                                        max={task.maxScore ?? 100}
                                        value={task.studentReportedScore ?? ""}
                                        aria-invalid={invalidScoreId === `${category}-${task.id}`}
                                        placeholder={suggestion === null
                                            ? "—"
                                            : (suggestion * Number(task.maxScore ?? 100) / 100).toFixed(2)}
                                        onChange={(event) => saveDraftScore(category, task.id, event.target.value)}
                                        aria-label={`Private draft score for ${label}`}
                                    />
                                    <span>/ {task.maxScore ?? 100}</span>
                                </>
                            )}
                        </span>
                    </label>
                )) : <p>No activities recorded for this term yet.</p>}
            </div>
            {saveError && <p className="sidebar-sandbox-error" role="alert">{saveError}</p>}
            <p className="sidebar-sandbox-projection">
                Sandbox projected average
                <strong>{projectedAverage === null ? "—" : `${projectedAverage.toFixed(2)}%`}</strong>
            </p>
            {variant !== "page" && (
                <details className="sidebar-sandbox-calculation">
                    <summary>How this is calculated</summary>
                    <p>ATs and TLAs use the grading rule for this subject. Official scores take priority, and your drafts stay private.</p>
                </details>
            )}
        </section>
    );
}
