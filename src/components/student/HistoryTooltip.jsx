// src/components/student/HistoryTooltip.jsx
// Tooltip for the history charts. Shows only the point under the pointer
// (see usePointHover.js): the task, its score, the entry an official score
// replaced or the planned score, and the grade right after it.
import { useEffect, useState } from "react";

function formatGrade(value) {
    return value === null || value === undefined ? "—" : `${Number(value.toFixed(2))}%`;
}

function ReplacedLine({ point }) {
    const change = point.percent - point.replacedEntry.percent;
    return (
        <p className="history-tooltip-replaced">
            You entered {point.replacedEntry.score}/{point.replacedEntry.maxScore} ({point.replacedEntry.percent.toFixed(1)}%)
            {" → "}official {point.percent.toFixed(1)}% ({change > 0 ? "+" : ""}{change.toFixed(1)} pts)
        </p>
    );
}

function PointDetails({ point, kind, seriesName, color }) {
    if (kind === "plan") {
        return (
            <>
                <p>Step {point.step} · planned</p>
                <p className="history-tooltip-task">{point.label}</p>
                <p>{point.isExpected ? "Your estimate" : "Score needed"} {formatGrade(point.percent)}</p>
                <p>Grade then <strong>{formatGrade(point.planGrade)}</strong></p>
            </>
        );
    }
    if (kind === "ghost") {
        return (
            <>
                <p>Task {point.step} · your entry before the official score</p>
                <p className="history-tooltip-task">{point.label}</p>
                <ReplacedLine point={point} />
                <p>
                    Grade with your entry <strong>{formatGrade(point.ghostGrade)}</strong>
                    {" · "}with the official score <strong>{formatGrade(point.grade)}</strong>
                </p>
            </>
        );
    }
    return (
        <>
            {seriesName && (
                <strong className="history-tooltip-series" style={{ color }}>{seriesName}</strong>
            )}
            <p>Task {point.step} · {point.termLabel} · {point.criterionName}</p>
            <p className="history-tooltip-task">{point.label}</p>
            <p>Score {point.percent.toFixed(1)}% ({point.isOfficial ? "official" : "yours"})</p>
            {point.replacedEntry && <ReplacedLine point={point} />}
            <p>Grade so far <strong>{formatGrade(point.grade)}</strong></p>
        </>
    );
}

// store: from usePointHover(). It sends { x, y, flipX, below, data } where
// data is { point, kind: "real" | "ghost" | "plan", seriesName?, color? }.
export default function HistoryTooltip({ store }) {
    const [hover, setHover] = useState(null);
    useEffect(() => store.subscribe(setHover), [store]);

    if (!hover) return null;
    const offsetX = hover.flipX ? "calc(-100% - 14px)" : "14px";
    const offsetY = hover.below ? "14px" : "calc(-100% - 14px)";
    return (
        <div
            className="history-tooltip history-tooltip-float"
            role="status"
            style={{ left: hover.x, top: hover.y, transform: `translate(${offsetX}, ${offsetY})` }}
        >
            <PointDetails {...hover.data} />
        </div>
    );
}
