// src/components/student/AllSubjectsHistory.jsx
// Dashboard chart: one line per subject for the chosen term (this
// semester's subjects), each with its target as a dashed line in the same
// color, the 75% passing line, and a "target reached" marker on the latest
// task when it is at or above the target. Chips show or
// hide subjects. Clicking a point opens that subject at that task.
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import {
    CartesianGrid,
    Line,
    LineChart,
    ReferenceLine,
    ResponsiveContainer,
    Tooltip,
    XAxis,
    YAxis,
} from "recharts";
import { resolveColor } from "../../utils/cssColor";
import { getCriteriaColor } from "../../utils/rules";
import { getChartScale, getCoursesHistory, PASSING_GRADE } from "../../utils/history";
import { TERMS, getTermLabel } from "../../utils/terms";
import HistoryTooltip from "./HistoryTooltip";
import "./HistoryChart.css";

// Strong colors first so the first lines read well on white.
const LINE_COLOR_ORDER = [1, 4, 3, 5, 2, 8, 7, 6];

function lineColor(index) {
    return resolveColor(getCriteriaColor(LINE_COLOR_ORDER[index % LINE_COLOR_ORDER.length]));
}

function formatGrade(value) {
    return value === null || value === undefined ? "—" : `${Number(value.toFixed(2))}%`;
}

function SubjectDot({ cx, cy, payload, color, reached, surface, success, onSelect, active = false }) {
    if (cx === undefined || cy === undefined || payload?.grade === null || payload?.grade === undefined) return null;
    return (
        <g className="history-dot is-clickable" onClick={() => onSelect(payload)}>
            {reached && <circle cx={cx} cy={cy} r={9} fill="none" stroke={success} strokeWidth={2} />}
            {payload.isOfficial ? (
                <circle cx={cx} cy={cy} r={active ? 6 : 4} fill={color} />
            ) : (
                <circle cx={cx} cy={cy} r={active ? 6 : 4} fill={surface} stroke={color} strokeWidth={2} />
            )}
            <circle cx={cx} cy={cy} r={11} fill="transparent" />
        </g>
    );
}

// db: the database. studentId: the signed-in student.
// semesterId: only this semester's subjects. initialTerm: "prelim" etc.
export default function AllSubjectsHistory({ db, studentId, semesterId, initialTerm = "prelim" }) {
    const navigate = useNavigate();
    const [termKey, setTermKey] = useState(initialTerm);
    const [hiddenIds, setHiddenIds] = useState(() => new Set());
    const termLabel = getTermLabel(termKey);

    const courses = getCoursesHistory(db, studentId, termKey, semesterId)
        .map((course, index) => ({ ...course, color: lineColor(index) }));
    const visible = courses.filter((course) => !hiddenIds.has(course.classId));
    const plotted = visible.filter((course) => course.points.length > 0);
    const scale = getChartScale(
        [
            ...plotted.flatMap((course) => course.points.map((point) => point.grade)),
            ...plotted.map((course) => course.target),
            PASSING_GRADE,
        ],
        Math.max(1, ...plotted.map((course) => course.points.length))
    );
    const colors = {
        grid: resolveColor("var(--color-border)"),
        muted: resolveColor("var(--color-muted)"),
        surface: resolveColor("var(--color-surface)"),
        success: resolveColor("var(--color-success)"),
        passing: resolveColor("var(--color-warning-strong)"),
    };
    const allShown = hiddenIds.size === 0;

    function toggle(classId) {
        setHiddenIds((current) => {
            const next = new Set(current);
            if (next.has(classId)) next.delete(classId);
            else next.add(classId);
            return next;
        });
    }

    function openTask(course, point) {
        const task = point.taskId ? `&task=${encodeURIComponent(point.taskId)}` : "";
        navigate(`/student/subject/${course.classId}?term=${termKey}${task}`);
    }

    return (
        <section className="history-section" aria-labelledby="all-history-title">
            <div className="history-section-heading">
                <div>
                    <h2 id="all-history-title">{termLabel} Grade History</h2>
                    <p>
                        Each subject&apos;s {termLabel} grade after every scored task. Dashed lines are
                        targets in the subject&apos;s color. Click a point to open that task.
                    </p>
                </div>
                <div className="history-scope" role="group" aria-label="Term shown">
                    {TERMS.map((term) => (
                        <button
                            key={term.key}
                            type="button"
                            aria-pressed={term.key === termKey}
                            onClick={() => setTermKey(term.key)}
                        >
                            {term.label}
                        </button>
                    ))}
                </div>
            </div>

            {courses.length === 0 ? (
                <p className="history-empty">Add a subject below and its grade history will show here.</p>
            ) : (
                <div className="history-chart">
                    <div className="history-filter" role="group" aria-label="Subjects shown in the chart">
                        <button
                            type="button"
                            className="history-chip history-chip-all"
                            onClick={() =>
                                setHiddenIds(allShown ? new Set(courses.map((course) => course.classId)) : new Set())
                            }
                        >
                            {allShown ? "Hide all" : "Show all"}
                        </button>
                        {courses.map((course) => (
                            <button
                                key={course.classId}
                                type="button"
                                className="history-chip"
                                aria-pressed={!hiddenIds.has(course.classId)}
                                onClick={() => toggle(course.classId)}
                                title={course.subjectName}
                            >
                                <i style={{ backgroundColor: course.color }} aria-hidden="true" />
                                {course.subjectCode}
                                <small>
                                    {course.points.length === 0
                                        ? "no scores"
                                        : course.reachedIndex >= 0 ? "target reached" : `target ${course.target}%`}
                                </small>
                            </button>
                        ))}
                    </div>

                    {plotted.length === 0 ? (
                        <p className="history-empty">
                            {visible.length === 0
                                ? "Choose at least one subject above to see its line."
                                : `The subjects you chose have no scored tasks for ${termLabel} yet.`}
                        </p>
                    ) : (
                        <div
                            className="history-plot"
                            role="img"
                            aria-label={`${termLabel} grade after each task for ${plotted
                                .map((course) => `${course.subjectCode} (latest ${formatGrade(course.points.at(-1).grade)}, target ${course.target}%)`)
                                .join(", ")}. The same data is in the table below.`}
                        >
                            <ResponsiveContainer width="100%" height={320}>
                                <LineChart margin={{ top: 16, right: 16, bottom: 8, left: 0 }}>
                                    <CartesianGrid stroke={colors.grid} vertical={false} />
                                    <XAxis
                                        dataKey="step"
                                        type="number"
                                        domain={scale.xDomain}
                                        ticks={scale.xTicks}
                                        allowDecimals={false}
                                        allowDuplicatedCategory={false}
                                        tick={{ fill: colors.muted, fontSize: 12 }}
                                        stroke={colors.grid}
                                        label={{ value: "Tasks", position: "insideBottomRight", offset: -4, fill: colors.muted, fontSize: 12 }}
                                    />
                                    <YAxis
                                        domain={scale.yDomain}
                                        ticks={scale.yTicks}
                                        allowDataOverflow
                                        unit="%"
                                        width={48}
                                        tick={{ fill: colors.muted, fontSize: 12 }}
                                        stroke={colors.grid}
                                    />
                                    <ReferenceLine
                                        y={PASSING_GRADE}
                                        stroke={colors.passing}
                                        strokeDasharray="2 4"
                                        strokeWidth={1.5}
                                        label={{ value: `Passing ${PASSING_GRADE}%`, position: "insideBottomLeft", fill: colors.passing, fontSize: 11 }}
                                    />
                                    {plotted.map((course) => (
                                        <ReferenceLine
                                            key={`target-${course.classId}`}
                                            y={course.target}
                                            stroke={course.color}
                                            strokeDasharray="7 5"
                                            strokeWidth={1.5}
                                        />
                                    ))}
                                    <Tooltip
                                        content={<HistoryTooltip multiSeries />}
                                        cursor={{ stroke: colors.grid }}
                                    />
                                    {plotted.map((course) => {
                                        const reachedStep = course.reachedIndex >= 0 ? course.points[course.reachedIndex].step : null;
                                        const dotProps = {
                                            color: course.color,
                                            surface: colors.surface,
                                            success: colors.success,
                                            onSelect: (point) => openTask(course, point),
                                        };
                                        return (
                                            <Line
                                                key={course.classId}
                                                data={course.points}
                                                dataKey="grade"
                                                name={course.subjectCode}
                                                type="linear"
                                                stroke={course.color}
                                                strokeWidth={2.5}
                                                dot={(props) => (
                                                    <SubjectDot key={`${course.classId}-${props.index}`} {...props} {...dotProps} reached={props.payload?.step === reachedStep} />
                                                )}
                                                activeDot={(props) => (
                                                    <SubjectDot {...props} {...dotProps} reached={props.payload?.step === reachedStep} active />
                                                )}
                                                isAnimationActive={false}
                                                connectNulls={false}
                                            />
                                        );
                                    })}
                                </LineChart>
                            </ResponsiveContainer>
                        </div>
                    )}

                    <p className="history-legend">
                        <span><i className="is-line" aria-hidden="true" /> Grade so far (filled dot: official, hollow: yours)</span>
                        <span><i className="is-target" aria-hidden="true" /> Target, in the subject&apos;s color</span>
                        <span><i className="is-passing" aria-hidden="true" /> Passing grade</span>
                        <span><i className="is-reached" aria-hidden="true" /> Target reached</span>
                    </p>

                    <details className="history-table">
                        <summary>Show as a table</summary>
                        {visible.filter((course) => course.points.length > 0).map((course) => (
                            <table key={course.classId}>
                                <caption>{course.subjectCode} {course.subjectName} · target {course.target}%</caption>
                                <thead>
                                    <tr>
                                        <th scope="col">Step</th>
                                        <th scope="col">Task</th>
                                        <th scope="col">Score</th>
                                        <th scope="col">Grade so far</th>
                                        <th scope="col"><span className="history-sr-only">Open task</span></th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {course.points.map((point) => (
                                        <tr key={point.step}>
                                            <td>{point.step}</td>
                                            <td>{point.criterionName} · {point.label}</td>
                                            <td>{point.percent.toFixed(1)}% {point.isOfficial ? "(official)" : "(yours)"}</td>
                                            <td>{formatGrade(point.grade)}</td>
                                            <td>
                                                <button type="button" className="history-table-link" onClick={() => openTask(course, point)}>
                                                    Open task
                                                </button>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        ))}
                    </details>
                </div>
            )}
        </section>
    );
}
