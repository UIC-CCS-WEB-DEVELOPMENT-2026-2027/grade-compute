// src/components/student/HistoryTooltip.jsx
// Tooltip for the history charts. Shows the task at that step: its score,
// the entry an official score replaced, or the planned score, and the
// grade right after it. Multi-subject charts pass one entry per subject.
function formatGrade(value) {
    return value === null || value === undefined ? "—" : `${Number(value.toFixed(2))}%`;
}

function PointDetails({ point, seriesName, color }) {
    if (point.isPlan) {
        return (
            <div>
                <p>Step {point.step} · planned</p>
                <p className="history-tooltip-task">{point.label}</p>
                <p>
                    {point.isExpected ? "Your estimate" : "Score needed"} {formatGrade(point.percent)}
                </p>
                <p>Grade then <strong>{formatGrade(point.planGrade)}</strong></p>
            </div>
        );
    }
    return (
        <div>
            {seriesName && (
                <strong className="history-tooltip-series" style={{ color }}>{seriesName}</strong>
            )}
            <p>Task {point.step} · {point.termLabel} · {point.criterionName}</p>
            <p className="history-tooltip-task">{point.label}</p>
            <p>
                Score {point.percent.toFixed(1)}% ({point.isOfficial ? "official" : "yours"})
            </p>
            {point.replacedEntry && (
                <p className="history-tooltip-replaced">
                    You entered {point.replacedEntry.score}/{point.replacedEntry.maxScore} ({point.replacedEntry.percent.toFixed(1)}%)
                    {" → "}official {point.percent.toFixed(1)}%
                    {" "}({point.percent - point.replacedEntry.percent > 0 ? "+" : ""}{(point.percent - point.replacedEntry.percent).toFixed(1)} pts)
                </p>
            )}
            <p>Grade so far <strong>{formatGrade(point.grade)}</strong></p>
        </div>
    );
}

export default function HistoryTooltip({ active, payload, multiSeries = false }) {
    if (!active || !payload?.length) return null;

    // Single-subject charts: every line shares one row, so show it once.
    if (!multiSeries) {
        const point = payload[0].payload;
        return (
            <div className="history-tooltip">
                <PointDetails point={point} />
            </div>
        );
    }

    return (
        <div className="history-tooltip">
            {payload.map((entry) => (
                <PointDetails
                    key={entry.name}
                    point={entry.payload}
                    seriesName={entry.name}
                    color={entry.stroke}
                />
            ))}
        </div>
    );
}
