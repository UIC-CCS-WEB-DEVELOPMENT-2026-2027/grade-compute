// src/components/student/HistoryChart.jsx
// One subject's term grade after each scored task (solid line), with:
// - the target and the 75% passing grade as reference lines,
// - a faded dot where an official score replaced your own entry,
// - a "Target reached" marker on the latest task when it is at or above the
//   target (on the plan's last task when only the plan gets there),
// - optionally the sandbox plan for the remaining tasks (dotted line).
// Used on Subject Detail (SubjectGradeHistory) and in the sandbox.
// Data comes from utils/history.js.
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
import { getChartScale, getTargetReachedIndex, PASSING_GRADE } from "../../utils/history";
import HistoryTooltip from "./HistoryTooltip";
import "./HistoryChart.css";

function formatGrade(value) {
    return value === null || value === undefined ? "—" : `${Number(value.toFixed(2))}%`;
}

// Keep the "Target reached" label inside the chart: below the point when
// the point is near the top edge, and inward at the first/last step.
function labelY(cy, gap) {
    return cy - gap < 34 ? cy + gap + 10 : cy - gap;
}

function labelAnchor(step, lastStep) {
    if (step <= 1) return "start";
    if (step >= lastStep) return "end";
    return "middle";
}

// Real scores: filled dot for official, hollow accent dot for your own.
// The latest task gets a ring and a label when it is at the target.
function RealDot({ cx, cy, payload, colors, reachedStep, lastStep, onSelect, active = false }) {
    if (cx === undefined || cy === undefined || payload?.grade === null || payload?.grade === undefined) return null;
    const clickable = Boolean(onSelect && payload.taskId);
    const radius = active ? 7 : 5;
    return (
        <g
            className={clickable ? "history-dot is-clickable" : "history-dot"}
            onClick={clickable ? () => onSelect(payload) : undefined}
        >
            {payload.step === reachedStep && (
                <>
                    <circle cx={cx} cy={cy} r={11} fill="none" stroke={colors.success} strokeWidth={2} />
                    <text x={cx} y={labelY(cy, 16)} textAnchor={labelAnchor(payload.step, lastStep)} fill={colors.success} fontSize={11} fontWeight={700}>
                        Target reached
                    </text>
                </>
            )}
            {payload.isOfficial ? (
                <circle cx={cx} cy={cy} r={radius} fill={colors.official} />
            ) : (
                <circle cx={cx} cy={cy} r={radius} fill={colors.surface} stroke={colors.accent} strokeWidth={2.5} />
            )}
            {/* Bigger invisible target so the dot is easy to click or tap. */}
            {clickable && <circle cx={cx} cy={cy} r={12} fill="transparent" />}
        </g>
    );
}

// Your own entry that an official score replaced: a faded hollow dot.
function GhostDot({ cx, cy, payload, colors }) {
    if (cx === undefined || cy === undefined || payload?.ghostGrade === null || payload?.ghostGrade === undefined) return null;
    return (
        <circle
            cx={cx}
            cy={cy}
            r={4.5}
            fill={colors.surface}
            stroke={colors.accent}
            strokeWidth={2}
            strokeDasharray="2 2"
            opacity={0.55}
        />
    );
}

// Planned (simulated) tasks: small hollow dots on the dotted line.
function PlanDot({ cx, cy, payload, colors, reachedStep, lastStep }) {
    if (cx === undefined || cy === undefined || !payload?.isPlan) return null;
    return (
        <g>
            {payload.step === reachedStep && (
                <text x={cx} y={labelY(cy, 12)} textAnchor={labelAnchor(payload.step, lastStep)} fill={colors.success} fontSize={11} fontWeight={700}>
                    Target reached
                </text>
            )}
            <circle cx={cx} cy={cy} r={4} fill={colors.surface} stroke={colors.plan} strokeWidth={2} />
        </g>
    );
}

// points: real history (getGradeHistory). planPoints: getPlanPoints().points.
// showPlan: draw planPoints. emphasizePlan: thicker plan line (sandbox).
// target / targetLabel: the dashed target line. termLabel: e.g. "Prelim".
// onSelect(point): called when a real point is clicked (go to that task).
export default function HistoryChart({
    points,
    planPoints = [],
    showPlan = false,
    emphasizePlan = false,
    target,
    targetLabel = "Target",
    termLabel,
    onSelect,
    height = 300,
}) {
    const plan = showPlan ? planPoints : [];
    if (points.length === 0 && plan.length === 0) {
        return (
            <p className="history-empty">
                No scored tasks for {termLabel} yet. Add a score in Current Term Records and it will appear here.
            </p>
        );
    }

    const colors = {
        line: resolveColor("var(--color-primary)"),
        official: resolveColor("var(--color-text-locked)"),
        accent: resolveColor("var(--color-accent)"),
        surface: resolveColor("var(--color-surface)"),
        plan: resolveColor(emphasizePlan ? "var(--color-primary)" : "var(--color-text-faint)"),
        success: resolveColor("var(--color-success)"),
        passing: resolveColor("var(--color-warning-strong)"),
        target: resolveColor("var(--color-text-locked)"),
        grid: resolveColor("var(--color-border)"),
        muted: resolveColor("var(--color-muted)"),
    };

    // One row per step. The last real step also starts the plan line, so
    // the dotted line continues from where the solid one ends.
    const rows = points.map((point) => ({ ...point }));
    if (plan.length && rows.length) rows[rows.length - 1].planGrade = rows[rows.length - 1].grade;
    plan.forEach((point) => rows.push({ ...point, isPlan: true }));

    const reachedIndex = getTargetReachedIndex(points, target);
    const reachedStep = reachedIndex >= 0 ? points[reachedIndex].step : null;
    const planReachedIndex = reachedStep === null ? getTargetReachedIndex(plan, target, "planGrade") : -1;
    const planReachedStep = planReachedIndex >= 0 ? plan[planReachedIndex].step : null;

    const scale = getChartScale(
        [
            ...points.flatMap((point) => [point.grade, point.ghostGrade]),
            ...plan.map((point) => point.planGrade),
            target,
            PASSING_GRADE,
        ],
        rows.length
    );
    const latest = points.length ? points[points.length - 1].grade : null;
    const gap = latest === null || target === null ? null : latest - target;
    const hasGhosts = points.some((point) => point.ghostGrade !== null && point.ghostGrade !== undefined);

    return (
        <div className="history-chart">
            {latest !== null && (
                <p className="history-summary">
                    <strong>{formatGrade(latest)}</strong> after {points.length} task{points.length === 1 ? "" : "s"}
                    {target !== null && (
                        <>
                            {" · "}{targetLabel.toLowerCase()} {formatGrade(target)}{" · "}
                            <span className={gap >= 0 ? "is-above" : "is-below"}>
                                {Math.abs(gap) < 0.005
                                    ? "on target"
                                    : gap > 0
                                        ? `${gap.toFixed(2)} points above`
                                        : `${Math.abs(gap).toFixed(2)} points below`}
                            </span>
                        </>
                    )}
                </p>
            )}

            <div
                className="history-plot"
                role="img"
                aria-label={`${termLabel} grade after each task${latest !== null ? `, latest ${formatGrade(latest)}` : ""}${target !== null ? `, ${targetLabel.toLowerCase()} ${formatGrade(target)}` : ""}${plan.length ? `, with a plan for ${plan.length} remaining tasks ending at ${formatGrade(plan[plan.length - 1].planGrade)}` : ""}. The same data is in the table below.`}
            >
                <ResponsiveContainer width="100%" height={height}>
                    <LineChart data={rows} margin={{ top: 26, right: 16, bottom: 8, left: 0 }}>
                        <CartesianGrid stroke={colors.grid} vertical={false} />
                        <XAxis
                            dataKey="step"
                            type="number"
                            domain={scale.xDomain}
                            ticks={scale.xTicks}
                            allowDecimals={false}
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
                        {target !== null && (
                            <ReferenceLine
                                y={target}
                                stroke={colors.target}
                                strokeDasharray="7 5"
                                strokeWidth={1.5}
                            />
                        )}
                        <Tooltip content={<HistoryTooltip />} cursor={{ stroke: colors.grid }} />
                        {plan.length > 0 && (
                            <Line
                                dataKey="planGrade"
                                type="linear"
                                stroke={colors.plan}
                                strokeWidth={emphasizePlan ? 3 : 2}
                                strokeDasharray="6 5"
                                dot={<PlanDot colors={colors} reachedStep={planReachedStep} lastStep={rows.length} />}
                                activeDot={false}
                                isAnimationActive={false}
                                connectNulls={false}
                            />
                        )}
                        {hasGhosts && (
                            <Line
                                dataKey="ghostGrade"
                                stroke="none"
                                dot={<GhostDot colors={colors} />}
                                activeDot={false}
                                isAnimationActive={false}
                                legendType="none"
                            />
                        )}
                        <Line
                            dataKey="grade"
                            type="linear"
                            stroke={colors.line}
                            strokeWidth={3}
                            dot={<RealDot colors={colors} reachedStep={reachedStep} lastStep={rows.length} onSelect={onSelect} />}
                            activeDot={(props) => (
                                <RealDot {...props} colors={colors} reachedStep={reachedStep} lastStep={rows.length} onSelect={onSelect} active />
                            )}
                            isAnimationActive={false}
                            connectNulls={false}
                        />
                    </LineChart>
                </ResponsiveContainer>
            </div>

            <p className="history-legend">
                <span><i className="is-official" aria-hidden="true" /> Official score</span>
                <span><i className="is-self" aria-hidden="true" /> Your score</span>
                {hasGhosts && <span><i className="is-ghost" aria-hidden="true" /> Your entry before the official score</span>}
                {plan.length > 0 && <span><i className="is-plan" aria-hidden="true" /> Plan for remaining tasks</span>}
                {target !== null && <span><i className="is-target" aria-hidden="true" /> {targetLabel} {formatGrade(target)}</span>}
                <span><i className="is-passing" aria-hidden="true" /> Passing {PASSING_GRADE}%</span>
            </p>

            <details className="history-table">
                <summary>Show as a table</summary>
                <table>
                    <caption>{termLabel} grade after each task</caption>
                    <thead>
                        <tr>
                            <th scope="col">Step</th>
                            <th scope="col">Task</th>
                            <th scope="col">Score</th>
                            <th scope="col">Grade so far</th>
                            {onSelect && <th scope="col"><span className="history-sr-only">Go to task</span></th>}
                        </tr>
                    </thead>
                    <tbody>
                        {points.map((point) => (
                            <tr key={`real-${point.step}`}>
                                <td>{point.step}</td>
                                <td>{point.criterionName} · {point.label}</td>
                                <td>
                                    {point.percent.toFixed(1)}% {point.isOfficial ? "(official)" : "(yours)"}
                                    {point.replacedEntry && ` · you entered ${point.replacedEntry.percent.toFixed(1)}%`}
                                </td>
                                <td>{formatGrade(point.grade)}</td>
                                {onSelect && (
                                    <td>
                                        {point.taskId && (
                                            <button type="button" className="history-table-link" onClick={() => onSelect(point)}>
                                                Go to task
                                            </button>
                                        )}
                                    </td>
                                )}
                            </tr>
                        ))}
                        {plan.map((point) => (
                            <tr key={`plan-${point.step}`} className="is-plan-row">
                                <td>{point.step}</td>
                                <td>{point.criterionName} · {point.label} (planned)</td>
                                <td>{formatGrade(point.percent)} {point.isExpected ? "(your estimate)" : "(needed)"}</td>
                                <td>{formatGrade(point.planGrade)}</td>
                                {onSelect && <td />}
                            </tr>
                        ))}
                    </tbody>
                </table>
            </details>
        </div>
    );
}
