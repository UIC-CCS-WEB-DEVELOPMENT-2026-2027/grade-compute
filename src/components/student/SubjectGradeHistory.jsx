// src/components/student/SubjectGradeHistory.jsx
// "<Term> Grade History" section on Subject Detail, under Current Term
// Records. Follows the selected term. Shows the sandbox plan for the
// remaining tasks (on at first, can be turned off) and links to the
// sandbox. Clicking a point scrolls to that task.
import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { DB_UPDATED_EVENT, getDb } from "../../utils/db";
import { focusTaskRow } from "../../utils/focusTask";
import { getEntryAccuracy, getGradeHistory, getPlanPoints, getTermTarget } from "../../utils/history";
import { getActiveStudentId } from "../../utils/session";
import { getTermLabel } from "../../utils/terms";
import HistoryChart from "./HistoryChart";

function formatGrade(value) {
    return value === null || value === undefined ? "—" : `${Number(value.toFixed(2))}%`;
}

export default function SubjectGradeHistory({ classId, termKey }) {
    const [dbData, setDbData] = useState(() => getDb());
    const [showPlan, setShowPlan] = useState(true);

    // Redraw when a score is saved (Current Term Records saves on blur).
    useEffect(() => {
        const refresh = () => setDbData(getDb());
        window.addEventListener(DB_UPDATED_EVENT, refresh);
        return () => window.removeEventListener(DB_UPDATED_EVENT, refresh);
    }, []);

    const studentId = getActiveStudentId(dbData);
    const classItem = dbData?.classes?.find((item) => item.id === classId);
    const record = classItem?.studentRecords?.find((item) => item.studentId === studentId);
    const rule = dbData?.computationRules?.find((item) => item.id === classItem?.computationRuleId);
    const termLabel = getTermLabel(termKey);
    if (!record || !rule) return null;

    const points = getGradeHistory(record, rule, termKey);
    const target = getTermTarget(record, termKey);
    const { plan, points: planPoints } = getPlanPoints(record, rule, termKey, target, points.length);
    const accuracy = getEntryAccuracy(points);
    const sandboxLink = `/student/subject/${classId}/sandbox?term=${termKey}`;

    return (
        <section className="history-section" aria-labelledby="subject-history-title">
            <div className="history-section-heading">
                <div>
                    <h2 id="subject-history-title">{termLabel} Grade History</h2>
                    <p>
                        Your {termLabel} grade after each scored task. Official scores replace your own
                        entries. Click a point to jump to its task.
                    </p>
                </div>
                <div className="history-section-actions">
                    {planPoints.length > 0 && (
                        <button
                            type="button"
                            className="history-toggle"
                            aria-pressed={showPlan}
                            onClick={() => setShowPlan((shown) => !shown)}
                        >
                            {showPlan ? "Hide plan" : "Show plan"}
                        </button>
                    )}
                    <Link className="history-link" to={sandboxLink}>Plan in sandbox</Link>
                </div>
            </div>

            <HistoryChart
                points={points}
                planPoints={planPoints}
                showPlan={showPlan}
                target={target}
                targetLabel="Target"
                termLabel={termLabel}
                onSelect={(point) => focusTaskRow(point.taskId)}
            />

            {showPlan && planPoints.length > 0 && (
                <p className="history-note">
                    {plan.status === "required" && (
                        <>Plan: score <strong>{formatGrade(plan.required)}</strong> on each remaining task to end at your target. </>
                    )}
                    {plan.status === "impossible" && (
                        <>Plan: even 100% on every remaining task ends at <strong>{formatGrade(plan.best)}</strong>. </>
                    )}
                    {plan.status === "reached" && (
                        <>You&apos;re already above target. The plan assumes you keep scoring around your current grade. </>
                    )}
                    Remaining tasks come from your sandbox settings; their order is a guess, so the end
                    point is what matters.
                </p>
            )}

            {accuracy && (
                <p className="history-note">
                    Your own entries were{" "}
                    <strong>
                        {Math.abs(accuracy.averageGap) < 0.05
                            ? "spot on"
                            : `${Math.abs(accuracy.averageGap).toFixed(1)} points ${accuracy.averageGap < 0 ? "higher" : "lower"}`}
                    </strong>
                    {Math.abs(accuracy.averageGap) < 0.05 ? " compared with" : " than"} the official scores that replaced them
                    ({accuracy.count} task{accuracy.count === 1 ? "" : "s"}).
                </p>
            )}
        </section>
    );
}
